/**
 * S3/R2 Upload Hook
 *
 * Client-side hook for uploading files to R2 via signed URLs.
 * Handles the full upload flow: request signed URL -> upload to R2 -> complete upload.
 */

import { useState, useCallback } from 'react'

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface UploadResult {
  id: string
  s3Key: string
  cdnUrl: string
  filename: string
  size: number
  mimeType: string
}

export interface UploadError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface UseS3UploadOptions {
  directory?: 'courses' | 'submissions' | 'profiles' | 'thumbnails'
  contentId?: string // For course content uploads
  assignmentId?: string // For assignment submissions
  isPublic?: boolean
  onProgress?: (progress: UploadProgress) => void
  onSuccess?: (result: UploadResult) => void
  onError?: (error: UploadError) => void
}

export interface UseS3UploadReturn {
  upload: (file: File) => Promise<UploadResult | null>
  retry: () => Promise<UploadResult | null>
  uploading: boolean
  progress: UploadProgress | null
  error: UploadError | null
  canRetry: boolean
  reset: () => void
}

/**
 * Check if an error is retryable (transient failures)
 */
export function isRetryableError(error: UploadError | null): boolean {
  if (!error) return false
  const retryableCodes = ['NETWORK_ERROR', 'UPLOAD_TIMEOUT', 'S3_ERROR']
  return retryableCodes.includes(error.code)
}

export function useS3Upload(options: UseS3UploadOptions = {}): UseS3UploadReturn {
  const {
    directory = 'courses',
    contentId,
    assignmentId,
    isPublic = false,
    onProgress,
    onSuccess,
    onError,
  } = options

  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [error, setError] = useState<UploadError | null>(null)
  const [lastFile, setLastFile] = useState<File | null>(null)

  const reset = useCallback(() => {
    setUploading(false)
    setProgress(null)
    setError(null)
    setLastFile(null)
  }, [])

  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      setUploading(true)
      setProgress(null)
      setError(null)
      setLastFile(file)

      try {
        // Step 1: Request signed URL from our API
        const signedUrlResponse = await fetch('/api/upload/signed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type,
            size: file.size,
            directory,
          }),
        })

        if (!signedUrlResponse.ok) {
          const errorData = await signedUrlResponse.json()
          const uploadError: UploadError = errorData.error || {
            code: 'SIGNED_URL_ERROR',
            message: 'Failed to get upload URL',
          }
          setError(uploadError)
          onError?.(uploadError)
          return null
        }

        const { data: signedUrlData } = await signedUrlResponse.json()
        const { uploadUrl, key } = signedUrlData

        // Step 2: Upload file directly to R2 via signed URL
        // Using XMLHttpRequest for progress tracking
        const uploadResult = await new Promise<boolean>((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progressData: UploadProgress = {
                loaded: event.loaded,
                total: event.total,
                percentage: Math.round((event.loaded / event.total) * 100),
              }
              setProgress(progressData)
              onProgress?.(progressData)
            }
          })

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(true)
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          })

          xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'))
          })

          xhr.addEventListener('timeout', () => {
            reject(new Error('Upload timed out'))
          })

          xhr.open('PUT', uploadUrl)
          xhr.setRequestHeader('Content-Type', file.type)
          xhr.timeout = 5 * 60 * 1000 // 5 minute timeout
          xhr.send(file)
        })

        if (!uploadResult) {
          const uploadError: UploadError = {
            code: 'UPLOAD_FAILED',
            message: 'Failed to upload file to storage',
          }
          setError(uploadError)
          onError?.(uploadError)
          return null
        }

        // Step 3: Complete upload by storing metadata
        const completeResponse = await fetch('/api/upload/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key,
            filename: file.name,
            size: file.size,
            mimeType: file.type,
            contentId,
            assignmentId,
            isPublic,
          }),
        })

        if (!completeResponse.ok) {
          const errorData = await completeResponse.json()
          const uploadError: UploadError = errorData.error || {
            code: 'COMPLETE_ERROR',
            message: 'Failed to complete upload',
          }
          setError(uploadError)
          onError?.(uploadError)
          return null
        }

        const { data: result } = await completeResponse.json()

        setProgress({ loaded: file.size, total: file.size, percentage: 100 })
        setUploading(false)
        onSuccess?.(result)

        return result
      } catch (err) {
        const uploadError: UploadError = {
          code: 'NETWORK_ERROR',
          message: err instanceof Error ? err.message : 'Upload failed',
        }
        setError(uploadError)
        onError?.(uploadError)
        setUploading(false)
        return null
      }
    },
    [directory, contentId, assignmentId, isPublic, onProgress, onSuccess, onError]
  )

  const retry = useCallback(async (): Promise<UploadResult | null> => {
    if (!lastFile) return null
    return upload(lastFile)
  }, [lastFile, upload])

  const canRetry = isRetryableError(error) && lastFile !== null && !uploading

  return {
    upload,
    retry,
    uploading,
    progress,
    error,
    canRetry,
    reset,
  }
}

/**
 * Simple upload function without hook (for one-off uploads)
 */
export async function uploadToS3(
  file: File,
  options: Omit<UseS3UploadOptions, 'onProgress' | 'onSuccess' | 'onError'> = {}
): Promise<UploadResult> {
  const {
    directory = 'courses',
    contentId,
    assignmentId,
    isPublic = false,
  } = options

  // Step 1: Request signed URL
  const signedUrlResponse = await fetch('/api/upload/signed-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      directory,
    }),
  })

  if (!signedUrlResponse.ok) {
    const errorData = await signedUrlResponse.json()
    throw new Error(errorData.error?.message || 'Failed to get upload URL')
  }

  const { data: signedUrlData } = await signedUrlResponse.json()
  const { uploadUrl, key } = signedUrlData

  // Step 2: Upload to R2
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload file to storage')
  }

  // Step 3: Complete upload
  const completeResponse = await fetch('/api/upload/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
      contentId,
      assignmentId,
      isPublic,
    }),
  })

  if (!completeResponse.ok) {
    const errorData = await completeResponse.json()
    throw new Error(errorData.error?.message || 'Failed to complete upload')
  }

  const { data: result } = await completeResponse.json()
  return result
}
