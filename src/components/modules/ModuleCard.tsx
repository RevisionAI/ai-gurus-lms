'use client'

import { FileText, ClipboardList, MessageSquare } from 'lucide-react'
import type { Module } from './hooks/useModules'

interface ModuleCardProps {
  module: Module
}

function truncateText(text: string | null, maxLength: number = 100): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export default function ModuleCard({ module }: ModuleCardProps) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-white">
      <div className="flex items-start">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className="font-medium text-gray-900 text-base">{module.title}</h4>

          {/* Description Preview */}
          {module.description && (
            <p className="mt-1 text-sm text-gray-500">
              {truncateText(module.description)}
            </p>
          )}

          {/* Status Badge and Counts Row */}
          <div className="mt-3 flex items-center flex-wrap gap-3">
            {/* Status Badge */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                module.isPublished
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {module.isPublished ? 'Published' : 'Draft'}
            </span>

            {/* Counts */}
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1" title="Content items">
                <FileText className="h-4 w-4" />
                {module.contentCount}
              </span>
              <span className="flex items-center gap-1" title="Assignments">
                <ClipboardList className="h-4 w-4" />
                {module.assignmentCount}
              </span>
              <span className="flex items-center gap-1" title="Discussions">
                <MessageSquare className="h-4 w-4" />
                {module.discussionCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
