'use client'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, FolderInput, Loader2, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface Module {
  id: string
  title: string
  orderIndex: number
  contentCount?: number
  assignmentCount?: number
}

interface Assignment {
  id: string
  title: string
  moduleId: string | null
  module: Module | null
}

interface MoveAssignmentModalProps {
  isOpen: boolean
  courseId: string
  assignment: Assignment | null
  onClose: () => void
  onSuccess: () => void
}

export default function MoveAssignmentModal({
  isOpen,
  courseId,
  assignment,
  onClose,
  onSuccess,
}: MoveAssignmentModalProps) {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [isMoving, setIsMoving] = useState(false)

  // Fetch modules when modal opens
  useEffect(() => {
    if (isOpen && courseId) {
      setLoading(true)
      setSelectedModuleId(null)

      fetch(`/api/instructor/courses/${courseId}/modules`)
        .then((res) => res.json())
        .then((data) => {
          // Filter out the current module
          const modulesList = data.modules || data || []
          const availableModules = modulesList.filter(
            (m: Module) => m.id !== assignment?.moduleId
          )
          // Sort by orderIndex
          availableModules.sort((a: Module, b: Module) => a.orderIndex - b.orderIndex)
          setModules(availableModules)
        })
        .catch((err) => {
          console.error('Failed to fetch modules:', err)
          toast.error('Failed to load modules')
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen, courseId, assignment?.moduleId])

  const handleMove = async () => {
    if (!selectedModuleId || !assignment) return

    setIsMoving(true)

    try {
      const response = await fetch(
        `/api/instructor/courses/${courseId}/assignments/${assignment.id}/move`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetModuleId: selectedModuleId }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to move assignment')
      }

      const targetModule = modules.find((m) => m.id === selectedModuleId)
      toast.success(`Moved to "${targetModule?.title || 'module'}"`)
      onSuccess()
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to move assignment'
      toast.error(message)
    } finally {
      setIsMoving(false)
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-md max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <FolderInput className="h-5 w-5 text-blue-600" />
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Move Assignment to Module
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {assignment && (
              <p className="text-sm text-gray-600 mb-4">
                Moving: <span className="font-medium">{assignment.title}</span>
              </p>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : modules.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">
                  No other modules available.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Create another module to move assignments.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                  Select destination module
                </p>
                {modules.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => setSelectedModuleId(module.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      selectedModuleId === module.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{module.title}</p>
                      <p className="text-xs text-gray-500">
                        {module.assignmentCount !== undefined
                          ? `${module.assignmentCount} assignment${module.assignmentCount !== 1 ? 's' : ''}`
                          : ''}
                      </p>
                    </div>
                    {selectedModuleId === module.id && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleMove}
              disabled={!selectedModuleId || isMoving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMoving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Moving...
                </span>
              ) : (
                'Move'
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
