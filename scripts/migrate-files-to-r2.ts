/**
 * File Migration Script - Local to Cloudflare R2
 *
 * Migrates existing locally-stored files to Cloudflare R2 storage.
 *
 * Features:
 * - Recursive file scanning
 * - Progress tracking
 * - MD5 checksum validation
 * - Multipart upload for files > 5MB
 * - Retry logic with exponential backoff
 * - Dry-run mode
 * - Database record updates
 * - File archival
 *
 * Usage:
 *   npx tsx scripts/migrate-files-to-r2.ts [options]
 *
 * Options:
 *   --dry-run       Preview migration without uploading files
 *   --batch-size N  Number of files to process concurrently (default: 5)
 *   --skip-db       Skip database updates (useful for testing)
 *   --skip-archive  Skip archiving local files
 *   --verbose       Show detailed progress
 */

import { PrismaClient } from '@prisma/client'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as crypto from 'crypto'
import { createReadStream } from 'fs'

// ============================================
// Configuration & Types
// ============================================

interface MigrationConfig {
  dryRun: boolean
  batchSize: number
  skipDb: boolean
  skipArchive: boolean
  verbose: boolean
  uploadsDir: string
  archiveDir: string
  maxRetries: number
  checksumFailureThreshold: number // Percentage (0-100)
}

interface FileInfo {
  localPath: string
  relativePath: string
  size: number
  type: 'course-content' | 'submission' | 'thumbnail' | 'other'
  s3Key: string
}

interface MigrationResult {
  totalFiles: number
  successfulUploads: number
  failedUploads: number
  checksumMismatches: number
  skippedFiles: number
  databaseUpdates: number
  archivedFiles: number
  errors: Array<{ file: string; error: string }>
}

interface MigrationProgress {
  current: number
  total: number
  percentage: number
  currentFile: string
}

// ============================================
// Globals
// ============================================

const prisma = new PrismaClient()
let s3Client: S3Client | null = null

const PROJECT_ROOT = path.resolve(__dirname, '..')
const DEFAULT_UPLOADS_DIR = path.join(PROJECT_ROOT, 'public/uploads')
const MULTIPART_THRESHOLD = 5 * 1024 * 1024 // 5MB

// ============================================
// Utility Functions
// ============================================

function parseArgs(): MigrationConfig {
  const args = process.argv.slice(2)

  return {
    dryRun: args.includes('--dry-run'),
    batchSize: parseInt(args.find((_, i, arr) => arr[i - 1] === '--batch-size') || '5', 10),
    skipDb: args.includes('--skip-db'),
    skipArchive: args.includes('--skip-archive'),
    verbose: args.includes('--verbose'),
    uploadsDir: DEFAULT_UPLOADS_DIR,
    archiveDir: path.join(PROJECT_ROOT, `uploads_archive_${Date.now()}`),
    maxRetries: 3,
    checksumFailureThreshold: 5,
  }
}

function getS3Client(): S3Client {
  if (!s3Client) {
    const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME']
    const missing = required.filter(key => !process.env[key])

    if (missing.length > 0) {
      throw new Error(`Missing R2 environment variables: ${missing.join(', ')}`)
    }

    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  }

  return s3Client
}

function getBucketName(): string {
  return process.env.R2_BUCKET_NAME || ''
}

function getPublicUrl(key: string): string {
  const baseUrl = process.env.R2_PUBLIC_URL || ''
  if (!baseUrl) return ''
  return `${baseUrl}/${key}`
}

function log(message: string, verbose: boolean = false): void {
  if (!verbose || parseArgs().verbose) {
    console.log(`[${new Date().toISOString()}] ${message}`)
  }
}

function logProgress(progress: MigrationProgress): void {
  const bar = '='.repeat(Math.floor(progress.percentage / 2)) + '-'.repeat(50 - Math.floor(progress.percentage / 2))
  process.stdout.write(`\r[${bar}] ${progress.percentage.toFixed(1)}% (${progress.current}/${progress.total}) ${path.basename(progress.currentFile).substring(0, 30)}...`)
}

// ============================================
// File Scanning
// ============================================

/**
 * Recursively scan directory for files
 */
export async function scanLocalFiles(directory: string): Promise<string[]> {
  const files: string[] = []

  async function scanDir(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          await scanDir(fullPath)
        } else if (entry.isFile() && !entry.name.startsWith('.')) {
          files.push(fullPath)
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error)
    }
  }

  await scanDir(directory)
  return files
}

/**
 * Determine file type based on path
 */
function getFileType(relativePath: string): FileInfo['type'] {
  if (relativePath.includes('/assignments/')) return 'submission'
  if (relativePath.includes('/thumbnails/') || relativePath.startsWith('thumbnails/')) return 'thumbnail'
  if (relativePath.includes('/courses/')) return 'course-content'
  return 'other'
}

/**
 * Generate S3 key from local file path
 */
export function generateS3Key(relativePath: string, fileType: FileInfo['type']): string {
  const filename = path.basename(relativePath)
  const timestamp = Date.now()

  switch (fileType) {
    case 'submission':
      // Extract assignment ID from path if available
      const assignmentMatch = relativePath.match(/assignments\/([^/]+)/)
      const assignmentId = assignmentMatch ? assignmentMatch[1] : 'unknown'
      return `submissions/${assignmentId}/${timestamp}-${filename}`

    case 'thumbnail':
      return `thumbnails/${timestamp}-${filename}`

    case 'course-content':
      // Extract course ID from path if available
      const courseMatch = relativePath.match(/courses\/([^/]+)/)
      const courseId = courseMatch ? courseMatch[1] : 'unknown'
      return `course-content/${courseId}/${timestamp}-${filename}`

    default:
      return `uploads/${timestamp}-${filename}`
  }
}

/**
 * Build file info list from scanned files
 */
async function buildFileInfoList(files: string[], uploadsDir: string): Promise<FileInfo[]> {
  const fileInfoList: FileInfo[] = []

  for (const localPath of files) {
    const relativePath = path.relative(uploadsDir, localPath)
    const stats = await fs.stat(localPath)
    const type = getFileType(relativePath)

    fileInfoList.push({
      localPath,
      relativePath,
      size: stats.size,
      type,
      s3Key: generateS3Key(relativePath, type),
    })
  }

  return fileInfoList
}

// ============================================
// Checksum Validation
// ============================================

/**
 * Calculate MD5 checksum of a file
 */
export async function calculateMD5(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath)
  const hash = crypto.createHash('md5')
  hash.update(fileBuffer)
  return hash.digest('hex')
}

/**
 * Normalize ETag for comparison (R2 returns quoted ETag)
 */
function normalizeETag(etag: string | undefined): string {
  if (!etag) return ''
  return etag.replace(/"/g, '').toLowerCase()
}

// ============================================
// Upload Functions
// ============================================

/**
 * Upload a file with retry logic
 */
async function uploadWithRetry(
  fileInfo: FileInfo,
  config: MigrationConfig
): Promise<{ success: boolean; etag?: string; error?: string }> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await uploadFile(fileInfo)
      return { success: true, etag: result.etag }
    } catch (error) {
      lastError = error as Error

      if (attempt < config.maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000
        log(`Upload failed for ${path.basename(fileInfo.localPath)}, retrying in ${delay}ms (attempt ${attempt}/${config.maxRetries})`, true)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  return { success: false, error: lastError?.message || 'Unknown error' }
}

/**
 * Upload a single file to R2
 */
async function uploadFile(fileInfo: FileInfo): Promise<{ etag: string }> {
  const client = getS3Client()
  const bucket = getBucketName()
  const contentType = getContentType(fileInfo.localPath)

  if (fileInfo.size > MULTIPART_THRESHOLD) {
    // Use multipart upload for large files
    return await multipartUpload(fileInfo, contentType)
  }

  // Standard upload for smaller files
  const fileBuffer = await fs.readFile(fileInfo.localPath)

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: fileInfo.s3Key,
    Body: fileBuffer,
    ContentType: contentType,
  })

  const response = await client.send(command)

  return { etag: normalizeETag(response.ETag) }
}

/**
 * Multipart upload for large files
 */
async function multipartUpload(fileInfo: FileInfo, contentType: string): Promise<{ etag: string }> {
  const client = getS3Client()
  const bucket = getBucketName()

  const fileStream = createReadStream(fileInfo.localPath)

  const upload = new Upload({
    client,
    params: {
      Bucket: bucket,
      Key: fileInfo.s3Key,
      Body: fileStream,
      ContentType: contentType,
    },
    queueSize: 4,
    partSize: 5 * 1024 * 1024, // 5MB parts
  })

  const result = await upload.done()

  return { etag: normalizeETag(result.ETag) }
}

/**
 * Get content type from file extension
 */
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.zip': 'application/zip',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
  }

  return mimeTypes[ext] || 'application/octet-stream'
}

// ============================================
// Database Updates
// ============================================

/**
 * Update database records with S3 keys
 */
async function updateDatabaseRecords(
  fileInfo: FileInfo,
  config: MigrationConfig
): Promise<{ updated: boolean; recordType?: string }> {
  if (config.skipDb || config.dryRun) {
    return { updated: false }
  }

  const publicUrl = getPublicUrl(fileInfo.s3Key)

  try {
    // Try to match file URL patterns in database
    const filename = path.basename(fileInfo.localPath)

    if (fileInfo.type === 'course-content' || fileInfo.type === 'thumbnail') {
      // Search for CourseContent records with matching file URL
      const contentRecords = await prisma.courseContent.findMany({
        where: {
          OR: [
            { fileUrl: { contains: filename } },
            { thumbnailUrl: { contains: filename } },
          ],
        },
      })

      for (const record of contentRecords) {
        const updates: Record<string, string> = {}

        if (record.fileUrl?.includes(filename)) {
          updates.s3Key = fileInfo.s3Key
          updates.fileUrl = publicUrl
        }

        if (record.thumbnailUrl?.includes(filename)) {
          updates.thumbnailS3Key = fileInfo.s3Key
          updates.thumbnailUrl = publicUrl
        }

        if (Object.keys(updates).length > 0) {
          await prisma.courseContent.update({
            where: { id: record.id },
            data: updates,
          })
          log(`Updated CourseContent ${record.id} with S3 key`, true)
        }
      }

      if (contentRecords.length > 0) {
        return { updated: true, recordType: 'CourseContent' }
      }
    }

    if (fileInfo.type === 'submission') {
      // Search for Submission records with matching file URL
      const submissionRecords = await prisma.submission.findMany({
        where: {
          fileUrl: { contains: filename },
        },
      })

      for (const record of submissionRecords) {
        await prisma.submission.update({
          where: { id: record.id },
          data: {
            s3Key: fileInfo.s3Key,
            fileUrl: publicUrl,
          },
        })
        log(`Updated Submission ${record.id} with S3 key`, true)
      }

      if (submissionRecords.length > 0) {
        return { updated: true, recordType: 'Submission' }
      }
    }

    return { updated: false }
  } catch (error) {
    console.error(`Database update error for ${fileInfo.localPath}:`, error)
    return { updated: false }
  }
}

// ============================================
// Archive Functions
// ============================================

/**
 * Archive a successfully migrated file
 */
async function archiveFile(
  fileInfo: FileInfo,
  config: MigrationConfig
): Promise<boolean> {
  if (config.skipArchive || config.dryRun) {
    return false
  }

  try {
    const archivePath = path.join(config.archiveDir, fileInfo.relativePath)
    const archiveDirectory = path.dirname(archivePath)

    // Create archive directory structure
    await fs.mkdir(archiveDirectory, { recursive: true })

    // Move file to archive
    await fs.rename(fileInfo.localPath, archivePath)

    return true
  } catch (error) {
    console.error(`Archive error for ${fileInfo.localPath}:`, error)
    return false
  }
}

// ============================================
// Report Generation
// ============================================

/**
 * Generate integrity report
 */
function generateReport(result: MigrationResult, config: MigrationConfig): string {
  const report = `
================================================================================
FILE MIGRATION REPORT
================================================================================
Generated: ${new Date().toISOString()}
Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE'}
Uploads Directory: ${config.uploadsDir}
Archive Directory: ${config.archiveDir}

SUMMARY
-------
Total Files Scanned:     ${result.totalFiles}
Successful Uploads:      ${result.successfulUploads}
Failed Uploads:          ${result.failedUploads}
Checksum Mismatches:     ${result.checksumMismatches}
Skipped Files:           ${result.skippedFiles}
Database Updates:        ${result.databaseUpdates}
Archived Files:          ${result.archivedFiles}

SUCCESS RATE: ${result.totalFiles > 0 ? ((result.successfulUploads / result.totalFiles) * 100).toFixed(2) : 0}%

${result.errors.length > 0 ? `
ERRORS
------
${result.errors.map(e => `- ${e.file}: ${e.error}`).join('\n')}
` : ''}
================================================================================
`

  return report
}

// ============================================
// Main Migration Function
// ============================================

async function main(): Promise<void> {
  const config = parseArgs()

  console.log('\n========================================')
  console.log('FILE MIGRATION TO R2')
  console.log('========================================')
  console.log(`Mode: ${config.dryRun ? 'DRY RUN (no files will be uploaded)' : 'LIVE'}`)
  console.log(`Uploads Directory: ${config.uploadsDir}`)
  console.log(`Batch Size: ${config.batchSize}`)
  console.log('========================================\n')

  const result: MigrationResult = {
    totalFiles: 0,
    successfulUploads: 0,
    failedUploads: 0,
    checksumMismatches: 0,
    skippedFiles: 0,
    databaseUpdates: 0,
    archivedFiles: 0,
    errors: [],
  }

  try {
    // Step 1: Scan local files
    log('Scanning local uploads directory...')
    const files = await scanLocalFiles(config.uploadsDir)
    result.totalFiles = files.length
    log(`Found ${files.length} files to migrate`)

    if (files.length === 0) {
      log('No files to migrate. Exiting.')
      return
    }

    // Step 2: Build file info list
    log('Building file metadata...')
    const fileInfoList = await buildFileInfoList(files, config.uploadsDir)

    // Calculate total size
    const totalSize = fileInfoList.reduce((sum, f) => sum + f.size, 0)
    log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)

    // Step 3: Create archive directory
    if (!config.dryRun && !config.skipArchive) {
      await fs.mkdir(config.archiveDir, { recursive: true })
      log(`Archive directory created: ${config.archiveDir}`)
    }

    // Step 4: Process files in batches
    log('\nStarting migration...\n')

    for (let i = 0; i < fileInfoList.length; i += config.batchSize) {
      const batch = fileInfoList.slice(i, i + config.batchSize)

      await Promise.all(batch.map(async (fileInfo) => {
        const progress: MigrationProgress = {
          current: i + batch.indexOf(fileInfo) + 1,
          total: fileInfoList.length,
          percentage: ((i + batch.indexOf(fileInfo) + 1) / fileInfoList.length) * 100,
          currentFile: fileInfo.localPath,
        }

        logProgress(progress)

        if (config.dryRun) {
          log(`[DRY RUN] Would upload: ${fileInfo.relativePath} -> ${fileInfo.s3Key}`, true)
          result.successfulUploads++
          return
        }

        // Calculate local MD5
        const localMd5 = await calculateMD5(fileInfo.localPath)

        // Upload file with retry
        const uploadResult = await uploadWithRetry(fileInfo, config)

        if (!uploadResult.success) {
          result.failedUploads++
          result.errors.push({ file: fileInfo.relativePath, error: uploadResult.error || 'Upload failed' })
          return
        }

        // Verify checksum
        if (uploadResult.etag && uploadResult.etag !== localMd5) {
          result.checksumMismatches++
          result.errors.push({
            file: fileInfo.relativePath,
            error: `Checksum mismatch: local=${localMd5}, remote=${uploadResult.etag}`
          })

          // Check if we've exceeded the failure threshold
          const failureRate = (result.checksumMismatches / result.totalFiles) * 100
          if (failureRate > config.checksumFailureThreshold) {
            throw new Error(`Checksum failure threshold exceeded (${failureRate.toFixed(1)}% > ${config.checksumFailureThreshold}%). Halting migration.`)
          }

          return
        }

        result.successfulUploads++

        // Update database records
        const dbResult = await updateDatabaseRecords(fileInfo, config)
        if (dbResult.updated) {
          result.databaseUpdates++
        }

        // Archive file
        const archived = await archiveFile(fileInfo, config)
        if (archived) {
          result.archivedFiles++
        }
      }))
    }

    console.log('\n\n') // Clear progress bar line

    // Step 5: Generate and display report
    const report = generateReport(result, config)
    console.log(report)

    // Save report to file
    const reportPath = path.join(config.archiveDir || PROJECT_ROOT, `migration-report-${Date.now()}.txt`)
    if (!config.dryRun) {
      await fs.writeFile(reportPath, report)
      log(`Report saved to: ${reportPath}`)
    }

    // Exit with appropriate code
    if (result.failedUploads > 0 || result.checksumMismatches > 0) {
      process.exit(1)
    }

    process.exit(0)

  } catch (error) {
    console.error('\nMigration failed with error:', error)

    // Generate partial report
    const report = generateReport(result, config)
    console.log(report)

    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if executed directly
main().catch(console.error)
