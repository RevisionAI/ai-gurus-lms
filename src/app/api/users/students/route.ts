import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only instructors can access this endpoint
    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all students with basic information
    const students = await prisma.users.findMany({
      where: {
        role: 'STUDENT'
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: {
        name: 'asc' // Alphabetical ordering by name
      }
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error('Error retrieving students:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
