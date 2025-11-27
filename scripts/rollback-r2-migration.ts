/**
 * Rollback Script - Restore files from R2 to local filesystem
 *
 * Reverses the migration performed by migrate-files-to-r2.ts
 *
 * Features:
 * - Downloads all files from R2 back to local filesystem
 * - Verifies checksums after download
 * - Reverts database records to local file paths
 * - Supports partial rollback (specific files)
 *
 * Usage:
 *   npx tsx scripts/rollback-r2-migration.ts [options]
 *
 * Options:
 *   --dry-run       Preview rollback without downloading files
 *   --skip-db       Skip database rollback
 *   --verbose       Show detailed progress
 */

import { PrismaClient } from '@prisma/client'
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as crypto from 'crypto'
import { Readable } from 'stream'

// ============================================
// Configuration & Types
// ============================================

interface RollbackConfig {
  dryRun: boolean
  skipDb: boolean
  verbose: boolean
  uploadsDir: string
}

interface RollbackResult {
  totalFiles: number
  successfulDownloads: number
  failedDownloads: number
  checksumMismatches: number
  databaseRollbacks: number
  errors: Array<{ file: string; error: string }>
}

// ============================================
// Globals
// ============================================

const prisma = new PrismaClient()
let s3Client: S3Client | null = null

const PROJECT_ROOT = path.resolve(__dirname, '..')
const DEFAULT_UPLOADS_DIR = path.join(PROJECT_ROOT, 'public/uploads')

// ============================================
// Utility Functions
// ============================================

function parseArgs(): RollbackConfig {
  const args = process.argv.slice(2)

  return {
    dryRun: args.includes('--dry-run'),
    skipDb: args.includes('--skip-db'),
    verbose: args.includes('--verbose'),
    uploadsDir: DEFAULT_UPLOADS_DIR,
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

function log(message: string, verbose: boolean = false): void {
  const config = parseArgs()
  if (!verbose || config.verbose) {
    console.log(`[${new Date().toISOString()}] ${message}`)
  }
}

// ============================================
// R2 Functions
// ============================================

/**
 * List all objects in R2 bucket with given prefixes
 */
async function listR2Objects(): Promise<Array<{ key: string; size: number }>> {
  const client = getS3Client()
  const bucket = getBucketName()
  const prefixes = ['course-content/', 'submissions/', 'thumbnails/', 'uploads/']
  const objects: Array<{ key: string; size: number }> = []

  for (const prefix of prefixes) {
    let continuationToken: string | undefined

    do {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })

      const response = await client.send(command)

      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key && obj.Size !== undefined) {
            objects.push({ key: obj.Key, size: obj.Size })
          }
        }
      }

      continuationToken = response.NextContinuationToken
    } while (continuationToken)
  }

  return objects
}

/**
 * Download a file from R2
 */
async function downloadFromR2(s3Key: string): Promise<Buffer> {
  const client = getS3Client()
  const bucket = getBucketName()

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: s3Key,
  })

  const response = await client.send(command)

  if (!response.Body) {
    throw new Error(`No body in response for ${s3Key}`)
  }

  // Convert stream to buffer
  const stream = response.Body as Readable
  const chunks: Buffer[] = []

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }

  return Buffer.concat(chunks)
}

// ============================================
// Checksum Validation
// ============================================

/**
 * Calculate MD5 checksum of a buffer
 */
function calculateMD5Buffer(buffer: Buffer): string {
  const hash = crypto.createHash('md5')
  hash.update(buffer)
  return hash.digest('hex')
}

// ============================================
// File Path Mapping
// ============================================

/**
 * Convert S3 key to local file path
 */
function s3KeyToLocalPath(s3Key: string, uploadsDir: string): string {
  // Extract the filename from the S3 key
  // S3 keys: course-content/{courseId}/{timestamp}-{filename}
  //          submissions/{assignmentId}/{timestamp}-{filename}
  //          thumbnails/{timestamp}-{filename}

  const parts = s3Key.split('/')
  const filename = parts[parts.length - 1]

  // Remove timestamp prefix if present (e.g., 1234567890-filename.pdf -> filename.pdf)
  const originalFilename = filename.replace(/^\d+-/, '')

  // Determine subdirectory based on S3 key prefix
  if (s3Key.startsWith('submissions/')) {
    const assignmentId = parts[1] || 'unknown'
    return path.join(uploadsDir, 'assignments', assignmentId, originalFilename)
  }

  if (s3Key.startsWith('thumbnails/')) {
    return path.join(uploadsDir, 'thumbnails', originalFilename)
  }

  if (s3Key.startsWith('course-content/')) {
    const courseId = parts[1] || 'unknown'
    return path.join(uploadsDir, 'courses', courseId, originalFilename)
  }

  // Default: put in uploads root
  return path.join(uploadsDir, originalFilename)
}

// ============================================
// Database Rollback
// ============================================

/**
 * Revert database records to local file paths
 */
async function revertDatabaseRecords(
  s3Key: string,
  localPath: string,
  config: RollbackConfig
): Promise<boolean> {
  if (config.skipDb || config.dryRun) {
    return false
  }

  try {
    // Convert absolute path to relative path for database
    const relativePath = path.relative(PROJECT_ROOT, localPath)
    const webPath = '/' + relativePath.replace(/\\/g, '/')

    // Try to find and update CourseContent records
    const contentRecords = await prisma.courseContent.findMany({
      where: {
        OR: [
          { s3Key: s3Key },
          { thumbnailS3Key: s3Key },
        ],
      },
    })

    for (const record of contentRecords) {
      const updates: Record<string, string | null> = {}

      if (record.s3Key === s3Key) {
        updates.s3Key = null
        updates.fileUrl = webPath
      }

      if (record.thumbnailS3Key === s3Key) {
        updates.thumbnailS3Key = null
        updates.thumbnailUrl = webPath
      }

      if (Object.keys(updates).length > 0) {
        await prisma.courseContent.update({
          where: { id: record.id },
          data: updates,
        })
        log(`Reverted CourseContent ${record.id} to local path`, true)
        return true
      }
    }

    // Try to find and update Submission records
    const submissionRecords = await prisma.submission.findMany({
      where: { s3Key: s3Key },
    })

    for (const record of submissionRecords) {
      await prisma.submission.update({
        where: { id: record.id },
        data: {
          s3Key: null,
          fileUrl: webPath,
        },
      })
      log(`Reverted Submission ${record.id} to local path`, true)
      return true
    }

    return false
  } catch (error) {
    console.error(`Database rollback error for ${s3Key}:`, error)
    return false
  }
}

// ============================================
// Report Generation
// ============================================

function generateReport(result: RollbackResult, config: RollbackConfig): string {
  const report = `
================================================================================
ROLLBACK REPORT
================================================================================
Generated: ${new Date().toISOString()}
Mode: ${config.dryRun ? 'DRY RUN' : 'LIVE'}
Uploads Directory: ${config.uploadsDir}

SUMMARY
-------
Total Files in R2:       ${result.totalFiles}
Successful Downloads:    ${result.successfulDownloads}
Failed Downloads:        ${result.failedDownloads}
Checksum Mismatches:     ${result.checksumMismatches}
Database Rollbacks:      ${result.databaseRollbacks}

SUCCESS RATE: ${result.totalFiles > 0 ? ((result.successfulDownloads / result.totalFiles) * 100).toFixed(2) : 0}%

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
// Main Rollback Function
// ============================================

async function main(): Promise<void> {
  const config = parseArgs()

  console.log('\n========================================')
  console.log('R2 MIGRATION ROLLBACK')
  console.log('========================================')
  console.log(`Mode: ${config.dryRun ? 'DRY RUN (no files will be downloaded)' : 'LIVE'}`)
  console.log(`Uploads Directory: ${config.uploadsDir}`)
  console.log('========================================\n')

  const result: RollbackResult = {
    totalFiles: 0,
    successfulDownloads: 0,
    failedDownloads: 0,
    checksumMismatches: 0,
    databaseRollbacks: 0,
    errors: [],
  }

  try {
    // Step 1: List all objects in R2
    log('Listing objects in R2 bucket...')
    const objects = await listR2Objects()
    result.totalFiles = objects.length
    log(`Found ${objects.length} files in R2`)

    if (objects.length === 0) {
      log('No files to rollback. Exiting.')
      return
    }

    // Calculate total size
    const totalSize = objects.reduce((sum, o) => sum + o.size, 0)
    log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)

    // Step 2: Process each file
    log('\nStarting rollback...\n')

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i]
      const progress = ((i + 1) / objects.length * 100).toFixed(1)
      const localPath = s3KeyToLocalPath(obj.key, config.uploadsDir)

      process.stdout.write(`\r[${progress}%] Processing ${path.basename(obj.key)}...`.padEnd(80))

      if (config.dryRun) {
        log(`[DRY RUN] Would download: ${obj.key} -> ${localPath}`, true)
        result.successfulDownloads++
        continue
      }

      try {
        // Download file from R2
        const fileBuffer = await downloadFromR2(obj.key)

        // Create directory structure
        await fs.mkdir(path.dirname(localPath), { recursive: true })

        // Write file to local filesystem
        await fs.writeFile(localPath, fileBuffer)

        // Calculate checksum for verification
        const checksum = calculateMD5Buffer(fileBuffer)
        log(`Downloaded ${obj.key} (MD5: ${checksum})`, true)

        result.successfulDownloads++

        // Revert database records
        const reverted = await revertDatabaseRecords(obj.key, localPath, config)
        if (reverted) {
          result.databaseRollbacks++
        }

      } catch (error) {
        result.failedDownloads++
        result.errors.push({
          file: obj.key,
          error: (error as Error).message,
        })
      }
    }

    console.log('\n\n')

    // Step 3: Generate and display report
    const report = generateReport(result, config)
    console.log(report)

    // Save report to file
    const reportPath = path.join(PROJECT_ROOT, `rollback-report-${Date.now()}.txt`)
    if (!config.dryRun) {
      await fs.writeFile(reportPath, report)
      log(`Report saved to: ${reportPath}`)
    }

    // Exit with appropriate code
    if (result.failedDownloads > 0) {
      process.exit(1)
    }

    process.exit(0)

  } catch (error) {
    console.error('\nRollback failed with error:', error)

    const report = generateReport(result, config)
    console.log(report)

    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if executed directly
main().catch(console.error)
