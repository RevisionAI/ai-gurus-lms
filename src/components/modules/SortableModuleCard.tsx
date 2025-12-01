'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState, useRef, useEffect } from 'react'
import {
  GripVertical,
  FileText,
  ClipboardList,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Globe,
  Trash2,
  Plus,
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import toast from 'react-hot-toast'
import type { Module } from './hooks/useModules'
import type { ModuleContent } from './hooks/useModuleContent'
import ModuleContentList from './ModuleContentList'
import MoveToModuleModal from './MoveToModuleModal'
import DeleteModuleModal from './DeleteModuleModal'

interface SortableModuleCardProps {
  module: Module
  courseId: string
  onEdit?: (module: Module) => void
  onDelete?: (moduleId: string) => void
  onPublish?: (moduleId: string) => void
  onAddContent?: (moduleId: string) => void
  onMoveSuccess?: () => void
}

function truncateText(text: string | null, maxLength: number = 100): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export default function SortableModuleCard({
  module,
  courseId,
  onEdit,
  onDelete,
  onPublish,
  onAddContent,
  onMoveSuccess,
}: SortableModuleCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [contentToMove, setContentToMove] = useState<ModuleContent | null>(null)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [unpublishDialogOpen, setUnpublishDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
  }

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  const handleToggleExpand = () => {
    setExpanded(!expanded)
  }

  const handleAddContent = () => {
    onAddContent?.(module.id)
  }

  const handleMoveContent = (content: ModuleContent) => {
    setContentToMove(content)
    setMoveModalOpen(true)
  }

  const handleMoveSuccess = () => {
    setContentToMove(null)
    onMoveSuccess?.()
  }

  const handlePublish = async (cascadeToContent: boolean) => {
    setIsPublishing(true)
    try {
      const response = await fetch(
        `/api/instructor/courses/${courseId}/modules/${module.id}/publish`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublished: true, cascadeToContent }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to publish module')
      }

      const data = await response.json()
      const cascadeMsg = data.cascadedCount > 0 ? ` (${data.cascadedCount} items also published)` : ''
      toast.success(`Module published${cascadeMsg}`)
      setPublishDialogOpen(false)
      onMoveSuccess?.() // Reuse refetch callback
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to publish'
      toast.error(message)
    } finally {
      setIsPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    setIsPublishing(true)
    try {
      const response = await fetch(
        `/api/instructor/courses/${courseId}/modules/${module.id}/publish`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublished: false }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to unpublish module')
      }

      toast.success('Module unpublished')
      setUnpublishDialogOpen(false)
      onMoveSuccess?.() // Reuse refetch callback
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unpublish'
      toast.error(message)
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-gray-200 rounded-lg transition-colors ${
        isDragging
          ? 'bg-blue-50 border-blue-300 shadow-lg'
          : 'bg-white hover:border-gray-300'
      }`}
    >
      {/* Main card content */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="mr-3 mt-0.5 cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-gray-100"
          >
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>

          {/* Expand Toggle */}
          <button
            onClick={handleToggleExpand}
            className="mr-2 mt-0.5 p-1 rounded hover:bg-gray-100"
            title={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            {/* Title - clickable to expand */}
            <button
              onClick={handleToggleExpand}
              className="font-medium text-gray-900 text-base text-left hover:text-blue-600 transition-colors"
            >
              {module.title}
            </button>

            {/* Description Preview */}
            {module.description && !expanded && (
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
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-white'
                }`}
              >
                {module.isPublished ? 'Published' : 'Draft'}
              </span>

              {/* Prerequisite indicator */}
              {module.orderIndex === 0 ? (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white"
                  title="First module - always accessible"
                >
                  <Globe className="h-3 w-3" />
                  Open
                </span>
              ) : module.requiresPrevious ? (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white"
                  title="Requires completion of previous module"
                >
                  <Lock className="h-3 w-3" />
                  Sequential
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white"
                  title="Open access - no prerequisites"
                >
                  <Globe className="h-3 w-3" />
                  Open
                </span>
              )}

              {/* Counts */}
              <div className="flex items-center gap-3 text-sm text-white">
                <span className="flex items-center gap-1 bg-gray-600 px-2 py-0.5 rounded">
                  <FileText className="h-4 w-4" />
                  {module.contentCount}
                </span>
                <span className="flex items-center gap-1 bg-gray-600 px-2 py-0.5 rounded">
                  <ClipboardList className="h-4 w-4" />
                  {module.assignmentCount}
                </span>
                <span className="flex items-center gap-1 bg-gray-600 px-2 py-0.5 rounded">
                  <MessageSquare className="h-4 w-4" />
                  {module.discussionCount}
                </span>
              </div>
            </div>
          </div>

          {/* Action Menu */}
          <div className="relative ml-4" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="More actions"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    onEdit?.(module)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                {module.isPublished ? (
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      setUnpublishDialogOpen(true)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <EyeOff className="h-4 w-4" />
                    Unpublish
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      setPublishDialogOpen(true)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4" />
                    Publish
                  </button>
                )}
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    setDeleteDialogOpen(true)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded content area */}
      {expanded && (
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
          {/* Full description when expanded */}
          {module.description && (
            <p className="text-sm text-gray-600 mb-3">{module.description}</p>
          )}

          {/* Module content list */}
          <div className="mt-2">
            <h5 className="text-xs font-medium text-gray-500 uppercase mb-2">
              Content
            </h5>
            <ModuleContentList
              courseId={courseId}
              moduleId={module.id}
              onAddContent={handleAddContent}
              onMoveContent={handleMoveContent}
            />
          </div>

          {/* Add Assignment link */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <a
              href={`/instructor/courses/${courseId}/assignments/new?module=${module.id}`}
              className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
            >
              <ClipboardList className="h-4 w-4" />
              Add Assignment to this module
            </a>
          </div>
        </div>
      )}

      {/* Move to Module Modal */}
      <MoveToModuleModal
        isOpen={moveModalOpen}
        courseId={courseId}
        currentModuleId={module.id}
        content={contentToMove}
        onClose={() => {
          setMoveModalOpen(false)
          setContentToMove(null)
        }}
        onSuccess={handleMoveSuccess}
      />

      {/* Publish Dialog */}
      <Dialog.Root open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-md p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
              Publish Module
            </Dialog.Title>
            <Dialog.Description className="text-sm text-gray-600 mb-4">
              Make &ldquo;{module.title}&rdquo; visible to students?
            </Dialog.Description>

            {(module.contentCount > 0 || module.assignmentCount > 0) && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <p className="text-sm text-blue-800">
                  This module contains {module.contentCount} content items and{' '}
                  {module.assignmentCount} assignments.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-4">
              {/* Primary action: Publish with all content (recommended) */}
              <button
                onClick={() => handlePublish(true)}
                disabled={isPublishing}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isPublishing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </span>
                ) : (
                  'Publish module and all content'
                )}
              </button>
              {/* Secondary action: Publish module only (less common) */}
              {(module.contentCount > 0 || module.assignmentCount > 0) && (
                <button
                  onClick={() => handlePublish(false)}
                  disabled={isPublishing}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  {isPublishing ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Publishing...
                    </span>
                  ) : (
                    'Publish module only (content stays hidden)'
                  )}
                </button>
              )}
              <button
                onClick={() => setPublishDialogOpen(false)}
                disabled={isPublishing}
                className="w-full px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Unpublish Dialog */}
      <Dialog.Root open={unpublishDialogOpen} onOpenChange={setUnpublishDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-md p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
              Unpublish Module
            </Dialog.Title>
            <Dialog.Description className="text-sm text-gray-600 mb-4">
              Are you sure you want to unpublish &ldquo;{module.title}&rdquo;?
            </Dialog.Description>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-sm text-yellow-800">
                Students will no longer be able to access this module or its content.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setUnpublishDialogOpen(false)}
                disabled={isPublishing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUnpublish}
                disabled={isPublishing}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                {isPublishing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Unpublishing...
                  </span>
                ) : (
                  'Unpublish'
                )}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Module Modal */}
      <DeleteModuleModal
        isOpen={deleteDialogOpen}
        courseId={courseId}
        module={module}
        onClose={() => setDeleteDialogOpen(false)}
        onSuccess={() => {
          setDeleteDialogOpen(false)
          onMoveSuccess?.() // Refetch modules list
        }}
      />
    </div>
  )
}
