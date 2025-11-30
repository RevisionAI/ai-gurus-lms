import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateGPA, GradeInput } from '@/lib/gpa';

/**
 * GET /api/students/gpa/course/[courseId]
 *
 * Calculate and return the GPA for a specific course for the authenticated student.
 *
 * @returns Course GPA data or error response
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Authentication check
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await params;
    const userId = session.user.id;

    // Verify course exists
    const course = await prisma.courses.findUnique({
      where: {
        id: courseId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        code: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Verify enrollment (student must be enrolled in the course)
    const enrollment = await prisma.enrollments.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 403 }
      );
    }

    // Fetch all grades for the student in this course
    const grades = await prisma.grades.findMany({
      where: {
        studentId: userId,
        deletedAt: null,
        assignments: {
          courseId,
          deletedAt: null,
        },
      },
      include: {
        assignments: {
          select: {
            maxPoints: true,
            title: true,
          },
        },
      },
    });

    // Transform to GradeInput format
    const gradeInputs: GradeInput[] = grades.map((g) => ({
      points: g.points,
      maxPoints: g.assignments.maxPoints,
      weight: 1, // Equal weight for MVP
      isGraded: true,
    }));

    // Calculate GPA
    const result = calculateGPA(gradeInputs);

    // Return N/A response if no grades
    if (!result) {
      return NextResponse.json({
        courseId,
        courseTitle: course.title,
        courseCode: course.code,
        gpa: null,
        percentage: null,
        letterGrade: 'N/A',
        isCalculated: false,
        gradedCount: 0,
      });
    }

    // Return calculated GPA response
    return NextResponse.json({
      courseId,
      courseTitle: course.title,
      courseCode: course.code,
      gpa: result.gpa,
      percentage: result.percentage,
      letterGrade: result.letterGrade,
      isCalculated: true,
      gradedCount: result.gradedCount,
    });
  } catch (error) {
    console.error('Course GPA calculation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
