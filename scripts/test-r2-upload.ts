/**
 * R2 Storage Upload Test Script
 *
 * Tests basic R2 operations: upload, download, signed URL generation, and deletion.
 * Run with: npx tsx scripts/test-r2-upload.ts
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local manually (tsx doesn't auto-load it)
const envPath = resolve(process.cwd(), '.env.local')
try {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        process.env[key] = valueParts.join('=')
      }
    }
  }
} catch {
  console.warn('Warning: Could not load .env.local')
}

import crypto from 'crypto'
import {
  uploadFile,
  generateSignedDownloadUrl,
  generateSignedUploadUrl,
  getPublicUrl,
  deleteFile,
  fileExists,
  getFileMetadata,
  listFiles,
  getR2Client,
  getBucketName,
} from '../src/lib/r2'

interface TestResult {
  name: string
  passed: boolean
  message: string
  duration: number
}

const results: TestResult[] = []

async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  const start = Date.now()
  try {
    await testFn()
    results.push({
      name,
      passed: true,
      message: 'Success',
      duration: Date.now() - start,
    })
    console.log(`  ✅ ${name} (${Date.now() - start}ms)`)
  } catch (error) {
    results.push({
      name,
      passed: false,
      message: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start,
    })
    console.log(`  ❌ ${name}: ${error instanceof Error ? error.message : error}`)
  }
}

async function main() {
  console.log('='.repeat(60))
  console.log('R2 Storage Integration Test')
  console.log('='.repeat(60))
  console.log('')
  console.log(`Bucket: ${getBucketName()}`)
  console.log(`Account ID: ${process.env.R2_ACCOUNT_ID}`)
  console.log('')

  const testKey = `test/${Date.now()}-test-file.txt`
  const testContent = `Test file content generated at ${new Date().toISOString()}\n` +
    'This is a test file for verifying R2 storage integration.\n' +
    crypto.randomBytes(1024).toString('hex') // Add some random content
  const testBuffer = Buffer.from(testContent)
  const checksumBefore = crypto.createHash('md5').update(testBuffer).digest('hex')

  console.log('Running tests...')
  console.log('')

  // Test 1: R2 Client initialization
  await runTest('R2 Client initialization', async () => {
    const client = getR2Client()
    if (!client) {
      throw new Error('Failed to initialize R2 client')
    }
  })

  // Test 2: Upload file
  await runTest('Upload file to R2', async () => {
    const result = await uploadFile(testKey, testBuffer, 'text/plain', {
      'test-metadata': 'true',
      'uploaded-by': 'test-script',
    })
    if (!result.key) {
      throw new Error('Upload returned no key')
    }
  })

  // Test 3: Check file exists
  await runTest('Verify file exists', async () => {
    const exists = await fileExists(testKey)
    if (!exists) {
      throw new Error('File not found after upload')
    }
  })

  // Test 4: Get file metadata
  await runTest('Get file metadata', async () => {
    const metadata = await getFileMetadata(testKey)
    if (!metadata) {
      throw new Error('Failed to get file metadata')
    }
    if (metadata.size !== testBuffer.length) {
      throw new Error(`Size mismatch: expected ${testBuffer.length}, got ${metadata.size}`)
    }
    if (metadata.contentType !== 'text/plain') {
      throw new Error(`Content type mismatch: expected text/plain, got ${metadata.contentType}`)
    }
  })

  // Test 5: Generate signed download URL
  let downloadUrl = ''
  await runTest('Generate signed download URL', async () => {
    downloadUrl = await generateSignedDownloadUrl(testKey, 300)
    if (!downloadUrl || !downloadUrl.startsWith('https://')) {
      throw new Error('Invalid signed URL generated')
    }
  })

  // Test 6: Download via signed URL and verify checksum
  await runTest('Download file and verify checksum', async () => {
    if (!downloadUrl) {
      throw new Error('No download URL available')
    }

    const response = await fetch(downloadUrl)
    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`)
    }

    const downloadedContent = Buffer.from(await response.arrayBuffer())
    const checksumAfter = crypto.createHash('md5').update(downloadedContent).digest('hex')

    if (checksumBefore !== checksumAfter) {
      throw new Error(`Checksum mismatch: expected ${checksumBefore}, got ${checksumAfter}`)
    }
  })

  // Test 7: Generate signed upload URL
  await runTest('Generate signed upload URL', async () => {
    const uploadUrl = await generateSignedUploadUrl(
      `test/${Date.now()}-presigned-upload.txt`,
      'text/plain',
      300
    )
    if (!uploadUrl || !uploadUrl.startsWith('https://')) {
      throw new Error('Invalid signed upload URL generated')
    }
  })

  // Test 8: List files
  await runTest('List files in test directory', async () => {
    const files = await listFiles('test/')
    if (!Array.isArray(files)) {
      throw new Error('List files did not return an array')
    }
    const testFile = files.find(f => f.key === testKey)
    if (!testFile) {
      throw new Error('Test file not found in listing')
    }
  })

  // Test 9: Get public URL
  await runTest('Generate public URL', async () => {
    const publicUrl = getPublicUrl(testKey)
    if (!publicUrl || !publicUrl.includes(testKey)) {
      throw new Error('Invalid public URL generated')
    }
  })

  // Test 10: Delete file
  await runTest('Delete test file', async () => {
    await deleteFile(testKey)
    // Wait a moment for deletion to propagate
    await new Promise(resolve => setTimeout(resolve, 1000))
  })

  // Test 11: Verify file deleted
  await runTest('Verify file deleted', async () => {
    const exists = await fileExists(testKey)
    if (exists) {
      throw new Error('File still exists after deletion')
    }
  })

  // Summary
  console.log('')
  console.log('='.repeat(60))
  console.log('TEST SUMMARY')
  console.log('='.repeat(60))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

  console.log(`  Total: ${results.length}`)
  console.log(`  Passed: ${passed}`)
  console.log(`  Failed: ${failed}`)
  console.log(`  Duration: ${totalDuration}ms`)
  console.log('')

  if (failed > 0) {
    console.log('Failed tests:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`)
    })
    console.log('')
  }

  console.log(`OVERALL: ${failed === 0 ? '✅ PASS' : '❌ FAIL'}`)
  console.log('='.repeat(60))

  // Exit with appropriate code
  process.exit(failed === 0 ? 0 : 1)
}

main().catch(error => {
  console.error('Test script failed:', error)
  process.exit(1)
})
