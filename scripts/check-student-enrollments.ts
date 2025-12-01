/**
 * Check which courses students are enrolled in
 * Run with: TMPDIR=/tmp npx tsx scripts/check-student-enrollments.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n=== Student Enrollment Check ===\n')

  // Get all students
  const students = await prisma.users.findMany({
    where: { role: 'STUDENT', deletedAt: null },
    include: {
      enrollments: {
        include: {
          courses: {
            select: {
              id: true,
              title: true,
              code: true,
            }
          }
        }
      }
    }
  })

  for (const student of students) {
    console.log(`\n👤 ${student.name} (${student.email})`)
    console.log(`   Enrolled in ${student.enrollments.length} course(s):`)

    for (const enrollment of student.enrollments) {
      console.log(`   - ${enrollment.courses.title} (${enrollment.courses.code})`)
      console.log(`     Course ID: ${enrollment.courses.id}`)

      // Check modules for this course
      const modules = await prisma.modules.findMany({
        where: {
          courseId: enrollment.courses.id,
          deletedAt: null,
        },
        orderBy: { orderIndex: 'asc' }
      })

      console.log(`     Modules: ${modules.length}`)
      for (const mod of modules) {
        const status = mod.isPublished ? '✅' : '❌'
        console.log(`       ${status} ${mod.title} (published: ${mod.isPublished})`)
      }
    }
  }

  console.log('\n=== End of Report ===\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
