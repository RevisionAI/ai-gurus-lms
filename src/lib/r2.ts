/**
 * Cloudflare R2 Storage Client
 *
 * S3-compatible storage client configured for Cloudflare R2.
 * Provides helper functions for file uploads, downloads, and signed URL generation.
 *
 * Environment variables required:
 * - R2_ACCOUNT_ID: Cloudflare account ID
 * - R2_ACCESS_KEY_ID: R2 API token access key
 * - R2_SECRET_ACCESS_KEY: R2 API token secret
 * - R2_BUCKET_NAME: R2 bucket name
 * - R2_PUBLIC_URL: R2 public CDN URL (r2.dev subdomain)
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Validate required environment variables
function validateEnvVars(): void {
  const required = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
  ]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required R2 environment variables: ${missing.join(', ')}`
    )
  }
}

// Create R2 client (lazy initialization)
let r2ClientInstance: S3Client | null = null

/**
 * Get the R2 S3 client instance (singleton)
 */
export function getR2Client(): S3Client {
  if (!r2ClientInstance) {
    validateEnvVars()

    r2ClientInstance = new S3Client({
      region: 'auto', // R2 uses 'auto' region
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  }

  return r2ClientInstance
}

// Bucket name helper (function for lazy evaluation)
export function getBucketName(): string {
  return process.env.R2_BUCKET_NAME || ''
}

// Legacy export for backwards compatibility
export const bucketName = process.env.R2_BUCKET_NAME || ''

// Public URL helper (function for lazy evaluation)
export function getPublicUrlBase(): string {
  return process.env.R2_PUBLIC_URL || ''
}

// Legacy export for backwards compatibility
export const publicUrl = process.env.R2_PUBLIC_URL || ''

/**
 * Generate a pre-signed URL for uploading a file directly to R2
 *
 * @param key - The object key (file path in bucket)
 * @param contentType - MIME type of the file
 * @param expiresIn - URL expiration time in seconds (default: 5 minutes)
 * @returns Pre-signed PUT URL for direct upload
 */
export async function generateSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 300 // 5 minutes
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: contentType,
  })

  return await getSignedUrl(getR2Client(), command, { expiresIn })
}

/**
 * Generate a pre-signed URL for downloading a private file from R2
 *
 * @param key - The object key (file path in bucket)
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Pre-signed GET URL for private content
 */
export async function generateSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  })

  return await getSignedUrl(getR2Client(), command, { expiresIn })
}

/**
 * Get the public CDN URL for a file (no signature needed)
 * Use this for publicly accessible content like course materials and thumbnails.
 *
 * @param key - The object key (file path in bucket)
 * @returns Public CDN URL
 */
export function getPublicUrl(key: string): string {
  const baseUrl = getPublicUrlBase()
  if (!baseUrl) {
    throw new Error('R2_PUBLIC_URL environment variable is not configured')
  }
  return `${baseUrl}/${key}`
}

/**
 * Upload a file directly to R2
 *
 * @param key - The object key (file path in bucket)
 * @param body - File content (Buffer, ReadableStream, or string)
 * @param contentType - MIME type of the file
 * @param metadata - Optional metadata to attach to the object
 * @returns Upload result
 */
export async function uploadFile(
  key: string,
  body: Buffer | ReadableStream | string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<{ key: string; etag?: string }> {
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  })

  const response = await getR2Client().send(command)

  return {
    key,
    etag: response.ETag,
  }
}

/**
 * Delete a file from R2
 *
 * @param key - The object key (file path in bucket)
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  })

  await getR2Client().send(command)
}

/**
 * Check if a file exists in R2
 *
 * @param key - The object key (file path in bucket)
 * @returns True if file exists, false otherwise
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    })

    await getR2Client().send(command)
    return true
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'NotFound') {
      return false
    }
    throw error
  }
}

/**
 * Get file metadata from R2
 *
 * @param key - The object key (file path in bucket)
 * @returns File metadata including size, content type, and last modified
 */
export async function getFileMetadata(key: string): Promise<{
  size: number
  contentType?: string
  lastModified?: Date
  etag?: string
  metadata?: Record<string, string>
} | null> {
  try {
    const command = new HeadObjectCommand({
      Bucket: getBucketName(),
      Key: key,
    })

    const response = await getR2Client().send(command)

    return {
      size: response.ContentLength || 0,
      contentType: response.ContentType,
      lastModified: response.LastModified,
      etag: response.ETag,
      metadata: response.Metadata,
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'NotFound') {
      return null
    }
    throw error
  }
}

/**
 * List files in a directory (prefix) in R2
 *
 * @param prefix - The directory prefix to list
 * @param maxKeys - Maximum number of keys to return (default: 1000)
 * @returns Array of file keys and metadata
 */
export async function listFiles(
  prefix: string,
  maxKeys: number = 1000
): Promise<Array<{ key: string; size: number; lastModified?: Date }>> {
  const command = new ListObjectsV2Command({
    Bucket: getBucketName(),
    Prefix: prefix,
    MaxKeys: maxKeys,
  })

  const response = await getR2Client().send(command)

  return (response.Contents || []).map((item) => ({
    key: item.Key || '',
    size: item.Size || 0,
    lastModified: item.LastModified,
  }))
}

/**
 * Generate a unique file key with timestamp
 *
 * @param directory - Directory path (e.g., 'uploads', 'submissions')
 * @param filename - Original filename
 * @param userId - Optional user ID for organization
 * @returns Unique file key
 */
export function generateFileKey(
  directory: string,
  filename: string,
  userId?: string
): string {
  const timestamp = Date.now()
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')

  if (userId) {
    return `${directory}/${userId}/${timestamp}-${sanitizedFilename}`
  }

  return `${directory}/${timestamp}-${sanitizedFilename}`
}

// Allowed MIME types for file uploads (to be enforced in upload API)
export const ALLOWED_MIME_TYPES = {
  // Documents
  'application/pdf': { ext: 'pdf', maxSize: 50 * 1024 * 1024 }, // 50MB
  'application/msword': { ext: 'doc', maxSize: 50 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    ext: 'docx',
    maxSize: 50 * 1024 * 1024,
  },
  'application/vnd.ms-excel': { ext: 'xls', maxSize: 50 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    ext: 'xlsx',
    maxSize: 50 * 1024 * 1024,
  },
  'application/vnd.ms-powerpoint': { ext: 'ppt', maxSize: 50 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    ext: 'pptx',
    maxSize: 50 * 1024 * 1024,
  },

  // Images
  'image/jpeg': { ext: 'jpg', maxSize: 10 * 1024 * 1024 }, // 10MB
  'image/png': { ext: 'png', maxSize: 10 * 1024 * 1024 },
  'image/gif': { ext: 'gif', maxSize: 10 * 1024 * 1024 },
  'image/webp': { ext: 'webp', maxSize: 10 * 1024 * 1024 },

  // Video
  'video/mp4': { ext: 'mp4', maxSize: 500 * 1024 * 1024 }, // 500MB
  'video/webm': { ext: 'webm', maxSize: 500 * 1024 * 1024 },
  'video/quicktime': { ext: 'mov', maxSize: 500 * 1024 * 1024 },

  // Archives
  'application/zip': { ext: 'zip', maxSize: 100 * 1024 * 1024 }, // 100MB
  'application/x-zip-compressed': { ext: 'zip', maxSize: 100 * 1024 * 1024 },

  // Text
  'text/plain': { ext: 'txt', maxSize: 10 * 1024 * 1024 },
  'text/csv': { ext: 'csv', maxSize: 10 * 1024 * 1024 },
} as const

/**
 * Validate file type and size
 *
 * @param contentType - MIME type of the file
 * @param size - File size in bytes
 * @returns Validation result with error message if invalid
 */
export function validateFile(
  contentType: string,
  size: number
): { valid: boolean; error?: string } {
  const allowedType = ALLOWED_MIME_TYPES[contentType as keyof typeof ALLOWED_MIME_TYPES]

  if (!allowedType) {
    return {
      valid: false,
      error: `File type '${contentType}' is not allowed`,
    }
  }

  if (size > allowedType.maxSize) {
    const maxSizeMB = allowedType.maxSize / (1024 * 1024)
    return {
      valid: false,
      error: `File size exceeds maximum allowed (${maxSizeMB}MB for ${allowedType.ext} files)`,
    }
  }

  return { valid: true }
}

/**
 * Resolve file URL with fallback logic for migration compatibility
 *
 * Priority:
 * 1. If s3Key is present, return CDN URL
 * 2. If fileUrl is a CDN URL (contains r2.dev), return as-is
 * 3. If fileUrl is a local path, return as-is (legacy support)
 * 4. Return null if no URL available
 *
 * @param s3Key - S3/R2 object key (if migrated)
 * @param fileUrl - Legacy file URL (local or external)
 * @returns Resolved URL or null
 */
export function resolveFileUrl(
  s3Key: string | null | undefined,
  fileUrl: string | null | undefined
): string | null {
  // If s3Key exists, always prefer CDN URL
  if (s3Key) {
    return getPublicUrl(s3Key)
  }

  // If fileUrl exists, return it (could be local path or external URL)
  if (fileUrl) {
    return fileUrl
  }

  return null
}

/**
 * Check if a file URL is from R2/CDN
 *
 * @param url - File URL to check
 * @returns True if URL is from R2/CDN
 */
export function isCloudUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return url.includes('r2.dev') || url.includes('cloudflarestorage')
}

/**
 * Check if a file URL is a local path
 *
 * @param url - File URL to check
 * @returns True if URL is a local path
 */
export function isLocalPath(url: string | null | undefined): boolean {
  if (!url) return false
  return url.startsWith('/uploads/') || url.startsWith('/public/uploads/')
}

/**
 * Get file storage type for UI display
 *
 * @param s3Key - S3/R2 object key
 * @param fileUrl - File URL
 * @returns Storage type: 'cloud', 'local', 'external', or null
 */
export function getStorageType(
  s3Key: string | null | undefined,
  fileUrl: string | null | undefined
): 'cloud' | 'local' | 'external' | null {
  if (s3Key) return 'cloud'
  if (!fileUrl) return null
  if (isCloudUrl(fileUrl)) return 'cloud'
  if (isLocalPath(fileUrl)) return 'local'
  return 'external'
}
