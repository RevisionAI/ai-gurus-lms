/**
 * RoleChangeConfirmation Component
 *
 * Confirmation dialog for role changes.
 * Displays warning message and requires explicit confirmation.
 *
 * Story: 2.5 - Admin Dashboard User Management
 * AC: 2.5.6
 */

'use client'

import { useCallback, useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, AlertTriangle } from 'lucide-react'

/**
 * Role display names
 */
const roleDisplayNames: Record<string, string> = {
  STUDENT: 'Student',
  INSTRUCTOR: 'Instructor',
  ADMIN: 'Admin',
}

/**
 * Props for RoleChangeConfirmation component
 */
export interface RoleChangeConfirmationProps {
  /** Whether the dialog is open */
  isOpen: boolean
  /** Previous role */
  oldRole: string
  /** New role */
  newRole: string
  /** User name for context */
  userName: string
  /** Callback when user confirms */
  onConfirm: () => void
  /** Callback when user cancels */
  onCancel: () => void
}

/**
 * RoleChangeConfirmation component
 */
export function RoleChangeConfirmation({
  isOpen,
  oldRole,
  newRole,
  userName,
  onConfirm,
  onCancel,
}: RoleChangeConfirmationProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Focus confirm button when dialog opens
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      setTimeout(() => confirmButtonRef.current?.focus(), 50)
    }
  }, [isOpen])

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        onConfirm()
      }
    },
    [onConfirm]
  )

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white p-6 shadow-lg rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Confirm Role Change
              </Dialog.Title>

              <Dialog.Description className="mt-2 text-sm text-gray-600">
                Change role for <strong>{userName}</strong> from{' '}
                <span className="font-medium text-gray-800">
                  {roleDisplayNames[oldRole] || oldRole}
                </span>{' '}
                to{' '}
                <span className="font-medium text-pink-600">
                  {roleDisplayNames[newRole] || newRole}
                </span>
                ?
              </Dialog.Description>

              <p className="mt-2 text-sm text-yellow-600">
                This will affect the user&apos;s permissions and access to features.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
            >
              Yes, Change Role
            </button>
          </div>

          <Dialog.Close asChild>
            <button
              type="button"
              onClick={onCancel}
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

export default RoleChangeConfirmation
