/**
 * ResetPasswordModal Component
 *
 * Modal dialog for resetting a user's password.
 * Shows the newly generated password once for the admin to share.
 *
 * Story: 2.5 - Admin Dashboard User Management
 * AC: 2.5.7
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Loader2, Key, Copy, Check } from 'lucide-react'
import type { User } from './UserTable'

/**
 * Props for ResetPasswordModal component
 */
export interface ResetPasswordModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** User whose password is being reset */
  user: User | null
  /** Callback when modal closes */
  onClose: () => void
}

/**
 * ResetPasswordModal component
 */
export function ResetPasswordModal({
  isOpen,
  user,
  onClose,
}: ResetPasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setNewPassword(null)
      setCopied(false)
      setTimeout(() => confirmButtonRef.current?.focus(), 50)
    }
  }, [isOpen])

  /**
   * Handle password reset
   */
  const handleReset = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to reset password')
      }

      setNewPassword(data.data.newPassword)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  /**
   * Copy password to clipboard
   */
  const handleCopy = useCallback(async () => {
    if (!newPassword) return

    try {
      await navigator.clipboard.writeText(newPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = newPassword
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [newPassword])

  if (!user) return null

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white p-6 shadow-lg rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {!newPassword ? (
            // Confirmation view
            <>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Key className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Reset Password
                  </Dialog.Title>

                  <Dialog.Description className="mt-2 text-sm text-gray-600">
                    Generate a new random password for{' '}
                    <strong>
                      {user.name} {user.surname}
                    </strong>
                    ?
                  </Dialog.Description>

                  <p className="mt-2 text-sm text-yellow-600">
                    The user will need to use this new password to log in.
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
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Reset Password
                </button>
              </div>
            </>
          ) : (
            // Success view with new password
            <>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Password Reset Successfully
                  </Dialog.Title>

                  <Dialog.Description className="mt-2 text-sm text-gray-600">
                    Copy this password and share it with the user. This password
                    will not be shown again.
                  </Dialog.Description>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-100 rounded-md flex items-center justify-between">
                <code className="text-sm font-mono text-gray-800 break-all">
                  {newPassword}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="ml-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors flex-shrink-0"
                  aria-label={copied ? 'Copied' : 'Copy password'}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                The user should change this password after first login.
              </p>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                >
                  Done
                </button>
              </div>
            </>
          )}

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

export default ResetPasswordModal
