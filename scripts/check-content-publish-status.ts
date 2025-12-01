/**
 * Diagnostic script to check content publish status
 * Run with: TMPDIR=/tmp npx tsx scripts/check-content-publish-status.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n=== Content Publish Status Check ===\n')

  // Get the AI Fluency 2025 course
  const course = await prisma.courses.findFirst({
    where: {
      code: 'AIF-2025',
      deletedAt: null
    },
    include: {
      modules: {
        where: { deletedAt: null },
        orderBy: { orderIndex: 'asc' },
        include: {
          course_content: {
            where: { deletedAt: null },
            orderBy: { orderIndex: 'asc' },
            select: {
              id: true,
              title: true,
              type: true,
              isPublished: true,
              orderIndex: true,
            }
          },
          assignments: {
            where: { deletedAt: null },
            select: {
              id: true,
              title: true,
              isPublished: true,
            }
          }
        }
      }
    }
  })

  if (!course) {
    console.log('Course AIF-2025 not found!')
    return
  }

  console.log(`📚 Course: ${course.title} (${course.code})`)

  for (const mod of course.modules) {
    const modStatus = mod.isPublished ? '✅' : '❌'
    console.log(`\n${modStatus} Module: ${mod.title}`)
    console.log(`   Published: ${mod.isPublished}`)

    // Content
    const publishedContent = mod.course_content.filter(c => c.isPublished).length
    const unpublishedContent = mod.course_content.filter(c => !c.isPublished).length
    console.log(`   Content: ${publishedContent} published, ${unpublishedContent} unpublished`)

    if (unpublishedContent > 0) {
      console.log('   ⚠️ Unpublished content items:')
      for (const c of mod.course_content.filter(c => !c.isPublished)) {
        console.log(`      - ${c.title} (${c.type})`)
      }
    }

    // Assignments
    const publishedAssign = mod.assignments.filter(a => a.isPublished).length
    const unpublishedAssign = mod.assignments.filter(a => !a.isPublished).length
    console.log(`   Assignments: ${publishedAssign} published, ${unpublishedAssign} unpublished`)
  }

  // Also check enrollments
  console.log('\n\n=== Student Enrollments ===\n')
  const enrollments = await prisma.enrollments.findMany({
    where: { courseId: course.id },
    include: {
      users: {
        select: { name: true, email: true, role: true }
      }
    }
  })

  console.log(`Total enrollments: ${enrollments.length}`)
  const students = enrollments.filter(e => e.users.role === 'STUDENT')
  console.log(`Student enrollments: ${students.length}`)
  for (const e of students) {
    console.log(`   - ${e.users.name} (${e.users.email})`)
  }

  console.log('\n=== End of Report ===\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
