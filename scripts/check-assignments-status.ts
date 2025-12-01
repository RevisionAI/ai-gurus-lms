/**
 * Check assignment publish status
 * Run with: TMPDIR=/tmp npx tsx scripts/check-assignments-status.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n=== Assignment Publish Status ===\n')

  const courses = await prisma.courses.findMany({
    where: { deletedAt: null },
    include: {
      modules: {
        where: { deletedAt: null },
        orderBy: { orderIndex: 'asc' },
        include: {
          assignments: {
            where: { deletedAt: null },
            select: {
              id: true,
              title: true,
              isPublished: true,
              dueDate: true,
            }
          }
        }
      }
    }
  })

  for (const course of courses) {
    const hasAssignments = course.modules.some(m => m.assignments.length > 0)
    if (!hasAssignments) continue

    console.log(`\n📚 ${course.title} (${course.code})`)

    for (const mod of course.modules) {
      if (mod.assignments.length === 0) continue

      const modStatus = mod.isPublished ? '✅' : '❌'
      console.log(`\n   ${modStatus} Module: ${mod.title}`)

      for (const assign of mod.assignments) {
        const status = assign.isPublished ? '✅ PUBLISHED' : '❌ DRAFT'
        console.log(`      ${status} - ${assign.title}`)
      }
    }
  }

  // Summary of unpublished assignments
  const unpublished = await prisma.assignments.findMany({
    where: {
      isPublished: false,
      deletedAt: null,
    },
    include: {
      modules: { select: { title: true } },
      courses: { select: { title: true, code: true } }
    }
  })

  if (unpublished.length > 0) {
    console.log('\n\n⚠️  UNPUBLISHED ASSIGNMENTS (students cannot see these):')
    for (const a of unpublished) {
      console.log(`   - "${a.title}" in ${a.modules?.title || 'No module'} (${a.courses.code})`)
    }
  }

  console.log('\n=== End ===\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
