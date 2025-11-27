/**
 * Upload Error Display Component
 *
 * Displays upload errors with user-friendly messages and retry button
 * for transient failures (network errors, timeouts).
 */

'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { isRetryableError, UploadError as UploadErrorType } from '@/hooks/useS3Upload'

interface UploadErrorProps {
  error: UploadErrorType
  onRetry?: () => void
  canRetry?: boolean
  onDismiss?: () => void
}

/**
 * Get a user-friendly message for upload error codes
 */
function getUserFriendlyMessage(error: UploadErrorType): string {
  switch (error.code) {
    case 'FILE_TOO_LARGE':
      return error.message || 'The file is too large. Please select a smaller file.'
    case 'INVALID_FILE_TYPE':
      return error.message || 'This file type is not allowed. Please select a different file.'
    case 'UPLOAD_TIMEOUT':
      return 'The upload took too long. Please check your internet connection and try again.'
    case 'NETWORK_ERROR':
      return 'A network error occurred. Please check your internet connection and try again.'
    case 'UNAUTHORIZED':
      return 'You are not authorized to upload files. Please log in and try again.'
    case 'S3_ERROR':
      return 'The storage service is temporarily unavailable. Please try again later.'
    case 'VALIDATION_ERROR':
      return error.message || 'The file information is invalid. Please try a different file.'
    default:
      return error.message || 'An unexpected error occurred. Please try again.'
  }
}

export function UploadErrorDisplay({
  error,
  onRetry,
  canRetry,
  onDismiss,
}: UploadErrorProps) {
  const showRetry = canRetry ?? isRetryableError(error)
  const message = getUserFriendlyMessage(error)

  return (
    <div className="rounded-md bg-red-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">Upload Failed</h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
          {error.details && (
            <details className="mt-2">
              <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                Technical details
              </summary>
              <pre className="mt-1 text-xs text-red-500 whitespace-pre-wrap">
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          )}
          <div className="mt-3 flex space-x-3">
            {showRetry && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry Upload
              </button>
            )}
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="text-sm font-medium text-red-600 hover:text-red-500"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadErrorDisplay
