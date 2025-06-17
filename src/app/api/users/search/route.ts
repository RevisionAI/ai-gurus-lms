import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only authenticated users, preferably instructors or admins, should search users.
    // For now, let's restrict to instructors for enrolling students.
    if (!session || session.user.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: 'Search query must be at least 2 characters long' }, { status: 400 });
    }

    // For SQLite, the LIKE operator is case-insensitive for ASCII characters.
    // We use a parameterized $queryRaw with SQL concatenation to safely build the LIKE pattern.
    const users: { id: string; name: string | null; email: string }[] = await prisma.$queryRaw`
      SELECT id, name, email FROM "users"
      WHERE "role" = 'STUDENT' AND ("name" LIKE '%' || ${query} || '%' OR "email" LIKE '%' || ${query} || '%')
      LIMIT 10
    `;


    return NextResponse.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
