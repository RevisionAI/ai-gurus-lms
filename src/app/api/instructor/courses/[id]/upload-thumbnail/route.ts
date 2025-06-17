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

    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify instructor owns the course
    const course = await prisma.course.findUnique({
      where: {
        id,
        instructorId: session.user.id
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('thumbnail') as File

    if (!file) {
      return NextResponse.json({ error: 'No thumbnail file provided' }, { status: 400 })
    }

    // Validate file size (2MB limit for thumbnails)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'Thumbnail too large. Maximum size is 2MB.' }, { status: 400 })
    }

    // Validate file type - only images for thumbnails
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ]

    const fileExtension = file.name.toLowerCase().split('.').pop()
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
      return NextResponse.json({ 
        error: 'Invalid thumbnail format. Please upload JPEG, PNG, GIF, or WebP images.' 
      }, { status: 400 })
    }

    // Create unique filename
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filename = `thumb_${timestamp}_${originalName}`
    
    // Create thumbnails directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'thumbnails')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save thumbnail
    const filePath = join(uploadDir, filename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Return thumbnail URL
    const thumbnailUrl = `/uploads/thumbnails/${filename}`

    return NextResponse.json({
      url: thumbnailUrl,
      filename: originalName,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('Error uploading thumbnail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}