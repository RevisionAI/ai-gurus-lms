/**
 * Signed URL Generation API
 *
 * Generates pre-signed URLs for direct client-to-R2 uploads.
 * This endpoint validates the request and returns a signed PUT URL.
 *
 * POST /api/upload/signed-url
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  generateSignedUploadUrl,
  generateFileKey,
  validateFile,
} from '@/lib/r2'
import {
  signedUrlRequestSchema,
  createUploadError,
  UploadErrorCodes,
  validateFileSize,
} from '@/validators/file'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        createUploadError(
          UploadErrorCodes.UNAUTHORIZED,
          'Authentication required'
        ),
        { status: 401 }
      )
    }

    // 2. Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        createUploadError(
          UploadErrorCodes.VALIDATION_ERROR,
          'Invalid JSON in request body'
        ),
        { status: 400 }
      )
    }

    let validated
    try {
      validated = signedUrlRequestSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0]
        return NextResponse.json(
          createUploadError(
            UploadErrorCodes.VALIDATION_ERROR,
            firstError?.message || 'Validation failed',
            { errors: error.issues }
          ),
          { status: 400 }
        )
      }
      throw error
    }

    const { filename, mimeType, size, directory } = validated

    // 3. Validate file type against allowed types
    const typeValidation = validateFile(mimeType, size)
    if (!typeValidation.valid) {
      return NextResponse.json(
        createUploadError(
          UploadErrorCodes.INVALID_FILE_TYPE,
          typeValidation.error || 'File type not allowed'
        ),
        { status: 400 }
      )
    }

    // 4. Validate file size against type-specific limits
    const sizeValidation = validateFileSize(mimeType, size)
    if (!sizeValidation.valid) {
      return NextResponse.json(
        createUploadError(
          UploadErrorCodes.FILE_TOO_LARGE,
          sizeValidation.error || 'File too large',
          { maxSize: sizeValidation.maxSize }
        ),
        { status: 400 }
      )
    }

    // 5. Generate unique S3 key
    const key = generateFileKey(directory, filename, session.user.id)

    // 6. Generate signed upload URL (expires in 5 minutes)
    const uploadUrl = await generateSignedUploadUrl(key, mimeType, 300)

    // 7. Return response
    return NextResponse.json({
      data: {
        uploadUrl,
        key,
        expiresIn: 300, // 5 minutes
        maxSize: sizeValidation.maxSize,
      },
    })
  } catch (error) {
    console.error('Error generating signed URL:', error)

    return NextResponse.json(
      createUploadError(
        UploadErrorCodes.S3_ERROR,
        'Failed to generate upload URL'
      ),
      { status: 500 }
    )
  }
}
