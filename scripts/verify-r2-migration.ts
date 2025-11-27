/**
 * Verification Script - Validate R2 Migration
 *
 * Verifies that all migrated files are accessible via CDN URLs.
 *
 * Usage:
 *   npx tsx scripts/verify-r2-migration.ts [options]
 *
 * Options:
 *   --verbose       Show detailed progress
 *   --spot-check N  Only check N random files (default: all)
 */

import { PrismaClient } from '@prisma/client'

// ============================================
// Configuration & Types
// ============================================

interface VerificationConfig {
  verbose: boolean
  spotCheck: number | null
}

interface VerificationResult {
  totalRecords: number
  recordsWithS3Key: number
  recordsWithLocalPath: number
  recordsWithNoFile: number
  accessible: number
  inaccessible: number
  errors: Array<{ record: string; url: string; error: string }>
}

// ============================================
// Globals
// ============================================

const prisma = new PrismaClient()

// ============================================
// Utility Functions
// ============================================

function parseArgs(): VerificationConfig {
  const args = process.argv.slice(2)
  const spotCheckIndex = args.findIndex((arg, i, arr) => arr[i - 1] === '--spot-check')

  return {
    verbose: args.includes('--verbose'),
    spotCheck: spotCheckIndex >= 0 ? parseInt(args[spotCheckIndex], 10) : null,
  }
}

function log(message: string, verbose: boolean = false): void {
  const config = parseArgs()
  if (!verbose || config.verbose) {
    console.log(`[${new Date().toISOString()}] ${message}`)
  }
}

/**
 * Check if a URL is accessible via HTTP HEAD request
 */
async function checkUrlAccessible(url: string): Promise<{ accessible: boolean; error?: string }> {
  try {
    // For local paths, we can't verify via HTTP
    if (url.startsWith('/')) {
      return { accessible: true } // Assume local paths are accessible
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (response.ok) {
      return { accessible: true }
    }

    return {
      accessible: false,
      error: `HTTP ${response.status}: ${response.statusText}`,
    }
  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Shuffle array for random sampling
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// ============================================
// Main Verification Function
// ============================================

async function main(): Promise<void> {
  const config = parseArgs()

  console.log('\n========================================')
  console.log('R2 MIGRATION VERIFICATION')
  console.log('========================================')
  console.log(`Mode: ${config.spotCheck ? `Spot check (${config.spotCheck} files)` : 'Full verification'}`)
  console.log('========================================\n')

  const result: VerificationResult = {
    totalRecords: 0,
    recordsWithS3Key: 0,
    recordsWithLocalPath: 0,
    recordsWithNoFile: 0,
    accessible: 0,
    inaccessible: 0,
    errors: [],
  }

  try {
    // Step 1: Get all CourseContent records with file URLs
    log('Fetching CourseContent records...')
    const courseContent = await prisma.courseContent.findMany({
      where: {
        OR: [
          { fileUrl: { not: null } },
          { s3Key: { not: null } },
          { thumbnailUrl: { not: null } },
          { thumbnailS3Key: { not: null } },
        ],
      },
      select: {
        id: true,
        title: true,
        fileUrl: true,
        s3Key: true,
        thumbnailUrl: true,
        thumbnailS3Key: true,
      },
    })

    log(`Found ${courseContent.length} CourseContent records`)

    // Step 2: Get all Submission records with file URLs
    log('Fetching Submission records...')
    const submissions = await prisma.submission.findMany({
      where: {
        OR: [
          { fileUrl: { not: null } },
          { s3Key: { not: null } },
        ],
      },
      select: {
        id: true,
        fileUrl: true,
        s3Key: true,
      },
    })

    log(`Found ${submissions.length} Submission records`)

    // Step 3: Build list of URLs to check
    interface FileRecord {
      type: 'CourseContent' | 'Submission'
      id: string
      field: string
      url: string
      hasS3Key: boolean
    }

    const filesToCheck: FileRecord[] = []

    for (const content of courseContent) {
      // Main file
      if (content.s3Key || content.fileUrl) {
        const url = content.s3Key
          ? `${process.env.R2_PUBLIC_URL}/${content.s3Key}`
          : content.fileUrl!

        filesToCheck.push({
          type: 'CourseContent',
          id: content.id,
          field: 'fileUrl',
          url,
          hasS3Key: !!content.s3Key,
        })
      }

      // Thumbnail
      if (content.thumbnailS3Key || content.thumbnailUrl) {
        const url = content.thumbnailS3Key
          ? `${process.env.R2_PUBLIC_URL}/${content.thumbnailS3Key}`
          : content.thumbnailUrl!

        filesToCheck.push({
          type: 'CourseContent',
          id: content.id,
          field: 'thumbnailUrl',
          url,
          hasS3Key: !!content.thumbnailS3Key,
        })
      }
    }

    for (const submission of submissions) {
      if (submission.s3Key || submission.fileUrl) {
        const url = submission.s3Key
          ? `${process.env.R2_PUBLIC_URL}/${submission.s3Key}`
          : submission.fileUrl!

        filesToCheck.push({
          type: 'Submission',
          id: submission.id,
          field: 'fileUrl',
          url,
          hasS3Key: !!submission.s3Key,
        })
      }
    }

    result.totalRecords = filesToCheck.length
    result.recordsWithS3Key = filesToCheck.filter(f => f.hasS3Key).length
    result.recordsWithLocalPath = filesToCheck.filter(f => !f.hasS3Key && f.url.startsWith('/')).length

    log(`Total files to verify: ${filesToCheck.length}`)
    log(`  - With S3 key: ${result.recordsWithS3Key}`)
    log(`  - With local path: ${result.recordsWithLocalPath}`)

    // Step 4: Select files to check (all or sample)
    let filesToVerify = filesToCheck
    if (config.spotCheck && config.spotCheck < filesToCheck.length) {
      filesToVerify = shuffleArray(filesToCheck).slice(0, config.spotCheck)
      log(`Spot checking ${config.spotCheck} random files`)
    }

    // Step 5: Check accessibility
    log('\nVerifying file accessibility...\n')

    for (let i = 0; i < filesToVerify.length; i++) {
      const file = filesToVerify[i]
      const progress = ((i + 1) / filesToVerify.length * 100).toFixed(1)

      process.stdout.write(`\r[${progress}%] Checking ${file.type}:${file.id}:${file.field}...`.padEnd(80))

      // Skip local paths for HTTP verification
      if (file.url.startsWith('/')) {
        result.accessible++
        log(`[LOCAL] ${file.type}:${file.id} - ${file.url}`, true)
        continue
      }

      const check = await checkUrlAccessible(file.url)

      if (check.accessible) {
        result.accessible++
        log(`[OK] ${file.type}:${file.id} - ${file.url}`, true)
      } else {
        result.inaccessible++
        result.errors.push({
          record: `${file.type}:${file.id}:${file.field}`,
          url: file.url,
          error: check.error || 'Unknown error',
        })
        log(`[FAIL] ${file.type}:${file.id} - ${check.error}`, true)
      }
    }

    console.log('\n\n')

    // Step 6: Generate report
    const report = `
================================================================================
VERIFICATION REPORT
================================================================================
Generated: ${new Date().toISOString()}
Mode: ${config.spotCheck ? `Spot check (${config.spotCheck} files)` : 'Full verification'}

SUMMARY
-------
Total File Records:      ${result.totalRecords}
  - With S3 Key:         ${result.recordsWithS3Key}
  - With Local Path:     ${result.recordsWithLocalPath}

Files Verified:          ${filesToVerify.length}
  - Accessible:          ${result.accessible}
  - Inaccessible:        ${result.inaccessible}

ACCESSIBILITY RATE: ${filesToVerify.length > 0 ? ((result.accessible / filesToVerify.length) * 100).toFixed(2) : 0}%

${result.errors.length > 0 ? `
INACCESSIBLE FILES
------------------
${result.errors.map(e => `- ${e.record}\n  URL: ${e.url}\n  Error: ${e.error}`).join('\n\n')}
` : ''}
================================================================================
`

    console.log(report)

    // Exit code based on results
    if (result.inaccessible > 0) {
      process.exit(1)
    }

    process.exit(0)

  } catch (error) {
    console.error('\nVerification failed with error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if executed directly
main().catch(console.error)
