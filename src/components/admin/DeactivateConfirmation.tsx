/**
 * DeactivateConfirmation Component
 *
 * Confirmation dialog for deactivating (soft-deleting) a user.
 * Displays warning message and requires explicit confirmation.
 *
 * Story: 2.5 - Admin Dashboard User Management
 * AC: 2.5.8
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, AlertTriangle, Loader2 } from 'lucide-react'
import type { User } from './UserTable'

/**
 * Props for DeactivateConfirmation component
 */
export interface DeactivateConfirmationProps {
  /** Whether the dialog is open */
  isOpen: boolean
  /** User to deactivate */
  user: User | null
  /** Callback when modal closes */
  onClose: () => void
  /** Callback when deactivation succeeds */
  onSuccess: () => void
}

/**
 * DeactivateConfirmation component
 */
export function DeactivateConfirmation({
  isOpen,
  user,
  onClose,
  onSuccess,
}: DeactivateConfirmationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Reset state and focus when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setTimeout(() => confirmButtonRef.current?.focus(), 50)
    }
  }, [isOpen])

  /**
   * Handle deactivation
   */
  const handleDeactivate = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to deactivate user')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [user, onSuccess, onClose])

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
        e.preventDefault()
        handleDeactivate()
      }
    },
    [handleDeactivate, isLoading]
  )

  if (!user) return null

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white p-6 shadow-lg rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Deactivate User
              </Dialog.Title>

              <Dialog.Description className="mt-2 text-sm text-gray-600">
                Are you sure you want to deactivate{' '}
                <strong>
                  {user.name} {user.surname}
                </strong>
                ?
              </Dialog.Description>

              <div className="mt-3 text-sm text-gray-600 space-y-1">
                <p>This will:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Prevent the user from logging in</li>
                  <li>Hide the user from active user lists</li>
                  <li>Preserve all user data for compliance</li>
                </ul>
              </div>

              <p className="mt-3 text-sm text-green-600">
                This action can be undone from the Deleted Records page.
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={handleDeactivate}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Deactivate
            </button>
          </div>

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

export default DeactivateConfirmation
