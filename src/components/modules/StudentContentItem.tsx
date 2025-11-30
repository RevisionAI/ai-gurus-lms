'use client'

import Link from 'next/link'
import Image from 'next/image'
import { FileText, Video, File, Link as LinkIcon, BookOpen, Check } from 'lucide-react'

type ContentType = 'TEXT' | 'VIDEO' | 'DOCUMENT' | 'LINK' | 'SCORM' | 'YOUTUBE'

interface ContentItem {
  id: string
  title: string
  type: ContentType
  fileUrl?: string | null
  thumbnailUrl?: string | null
  isViewed: boolean
}

/**
 * Extract YouTube video ID from various URL formats
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/**
 * Get thumbnail URL for content item
 * For YouTube content without a stored thumbnail, generates one from the video ID
 */
function getContentThumbnail(item: ContentItem): string | null {
  // Use stored thumbnail if available
  if (item.thumbnailUrl) {
    return item.thumbnailUrl
  }

  // For YouTube content, generate thumbnail from video URL
  if (item.type === 'YOUTUBE' && item.fileUrl) {
    const videoId = extractYouTubeId(item.fileUrl)
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    }
  }

  return null
}

interface StudentContentItemProps {
  item: ContentItem
  courseId: string
  moduleId: string
}

function getContentIcon(type: ContentType) {
  switch (type) {
    case 'TEXT':
      return FileText
    case 'VIDEO':
      return Video
    case 'YOUTUBE':
      return Video
    case 'DOCUMENT':
      return File
    case 'LINK':
      return LinkIcon
    case 'SCORM':
      return BookOpen
    default:
      return FileText
  }
}

function getContentIconColor(type: ContentType) {
  switch (type) {
    case 'TEXT':
      return 'text-white bg-gray-500'
    case 'VIDEO':
      return 'text-white bg-red-500'
    case 'YOUTUBE':
      return 'text-white bg-red-600'
    case 'DOCUMENT':
      return 'text-white bg-green-500'
    case 'LINK':
      return 'text-white bg-purple-500'
    case 'SCORM':
      return 'text-white bg-blue-500'
    default:
      return 'text-white bg-gray-500'
  }
}

export default function StudentContentItem({
  item,
  courseId,
  moduleId,
}: StudentContentItemProps) {
  const Icon = getContentIcon(item.type)
  const thumbnailUrl = getContentThumbnail(item)

  return (
    <Link
      href={`/courses/${courseId}/modules/${moduleId}/content/${item.id}`}
      className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-gray-50 transition-all"
    >
      {/* Icon or Thumbnail */}
      {thumbnailUrl ? (
        <Image
          src={thumbnailUrl}
          alt={item.title}
          width={48}
          height={48}
          className="object-cover rounded border border-gray-200 flex-shrink-0"
        />
      ) : (
        <div
          className={`h-12 w-12 flex items-center justify-center rounded border border-gray-200 flex-shrink-0 ${getContentIconColor(item.type)}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      )}

      {/* Content Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900">{item.title}</h4>
        <div className="flex items-center space-x-2 mt-1">
          <span className="text-sm text-gray-500 capitalize">
            {item.type.toLowerCase().replace('_', ' ')}
          </span>
          {item.isViewed && (
            <span className="inline-flex items-center text-xs text-green-600">
              <Check className="h-3 w-3 mr-1" />
              Viewed
            </span>
          )}
        </div>
      </div>

      {/* Chevron */}
      <div className="flex-shrink-0 text-gray-400">
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  )
}
