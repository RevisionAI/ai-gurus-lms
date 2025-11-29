'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { BookOpen, Plus, RefreshCw, Save, Loader2, GripVertical, FileText, ClipboardList, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { useModules, Module } from './hooks/useModules'
import SortableModuleCard from './SortableModuleCard'
import ModuleFormModal from './ModuleFormModal'

interface ModuleListProps {
  courseId: string
}

export default function ModuleList({ courseId }: ModuleListProps) {
  const router = useRouter()
  const { modules, loading, error, refetch } = useModules(courseId)

  // DnD State
  const [localModules, setLocalModules] = useState<Module[]>([])
  const [originalModules, setOriginalModules] = useState<Module[]>([])
  const [hasOrderChanged, setHasOrderChanged] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)

  // Sync modules from API to local state
  useMemo(() => {
    if (modules.length > 0 && localModules.length === 0) {
      setLocalModules(modules)
      setOriginalModules(modules)
    } else if (modules.length > 0 && !hasOrderChanged) {
      // Update local modules when data refreshes (but not during reorder)
      setLocalModules(modules)
      setOriginalModules(modules)
    }
  }, [modules, localModules.length, hasOrderChanged])

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Get the active module being dragged
  const activeModule = useMemo(() => {
    if (!activeId) return null
    return localModules.find((m) => m.id === activeId) ?? null
  }, [activeId, localModules])

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null)

    const { active, over } = event
    if (!over || active.id === over.id) return

    setLocalModules((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)
      const newOrder = arrayMove(items, oldIndex, newIndex)
      return newOrder
    })
    setHasOrderChanged(true)
  }, [])

  // Save reordered modules to API
  const handleSaveOrder = useCallback(async () => {
    setIsSaving(true)
    try {
      const moduleIds = localModules.map((m) => m.id)
      const response = await fetch(
        `/api/instructor/courses/${courseId}/modules/reorder`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moduleIds }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save order')
      }

      toast.success('Module order saved')
      setHasOrderChanged(false)
      setOriginalModules(localModules)
      refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save order'
      toast.error(message)
      // Rollback to original order
      setLocalModules(originalModules)
      setHasOrderChanged(false)
    } finally {
      setIsSaving(false)
    }
  }, [courseId, localModules, originalModules, refetch])

  // Modal handlers
  const handleOpenCreate = useCallback(() => {
    setModalMode('create')
    setSelectedModule(null)
    setModalOpen(true)
  }, [])

  const handleOpenEdit = useCallback((module: Module) => {
    setModalMode('edit')
    setSelectedModule(module)
    setModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalOpen(false)
    setSelectedModule(null)
  }, [])

  const handleSuccess = useCallback(() => {
    handleCloseModal()
    refetch()
  }, [handleCloseModal, refetch])

  // Navigate to content page with module context for adding content
  const handleAddContent = useCallback((moduleId: string) => {
    router.push(`/instructor/courses/${courseId}/content?module=${moduleId}&new=true`)
  }, [router, courseId])

  // Get module IDs for SortableContext
  const moduleIds = useMemo(() => localModules.map((m) => m.id), [localModules])

  // Loading State
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 border border-gray-200 rounded-lg animate-pulse"
          >
            <div className="flex items-start">
              <div className="h-6 w-6 bg-gray-200 rounded mr-3"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-2/3 mb-3"></div>
                <div className="flex gap-3">
                  <div className="h-6 bg-gray-100 rounded w-20"></div>
                  <div className="h-4 bg-gray-100 rounded w-16"></div>
                  <div className="h-4 bg-gray-100 rounded w-16"></div>
                  <div className="h-4 bg-gray-100 rounded w-16"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-red-400 mb-4">
          <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-12 w-12"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-900">
          Failed to load modules
        </h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <div className="mt-6">
          <button
            onClick={refetch}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Empty State
  if (modules.length === 0) {
    return (
      <div>
        {/* Header with Add Module button */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Modules (0)</h3>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Module
          </button>
        </div>

        {/* Empty state content */}
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No modules yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first module.
          </p>
        </div>

        {/* Module Form Modal */}
        <ModuleFormModal
          isOpen={modalOpen}
          mode={modalMode}
          courseId={courseId}
          module={selectedModule}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      </div>
    )
  }

  // Modules List with DnD
  return (
    <div>
      {/* Header with Add Module and Save Order buttons */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Modules ({localModules.length})
        </h3>
        <div className="flex items-center gap-2">
          {hasOrderChanged && (
            <button
              onClick={handleSaveOrder}
              disabled={isSaving}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Save Order
                </>
              )}
            </button>
          )}
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Module
          </button>
        </div>
      </div>

      {/* DnD Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={moduleIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {localModules.map((module) => (
              <SortableModuleCard
                key={module.id}
                module={module}
                courseId={courseId}
                onEdit={handleOpenEdit}
                onAddContent={handleAddContent}
                onMoveSuccess={refetch}
              />
            ))}
          </div>
        </SortableContext>

        {/* DragOverlay - Ghost element during drag */}
        <DragOverlay>
          {activeModule ? (
            <div className="border border-blue-300 rounded-lg bg-white shadow-2xl opacity-90">
              <div className="p-4">
                <div className="flex items-start">
                  {/* Drag Handle */}
                  <div className="mr-3 mt-0.5 p-1 -ml-1 rounded bg-blue-100">
                    <GripVertical className="h-5 w-5 text-blue-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <div className="font-medium text-gray-900 text-base">
                      {activeModule.title}
                    </div>

                    {/* Status Badge and Counts Row */}
                    <div className="mt-3 flex items-center flex-wrap gap-3">
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          activeModule.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {activeModule.isPublished ? 'Published' : 'Draft'}
                      </span>

                      {/* Counts */}
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {activeModule.contentCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClipboardList className="h-4 w-4" />
                          {activeModule.assignmentCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          {activeModule.discussionCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Module Form Modal */}
      <ModuleFormModal
        isOpen={modalOpen}
        mode={modalMode}
        courseId={courseId}
        module={selectedModule}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
