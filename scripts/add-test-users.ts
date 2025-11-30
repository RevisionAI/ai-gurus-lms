/**
 * Add Test Users Script
 *
 * Creates test accounts and enrolls them in existing courses.
 * Safe to run on existing databases - uses upsert to avoid duplicates.
 *
 * Usage: npx tsx scripts/add-test-users.ts
 */

import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function addTestUsers() {
  console.log('='.repeat(60))
  console.log('Add Test Users Script')
  console.log('='.repeat(60))
  console.log('')

  try {
    const password = await hashPassword('Test123!')

    // Create/update test users
    console.log('Creating test users...')

    const admin = await prisma.users.upsert({
      where: { email: 'admin@aigurus.test' },
      update: { password }, // Update password if exists
      create: {
        email: 'admin@aigurus.test',
        name: 'Admin',
        surname: 'User',
        password,
        cellNumber: '+1234567890',
        company: 'AI Gurus',
        position: 'Administrator',
        workAddress: '123 Admin Street',
        role: UserRole.ADMIN
      }
    })
    console.log(`  ✓ Admin: ${admin.email}`)

    const instructor = await prisma.users.upsert({
      where: { email: 'instructor@aigurus.test' },
      update: { password },
      create: {
        email: 'instructor@aigurus.test',
        name: 'Test',
        surname: 'Instructor',
        password,
        cellNumber: '+1234567891',
        company: 'AI Gurus',
        position: 'Senior Instructor',
        workAddress: '456 Teaching Lane',
        role: UserRole.INSTRUCTOR
      }
    })
    console.log(`  ✓ Instructor: ${instructor.email}`)

    const student = await prisma.users.upsert({
      where: { email: 'student@aigurus.test' },
      update: { password },
      create: {
        email: 'student@aigurus.test',
        name: 'Test',
        surname: 'Student',
        password,
        cellNumber: '+1234567892',
        company: 'Test Corp',
        position: 'Developer',
        workAddress: '789 Learning Blvd',
        role: UserRole.STUDENT
      }
    })
    console.log(`  ✓ Student: ${student.email}`)

    // Get all active courses
    console.log('')
    console.log('Finding existing courses...')
    const courses = await prisma.courses.findMany({
      where: { isActive: true },
      select: { id: true, title: true, code: true }
    })

    if (courses.length === 0) {
      console.log('  No active courses found.')
    } else {
      console.log(`  Found ${courses.length} active course(s)`)

      // Enroll student in all active courses
      console.log('')
      console.log('Enrolling test student in courses...')

      for (const course of courses) {
        try {
          await prisma.enrollments.upsert({
            where: {
              userId_courseId: {
                userId: student.id,
                courseId: course.id
              }
            },
            update: {},
            create: {
              userId: student.id,
              courseId: course.id
            }
          })
          console.log(`  ✓ Enrolled in: ${course.code || course.title}`)
        } catch (err) {
          console.log(`  - Already enrolled in: ${course.code || course.title}`)
        }
      }
    }

    // Summary
    console.log('')
    console.log('='.repeat(60))
    console.log('COMPLETE')
    console.log('='.repeat(60))
    console.log('')
    console.log('Test Accounts (Password: Test123!)')
    console.log('─'.repeat(40))
    console.log(`  ADMIN:      admin@aigurus.test`)
    console.log(`  INSTRUCTOR: instructor@aigurus.test`)
    console.log(`  STUDENT:    student@aigurus.test`)
    console.log('')
    console.log('Login at: /login')
    console.log('')

  } catch (error) {
    console.error('Failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

addTestUsers()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
