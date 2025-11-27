'use client';

import { GraduationCap, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import GPACard from './GPACard';

/**
 * Course GPA data structure
 */
interface CourseGPA {
  courseId: string;
  courseName: string;
  courseCode: string;
  gpa: number | null;
  percentage: number | null;
  letterGrade: string;
  gradedCount: number;
}

/**
 * Props for the GPASummary component
 */
interface GPASummaryProps {
  /** Overall GPA value */
  overallGPA: number | null;
  /** Overall percentage */
  overallPercentage: number | null;
  /** Overall letter grade */
  overallLetterGrade: string;
  /** Array of per-course GPA data */
  courseGPAs: CourseGPA[];
  /** Whether the data is loading */
  isLoading?: boolean;
  /** Error message if fetch failed */
  error?: string | null;
  /** Callback to retry fetching */
  onRetry?: () => void;
}

/**
 * Get background color class based on letter grade
 */
function getGradeBackgroundClass(letterGrade: string): string {
  if (letterGrade.startsWith('A'))
    return 'border-l-4 border-l-green-500 bg-green-500/10';
  if (letterGrade.startsWith('B'))
    return 'border-l-4 border-l-blue-500 bg-blue-500/10';
  if (letterGrade.startsWith('C'))
    return 'border-l-4 border-l-yellow-500 bg-yellow-500/10';
  if (letterGrade.startsWith('D'))
    return 'border-l-4 border-l-orange-500 bg-orange-500/10';
  if (letterGrade === 'F')
    return 'border-l-4 border-l-red-500 bg-red-500/10';
  return 'border-l-4 border-l-gray-500 bg-gray-500/10';
}

/**
 * Get text color class based on letter grade
 */
function getGradeTextClass(letterGrade: string): string {
  if (letterGrade.startsWith('A')) return 'text-green-400';
  if (letterGrade.startsWith('B')) return 'text-blue-400';
  if (letterGrade.startsWith('C')) return 'text-yellow-400';
  if (letterGrade.startsWith('D')) return 'text-orange-400';
  if (letterGrade === 'F') return 'text-red-400';
  return 'text-gray-400';
}

/**
 * GPASummary Component
 *
 * Displays an overall GPA summary with a breakdown of per-course GPAs.
 * Includes loading, error, and empty states.
 */
export default function GPASummary({
  overallGPA,
  overallPercentage,
  overallLetterGrade,
  courseGPAs,
  isLoading = false,
  error = null,
  onRetry,
}: GPASummaryProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-card-bg shadow rounded-lg animate-pulse">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="h-5 w-5 text-white/50" />
            <div className="h-6 bg-white/20 rounded w-32"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-white/10 rounded-lg"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-card-bg shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <h3 className="text-lg font-medium text-white">
              GPA Calculation Error
            </h3>
          </div>
          <p className="text-white/70 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Empty state (no courses)
  if (courseGPAs.length === 0) {
    return (
      <div className="bg-card-bg shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="h-5 w-5 text-white" />
            <h3 className="text-lg font-medium text-white">Academic Progress</h3>
          </div>
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/70">
              Your GPA will appear here once you are enrolled in courses and receive grades.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const coursesWithGrades = courseGPAs.filter((c) => c.gpa !== null);

  return (
    <div className="bg-card-bg shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-white" aria-hidden="true" />
            <h3 className="text-lg font-medium text-white">Academic Progress</h3>
          </div>
          <div className="text-sm text-white/60">
            {coursesWithGrades.length} of {courseGPAs.length} courses graded
          </div>
        </div>

        {/* Overall GPA Card */}
        <div className="mb-6">
          <GPACard
            gpa={overallGPA}
            letterGrade={overallLetterGrade}
            label="Overall GPA"
            percentage={overallPercentage}
            gradientClass="bg-button-gradient"
          />
        </div>

        {/* Course GPA List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white/70 uppercase tracking-wide">
            Course Breakdown
          </h4>
          {courseGPAs.map((course) => (
            <div
              key={course.courseId}
              className={`p-3 rounded-lg ${getGradeBackgroundClass(course.letterGrade)}`}
              role="listitem"
              aria-label={`${course.courseName}: ${course.gpa !== null ? course.gpa.toFixed(2) : 'No grade'} ${course.letterGrade !== 'N/A' ? `(${course.letterGrade})` : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-white truncate">
                    {course.courseName}
                  </h5>
                  <p className="text-sm text-white/60">{course.courseCode}</p>
                  {course.gradedCount > 0 && (
                    <p className="text-xs text-white/40 mt-1">
                      {course.gradedCount} assignment
                      {course.gradedCount !== 1 ? 's' : ''} graded
                    </p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div
                    className={`text-lg font-bold ${getGradeTextClass(course.letterGrade)}`}
                  >
                    {course.gpa !== null ? course.gpa.toFixed(2) : 'N/A'}
                  </div>
                  {course.letterGrade !== 'N/A' && (
                    <div className="text-sm text-white/60">
                      {course.letterGrade}
                    </div>
                  )}
                  {course.percentage !== null && (
                    <div className="text-xs text-white/40">
                      {course.percentage.toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
