/**
 * Gradebook CSV Export API Route
 * GET /api/instructor/gradebook/[courseId]/export
 *
 * Exports gradebook data to CSV format with optional filtering.
 * Includes rate limiting (10 exports per 10 minutes per instructor).
 *
 * Story: 2.3 - Gradebook Filtering & CSV Export
 *
 * @see docs/stories/2-3-gradebook-filtering-csv-export.md
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateGPA, GradeInput } from '@/lib/gpa';
import { parseGradebookFilters, GradebookFilters } from '@/validators/gradebook';
import { formatZodErrors } from '@/lib/validation';
import {
  generateGradebookCSV,
  generateCSVFilename,
  CSVGradebookMatrix,
  getExportStats,
} from '@/lib/csv-export';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ============================================
// Types
// ============================================

type CellStatus = 'graded' | 'pending' | 'late' | 'missing';

interface GradebookCell {
  assignmentId: string;
  score: number | null;
  status: CellStatus;
}

// ============================================
// Rate Limiting
// ============================================

let exportRateLimiter: Ratelimit | null = null;

/**
 * Get or create export rate limiter
 * 10 exports per 10 minutes per instructor
 */
function getExportRateLimiter(): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Rate limiting disabled in development without Redis
    return null;
  }

  if (!exportRateLimiter) {
    const redis = new Redis({ url, token });
    exportRateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 m'),
      analytics: true,
      prefix: 'ratelimit:gradebook_export',
    });
  }

  return exportRateLimiter;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Determine the status of a grade cell based on submission and grade data
 */
function determineCellState(
  submission: { id: string; submittedAt: Date } | null,
  grade: { points: number } | null,
  assignment: { dueDate: Date | null }
): CellStatus {
  if (grade) {
    return 'graded';
  }

  if (submission) {
    const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
    const submittedAt = new Date(submission.submittedAt);

    if (dueDate && submittedAt > dueDate) {
      return 'late';
    }
    return 'pending';
  }

  const now = new Date();
  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
  if (dueDate && now > dueDate) {
    return 'missing';
  }

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

// ============================================
// Route Handler
// ============================================

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

    // Apply rate limiting
    const rateLimiter = getExportRateLimiter();
    if (rateLimiter) {
      const identifier = `export:${session.user.id}:${courseId}`;
      const result = await rateLimiter.limit(identifier);

      if (!result.success) {
        const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

        console.warn(`[Gradebook Export] Rate limit exceeded for user ${session.user.id} on course ${courseId}`);

        return NextResponse.json(
          {
            error: {
              code: 'RATE_LIMITED',
              message: 'Too many exports. Please try again later.',
              details: {
                limit: result.limit,
                remaining: result.remaining,
                resetAt: new Date(result.reset).toISOString(),
                retryAfter,
              },
            },
          },
          {
            status: 429,
            headers: {
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': new Date(result.reset).toISOString(),
            },
          }
        );
      }
    }

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

    if (filters.assignmentId) {
      assignmentWhere.id = filters.assignmentId;
    }

    if (filters.dateFrom || filters.dateTo) {
      assignmentWhere.dueDate = {};
      if (filters.dateFrom) {
        assignmentWhere.dueDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
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

    // Calculate total possible points
    const totalPossiblePoints = assignments.reduce(
      (sum, a) => sum + a.maxPoints,
      0
    );

    // Build CSV data structure
    const csvStudents: CSVGradebookMatrix['students'] = [];

    for (const enrollment of enrollments) {
      const student = enrollment.users;
      let totalPoints = 0;
      const gradedAssignments: GradeInput[] = [];
      let matchesStatusFilterForStudent = false;

      const grades: GradebookCell[] = assignments.map((assignment) => {
        const grade = assignment.grades.find(
          (g) => g.studentId === student.id
        );
        const submission = assignment.submissions.find(
          (s) => s.studentId === student.id
        );

        const status = determineCellState(
          submission ? { id: submission.id, submittedAt: submission.submittedAt } : null,
          grade ? { points: grade.points } : null,
          { dueDate: assignment.dueDate }
        );

        if (matchesStatusFilter(status, filters.status)) {
          matchesStatusFilterForStudent = true;
        }

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
        };
      });

      if (filters.status === 'all' || matchesStatusFilterForStudent) {
        const percentage =
          totalPossiblePoints > 0
            ? Math.round((totalPoints / totalPossiblePoints) * 10000) / 100
            : 0;

        const gpaResult = calculateGPA(gradedAssignments);
        const gpa = gpaResult?.gpa ?? null;

        csvStudents.push({
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

    // Build CSV matrix
    const csvMatrix: CSVGradebookMatrix = {
      students: csvStudents,
      assignments: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        maxPoints: a.maxPoints,
      })),
      courseCode: course.code,
      courseTitle: course.title,
    };

    // Generate CSV content
    const csvContent = generateGradebookCSV(csvMatrix);
    const filename = generateCSVFilename(course.code);

    // Log export action
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    const stats = getExportStats(csvMatrix);

    console.log(
      JSON.stringify({
        action: 'gradebook_export',
        courseId,
        instructorId: session.user.id,
        rowCount: stats.studentCount,
        columnCount: stats.assignmentCount,
        fileSize: csvContent.length,
        filters,
        executionTime: `${executionTime.toFixed(2)}ms`,
      })
    );

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(csvContent.length),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Gradebook Export] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to export gradebook' } },
      { status: 500 }
    );
  }
}
