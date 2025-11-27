'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { BookOpen, Download, RefreshCw, AlertCircle, Grid, List } from 'lucide-react';
import {
  GradebookGrid,
  GradebookList,
  GradebookMatrix,
  GradebookStudent,
} from '@/components/gradebook';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface Course {
  id: string;
  title: string;
  code: string;
}

/**
 * Gradebook Page (with course selector)
 *
 * Displays gradebook matrix with course dropdown for selection.
 * Uses the new optimized API endpoint.
 *
 * Story: 2.1 - Gradebook Grid View Implementation
 */
export default function GradebookPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [gradebook, setGradebook] = useState<GradebookMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'auto' | 'grid' | 'list'>('auto');

  // Detect mobile viewport for auto view switching
  const isMobile = useIsMobile();

  // Determine which view to show
  const showGrid = viewMode === 'grid' || (viewMode === 'auto' && !isMobile);
  const showList = viewMode === 'list' || (viewMode === 'auto' && isMobile);

  // Fetch instructor's courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/instructor/courses');
        if (response.ok) {
          const data = await response.json();
          setCourses(data);
          // Select first course by default
          if (data.length > 0) {
            setSelectedCourseId(data[0].id);
          }
        } else {
          setError('Failed to fetch courses');
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('An error occurred while fetching courses');
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Fetch gradebook data when course is selected
  const fetchGradebook = useCallback(async () => {
    if (!selectedCourseId) {
      setGradebook(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/instructor/gradebook/${selectedCourseId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch gradebook');
      }

      const data = await response.json();
      setGradebook(data.data);
    } catch (err) {
      console.error('Error fetching gradebook:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setGradebook(null);
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  // Fetch gradebook when course changes
  useEffect(() => {
    fetchGradebook();
  }, [fetchGradebook]);

  // Handle cell click (placeholder for Story 2.2)
  const handleCellClick = (studentId: string, assignmentId: string) => {
    console.log('Cell clicked:', { studentId, assignmentId });
  };

  // Export gradebook to CSV
  const handleExportCSV = () => {
    if (!gradebook) return;

    const { students, assignments, courseCode } = gradebook;

    let csv = 'Student Name,Email';
    assignments.forEach((a) => {
      csv += `,${escapeCSV(a.title)} (${a.maxPoints})`;
    });
    csv += ',Total Points,Percentage (%),GPA\n';

    students.forEach((student) => {
      csv += `${escapeCSV(student.name)},${escapeCSV(student.email)}`;

      assignments.forEach((assignment) => {
        const grade = student.grades.find(
          (g) => g.assignmentId === assignment.id
        );
        if (grade?.score !== null && grade?.score !== undefined) {
          csv += `,${grade.score}`;
        } else {
          csv += `,${grade?.status || 'N/A'}`;
        }
      });

      const totalPossible = assignments.reduce((sum, a) => sum + a.maxPoints, 0);
      csv += `,${student.totalPoints}/${totalPossible}`;
      csv += `,${student.percentage.toFixed(1)}`;
      csv += `,${student.gpa !== null ? student.gpa.toFixed(2) : 'N/A'}\n`;
    });

    const date = new Date().toISOString().split('T')[0];
    const filename = `${courseCode}_grades_${date}.csv`;
    downloadCSV(csv, filename);
  };

  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
      <div className="min-h-screen bg-bg-primary">
        <Navbar />
        <main className="max-w-full mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-2xl font-semibold text-text-primary">
              Gradebook
            </h1>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="hidden md:flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 flex items-center gap-1 text-sm ${
                    showGrid
                      ? 'bg-pink-100 text-pink-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Grid view"
                  aria-pressed={showGrid}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 flex items-center gap-1 text-sm ${
                    showList
                      ? 'bg-pink-100 text-pink-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title="List view"
                  aria-pressed={showList}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Refresh */}
              <button
                onClick={fetchGradebook}
                disabled={loading || !selectedCourseId}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
                title="Refresh gradebook"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
              </button>

              {/* Export CSV */}
              <button
                onClick={handleExportCSV}
                disabled={!gradebook || loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Course Selector */}
          {coursesLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-card-bg rounded-lg shadow p-6">
              <div className="text-center">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-text-primary">
                  No courses found
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                  You haven't created any courses yet.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Course Dropdown */}
              <div className="mb-6">
                <label
                  htmlFor="course-select"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  Select Course
                </label>
                <select
                  id="course-select"
                  value={selectedCourseId || ''}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="max-w-md mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-pink-500 focus:border-pink-500 rounded-md bg-bg-content text-text-primary"
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mb-4 text-xs">
                <div className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-green-100 border border-green-200" />
                  <span className="text-gray-600">Graded</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200" />
                  <span className="text-gray-600">Pending</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-orange-100 border border-orange-200" />
                  <span className="text-gray-600">Late</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-red-100 border border-red-200" />
                  <span className="text-gray-600">Missing</span>
                </div>
              </div>

              {/* Error State */}
              {error && (
                <div className="rounded-md bg-red-50 p-4 mb-6">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                      <button
                        onClick={fetchGradebook}
                        className="mt-2 text-sm text-red-600 underline hover:text-red-500"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
                </div>
              )}

              {/* Gradebook Content */}
              {!loading && gradebook && (
                <>
                  {/* Empty state */}
                  {gradebook.students.length === 0 ? (
                    <div className="bg-card-bg rounded-lg shadow p-6">
                      <div className="text-center">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-text-primary">
                          No students enrolled
                        </h3>
                        <p className="mt-1 text-sm text-text-secondary">
                          There are no students enrolled in this course yet.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Grid View */}
                      {showGrid && (
                        <div className="hidden md:block">
                          <GradebookGrid
                            students={gradebook.students}
                            assignments={gradebook.assignments}
                            onCellClick={handleCellClick}
                            isLoading={loading}
                          />
                        </div>
                      )}

                      {/* List View */}
                      {showList && (
                        <div className={showGrid ? 'md:hidden' : ''}>
                          <GradebookList
                            students={gradebook.students}
                            assignments={gradebook.assignments}
                            onCellClick={handleCellClick}
                          />
                        </div>
                      )}

                      {/* Stats Summary */}
                      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                          label="Students"
                          value={gradebook.students.length.toString()}
                        />
                        <StatCard
                          label="Assignments"
                          value={gradebook.assignments.length.toString()}
                        />
                        <StatCard
                          label="Avg. Percentage"
                          value={`${calculateAveragePercentage(gradebook.students).toFixed(1)}%`}
                        />
                        <StatCard
                          label="Avg. GPA"
                          value={calculateAverageGPA(gradebook.students)}
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function calculateAveragePercentage(students: GradebookStudent[]): number {
  if (students.length === 0) return 0;
  const total = students.reduce((sum, s) => sum + s.percentage, 0);
  return total / students.length;
}

function calculateAverageGPA(students: GradebookStudent[]): string {
  const studentsWithGPA = students.filter((s) => s.gpa !== null);
  if (studentsWithGPA.length === 0) return 'N/A';
  const total = studentsWithGPA.reduce((sum, s) => sum + (s.gpa || 0), 0);
  return (total / studentsWithGPA.length).toFixed(2);
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
