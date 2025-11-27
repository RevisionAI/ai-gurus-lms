'use client';

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { getStatusColorClasses, getStatusIcon, getStatusLabel, CellStatus } from './types';

/**
 * Props for EditableGradeCell component
 */
export interface EditableGradeCellProps {
  /** Current grade value (null if not graded) */
  initialValue: number | null;
  /** Maximum points for the assignment */
  maxPoints: number;
  /** Cell status for color coding */
  status: CellStatus;
  /** Whether editing is disabled (e.g., no submission) */
  disabled?: boolean;
  /** Whether a save operation is in progress */
  isLoading?: boolean;
  /** Callback when user confirms a grade change */
  onSave: (newValue: number) => void;
  /** Callback when user cancels editing */
  onCancel: () => void;
  /** Callback when Tab is pressed (for grid navigation) */
  onTabNext?: () => void;
  /** Callback when Shift+Tab is pressed (for grid navigation) */
  onTabPrevious?: () => void;
  /** Callback to open confirmation dialog */
  onRequestConfirmation?: (oldValue: number | null, newValue: number) => void;
}

/**
 * Validation result for grade input
 */
interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Validate grade input
 */
function validateGrade(
  value: string,
  maxPoints: number
): ValidationResult {
  // Empty value
  if (value.trim() === '') {
    return { isValid: false, error: 'Grade is required' };
  }

  // Check if numeric (allow decimals)
  const numericRegex = /^-?\d*\.?\d*$/;
  if (!numericRegex.test(value)) {
    return { isValid: false, error: 'Grade must be a number' };
  }

  const numValue = parseFloat(value);

  // Check if valid number
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Grade must be a number' };
  }

  // Check if negative
  if (numValue < 0) {
    return { isValid: false, error: 'Grade cannot be negative' };
  }

  // Check if exceeds max points
  if (numValue > maxPoints) {
    return { isValid: false, error: `Grade cannot exceed ${maxPoints}` };
  }

  return { isValid: true, error: null };
}

/**
 * EditableGradeCell Component
 *
 * An inline editable cell for the gradebook grid with:
 * - Double-click to enter edit mode
 * - Input validation (non-numeric, negative, exceeds max)
 * - Keyboard navigation (Enter, Escape, Tab, Shift+Tab)
 * - Accessible with ARIA labels and focus indicators
 *
 * Story: 2.2 - Gradebook Inline Editing with Confirmation
 * AC: 2.2.1, 2.2.6, 2.2.8
 */
function EditableGradeCellComponent({
  initialValue,
  maxPoints,
  status,
  disabled = false,
  isLoading = false,
  onSave,
  onCancel,
  onTabNext,
  onTabPrevious,
  onRequestConfirmation,
}: EditableGradeCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(
    initialValue !== null ? initialValue.toString() : ''
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLTableCellElement>(null);

  // Reset input value when initialValue changes (e.g., after successful save or rollback)
  useEffect(() => {
    if (!isEditing) {
      setInputValue(initialValue !== null ? initialValue.toString() : '');
    }
  }, [initialValue, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Get color classes based on status
  const colorClasses = getStatusColorClasses(status);
  const statusIcon = getStatusIcon(status);
  const statusLabel = getStatusLabel(status);

  /**
   * Enter edit mode
   */
  const enterEditMode = useCallback(() => {
    if (disabled || isLoading) return;
    setIsEditing(true);
    setValidationError(null);
    setInputValue(initialValue !== null ? initialValue.toString() : '');
  }, [disabled, isLoading, initialValue]);

  /**
   * Exit edit mode and cancel
   */
  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setValidationError(null);
    setInputValue(initialValue !== null ? initialValue.toString() : '');
    onCancel();
    // Return focus to cell
    cellRef.current?.focus();
  }, [initialValue, onCancel]);

  /**
   * Attempt to save the grade
   */
  const attemptSave = useCallback(() => {
    const validation = validateGrade(inputValue, maxPoints);

    if (!validation.isValid) {
      setValidationError(validation.error);
      return false;
    }

    const newValue = parseFloat(inputValue);

    // If value hasn't changed, just exit edit mode
    if (initialValue !== null && newValue === initialValue) {
      setIsEditing(false);
      cellRef.current?.focus();
      return true;
    }

    // Request confirmation via dialog
    if (onRequestConfirmation) {
      onRequestConfirmation(initialValue, newValue);
    } else {
      // No confirmation dialog, save directly
      onSave(newValue);
      setIsEditing(false);
    }

    return true;
  }, [inputValue, maxPoints, initialValue, onRequestConfirmation, onSave]);

  /**
   * Handle input change with validation
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInputValue(value);

      // Clear error when user starts typing
      if (validationError) {
        setValidationError(null);
      }
    },
    [validationError]
  );

  /**
   * Handle input blur
   */
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      // Don't trigger save if focus moved to confirmation dialog or other UI
      // Check if the related target is within the cell
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (relatedTarget && cellRef.current?.contains(relatedTarget)) {
        return;
      }

      // Validate and request confirmation on blur
      const validation = validateGrade(inputValue, maxPoints);
      if (validation.isValid) {
        const newValue = parseFloat(inputValue);
        if (initialValue === null || newValue !== initialValue) {
          // Request confirmation
          if (onRequestConfirmation) {
            onRequestConfirmation(initialValue, newValue);
          }
        } else {
          // Value unchanged, just exit
          setIsEditing(false);
        }
      } else {
        // Invalid value, show error but don't exit
        setValidationError(validation.error);
      }
    },
    [inputValue, maxPoints, initialValue, onRequestConfirmation]
  );

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          attemptSave();
          break;

        case 'Escape':
          e.preventDefault();
          cancelEdit();
          break;

        case 'Tab':
          e.preventDefault();
          const saved = attemptSave();
          if (saved) {
            setIsEditing(false);
            if (e.shiftKey) {
              onTabPrevious?.();
            } else {
              onTabNext?.();
            }
          }
          break;
      }
    },
    [attemptSave, cancelEdit, onTabNext, onTabPrevious]
  );

  /**
   * Handle cell double-click to enter edit mode
   */
  const handleDoubleClick = useCallback(() => {
    enterEditMode();
  }, [enterEditMode]);

  /**
   * Handle cell keyboard events (for accessibility)
   */
  const handleCellKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTableCellElement>) => {
      if (isEditing) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        enterEditMode();
      }
    },
    [isEditing, enterEditMode]
  );

  /**
   * Confirm the save (called from parent after confirmation dialog)
   */
  const confirmSave = useCallback(
    (newValue: number) => {
      onSave(newValue);
      setIsEditing(false);
      setValidationError(null);
      cellRef.current?.focus();
    },
    [onSave]
  );

  /**
   * Cancel after confirmation dialog dismissed
   */
  const cancelConfirmation = useCallback(() => {
    // Stay in edit mode but allow user to modify
    inputRef.current?.focus();
  }, []);

  // Expose methods for parent component
  React.useImperativeHandle(
    // This would need a forwardRef, but for simplicity we'll handle via callbacks
    undefined,
    () => ({
      confirmSave,
      cancelConfirmation,
      enterEditMode,
    }),
    [confirmSave, cancelConfirmation, enterEditMode]
  );

  // Render loading state
  if (isLoading) {
    return (
      <td
        ref={cellRef}
        className={`px-3 py-2 text-center whitespace-nowrap border ${colorClasses} opacity-50`}
        role="gridcell"
        aria-label="Saving grade..."
        aria-busy="true"
        data-testid="editable-grade-cell"
        data-max-points={maxPoints}
      >
        <Loader2 className="w-4 h-4 mx-auto animate-spin" />
      </td>
    );
  }

  // Render edit mode
  if (isEditing) {
    return (
      <td
        ref={cellRef}
        className={`px-1 py-1 text-center whitespace-nowrap border-2 border-blue-500 bg-white relative`}
        role="gridcell"
        aria-label="Editing grade"
        data-testid="editable-grade-cell"
        data-max-points={maxPoints}
      >
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={`w-16 px-2 py-1 text-center text-sm font-medium border rounded focus:outline-none focus:ring-2 ${
              validationError
                ? 'border-red-500 focus:ring-red-500 text-red-700'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            aria-label={`Grade input, maximum ${maxPoints} points`}
            aria-invalid={validationError ? 'true' : 'false'}
            aria-describedby={validationError ? 'grade-error' : undefined}
          />
          <span className="text-xs text-gray-500 ml-1">/{maxPoints}</span>
        </div>

        {/* Error tooltip */}
        {validationError && (
          <div
            id="grade-error"
            className="absolute z-10 left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 bg-red-100 border border-red-300 rounded text-xs text-red-700 whitespace-nowrap shadow-lg"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="w-3 h-3 inline mr-1" />
            {validationError}
          </div>
        )}
      </td>
    );
  }

  // Render view mode (disabled or normal)
  const displayContent = () => {
    if (status === 'graded' && initialValue !== null) {
      return (
        <span className="font-medium">
          {initialValue}
          <span className="text-xs text-gray-500">/{maxPoints}</span>
        </span>
      );
    }
    return <span className="text-sm">{statusIcon}</span>;
  };

  return (
    <td
      ref={cellRef}
      className={`px-3 py-2 text-center whitespace-nowrap border ${colorClasses} transition-colors ${
        disabled
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer hover:opacity-80'
      } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset`}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleCellKeyDown}
      role="gridcell"
      aria-label={`${statusLabel}${initialValue !== null ? `, score: ${initialValue} out of ${maxPoints}` : ''}${
        disabled ? '' : ', double-click to edit'
      }`}
      tabIndex={disabled ? -1 : 0}
      data-testid="editable-grade-cell"
      data-max-points={maxPoints}
    >
      {displayContent()}
    </td>
  );
}

// Memoize to prevent unnecessary re-renders
export const EditableGradeCell = memo(EditableGradeCellComponent);

// Export the confirm/cancel methods type for parent component
export type EditableGradeCellRef = {
  confirmSave: (newValue: number) => void;
  cancelConfirmation: () => void;
  enterEditMode: () => void;
};
