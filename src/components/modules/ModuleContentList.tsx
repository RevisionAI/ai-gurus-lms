'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  FileText,
  Video,
  File,
  Link as LinkIcon,
  BookOpen,
  GripVertical,
  Plus,
  Save,
  Loader2,
  MoreHorizontal,
  FolderInput,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useModuleContent, type ModuleContent } from './hooks/useModuleContent'

interface ModuleContentListProps {
  courseId: string
  moduleId: string
  onAddContent?: () => void
  onMoveContent?: (content: ModuleContent) => void
}

function getContentIcon(type: ModuleContent['type']) {
  switch (type) {
    case 'TEXT':
      return FileText
    case 'VIDEO':
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

function getContentIconColor(type: ModuleContent['type']) {
  switch (type) {
    case 'TEXT':
      return 'text-gray-600 bg-gray-100'
    case 'VIDEO':
    case 'YOUTUBE':
      return 'text-red-600 bg-red-100'
    case 'DOCUMENT':
      return 'text-green-600 bg-green-100'
    case 'LINK':
      return 'text-purple-600 bg-purple-100'
    case 'SCORM':
      return 'text-blue-600 bg-blue-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

interface SortableContentItemProps {
  item: ModuleContent
  courseId: string
  onMoveContent?: (content: ModuleContent) => void
}

function SortableContentItem({ item, courseId, onMoveContent }: SortableContentItemProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const Icon = getContentIcon(item.type)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

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

  const handleClick = () => {
    router.push(`/instructor/courses/${courseId}/content?edit=${item.id}`)
  }

  const handleMoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMenuOpen(false)
    onMoveContent?.(item)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded border ${
        isDragging
          ? 'bg-blue-50 border-blue-300 shadow'
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200"
      >
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      <div
        onClick={handleClick}
        className="flex-1 flex items-center gap-2 cursor-pointer"
      >
        <div className={`p-1.5 rounded ${getContentIconColor(item.type)}`}>
          <Icon className="h-4 w-4" />
        </div>

        <span className="text-sm text-gray-900 truncate flex-1">
          {item.title}
        </span>

        <span
          className={`text-xs px-1.5 py-0.5 rounded ${
            item.isPublished
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          {item.isPublished ? 'Published' : 'Draft'}
        </span>
      </div>

      {/* Action Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen(!menuOpen)
          }}
          className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200"
          title="More actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
            <button
              onClick={handleMoveClick}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <FolderInput className="h-4 w-4" />
              Move to Module
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ModuleContentList({
  courseId,
  moduleId,
  onAddContent,
  onMoveContent,
}: ModuleContentListProps) {
  const { content: fetchedContent, loading, error, refetch, setContent } =
    useModuleContent(courseId, moduleId)

  const [localContent, setLocalContent] = useState<ModuleContent[]>([])
  const [hasOrderChanged, setHasOrderChanged] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch content on mount
  useEffect(() => {
    refetch()
  }, [refetch])

  // Sync local content with fetched content
  const content = useMemo(() => {
    if (!hasOrderChanged && fetchedContent.length > 0) {
      return fetchedContent
    }
    return localContent.length > 0 ? localContent : fetchedContent
  }, [fetchedContent, localContent, hasOrderChanged])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const contentIds = useMemo(() => content.map((c) => c.id), [content])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (!over || active.id === over.id) return

      const currentContent =
        localContent.length > 0 ? localContent : fetchedContent
      const oldIndex = currentContent.findIndex((c) => c.id === active.id)
      const newIndex = currentContent.findIndex((c) => c.id === over.id)

      if (oldIndex === -1 || newIndex === -1) return

      const newContent = arrayMove(currentContent, oldIndex, newIndex)
      setLocalContent(newContent)
      setHasOrderChanged(true)
    },
    [localContent, fetchedContent]
  )

  const handleSaveOrder = useCallback(async () => {
    if (!hasOrderChanged || localContent.length === 0) return

    setIsSaving(true)
    const contentIds = localContent.map((c) => c.id)

    try {
      const response = await fetch(
        `/api/instructor/courses/${courseId}/modules/${moduleId}/content/reorder`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentIds }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save content order')
      }

      toast.success('Content order saved')
      setHasOrderChanged(false)
      setLocalContent([])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save order'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }, [hasOrderChanged, localContent, courseId, moduleId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 py-2">{error}</div>
    )
  }

  if (content.length === 0) {
    return (
      <div className="py-3 text-center">
        <p className="text-sm text-gray-500 mb-2">No content in this module</p>
        {onAddContent && (
          <button
            onClick={onAddContent}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Content
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Header with Save Order button */}
      <div className="flex items-center justify-between">
        {hasOrderChanged && (
          <button
            onClick={handleSaveOrder}
            disabled={isSaving}
            className="inline-flex items-center text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="h-3 w-3 mr-1" />
            {isSaving ? 'Saving...' : 'Save Order'}
          </button>
        )}
        {onAddContent && (
          <button
            onClick={onAddContent}
            className="ml-auto inline-flex items-center text-xs text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-3 w-3 mr-0.5" />
            Add
          </button>
        )}
      </div>

      {/* Content list with drag-and-drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={contentIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {content.map((item) => (
              <SortableContentItem
                key={item.id}
                item={item}
                courseId={courseId}
                onMoveContent={onMoveContent}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
