import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all active courses where the student is not enrolled
    const availableCourses = await prisma.courses.findMany({
      where: {
        isActive: true,
        enrollments: {
          none: {
            userId: session.user.id
          }
        }
      },
      include: {
        users: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });

    return NextResponse.json(availableCourses);
  } catch (error) {
    console.error('Error fetching available courses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
