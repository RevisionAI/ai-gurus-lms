import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  calculateGPA,
  calculateOverallGPA,
  GradeInput,
  percentageToLetterGrade,
} from '@/lib/gpa';

/**
 * Course GPA data structure for response
 */
interface CourseGPAData {
  courseId: string;
  courseName: string;
  courseCode: string;
  gpa: number | null;
  percentage: number | null;
  letterGrade: string;
  gradedCount: number;
}

/**
 * GET /api/students/gpa/overall
 *
 * Calculate and return the overall GPA across all enrolled courses
 * for the authenticated student.
 *
 * @returns Overall GPA data with per-course breakdown
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Authentication check
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all enrollments with course details
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        course: {
          deletedAt: null,
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
      },
    });

    // No enrollments means no GPA
    if (enrollments.length === 0) {
      return NextResponse.json({
        overallGPA: null,
        percentage: null,
        letterGrade: 'N/A',
        isCalculated: false,
        courseGPAs: [],
        courseCount: 0,
        coursesWithGrades: 0,
      });
    }

    // Calculate GPA for each course
    const courseGPAs: CourseGPAData[] = [];
    const validGPAs: number[] = [];
    const validPercentages: number[] = [];

    for (const enrollment of enrollments) {
      const course = enrollment.course;

      // Fetch grades for this course
      const grades = await prisma.grade.findMany({
        where: {
          studentId: userId,
          deletedAt: null,
          assignment: {
            courseId: course.id,
            deletedAt: null,
          },
        },
        include: {
          assignment: {
            select: {
              maxPoints: true,
            },
          },
        },
      });

      // Transform to GradeInput format
      const gradeInputs: GradeInput[] = grades.map((g) => ({
        points: g.points,
        maxPoints: g.assignment.maxPoints,
        weight: 1,
        isGraded: true,
      }));

      // Calculate course GPA
      const result = calculateGPA(gradeInputs);

      if (result) {
        courseGPAs.push({
          courseId: course.id,
          courseName: course.title,
          courseCode: course.code,
          gpa: result.gpa,
          percentage: result.percentage,
          letterGrade: result.letterGrade,
          gradedCount: result.gradedCount,
        });
        validGPAs.push(result.gpa);
        validPercentages.push(result.percentage);
      } else {
        courseGPAs.push({
          courseId: course.id,
          courseName: course.title,
          courseCode: course.code,
          gpa: null,
          percentage: null,
          letterGrade: 'N/A',
          gradedCount: 0,
        });
      }
    }

    // Calculate overall GPA
    const overallGPA = calculateOverallGPA(validGPAs);

    // Calculate overall percentage (average of course percentages)
    const overallPercentage =
      validPercentages.length > 0
        ? Math.round(
            (validPercentages.reduce((a, b) => a + b, 0) /
              validPercentages.length) *
              100
          ) / 100
        : null;

    // Get letter grade for overall
    const overallLetterGrade =
      overallPercentage !== null
        ? percentageToLetterGrade(overallPercentage)
        : 'N/A';

    return NextResponse.json({
      overallGPA,
      percentage: overallPercentage,
      letterGrade: overallLetterGrade,
      isCalculated: overallGPA !== null,
      courseGPAs,
      courseCount: enrollments.length,
      coursesWithGrades: validGPAs.length,
    });
  } catch (error) {
    console.error('Overall GPA calculation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
