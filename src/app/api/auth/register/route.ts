import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { name, surname, email, cellNumber, company, position, workAddress, password, role } = await request.json()

    if (!name || !surname || !email || !cellNumber || !company || !position || !workAddress || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.users.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.users.create({
      data: {
        id: randomUUID(),
        name,
        surname,
        email,
        cellNumber,
        company,
        position,
        workAddress,
        password: hashedPassword,
        role: role as 'STUDENT' | 'INSTRUCTOR' | 'ADMIN',
        updatedAt: new Date()
      }
    })

    return NextResponse.json(
      { message: 'User created successfully', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}