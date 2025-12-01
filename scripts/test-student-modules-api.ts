/**
 * Test what the student modules API would return
 * Run with: TMPDIR=/tmp npx tsx scripts/test-student-modules-api.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Copy of notDeleted from lib/soft-delete.ts
const notDeleted = { deletedAt: null }

async function main() {
  console.log('\n=== Simulating Student Modules API ===\n')

  const courseId = '2c5ff520-3255-48fa-a6cf-46bd6b294ab5' // AI Fluency 2025
  const studentId = 'test-student-id' // Replace with actual student ID

  // Get the actual student
  const student = await prisma.users.findFirst({
    where: { role: 'STUDENT', deletedAt: null }
  })

  if (!student) {
    console.log('No student found!')
    return
  }

  console.log(`Student: ${student.name} (${student.email})`)
  console.log(`Student ID: ${student.id}`)

  // Check enrollment
  const enrollment = await prisma.enrollments.findUnique({
    where: {
      userId_courseId: {
        userId: student.id,
        courseId: courseId,
      },
    },
  })

  console.log(`\nEnrollment: ${enrollment ? 'YES' : 'NO'}`)

  if (!enrollment) {
    console.log('Student is NOT enrolled in this course!')
    return
  }

  // Verify course exists
  const course = await prisma.courses.findFirst({
    where: {
      id: courseId,
      ...notDeleted,
    },
  })

  console.log(`Course found: ${course ? 'YES' : 'NO'}`)

  // Fetch modules (same query as the API)
  const modules = await prisma.modules.findMany({
    where: {
      courseId: courseId,
      isPublished: true,
      ...notDeleted,
    },
    orderBy: {
      orderIndex: 'asc',
    },
    select: {
      id: true,
      title: true,
      description: true,
      orderIndex: true,
      requiresPrevious: true,
      _count: {
        select: {
          course_content: { where: notDeleted },
          assignments: { where: notDeleted },
          discussions: { where: notDeleted },
        },
      },
    },
  })

  console.log(`\nModules found by API query: ${modules.length}`)

  for (const mod of modules) {
    console.log(`\n   ${mod.orderIndex + 1}. ${mod.title}`)
    console.log(`      ID: ${mod.id}`)
    console.log(`      orderIndex: ${mod.orderIndex}`)
    console.log(`      requiresPrevious: ${mod.requiresPrevious}`)
    console.log(`      Content: ${mod._count.course_content}`)
    console.log(`      Assignments: ${mod._count.assignments}`)
    console.log(`      Discussions: ${mod._count.discussions}`)
  }

  // Also check module_progress for this student
  console.log('\n\n=== Module Progress ===')
  const progress = await prisma.module_progress.findMany({
    where: {
      userId: student.id,
      moduleId: { in: modules.map(m => m.id) },
    }
  })

  if (progress.length === 0) {
    console.log('No progress records found for this student')
  } else {
    for (const p of progress) {
      const mod = modules.find(m => m.id === p.moduleId)
      console.log(`\n   ${mod?.title}:`)
      console.log(`      Completed: ${p.completedAt ? 'YES' : 'NO'}`)
      console.log(`      Content viewed: ${p.contentViewed?.length || 0} items`)
    }
  }

  console.log('\n=== End of Report ===\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
