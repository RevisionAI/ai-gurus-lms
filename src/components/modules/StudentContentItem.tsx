'use client'

import Link from 'next/link'
import Image from 'next/image'
import { FileText, Video, File, Link as LinkIcon, BookOpen, Check } from 'lucide-react'

type ContentType = 'TEXT' | 'VIDEO' | 'DOCUMENT' | 'LINK' | 'SCORM' | 'YOUTUBE'

interface ContentItem {
  id: string
  title: string
  type: ContentType
  thumbnailUrl?: string | null
  isViewed: boolean
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
      return 'text-gray-600 bg-gray-50'
    case 'VIDEO':
      return 'text-red-600 bg-red-50'
    case 'YOUTUBE':
      return 'text-red-600 bg-red-50'
    case 'DOCUMENT':
      return 'text-green-600 bg-green-50'
    case 'LINK':
      return 'text-purple-600 bg-purple-50'
    case 'SCORM':
      return 'text-blue-600 bg-blue-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

export default function StudentContentItem({
  item,
  courseId,
  moduleId,
}: StudentContentItemProps) {
  const Icon = getContentIcon(item.type)

  return (
    <Link
      href={`/courses/${courseId}/modules/${moduleId}/content/${item.id}`}
      className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-gray-50 transition-all"
    >
      {/* Icon or Thumbnail */}
      {item.thumbnailUrl ? (
        <Image
          src={item.thumbnailUrl}
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
