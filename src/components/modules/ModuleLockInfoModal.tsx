'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { Lock, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ModuleLockInfoModalProps {
  isOpen: boolean
  onClose: () => void
  moduleTitle: string
  unlockMessage: string
  prerequisiteModuleId?: string
  prerequisiteModuleTitle?: string
  courseId: string
}

export default function ModuleLockInfoModal({
  isOpen,
  onClose,
  moduleTitle,
  unlockMessage,
  prerequisiteModuleId,
  prerequisiteModuleTitle,
  courseId,
}: ModuleLockInfoModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg focus:outline-none">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <Lock className="h-5 w-5 text-gray-600" />
              </div>
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Module Locked
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-gray-500 mb-4">
            This module has prerequisites that need to be completed first.
          </Dialog.Description>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-gray-900 mb-1">
              {moduleTitle}
            </p>
            <p className="text-sm text-gray-600">{unlockMessage}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {prerequisiteModuleId && prerequisiteModuleTitle && (
              <Link
                href={`/courses/${courseId}/modules/${prerequisiteModuleId}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                onClick={onClose}
              >
                Go to {prerequisiteModuleTitle}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Got it
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
