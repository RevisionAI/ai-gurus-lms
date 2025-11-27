'use client';

import React from 'react';
import { GradebookStudent, GradebookAssignment } from './types';
import { EditableGradebookRow } from './EditableGradebookRow';

/**
 * Props for EditableGradebookGrid component
 */
export interface EditableGradebookGridProps {
  students: GradebookStudent[];
  assignments: GradebookAssignment[];
  /** ID of cell currently being saved (format: studentId-assignmentId) */
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
  isLoading?: boolean;
}

/**
 * EditableGradebookGrid Component
 *
 * Enhanced version of GradebookGrid with inline editing capability.
 * Uses EditableGradebookRow for each student.
 *
 * Story: 2.2 - Gradebook Inline Editing with Confirmation
 * AC: 2.2.1, 2.2.8
 */
export function EditableGradebookGrid({
  students,
  assignments,
  savingCellId,
  onGradeChangeRequest,
  onCancel,
  isLoading = false,
}: EditableGradebookGridProps) {
  // Calculate total possible points for header
  const totalPossiblePoints = assignments.reduce(
    (sum, a) => sum + a.maxPoints,
    0
  );

  /**
   * Handle Tab navigation to next cell
   */
  const handleTabNext = (studentId: string, currentAssignmentId: string) => {
    const studentIndex = students.findIndex((s) => s.id === studentId);
    const assignmentIndex = assignments.findIndex((a) => a.id === currentAssignmentId);

    if (studentIndex === -1 || assignmentIndex === -1) return;

    // Find next editable cell
    // Try next assignment in same row
    if (assignmentIndex < assignments.length - 1) {
      // Focus next cell in same row (handled by browser default tab behavior)
      return;
    }

    // Try first assignment in next row
    if (studentIndex < students.length - 1) {
      // Focus first cell in next row (handled by browser default tab behavior)
      return;
    }

    // At the last cell, do nothing (browser handles focus)
  };

  /**
   * Handle Shift+Tab navigation to previous cell
   */
  const handleTabPrevious = (studentId: string, currentAssignmentId: string) => {
    const studentIndex = students.findIndex((s) => s.id === studentId);
    const assignmentIndex = assignments.findIndex((a) => a.id === currentAssignmentId);

    if (studentIndex === -1 || assignmentIndex === -1) return;

    // Find previous editable cell
    // Try previous assignment in same row
    if (assignmentIndex > 0) {
      // Focus previous cell in same row (handled by browser default tab behavior)
      return;
    }

    // Try last assignment in previous row
    if (studentIndex > 0) {
      // Focus last cell in previous row (handled by browser default tab behavior)
      return;
    }

    // At the first cell, do nothing (browser handles focus)
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded mb-2" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-gray-100 rounded mb-1" />
        ))}
      </div>
    );
  }

  // Empty state: no students
  if (students.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No students enrolled in this course.</p>
      </div>
    );
  }

  // Empty state: no assignments
  if (assignments.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No published assignments in this course.</p>
      </div>
    );
  }

  return (
    <div
      className="overflow-auto max-h-[70vh] border border-gray-200 rounded-lg shadow-sm"
      role="region"
      aria-label="Editable gradebook grid"
      tabIndex={0}
    >
      <table
        className="min-w-full divide-y divide-gray-200"
        role="grid"
        aria-label="Student grades - click cell to edit"
      >
        {/* Header Row (sticky) */}
        <thead className="bg-gray-100 sticky top-0 z-20">
          <tr role="row">
            {/* Student column header (sticky corner) */}
            <th
              scope="col"
              className="sticky left-0 z-30 bg-gray-100 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-b border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
            >
              Student
            </th>

            {/* Assignment column headers */}
            {assignments.map((assignment) => (
              <th
                key={assignment.id}
                scope="col"
                className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 min-w-[100px]"
                title={assignment.title}
              >
                <div className="flex flex-col items-center">
                  <span className="truncate max-w-[120px]">
                    {assignment.title}
                  </span>
                  <span className="text-gray-400 font-normal text-xs">
                    {assignment.maxPoints} pts
                  </span>
                </div>
              </th>
            ))}

            {/* Summary column headers */}
            <th
              scope="col"
              className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 bg-gray-200"
            >
              <div className="flex flex-col items-center">
                <span>Total</span>
                <span className="text-gray-400 font-normal text-xs">
                  {totalPossiblePoints} pts
                </span>
              </div>
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 bg-gray-200"
            >
              %
            </th>
            <th
              scope="col"
              className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 bg-gray-200"
            >
              GPA
            </th>
          </tr>
        </thead>

        {/* Student Rows */}
        <tbody className="bg-white divide-y divide-gray-200">
          {students.map((student) => (
            <EditableGradebookRow
              key={student.id}
              student={student}
              assignments={assignments}
              savingCellId={savingCellId}
              onGradeChangeRequest={onGradeChangeRequest}
              onCancel={onCancel}
              onTabNext={handleTabNext}
              onTabPrevious={handleTabPrevious}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
