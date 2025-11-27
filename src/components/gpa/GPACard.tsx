'use client';

import { GraduationCap, TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Props for the GPACard component
 */
interface GPACardProps {
  /** GPA value (0-4.0 scale) or null if not calculated */
  gpa: number | null;
  /** Letter grade (A, A-, B+, etc.) or 'N/A' */
  letterGrade: string;
  /** Label to display (e.g., "Overall GPA", "Course GPA") */
  label: string;
  /** Optional percentage score */
  percentage?: number | null;
  /** Whether the GPA is loading */
  isLoading?: boolean;
  /** Custom gradient class for the card */
  gradientClass?: string;
  /** Show as compact card (smaller) */
  compact?: boolean;
}

/**
 * Get color class based on letter grade
 */
function getGradeColorClass(letterGrade: string): string {
  if (letterGrade.startsWith('A')) return 'text-green-400';
  if (letterGrade.startsWith('B')) return 'text-blue-400';
  if (letterGrade.startsWith('C')) return 'text-yellow-400';
  if (letterGrade.startsWith('D')) return 'text-orange-400';
  if (letterGrade === 'F') return 'text-red-400';
  return 'text-gray-400';
}

/**
 * Get trend icon based on GPA value
 */
function getTrendIcon(gpa: number | null) {
  if (gpa === null) return <Minus className="h-4 w-4 text-gray-400" />;
  if (gpa >= 3.5) return <TrendingUp className="h-4 w-4 text-green-400" />;
  if (gpa >= 2.5) return <Minus className="h-4 w-4 text-yellow-400" />;
  return <TrendingDown className="h-4 w-4 text-red-400" />;
}

/**
 * GPACard Component
 *
 * Displays a GPA value with color-coded styling based on the letter grade.
 * Supports loading states and compact display mode.
 */
export default function GPACard({
  gpa,
  letterGrade,
  label,
  percentage,
  isLoading = false,
  gradientClass = 'bg-button-gradient',
  compact = false,
}: GPACardProps) {
  const displayGPA = gpa !== null ? gpa.toFixed(2) : 'N/A';
  const gradeColorClass = getGradeColorClass(letterGrade);

  if (isLoading) {
    return (
      <div
        className={`${gradientClass} text-text-on-dark-bg overflow-hidden shadow rounded-lg animate-pulse`}
      >
        <div className={compact ? 'p-3' : 'p-5'}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <GraduationCap className="h-6 w-6 text-white/50" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <div className="h-4 bg-white/20 rounded w-24 mb-2"></div>
              <div className="h-6 bg-white/30 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${gradientClass} text-text-on-dark-bg overflow-hidden shadow rounded-lg`}
      role="region"
      aria-label={`${label}: ${displayGPA} ${letterGrade !== 'N/A' ? `(${letterGrade})` : ''}`}
    >
      <div className={compact ? 'p-3' : 'p-5'}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <GraduationCap className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-white/80 truncate">
                {label}
              </dt>
              <dd className="flex items-center gap-2">
                <span
                  className={`${compact ? 'text-base' : 'text-lg'} font-bold text-white`}
                >
                  {displayGPA}
                </span>
                {letterGrade !== 'N/A' && (
                  <span
                    className={`text-sm font-semibold ${gradeColorClass} bg-black/20 px-2 py-0.5 rounded`}
                  >
                    {letterGrade}
                  </span>
                )}
                {!compact && getTrendIcon(gpa)}
              </dd>
              {percentage !== undefined && percentage !== null && !compact && (
                <dd className="text-xs text-white/60 mt-1">
                  {percentage.toFixed(1)}% overall
                </dd>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
