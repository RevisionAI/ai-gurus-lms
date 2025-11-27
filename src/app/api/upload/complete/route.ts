/**
 * Upload Completion API
 *
 * Called after successful client-to-R2 upload to store file metadata.
 * Updates the database with S3 key and CDN URL.
 *
 * POST /api/upload/complete
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPublicUrl, fileExists, getFileMetadata } from '@/lib/r2'
import {
  uploadCompleteSchema,
  createUploadError,
  UploadErrorCodes,
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
      validated = uploadCompleteSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.errors[0]
        return NextResponse.json(
          createUploadError(
            UploadErrorCodes.VALIDATION_ERROR,
            firstError?.message || 'Validation failed',
            { errors: error.errors }
          ),
          { status: 400 }
        )
      }
      throw error
    }

    const { key, filename, size, mimeType, contentId, assignmentId, isPublic } = validated

    // 3. Verify the file was actually uploaded to R2
    const exists = await fileExists(key)
    if (!exists) {
      return NextResponse.json(
        createUploadError(
          UploadErrorCodes.S3_ERROR,
          'File not found in storage. Upload may have failed.'
        ),
        { status: 404 }
      )
    }

    // 4. Get file metadata from R2 to verify
    const metadata = await getFileMetadata(key)
    if (!metadata) {
      return NextResponse.json(
        createUploadError(
          UploadErrorCodes.S3_ERROR,
          'Unable to retrieve file metadata'
        ),
        { status: 500 }
      )
    }

    // 5. Generate CDN URL
    const cdnUrl = getPublicUrl(key)

    // 6. Update database based on context
    let result: {
      id: string
      s3Key: string
      cdnUrl: string
      filename: string
      size: number
      mimeType: string
    }

    if (contentId) {
      // Update CourseContent
      const content = await prisma.courseContent.findUnique({
        where: { id: contentId },
        include: { course: true },
      })

      if (!content) {
        return NextResponse.json(
          createUploadError(
            UploadErrorCodes.VALIDATION_ERROR,
            'Content not found'
          ),
          { status: 404 }
        )
      }

      // Verify user owns the course
      if (content.course.instructorId !== session.user.id && session.user.role !== 'ADMIN') {
        return NextResponse.json(
          createUploadError(
            UploadErrorCodes.UNAUTHORIZED,
            'Not authorized to modify this content'
          ),
          { status: 403 }
        )
      }

      const updated = await prisma.courseContent.update({
        where: { id: contentId },
        data: {
          fileUrl: cdnUrl,
          s3Key: key,
        },
      })

      result = {
        id: updated.id,
        s3Key: key,
        cdnUrl,
        filename,
        size,
        mimeType,
      }
    } else if (assignmentId) {
      // Create or update Submission
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: { course: { include: { enrollments: true } } },
      })

      if (!assignment) {
        return NextResponse.json(
          createUploadError(
            UploadErrorCodes.VALIDATION_ERROR,
            'Assignment not found'
          ),
          { status: 404 }
        )
      }

      // Verify user is enrolled in the course
      const isEnrolled = assignment.course.enrollments.some(
        (e) => e.userId === session.user.id
      )
      const isInstructor = assignment.course.instructorId === session.user.id

      if (!isEnrolled && !isInstructor && session.user.role !== 'ADMIN') {
        return NextResponse.json(
          createUploadError(
            UploadErrorCodes.UNAUTHORIZED,
            'Not authorized to submit to this assignment'
          ),
          { status: 403 }
        )
      }

      const submission = await prisma.submission.upsert({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId: session.user.id,
          },
        },
        create: {
          assignmentId,
          studentId: session.user.id,
          fileUrl: cdnUrl,
          s3Key: key,
        },
        update: {
          fileUrl: cdnUrl,
          s3Key: key,
          submittedAt: new Date(),
        },
      })

      result = {
        id: submission.id,
        s3Key: key,
        cdnUrl,
        filename,
        size,
        mimeType,
      }
    } else {
      // Generic upload (no specific context)
      // Just return the file info without database update
      result = {
        id: key, // Use key as ID for generic uploads
        s3Key: key,
        cdnUrl,
        filename,
        size,
        mimeType,
      }
    }

    return NextResponse.json({
      data: result,
    })
  } catch (error) {
    console.error('Error completing upload:', error)

    return NextResponse.json(
      createUploadError(
        UploadErrorCodes.S3_ERROR,
        'Failed to complete upload'
      ),
      { status: 500 }
    )
  }
}
