'use client';

import React, { memo } from 'react';
import {
  GradebookCellProps,
  getStatusColorClasses,
  getStatusIcon,
  getStatusLabel,
} from './types';

/**
 * GradebookCell Component
 *
 * Displays an individual grade cell with:
 * - Score display when graded
 * - Status icons (dash for missing, clock for pending)
 * - Color coding based on status
 * - Click handler for future inline editing (Story 2.2)
 *
 * Story: 2.1 - Gradebook Grid View Implementation
 * AC: 2.1.3, 2.1.4
 */
function GradebookCellComponent({
  cell,
  maxPoints,
  onClick,
}: GradebookCellProps) {
  const { score, status } = cell;
  const colorClasses = getStatusColorClasses(status);
  const statusIcon = getStatusIcon(status);
  const statusLabel = getStatusLabel(status);

  // Format score display
  const displayContent = () => {
    if (status === 'graded' && score !== null) {
      return (
        <span className="font-medium">
          {score}
          <span className="text-xs text-gray-500">/{maxPoints}</span>
        </span>
      );
    }
    return <span className="text-sm">{statusIcon}</span>;
  };

  return (
    <td
      className={`px-3 py-2 text-center whitespace-nowrap border ${colorClasses} transition-colors cursor-pointer hover:opacity-80`}
      onClick={onClick}
      role="gridcell"
      aria-label={`${statusLabel}${score !== null ? `, score: ${score} out of ${maxPoints}` : ''}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {displayContent()}
    </td>
  );
}

// Memoize to prevent unnecessary re-renders during scroll
export const GradebookCell = memo(GradebookCellComponent);
