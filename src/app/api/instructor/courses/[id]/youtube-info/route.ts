import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|m\.youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}

// Get YouTube video info using oEmbed API (no API key required)
async function getYouTubeInfo(videoId: string) {
  try {
    // Use YouTube oEmbed API for basic info
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    const response = await fetch(oEmbedUrl)
    
    if (!response.ok) {
      throw new Error('Video not found or not accessible')
    }
    
    const data = await response.json()
    
    // Extract thumbnail URLs (YouTube provides multiple sizes)
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    const fallbackThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    
    // Check if maxresdefault exists, otherwise use hqdefault
    const thumbnailResponse = await fetch(thumbnailUrl, { method: 'HEAD' })
    const finalThumbnail = thumbnailResponse.ok ? thumbnailUrl : fallbackThumbnail
    
    return {
      videoId,
      title: data.title,
      author: data.author_name,
      thumbnail: finalThumbnail,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      duration: null // oEmbed doesn't provide duration
    }
  } catch (error) {
    console.error('Error fetching YouTube info:', error)
    throw error
  }
}

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
    const course = await prisma.courses.findUnique({
      where: {
        id,
        instructorId: session.user.id
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 })
    }

    // Extract video ID
    const videoId = extractYouTubeId(url)
    if (!videoId) {
      return NextResponse.json({ 
        error: 'Invalid YouTube URL. Please provide a valid YouTube video URL.' 
      }, { status: 400 })
    }

    // Get video information
    try {
      const videoInfo = await getYouTubeInfo(videoId)
      return NextResponse.json(videoInfo)
    } catch (error) {
      return NextResponse.json({ 
        error: 'Could not fetch video information. Please check if the video exists and is publicly accessible.' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Error processing YouTube URL:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}