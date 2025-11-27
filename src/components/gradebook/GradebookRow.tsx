'use client';

import React, { memo } from 'react';
import { GradebookRowProps } from './types';
import { GradebookCell } from './GradebookCell';

/**
 * GradebookRow Component
 *
 * Displays a single student row with:
 * - Student name and email (sticky first column)
 * - Assignment grade cells
 * - Summary columns: total points, percentage, GPA
 *
 * Story: 2.1 - Gradebook Grid View Implementation
 * AC: 2.1.2
 */
function GradebookRowComponent({
  student,
  assignments,
  onCellClick,
}: GradebookRowProps) {
  const { id, name, email, grades, totalPoints, percentage, gpa } = student;

  // Calculate total possible points
  const totalPossiblePoints = assignments.reduce(
    (sum, a) => sum + a.maxPoints,
    0
  );

  // Get color class for percentage
  const getPercentageColorClass = (pct: number): string => {
    if (pct >= 90) return 'text-green-600';
    if (pct >= 80) return 'text-blue-600';
    if (pct >= 70) return 'text-yellow-600';
    if (pct >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <tr className="hover:bg-gray-50" role="row">
      {/* Student name column (sticky) */}
      <td
        className="sticky left-0 z-10 bg-white px-4 py-3 whitespace-nowrap border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
        role="rowheader"
      >
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{name}</span>
          <span className="text-xs text-gray-500">{email}</span>
        </div>
      </td>

      {/* Assignment grade cells */}
      {assignments.map((assignment) => {
        const gradeCell = grades.find((g) => g.assignmentId === assignment.id);
        if (!gradeCell) return null;

        return (
          <GradebookCell
            key={assignment.id}
            cell={gradeCell}
            maxPoints={assignment.maxPoints}
            onClick={() => onCellClick?.(assignment.id)}
          />
        );
      })}

      {/* Total Points column */}
      <td className="px-4 py-3 text-center whitespace-nowrap border bg-gray-50 font-medium">
        <span className="text-sm text-gray-900">
          {totalPoints}
          <span className="text-xs text-gray-500">/{totalPossiblePoints}</span>
        </span>
      </td>

      {/* Percentage column */}
      <td className="px-4 py-3 text-center whitespace-nowrap border bg-gray-50">
        <span className={`text-sm font-medium ${getPercentageColorClass(percentage)}`}>
          {percentage.toFixed(1)}%
        </span>
      </td>

      {/* GPA column */}
      <td className="px-4 py-3 text-center whitespace-nowrap border bg-gray-50">
        {gpa !== null ? (
          <span className="text-sm font-medium text-gray-900">
            {gpa.toFixed(2)}
          </span>
        ) : (
          <span className="text-sm text-gray-500">N/A</span>
        )}
      </td>
    </tr>
  );
}

// Memoize to prevent unnecessary re-renders
export const GradebookRow = memo(GradebookRowComponent);
