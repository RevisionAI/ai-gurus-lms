'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  GradebookListProps,
  GradebookStudent,
  GradebookAssignment,
  getStatusColorClasses,
  getStatusIcon,
  getStatusLabel,
} from './types';

/**
 * StudentCard Component (internal)
 *
 * Expandable card showing student grades on mobile
 */
function StudentCard({
  student,
  assignments,
  onCellClick,
}: {
  student: GradebookStudent;
  assignments: GradebookAssignment[];
  onCellClick?: (assignmentId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { name, email, grades, totalPoints, percentage, gpa } = student;

  // Calculate total possible points
  const totalPossiblePoints = assignments.reduce(
    (sum, a) => sum + a.maxPoints,
    0
  );

  // Get percentage color
  const getPercentageColorClass = (pct: number): string => {
    if (pct >= 90) return 'text-green-600';
    if (pct >= 80) return 'text-blue-600';
    if (pct >= 70) return 'text-yellow-600';
    if (pct >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Card Header (always visible) */}
      <button
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-500"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={`student-${student.id}-details`}
      >
        <div className="flex-1 text-left">
          <div className="font-medium text-gray-900">{name}</div>
          <div className="text-xs text-gray-500">{email}</div>
        </div>

        {/* Summary stats */}
        <div className="flex items-center gap-4 mr-2">
          <div className="text-right">
            <div className={`text-sm font-medium ${getPercentageColorClass(percentage)}`}>
              {percentage.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              {totalPoints}/{totalPossiblePoints}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {gpa !== null ? gpa.toFixed(2) : 'N/A'}
            </div>
            <div className="text-xs text-gray-500">GPA</div>
          </div>
        </div>

        {/* Expand/collapse icon */}
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div
          id={`student-${student.id}-details`}
          className="border-t border-gray-200 px-4 py-3 space-y-2"
        >
          {assignments.map((assignment) => {
            const gradeCell = grades.find(
              (g) => g.assignmentId === assignment.id
            );
            if (!gradeCell) return null;

            const { score, status } = gradeCell;
            const colorClasses = getStatusColorClasses(status);
            const statusIcon = getStatusIcon(status);
            const statusLabel = getStatusLabel(status);

            return (
              <button
                key={assignment.id}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md border ${colorClasses} hover:opacity-80 transition-colors`}
                onClick={() => onCellClick?.(assignment.id)}
                aria-label={`${assignment.title}: ${statusLabel}${score !== null ? `, score: ${score} out of ${assignment.maxPoints}` : ''}`}
              >
                <div className="text-left">
                  <div className="text-sm font-medium truncate max-w-[200px]">
                    {assignment.title}
                  </div>
                  <div className="text-xs opacity-75">
                    {assignment.maxPoints} pts
                  </div>
                </div>
                <div className="text-right">
                  {status === 'graded' && score !== null ? (
                    <span className="font-medium">
                      {score}/{assignment.maxPoints}
                    </span>
                  ) : (
                    <span className="text-sm">{statusIcon}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * GradebookList Component
 *
 * Mobile-friendly list view of gradebook data.
 * Displays students as expandable cards instead of a grid.
 *
 * Story: 2.1 - Gradebook Grid View Implementation
 * AC: 2.1.7
 */
export function GradebookList({
  students,
  assignments,
  onCellClick,
}: GradebookListProps) {
  // Empty states
  if (students.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No students enrolled in this course.</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No published assignments in this course.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" role="list" aria-label="Student grades list">
      {students.map((student) => (
        <StudentCard
          key={student.id}
          student={student}
          assignments={assignments}
          onCellClick={(assignmentId) =>
            onCellClick?.(student.id, assignmentId)
          }
        />
      ))}
    </div>
  );
}
