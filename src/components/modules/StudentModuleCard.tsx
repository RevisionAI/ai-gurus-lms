'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, ClipboardList, MessageSquare, Lock, CheckCircle, Play, Clock } from 'lucide-react'
import type { StudentModule, ModuleStatus } from './StudentModuleList'
import ModuleLockInfoModal from './ModuleLockInfoModal'

interface StudentModuleCardProps {
  module: StudentModule
  courseId: string
}

function truncateText(text: string | null, maxLength: number = 100): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

function getStatusBadge(status: ModuleStatus) {
  switch (status) {
    case 'completed':
      return {
        label: 'Complete',
        className: 'bg-green-100 text-green-800',
        icon: CheckCircle,
        iconClassName: 'text-green-600',
      }
    case 'in_progress':
      return {
        label: 'In Progress',
        className: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
        iconClassName: 'text-yellow-600',
      }
    case 'available':
      return {
        label: 'Available',
        className: 'bg-blue-100 text-blue-800',
        icon: Play,
        iconClassName: 'text-blue-600',
      }
    case 'locked':
    default:
      return {
        label: 'Locked',
        className: 'bg-gray-100 text-gray-600',
        icon: Lock,
        iconClassName: 'text-gray-500',
      }
  }
}

export default function StudentModuleCard({
  module,
  courseId,
}: StudentModuleCardProps) {
  const [showLockModal, setShowLockModal] = useState(false)

  const statusBadge = getStatusBadge(module.status)
  const StatusIcon = statusBadge.icon

  const handleCardClick = (e: React.MouseEvent) => {
    if (!module.isUnlocked) {
      e.preventDefault()
      setShowLockModal(true)
    }
  }

  const cardContent = (
    <div
      className={`relative p-4 border rounded-lg transition-all bg-white ${
        module.isUnlocked
          ? 'border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer'
          : 'border-gray-200 cursor-pointer'
      }`}
      onClick={!module.isUnlocked ? handleCardClick : undefined}
    >
      {/* Locked overlay */}
      {!module.isUnlocked && (
        <div className="absolute inset-0 bg-gray-50/80 rounded-lg flex items-center justify-center z-10">
          <div className="text-center">
            <Lock className="h-8 w-8 mx-auto text-gray-400 mb-2" aria-label="Locked module" />
            <p className="text-sm font-medium text-gray-600">Locked</p>
            <p className="text-xs text-gray-500 mt-1">Click for details</p>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Title row with status icon */}
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 flex-shrink-0 ${statusBadge.iconClassName}`} />
            <h4 className="font-medium text-gray-900 text-base">{module.title}</h4>
          </div>

          {/* Description Preview */}
          {module.description && (
            <p className="mt-1 text-sm text-gray-500 ml-7">
              {truncateText(module.description)}
            </p>
          )}

          {/* Status Badge and Counts Row */}
          <div className="mt-3 flex items-center flex-wrap gap-3 ml-7">
            {/* Status Badge */}
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}
            >
              {statusBadge.label}
            </span>

            {/* Counts */}
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {module.contentCount}
              </span>
              <span className="flex items-center gap-1">
                <ClipboardList className="h-4 w-4" />
                {module.assignmentCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {module.discussionCount}
              </span>
            </div>
          </div>

        </div>

        {/* Chevron indicator for unlocked modules */}
        {module.isUnlocked && (
          <div className="ml-4 flex-shrink-0 text-gray-400">
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
        )}
      </div>

      {/* Lock Info Modal */}
      <ModuleLockInfoModal
        isOpen={showLockModal}
        onClose={() => setShowLockModal(false)}
        moduleTitle={module.title}
        unlockMessage={module.unlockMessage || 'Complete the previous module to unlock'}
        prerequisiteModuleId={module.prerequisiteModuleId}
        prerequisiteModuleTitle={module.prerequisiteModuleTitle}
        courseId={courseId}
      />
    </div>
  )

  // Wrap in Link only for unlocked modules
  if (module.isUnlocked) {
    return (
      <Link
        href={`/courses/${courseId}/modules/${module.id}`}
        className="block"
      >
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
