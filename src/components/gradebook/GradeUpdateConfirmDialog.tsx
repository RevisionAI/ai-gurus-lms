'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { FeedbackTemplateSelector } from './FeedbackTemplateSelector';

/**
 * Props for GradeUpdateConfirmDialog component
 */
export interface GradeUpdateConfirmDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Previous grade value (null if not graded before) */
  oldGrade: number | null;
  /** New grade value to be saved */
  newGrade: number;
  /** Maximum points for context */
  maxPoints?: number;
  /** Student name for template placeholders */
  studentName?: string;
  /** Assignment title for template placeholders */
  assignmentTitle?: string;
  /** Existing feedback (if editing) */
  existingFeedback?: string | null;
  /** Callback when user confirms (clicks Yes) */
  onConfirm: (feedback?: string) => void;
  /** Callback when user cancels (clicks Cancel or closes dialog) */
  onCancel: () => void;
}

/**
 * GradeUpdateConfirmDialog Component
 *
 * Confirmation dialog for grade updates using Radix UI.
 * Shows old and new values and requires explicit confirmation.
 * Includes feedback input field with template selector.
 *
 * Features:
 * - Accessible with proper ARIA labels
 * - Keyboard navigation (Enter confirms, Escape cancels)
 * - Focus trap when open
 * - Animated transitions
 * - Feedback template selector (Story 2.7)
 *
 * Story: 2.2 - Gradebook Inline Editing with Confirmation
 * Story: 2.7 - Feedback Templates for Instructors
 * AC: 2.2.2, 2.2.3, 2.2.4, 2.7.5, 2.7.6
 */
export function GradeUpdateConfirmDialog({
  isOpen,
  oldGrade,
  newGrade,
  maxPoints,
  studentName,
  assignmentTitle,
  existingFeedback,
  onConfirm,
  onCancel,
}: GradeUpdateConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const [feedback, setFeedback] = useState<string>(existingFeedback || '');

  // Reset feedback when dialog opens/closes or when existingFeedback changes
  useEffect(() => {
    if (isOpen) {
      setFeedback(existingFeedback || '');
    }
  }, [isOpen, existingFeedback]);

  // Focus the confirm button when dialog opens
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      // Small delay to ensure dialog is rendered
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  /**
   * Handle confirm action
   */
  const handleConfirm = useCallback(() => {
    onConfirm(feedback || undefined);
  }, [onConfirm, feedback]);

  /**
   * Handle cancel action
   */
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  /**
   * Handle template applied from selector
   */
  const handleTemplateApplied = useCallback((feedbackText: string) => {
    setFeedback(feedbackText);
  }, []);

  /**
   * Handle keyboard events for quick actions
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Only confirm on Enter if not in textarea (allow Enter in textarea for newlines)
      if (e.key === 'Enter' && !e.shiftKey && e.target instanceof HTMLButtonElement) {
        e.preventDefault();
        handleConfirm();
      }
    },
    [handleConfirm]
  );

  // Build the message based on whether this is a new grade or an update
  const getMessage = () => {
    if (oldGrade === null) {
      return (
        <>
          Set grade to <strong className="text-blue-600">{newGrade}</strong>
          {maxPoints && (
            <span className="text-gray-500">/{maxPoints}</span>
          )}
          ?
        </>
      );
    }
    return (
      <>
        Update grade from{' '}
        <strong className="text-gray-600">{oldGrade}</strong> to{' '}
        <strong className="text-blue-600">{newGrade}</strong>
        {maxPoints && (
          <span className="text-gray-500">/{maxPoints}</span>
        )}
        ?
      </>
    );
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <Dialog.Portal>
        {/* Backdrop overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Dialog content */}
        <Dialog.Content
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg max-h-[90vh] overflow-y-auto"
          onKeyDown={handleKeyDown}
        >
          {/* Title */}
          <Dialog.Title className="text-lg font-semibold text-gray-900">
            Confirm Grade Update
          </Dialog.Title>

          {/* Description */}
          <Dialog.Description className="text-sm text-gray-600">
            {getMessage()}
          </Dialog.Description>

          {/* Feedback Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="feedback"
                className="block text-sm font-medium text-gray-700"
              >
                Feedback (optional)
              </label>
              {studentName && assignmentTitle && (
                <FeedbackTemplateSelector
                  studentName={studentName}
                  assignmentTitle={assignmentTitle}
                  score={newGrade}
                  onTemplateApplied={handleTemplateApplied}
                />
              )}
            </div>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
              placeholder="Provide feedback for the student..."
            />
            <p className="text-xs text-gray-500">
              {feedback.length}/5000 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-4">
            <Dialog.Close asChild>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
            </Dialog.Close>

            <button
              ref={confirmButtonRef}
              type="button"
              onClick={handleConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-pink-600 border border-transparent rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
            >
              Confirm
            </button>
          </div>

          {/* Close button (X) */}
          <Dialog.Close asChild>
            <button
              type="button"
              onClick={handleCancel}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
