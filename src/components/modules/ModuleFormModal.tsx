'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Loader2, Lock, Globe } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Module } from './hooks/useModules'

interface ModuleFormData {
  title: string
  description: string
  requiresPrevious: boolean
}

interface FormErrors {
  title?: string
  description?: string
}

export interface ModuleFormModalProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  courseId: string
  module?: Module | null
  onClose: () => void
  onSuccess: () => void
}

const initialFormData: ModuleFormData = {
  title: '',
  description: '',
  requiresPrevious: false,
}

export function ModuleFormModal({
  isOpen,
  mode,
  courseId,
  module,
  onClose,
  onSuccess,
}: ModuleFormModalProps) {
  const [formData, setFormData] = useState<ModuleFormData>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Reset/initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && module) {
        setFormData({
          title: module.title,
          description: module.description || '',
          requiresPrevious: module.requiresPrevious,
        })
      } else {
        setFormData(initialFormData)
      }
      setErrors({})
      setApiError(null)
      // Focus title input after a short delay
      setTimeout(() => titleInputRef.current?.focus(), 50)
    }
  }, [isOpen, mode, module])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))

      // Clear error for this field
      if (errors[name as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }))
      }
    },
    [errors]
  )

  const validateField = useCallback(
    (name: keyof ModuleFormData, value: string): string | undefined => {
      if (name === 'title') {
        if (!value.trim()) return 'Title is required'
        if (value.length > 200) return 'Title must be 200 characters or less'
      }
      if (name === 'description') {
        if (value.length > 2000)
          return 'Description must be 2000 characters or less'
      }
      return undefined
    },
    []
  )

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target
      const error = validateField(name as keyof ModuleFormData, value)
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }))
      }
    },
    [validateField]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setApiError(null)

      // Validate all fields
      const newErrors: FormErrors = {}
      const titleError = validateField('title', formData.title)
      const descriptionError = validateField('description', formData.description)

      if (titleError) newErrors.title = titleError
      if (descriptionError) newErrors.description = descriptionError

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      setIsSubmitting(true)

      try {
        const isEdit = mode === 'edit' && module

        // Build request body
        let body: Record<string, unknown>

        if (isEdit) {
          // For edit mode, only send changed fields
          body = {}
          if (formData.title !== module.title) {
            body.title = formData.title.trim()
          }
          const newDescription = formData.description.trim() || null
          const oldDescription = module.description || null
          if (newDescription !== oldDescription) {
            body.description = newDescription
          }
          // Always include requiresPrevious if it changed
          if (formData.requiresPrevious !== module.requiresPrevious) {
            body.requiresPrevious = formData.requiresPrevious
          }

          // Don't make request if nothing changed
          if (Object.keys(body).length === 0) {
            onClose()
            return
          }
        } else {
          // For create mode, send all fields
          body = {
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
            requiresPrevious: formData.requiresPrevious,
          }
        }

        const url = isEdit
          ? `/api/instructor/courses/${courseId}/modules/${module.id}`
          : `/api/instructor/courses/${courseId}/modules`

        const response = await fetch(url, {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error?.message || data.error || 'Failed to save module'
          )
        }

        toast.success(
          isEdit ? 'Module updated successfully' : 'Module created successfully'
        )
        onSuccess()
        onClose()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'An error occurred'
        setApiError(message)
        toast.error(message)
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, mode, module, courseId, validateField, onSuccess, onClose]
  )

  const isEdit = mode === 'edit'

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white p-6 shadow-lg rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
            {isEdit ? 'Edit Module' : 'Create Module'}
          </Dialog.Title>

          {apiError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                ref={titleInputRef}
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., Introduction to AI"
                maxLength={200}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              <div className="flex justify-between mt-1">
                {errors.title ? (
                  <p className="text-sm text-red-600">{errors.title}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-gray-400">
                  {formData.title.length}/200
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Brief description of the module content..."
                rows={4}
                maxLength={2000}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              <div className="flex justify-between mt-1">
                {errors.description ? (
                  <p className="text-sm text-red-600">{errors.description}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-gray-400">
                  {formData.description.length}/2000
                </span>
              </div>
            </div>

            {/* Prerequisites */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Prerequisites</h4>

              {isEdit && module?.orderIndex === 0 ? (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                  <Globe className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">
                    The first module is always accessible to all students.
                  </span>
                </div>
              ) : (
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requiresPrevious}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          requiresPrevious: e.target.checked,
                        }))
                      }
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={isSubmitting}
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5" />
                        Require previous module completion
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Students must complete the previous module before accessing this one.
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? 'Save Changes' : 'Create Module'}
              </button>
            </div>
          </form>

          <Dialog.Close asChild>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              aria-label="Close"
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default ModuleFormModal
