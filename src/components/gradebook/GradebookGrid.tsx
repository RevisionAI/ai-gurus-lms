'use client';

import React from 'react';
import { GradebookGridProps } from './types';
import { GradebookRow } from './GradebookRow';

/**
 * GradebookGrid Component
 *
 * Displays the full gradebook matrix with:
 * - Students as rows
 * - Assignments as columns
 * - Sticky header row for assignment names
 * - Sticky first column for student names
 * - Horizontal/vertical scrolling for large datasets
 *
 * Story: 2.1 - Gradebook Grid View Implementation
 * AC: 2.1.1, 2.1.5
 */
export function GradebookGrid({
  students,
  assignments,
  onCellClick,
  isLoading = false,
}: GradebookGridProps) {
  // Calculate total possible points for header
  const totalPossiblePoints = assignments.reduce(
    (sum, a) => sum + a.maxPoints,
    0
  );

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
      aria-label="Gradebook grid"
      tabIndex={0}
    >
      <table
        className="min-w-full divide-y divide-gray-200"
        role="grid"
        aria-label="Student grades"
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
            <GradebookRow
              key={student.id}
              student={student}
              assignments={assignments}
              onCellClick={(assignmentId) =>
                onCellClick?.(student.id, assignmentId)
              }
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
