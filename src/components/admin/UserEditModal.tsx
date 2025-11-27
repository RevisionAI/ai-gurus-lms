/**
 * UserEditModal Component
 *
 * Modal dialog for editing an existing user with:
 * - Pre-populated form fields
 * - Role change confirmation dialog
 * - Inline validation errors
 *
 * Story: 2.5 - Admin Dashboard User Management
 * AC: 2.5.5, 2.5.6
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Loader2 } from 'lucide-react'
import { z } from 'zod'
import { RoleChangeConfirmation } from './RoleChangeConfirmation'
import type { User } from './UserTable'

/**
 * Form data interface
 */
interface FormData {
  name: string
  email: string
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
}

/**
 * Form errors interface
 */
interface FormErrors {
  name?: string
  email?: string
}

/**
 * Props for UserEditModal component
 */
export interface UserEditModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** User being edited */
  user: User | null
  /** Callback when modal closes */
  onClose: () => void
  /** Callback when user is updated successfully */
  onSuccess: () => void
}

/**
 * UserEditModal component
 */
export function UserEditModal({
  isOpen,
  user,
  onClose,
  onSuccess,
}: UserEditModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    role: 'STUDENT',
  })
  const [originalRole, setOriginalRole] = useState<string>('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [showRoleConfirmation, setShowRoleConfirmation] = useState(false)
  const [pendingSubmit, setPendingSubmit] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Reset form when modal opens with user data
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
      })
      setOriginalRole(user.role)
      setErrors({})
      setApiError(null)
      setShowRoleConfirmation(false)
      setPendingSubmit(false)
      setTimeout(() => nameInputRef.current?.focus(), 50)
    }
  }, [isOpen, user])

  /**
   * Handle input change
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target
      setFormData((prev) => ({ ...prev, [name]: value }))

      // Clear error for this field
      if (errors[name as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }))
      }
    },
    [errors]
  )

  /**
   * Validate a single field
   */
  const validateField = useCallback((name: keyof FormData, value: string) => {
    if (name === 'name' && !value.trim()) {
      return 'Name is required'
    }
    if (name === 'email') {
      if (!value.trim()) return 'Email is required'
      if (!z.string().email().safeParse(value).success) {
        return 'Invalid email format'
      }
    }
    return undefined
  }, [])

  /**
   * Handle blur - validate field
   */
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const { name, value } = e.target
      const error = validateField(name as keyof FormData, value)
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }))
      }
    },
    [validateField]
  )

  /**
   * Submit the form (after role confirmation if needed)
   */
  const submitForm = useCallback(async () => {
    if (!user) return

    setIsSubmitting(true)
    setApiError(null)

    try {
      const body: Record<string, string> = {}
      if (formData.name !== user.name) body.name = formData.name.trim()
      if (formData.email !== user.email)
        body.email = formData.email.trim().toLowerCase()
      if (formData.role !== user.role) body.role = formData.role

      // Only send request if there are changes
      if (Object.keys(body).length === 0) {
        onClose()
        return
      }

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update user')
      }

      onSuccess()
      onClose()
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
      setPendingSubmit(false)
    }
  }, [user, formData, onSuccess, onClose])

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setApiError(null)

      // Validate all fields
      const newErrors: FormErrors = {}
      const nameError = validateField('name', formData.name)
      const emailError = validateField('email', formData.email)

      if (nameError) newErrors.name = nameError
      if (emailError) newErrors.email = emailError

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      // Check if role changed - show confirmation dialog
      if (formData.role !== originalRole) {
        setPendingSubmit(true)
        setShowRoleConfirmation(true)
        return
      }

      await submitForm()
    },
    [formData, originalRole, validateField, submitForm]
  )

  /**
   * Handle role change confirmation
   */
  const handleRoleConfirm = useCallback(() => {
    setShowRoleConfirmation(false)
    submitForm()
  }, [submitForm])

  /**
   * Handle role change cancel
   */
  const handleRoleCancel = useCallback(() => {
    setShowRoleConfirmation(false)
    setPendingSubmit(false)
    // Revert role to original
    setFormData((prev) => ({ ...prev, role: originalRole as FormData['role'] }))
  }, [originalRole])

  if (!user) return null

  return (
    <>
      <Dialog.Root open={isOpen && !showRoleConfirmation} onOpenChange={(open) => !open && onClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white p-6 shadow-lg rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Edit User
            </Dialog.Title>

            {apiError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="editName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  id="editName"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="editEmail"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="editEmail"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label
                  htmlFor="editRole"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="editRole"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  disabled={isSubmitting}
                >
                  <option value="STUDENT">Student</option>
                  <option value="INSTRUCTOR">Instructor</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {formData.role !== originalRole && (
                  <p className="mt-1 text-xs text-yellow-600">
                    Role change requires confirmation
                  </p>
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
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>

            <Dialog.Close asChild>
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Role Change Confirmation Dialog */}
      <RoleChangeConfirmation
        isOpen={showRoleConfirmation}
        oldRole={originalRole}
        newRole={formData.role}
        userName={user.name}
        onConfirm={handleRoleConfirm}
        onCancel={handleRoleCancel}
      />
    </>
  )
}

export default UserEditModal
