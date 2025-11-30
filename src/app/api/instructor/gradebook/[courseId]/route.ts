/**
 * Gradebook API Route
 * GET /api/instructor/gradebook/[courseId]
 *
 * Returns complete gradebook matrix data for a course with optional filtering.
 * Story: 2.1 - Gradebook Grid View Implementation
 * Story: 2.3 - Gradebook Filtering & CSV Export
 *
 * @see docs/stories/2-1-gradebook-grid-view-implementation.md
 * @see docs/stories/2-3-gradebook-filtering-csv-export.md
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateGPA, GradeInput } from '@/lib/gpa';
import { parseGradebookFilters, GradebookFilters } from '@/validators/gradebook';
import { formatZodErrors } from '@/lib/validation';

/**
 * Cell status for grade display
 * - graded: grade exists with score (green)
 * - pending: submission exists but no grade (yellow)
 * - late: submission after due date, not yet graded (orange)
 * - missing: no submission and past due date (red)
 */
export type CellStatus = 'graded' | 'pending' | 'late' | 'missing';

/**
 * Individual grade cell in the matrix
 */
export interface GradebookCell {
  assignmentId: string;
  score: number | null;
  status: CellStatus;
  submissionId: string | null;
}

/**
 * Student row in the gradebook matrix
 */
export interface GradebookStudent {
  id: string;
  name: string;
  email: string;
  grades: GradebookCell[];
  totalPoints: number;
  percentage: number;
  gpa: number | null;
}

/**
 * Assignment column in the gradebook matrix
 */
export interface GradebookAssignment {
  id: string;
  title: string;
  maxPoints: number;
  dueDate: Date | null;
}

/**
 * Complete gradebook matrix response
 */
export interface GradebookMatrix {
  students: GradebookStudent[];
  assignments: GradebookAssignment[];
  courseId: string;
  courseTitle: string;
  courseCode: string;
}

/**
 * Determine the status of a grade cell based on submission and grade data
 */
function determineCellState(
  submission: { id: string; submittedAt: Date } | null,
  grade: { points: number } | null,
  assignment: { dueDate: Date | null }
): CellStatus {
  // If graded, return graded status
  if (grade) {
    return 'graded';
  }

  // If submission exists
  if (submission) {
    const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
    const submittedAt = new Date(submission.submittedAt);

    // Check if submitted late
    if (dueDate && submittedAt > dueDate) {
      return 'late';
    }
    return 'pending';
  }

  // No submission - check if past due date
  const now = new Date();
  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
  if (dueDate && now > dueDate) {
    return 'missing';
  }

  // Assignment not due yet and no submission
  return 'missing';
}

/**
 * Check if a cell matches the status filter
 */
function matchesStatusFilter(
  status: CellStatus,
  filterStatus: GradebookFilters['status']
): boolean {
  if (filterStatus === 'all') return true;
  return status === filterStatus;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const startTime = performance.now();

  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Verify instructor role
    if (session.user.role !== 'INSTRUCTOR' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Instructor access required' } },
        { status: 403 }
      );
    }

    const { courseId } = await params;

    // Parse and validate filter parameters
    const { searchParams } = new URL(request.url);
    const filterResult = parseGradebookFilters(searchParams);

    if (!filterResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid filter parameters',
            details: formatZodErrors(filterResult.error),
          },
        },
        { status: 400 }
      );
    }

    const filters = filterResult.data;

    // Fetch course and verify instructor ownership
    const course = await prisma.courses.findUnique({
      where: {
        id: courseId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        code: true,
        instructorId: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Course not found' } },
        { status: 404 }
      );
    }

    // Verify instructor owns this course (skip for admin)
    if (session.user.role !== 'ADMIN' && course.instructorId !== session.user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Not instructor for this course' } },
        { status: 403 }
      );
    }

    // Build student filter conditions
    const studentWhere: { deletedAt: null; OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; surname?: { contains: string; mode: 'insensitive' } }> } = {
      deletedAt: null,
    };

    if (filters.studentFilter) {
      studentWhere.OR = [
        { name: { contains: filters.studentFilter, mode: 'insensitive' } },
        { surname: { contains: filters.studentFilter, mode: 'insensitive' } },
      ];
    }

    // Fetch enrollments with student data
    const enrollments = await prisma.enrollments.findMany({
      where: {
        courseId,
        users: studentWhere,
      },
      include: {
        users: {
          select: { id: true, name: true, surname: true, email: true },
        },
      },
      orderBy: {
        users: { name: 'asc' },
      },
    });

    // Build assignment filter conditions
    const assignmentWhere: {
      courseId: string;
      deletedAt: null;
      isPublished: boolean;
      id?: string;
      dueDate?: { gte?: Date; lte?: Date };
    } = {
      courseId,
      deletedAt: null,
      isPublished: true,
    };

    // Filter by specific assignment
    if (filters.assignmentId) {
      assignmentWhere.id = filters.assignmentId;
    }

    // Filter by date range
    if (filters.dateFrom || filters.dateTo) {
      assignmentWhere.dueDate = {};
      if (filters.dateFrom) {
        assignmentWhere.dueDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        // Set end of day for dateTo
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        assignmentWhere.dueDate.lte = toDate;
      }
    }

    // Fetch assignments with grades and submissions
    const assignments = await prisma.assignments.findMany({
      where: assignmentWhere,
      include: {
        grades: {
          where: { deletedAt: null },
          select: {
            id: true,
            studentId: true,
            points: true,
          },
        },
        submissions: {
          select: {
            id: true,
            studentId: true,
            submittedAt: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    // Transform data into GradebookMatrix format
    const gradebookAssignments: GradebookAssignment[] = assignments.map((a) => ({
      id: a.id,
      title: a.title,
      maxPoints: a.maxPoints,
      dueDate: a.dueDate,
    }));

    // Calculate total possible points
    const totalPossiblePoints = assignments.reduce(
      (sum, a) => sum + a.maxPoints,
      0
    );

    // Build student rows with grade cells
    const gradebookStudents: GradebookStudent[] = [];

    for (const enrollment of enrollments) {
      const student = enrollment.users;
      let totalPoints = 0;
      const gradedAssignments: GradeInput[] = [];
      let matchesStatusFilterForStudent = false;

      // Build grade cells for each assignment
      const grades: GradebookCell[] = assignments.map((assignment) => {
        // Find grade for this student/assignment
        const grade = assignment.grades.find(
          (g) => g.studentId === student.id
        );
        // Find submission for this student/assignment
        const submission = assignment.submissions.find(
          (s) => s.studentId === student.id
        );

        // Determine cell status
        const status = determineCellState(
          submission ? { id: submission.id, submittedAt: submission.submittedAt } : null,
          grade ? { points: grade.points } : null,
          { dueDate: assignment.dueDate }
        );

        // Track if this student has any grades matching the status filter
        if (matchesStatusFilter(status, filters.status)) {
          matchesStatusFilterForStudent = true;
        }

        // Track graded points for totals and GPA
        if (grade) {
          totalPoints += grade.points;
          gradedAssignments.push({
            points: grade.points,
            maxPoints: assignment.maxPoints,
            weight: 1,
            isGraded: true,
          });
        }

        return {
          assignmentId: assignment.id,
          score: grade?.points ?? null,
          status,
          submissionId: submission?.id ?? null,
        };
      });

      // Apply status filter at student level
      // Include student if they have at least one grade matching the status filter
      // or if filter is 'all'
      if (filters.status === 'all' || matchesStatusFilterForStudent) {
        // Calculate percentage
        const percentage =
          totalPossiblePoints > 0
            ? Math.round((totalPoints / totalPossiblePoints) * 10000) / 100
            : 0;

        // Calculate GPA using existing utility
        const gpaResult = calculateGPA(gradedAssignments);
        const gpa = gpaResult?.gpa ?? null;

        gradebookStudents.push({
          id: student.id,
          name: `${student.name} ${student.surname}`,
          email: student.email,
          grades,
          totalPoints,
          percentage,
          gpa,
        });
      }
    }

    // Build response
    const matrix: GradebookMatrix = {
      students: gradebookStudents,
      assignments: gradebookAssignments,
      courseId: course.id,
      courseTitle: course.title,
      courseCode: course.code,
    };

    // Log query execution time for performance monitoring
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    console.log(
      `[Gradebook API] Course ${courseId}: ${gradebookStudents.length} students × ${assignments.length} assignments in ${executionTime.toFixed(2)}ms (filters: ${JSON.stringify(filters)})`
    );

    // Warn if exceeding performance budget
    if (executionTime > 2000) {
      console.warn(
        `[Gradebook API] Performance warning: Query exceeded 2s threshold (${executionTime.toFixed(2)}ms)`
      );
    }

    return NextResponse.json({ data: matrix });
  } catch (error) {
    console.error('[Gradebook API] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
