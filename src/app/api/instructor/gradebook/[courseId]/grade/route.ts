/**
 * Grade Update API Route
 * PUT /api/instructor/gradebook/[courseId]/grade
 *
 * Updates a single grade for a student submission with inline editing.
 * Story: 2.2 - Gradebook Inline Editing with Confirmation
 *
 * @see docs/stories/2-2-gradebook-inline-editing-with-confirmation.md
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateRequest, createCustomValidationError } from '@/lib/validation';
import { applyUserRateLimit } from '@/lib/rate-limit';
import { gradeUpdateSchema } from '@/validators/gradebook';

/**
 * Response type for successful grade update
 */
interface GradeUpdateResponse {
  success: true;
  grade: {
    id: string;
    points: number;
    studentId: string;
    assignmentId: string;
    gradedAt: Date;
  };
  previousPoints: number | null;
}

/**
 * PUT /api/instructor/gradebook/[courseId]/grade
 *
 * Updates a grade for a submission. Creates a new grade record if none exists,
 * or updates the existing grade.
 *
 * Request body:
 * - submissionId: string (CUID) - The submission to grade
 * - grade: number - The new grade value (must be >= 0 and <= assignment maxPoints)
 *
 * Responses:
 * - 200: Grade updated successfully
 * - 400: Validation error (invalid input)
 * - 401: Not authenticated
 * - 403: Not authorized (not instructor for this course)
 * - 404: Submission or course not found
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
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

    // Apply rate limiting (30 requests per minute per user via default user limit)
    const rateLimitResponse = await applyUserRateLimit(
      session.user.id,
      '/api/instructor/gradebook/grade'
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Validate request body
    const validation = await validateRequest(request, gradeUpdateSchema);
    if (!validation.success) {
      return validation.response;
    }

    const { submissionId, grade, feedback } = validation.data;
    const { courseId } = await params;

    // Fetch course and verify instructor ownership
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        deletedAt: null,
      },
      select: {
        id: true,
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

    // Fetch submission and verify it belongs to an assignment in this course
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          select: {
            id: true,
            courseId: true,
            maxPoints: true,
            title: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Submission not found' } },
        { status: 404 }
      );
    }

    // Verify submission belongs to an assignment in this course
    if (submission.assignment.courseId !== courseId) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Submission not found in this course' } },
        { status: 404 }
      );
    }

    // Verify assignment is not deleted
    if (submission.assignment.deletedAt) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Assignment has been deleted' } },
        { status: 404 }
      );
    }

    // Validate grade does not exceed assignment maxPoints
    if (grade > submission.assignment.maxPoints) {
      return createCustomValidationError(
        `Grade cannot exceed maximum points (${submission.assignment.maxPoints})`,
        [
          {
            path: 'grade',
            message: `Grade must be ${submission.assignment.maxPoints} or less`,
          },
        ]
      );
    }

    // Get existing grade (if any) to track previous value
    const existingGrade = await prisma.grade.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId: submission.assignment.id,
          studentId: submission.studentId,
        },
      },
      select: {
        id: true,
        points: true,
      },
    });

    const previousPoints = existingGrade?.points ?? null;

    // Upsert grade (create or update)
    // Story: 2.7 - Added feedback field support
    const updatedGrade = await prisma.grade.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: submission.assignment.id,
          studentId: submission.studentId,
        },
      },
      create: {
        assignmentId: submission.assignment.id,
        studentId: submission.studentId,
        gradedById: session.user.id,
        points: grade,
        feedback: feedback ?? null,
        gradedAt: new Date(),
      },
      update: {
        points: grade,
        feedback: feedback !== undefined ? (feedback ?? null) : undefined,
        gradedById: session.user.id,
        gradedAt: new Date(),
        deletedAt: null, // Restore if soft-deleted
      },
    });

    // Log grade update for audit trail
    console.log(
      `[Grade API] Grade updated: courseId=${courseId}, assignmentId=${submission.assignment.id}, ` +
        `studentId=${submission.studentId}, previousPoints=${previousPoints}, newPoints=${grade}, ` +
        `gradedBy=${session.user.id}`
    );

    const response: GradeUpdateResponse = {
      success: true,
      grade: {
        id: updatedGrade.id,
        points: updatedGrade.points,
        studentId: updatedGrade.studentId,
        assignmentId: updatedGrade.assignmentId,
        gradedAt: updatedGrade.gradedAt,
      },
      previousPoints,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Grade API] Error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
