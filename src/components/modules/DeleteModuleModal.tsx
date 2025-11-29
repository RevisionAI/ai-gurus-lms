'use client'

import { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AlertTriangle, Loader2, Trash2, FolderInput, X } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Module } from './hooks/useModules'

interface DeleteModuleModalProps {
  isOpen: boolean
  courseId: string
  module: Module
  onClose: () => void
  onSuccess: () => void
}

interface AvailableModule {
  id: string
  title: string
  orderIndex: number
}

type DeleteMode = 'select' | 'move' | 'delete'

export default function DeleteModuleModal({
  isOpen,
  courseId,
  module,
  onClose,
  onSuccess,
}: DeleteModuleModalProps) {
  const [mode, setMode] = useState<DeleteMode>('select')
  const [isDeleting, setIsDeleting] = useState(false)
  const [availableModules, setAvailableModules] = useState<AvailableModule[]>([])
  const [loadingModules, setLoadingModules] = useState(false)
  const [selectedTargetModule, setSelectedTargetModule] = useState<string>('')

  const hasContent = module.contentCount > 0 || module.assignmentCount > 0 || module.discussionCount > 0
  const totalItems = module.contentCount + module.assignmentCount + module.discussionCount

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('select')
      setSelectedTargetModule('')
    }
  }, [isOpen])

  // Fetch available modules when entering move mode
  useEffect(() => {
    if (mode === 'move' && isOpen) {
      fetchAvailableModules()
    }
  }, [mode, isOpen])

  const fetchAvailableModules = async () => {
    setLoadingModules(true)
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/modules`)
      if (!response.ok) throw new Error('Failed to fetch modules')

      const data = await response.json()
      // Filter out the current module
      const filtered = data.modules
        .filter((m: AvailableModule) => m.id !== module.id)
        .sort((a: AvailableModule, b: AvailableModule) => a.orderIndex - b.orderIndex)

      setAvailableModules(filtered)
    } catch (error) {
      console.error('Error fetching modules:', error)
      toast.error('Failed to load modules')
    } finally {
      setLoadingModules(false)
    }
  }

  const handleDelete = async (moveContentTo?: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(
        `/api/instructor/courses/${courseId}/modules/${module.id}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ moveContentTo }),
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete module')
      }

      const data = await response.json()

      if (moveContentTo) {
        toast.success(`Module deleted. ${data.movedCount || totalItems} items moved.`)
      } else {
        toast.success('Module deleted successfully')
      }

      onSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete module'
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  const renderSelectMode = () => (
    <>
      <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
        Delete Module
      </Dialog.Title>
      <Dialog.Description className="text-sm text-gray-600 mb-4">
        Are you sure you want to delete &ldquo;{module.title}&rdquo;?
      </Dialog.Description>

      {hasContent && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
          <div className="flex gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                This module contains content
              </p>
              <p className="text-sm text-amber-700 mt-1">
                {module.contentCount > 0 && `${module.contentCount} content item${module.contentCount !== 1 ? 's' : ''}`}
                {module.contentCount > 0 && module.assignmentCount > 0 && ', '}
                {module.assignmentCount > 0 && `${module.assignmentCount} assignment${module.assignmentCount !== 1 ? 's' : ''}`}
                {(module.contentCount > 0 || module.assignmentCount > 0) && module.discussionCount > 0 && ', '}
                {module.discussionCount > 0 && `${module.discussionCount} discussion${module.discussionCount !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {hasContent && (
          <button
            onClick={() => setMode('move')}
            className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 text-left"
          >
            <FolderInput className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Move content first</p>
              <p className="text-xs text-gray-500">Move all content to another module, then delete</p>
            </div>
          </button>
        )}

        <button
          onClick={() => setMode('delete')}
          className="w-full flex items-center gap-3 p-3 border border-red-200 rounded-md hover:bg-red-50 text-left"
        >
          <Trash2 className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-700">
              {hasContent ? 'Delete module and all content' : 'Delete module'}
            </p>
            <p className="text-xs text-red-500">
              {hasContent ? 'This will delete all contained items' : 'This action cannot be undone'}
            </p>
          </div>
        </button>
      </div>

      <div className="flex justify-end mt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </>
  )

  const renderMoveMode = () => (
    <>
      <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
        Move Content Before Delete
      </Dialog.Title>
      <Dialog.Description className="text-sm text-gray-600 mb-4">
        Select a module to move {totalItems} item{totalItems !== 1 ? 's' : ''} to:
      </Dialog.Description>

      {loadingModules ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : availableModules.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-center">
          <p className="text-sm text-gray-600">No other modules available.</p>
          <p className="text-xs text-gray-500 mt-1">
            Create another module first, or delete this module with its content.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {availableModules.map((m) => (
            <label
              key={m.id}
              className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors ${
                selectedTargetModule === m.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="targetModule"
                value={m.id}
                checked={selectedTargetModule === m.id}
                onChange={() => setSelectedTargetModule(m.id)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-900">{m.title}</span>
            </label>
          ))}
        </div>
      )}

      <div className="flex justify-between gap-3 mt-4">
        <button
          onClick={() => setMode('select')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={() => handleDelete(selectedTargetModule)}
          disabled={!selectedTargetModule || isDeleting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isDeleting ? 'Moving...' : 'Move & Delete'}
        </button>
      </div>
    </>
  )

  const renderDeleteConfirmMode = () => (
    <>
      <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
        Confirm Delete
      </Dialog.Title>
      <Dialog.Description className="text-sm text-gray-600 mb-4">
        This action cannot be undone.
      </Dialog.Description>

      <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
        <div className="flex gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">
              You are about to permanently delete:
            </p>
            <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
              <li>&ldquo;{module.title}&rdquo; module</li>
              {module.contentCount > 0 && (
                <li>{module.contentCount} content item{module.contentCount !== 1 ? 's' : ''}</li>
              )}
              {module.assignmentCount > 0 && (
                <li>{module.assignmentCount} assignment{module.assignmentCount !== 1 ? 's' : ''}</li>
              )}
              {module.discussionCount > 0 && (
                <li>{module.discussionCount} discussion{module.discussionCount !== 1 ? 's' : ''}</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-3 mt-4">
        <button
          onClick={() => setMode('select')}
          disabled={isDeleting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={() => handleDelete()}
          disabled={isDeleting}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isDeleting ? 'Deleting...' : 'Delete Permanently'}
        </button>
      </div>
    </>
  )

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl z-50 w-full max-w-md p-6">
          {mode === 'select' && renderSelectMode()}
          {mode === 'move' && renderMoveMode()}
          {mode === 'delete' && renderDeleteConfirmMode()}

          <Dialog.Close asChild>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
