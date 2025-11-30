/**
 * Proxy Upload API
 *
 * Handles file uploads through the server to bypass CORS restrictions.
 * Files are uploaded to this endpoint, then forwarded to R2 server-side.
 *
 * POST /api/upload/proxy
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadFile, generateFileKey, validateFile, getPublicUrl } from '@/lib/r2'
import { createUploadError, UploadErrorCodes } from '@/validators/file'

// Increase body size limit for file uploads (default is 4MB in Next.js)
export const config = {
  api: {
    bodyParser: false,
  },
}

// For App Router, we need to configure the runtime
export const runtime = 'nodejs'

// Max file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        createUploadError(UploadErrorCodes.UNAUTHORIZED, 'Authentication required'),
        { status: 401 }
      )
    }

    // 2. Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const directory = (formData.get('directory') as string) || 'courses'

    if (!file) {
      return NextResponse.json(
        createUploadError(UploadErrorCodes.VALIDATION_ERROR, 'No file provided'),
        { status: 400 }
      )
    }

    // 3. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        createUploadError(
          UploadErrorCodes.FILE_TOO_LARGE,
          `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
        ),
        { status: 400 }
      )
    }

    // 4. Validate file type
    const typeValidation = validateFile(file.type, file.size)
    if (!typeValidation.valid) {
      return NextResponse.json(
        createUploadError(
          UploadErrorCodes.INVALID_FILE_TYPE,
          typeValidation.error || 'File type not allowed'
        ),
        { status: 400 }
      )
    }

    // 5. Generate unique S3 key
    const key = generateFileKey(directory, file.name, session.user.id)

    // 6. Convert File to Buffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 7. Upload to R2
    const result = await uploadFile(key, buffer, file.type)

    // 8. Get public URL
    const cdnUrl = getPublicUrl(key)

    // 9. Return success response
    return NextResponse.json({
      data: {
        id: key,
        s3Key: key,
        cdnUrl,
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        etag: result.etag,
      },
    })
  } catch (error) {
    console.error('Proxy upload error:', error)

    return NextResponse.json(
      createUploadError(UploadErrorCodes.S3_ERROR, 'Failed to upload file'),
      { status: 500 }
    )
  }
}
