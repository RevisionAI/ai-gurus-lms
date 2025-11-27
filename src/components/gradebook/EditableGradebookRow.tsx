'use client';

import React, { memo } from 'react';
import { GradebookStudent, GradebookAssignment, GradebookCell as GradebookCellType } from './types';
import { EditableGradeCell } from './EditableGradeCell';

/**
 * Props for EditableGradebookRow component
 */
export interface EditableGradebookRowProps {
  student: GradebookStudent;
  assignments: GradebookAssignment[];
  /** ID of cell currently being saved (for loading state) */
  savingCellId?: string | null;
  /** Callback when grade change is requested (before confirmation) */
  onGradeChangeRequest: (
    studentId: string,
    assignmentId: string,
    submissionId: string | null,
    oldGrade: number | null,
    newGrade: number,
    maxPoints: number
  ) => void;
  /** Callback when edit is cancelled */
  onCancel: () => void;
  /** Callback for tab navigation to next cell */
  onTabNext?: (studentId: string, currentAssignmentId: string) => void;
  /** Callback for tab navigation to previous cell */
  onTabPrevious?: (studentId: string, currentAssignmentId: string) => void;
}

/**
 * EditableGradebookRow Component
 *
 * Enhanced version of GradebookRow with inline editing capability.
 * Uses EditableGradeCell for each assignment grade.
 *
 * Story: 2.2 - Gradebook Inline Editing with Confirmation
 * AC: 2.2.1, 2.2.8
 */
function EditableGradebookRowComponent({
  student,
  assignments,
  savingCellId,
  onGradeChangeRequest,
  onCancel,
  onTabNext,
  onTabPrevious,
}: EditableGradebookRowProps) {
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

      {/* Assignment grade cells (editable) */}
      {assignments.map((assignment, index) => {
        const gradeCell = grades.find((g) => g.assignmentId === assignment.id);
        if (!gradeCell) return null;

        const cellId = `${id}-${assignment.id}`;
        const isLoading = savingCellId === cellId;
        const isDisabled = !gradeCell.submissionId; // Can't grade if no submission

        return (
          <EditableGradeCell
            key={assignment.id}
            initialValue={gradeCell.score}
            maxPoints={assignment.maxPoints}
            status={gradeCell.status}
            disabled={isDisabled}
            isLoading={isLoading}
            onSave={(newValue) => {
              // This is called after confirmation, but we want to trigger confirmation first
              // So this path shouldn't be used directly
            }}
            onCancel={onCancel}
            onRequestConfirmation={(oldGrade, newGrade) => {
              onGradeChangeRequest(
                id,
                assignment.id,
                gradeCell.submissionId,
                oldGrade,
                newGrade,
                assignment.maxPoints
              );
            }}
            onTabNext={() => onTabNext?.(id, assignment.id)}
            onTabPrevious={() => onTabPrevious?.(id, assignment.id)}
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
export const EditableGradebookRow = memo(EditableGradebookRowComponent);
