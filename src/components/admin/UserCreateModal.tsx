/**
 * UserCreateModal Component
 *
 * Modal dialog for creating a new user with:
 * - Form fields: Name, Email, Role
 * - Auto-generate password checkbox
 * - Inline validation errors
 *
 * Story: 2.5 - Admin Dashboard User Management
 * AC: 2.5.4
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Loader2 } from 'lucide-react'
import { adminCreateUserSchema } from '@/validators/user'
import { z } from 'zod'

/**
 * Form data interface
 */
interface FormData {
  name: string
  email: string
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
  password: string
  autoGeneratePassword: boolean
}

/**
 * Form errors interface
 */
interface FormErrors {
  name?: string
  email?: string
  role?: string
  password?: string
}

/**
 * Props for UserCreateModal component
 */
export interface UserCreateModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal closes */
  onClose: () => void
  /** Callback when user is created successfully */
  onSuccess: () => void
}

/**
 * Initial form state
 */
const initialFormData: FormData = {
  name: '',
  email: '',
  role: 'STUDENT',
  password: '',
  autoGeneratePassword: true,
}

/**
 * UserCreateModal component
 */
export function UserCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: UserCreateModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData)
      setErrors({})
      setApiError(null)
      // Focus name input after a short delay
      setTimeout(() => nameInputRef.current?.focus(), 50)
    }
  }, [isOpen])

  /**
   * Handle input change
   */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target
      const newValue =
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

      setFormData((prev) => ({ ...prev, [name]: newValue }))

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
  const validateField = useCallback(
    (name: keyof FormData, value: string) => {
      if (name === 'name' && !value.trim()) {
        return 'Name is required'
      }
      if (name === 'email') {
        if (!value.trim()) return 'Email is required'
        if (!z.string().email().safeParse(value).success) {
          return 'Invalid email format'
        }
      }
      if (name === 'password' && !formData.autoGeneratePassword) {
        if (!value) return 'Password is required'
        if (value.length < 8) return 'Password must be at least 8 characters'
      }
      return undefined
    },
    [formData.autoGeneratePassword]
  )

  /**
   * Handle blur - validate field
   */
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target
      const error = validateField(name as keyof FormData, value)
      if (error) {
        setErrors((prev) => ({ ...prev, [name]: error }))
      }
    },
    [validateField]
  )

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
      const passwordError = formData.autoGeneratePassword
        ? undefined
        : validateField('password', formData.password)

      if (nameError) newErrors.name = nameError
      if (emailError) newErrors.email = emailError
      if (passwordError) newErrors.password = passwordError

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      setIsSubmitting(true)

      try {
        // Build request body
        const body: Record<string, string> = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          role: formData.role,
        }
        if (!formData.autoGeneratePassword && formData.password) {
          body.password = formData.password
        }

        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to create user')
        }

        onSuccess()
        onClose()
      } catch (error) {
        setApiError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, validateField, onSuccess, onClose]
  )

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white p-6 shadow-lg rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
            Create New User
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
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                id="name"
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
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
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
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
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
            </div>

            {/* Auto-generate Password */}
            <div className="flex items-center">
              <input
                id="autoGeneratePassword"
                name="autoGeneratePassword"
                type="checkbox"
                checked={formData.autoGeneratePassword}
                onChange={handleChange}
                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                disabled={isSubmitting}
              />
              <label
                htmlFor="autoGeneratePassword"
                className="ml-2 block text-sm text-gray-700"
              >
                Generate random password
              </label>
            </div>

            {/* Password (if not auto-generating) */}
            {!formData.autoGeneratePassword && (
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Minimum 8 characters
                </p>
              </div>
            )}

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
                Create User
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
  )
}

export default UserCreateModal
