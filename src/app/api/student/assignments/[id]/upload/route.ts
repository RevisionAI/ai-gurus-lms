import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if assignment exists and is published
    const assignment = await prisma.assignments.findUnique({
      where: {
        id: id,
        isPublished: true
      },
      include: {
        courses: true
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Check if student is enrolled in the course
    const enrollment = await prisma.enrollments.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: assignment.courseId
        }
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
    }

    // Check if assignment is overdue
    if (assignment.dueDate && new Date() > assignment.dueDate) {
      return NextResponse.json({ error: 'Assignment is overdue' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (50MB limit for assignments)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 })
    }

    // Validate file type by extension
    const fileExtension = file.name.toLowerCase().split('.').pop()
    const allowedExtensions = [
      'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'rtf',
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp',
      'mp4', 'mov', 'avi', 'wmv', 'flv', 'webm',
      'mp3', 'wav', 'ogg', 'aac',
      'zip', 'rar', '7z', 'tar', 'gz'
    ]

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/rtf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/octet-stream'
    ]

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
      return NextResponse.json({ 
        error: 'File type not allowed. Please upload PDF, Word, PowerPoint, Excel, text, image, video, audio, or archive files.' 
      }, { status: 400 })
    }

    // Create unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `${timestamp}_${originalName}`
    
    // Create assignment-specific directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'assignments', id)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file
    const filePath = join(uploadDir, filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Return file URL
    const fileUrl = `/uploads/assignments/${id}/${filename}`

    return NextResponse.json({
      url: fileUrl,
      filename: originalName,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('Error uploading assignment file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}