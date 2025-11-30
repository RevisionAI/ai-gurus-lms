/**
 * Student Unenroll API
 *
 * DELETE /api/student/unenroll
 * Allows a student to unenroll from a course
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Verify the enrollment exists
    const enrollment = await prisma.enrollments.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId
        }
      },
      include: {
        courses: {
          select: {
            title: true
          }
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 404 });
    }

    // Delete the enrollment
    await prisma.enrollments.delete({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId
        }
      }
    });

    return NextResponse.json({
      message: 'Successfully unenrolled from course',
      courseTitle: enrollment.courses.title
    }, { status: 200 });
  } catch (error) {
    console.error('Error unenrolling from course:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
