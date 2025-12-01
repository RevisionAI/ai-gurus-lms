/**
 * Diagnostic script to check module publish status
 * Run with: npx tsx scripts/check-module-publish-status.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n=== Module Publish Status Check ===\n')

  // Get all courses with their modules
  const courses = await prisma.courses.findMany({
    where: { deletedAt: null },
    include: {
      modules: {
        where: { deletedAt: null },
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          title: true,
          orderIndex: true,
          isPublished: true,
          requiresPrevious: true,
          _count: {
            select: {
              course_content: { where: { deletedAt: null } },
              assignments: { where: { deletedAt: null } },
            }
          }
        }
      }
    }
  })

  for (const course of courses) {
    console.log(`\n📚 Course: ${course.title} (${course.code})`)
    console.log(`   ID: ${course.id}`)
    console.log(`   Modules: ${course.modules.length}`)

    if (course.modules.length === 0) {
      console.log('   (No modules)')
      continue
    }

    console.log('\n   Modules:')
    for (const mod of course.modules) {
      const publishStatus = mod.isPublished ? '✅ PUBLISHED' : '❌ DRAFT'
      const lockStatus = mod.requiresPrevious ? '🔒 Sequential' : '🔓 Open'
      console.log(`   ${mod.orderIndex + 1}. ${mod.title}`)
      console.log(`      Status: ${publishStatus}`)
      console.log(`      Access: ${lockStatus}`)
      console.log(`      Content: ${mod._count.course_content} items, ${mod._count.assignments} assignments`)
      console.log(`      ID: ${mod.id}`)
    }
  }

  // Check for any modules that might have issues
  const unpublishedModules = await prisma.modules.findMany({
    where: {
      isPublished: false,
      deletedAt: null,
    },
    include: {
      courses: {
        select: { title: true, code: true }
      }
    }
  })

  if (unpublishedModules.length > 0) {
    console.log('\n\n⚠️  UNPUBLISHED MODULES (students cannot see these):')
    for (const mod of unpublishedModules) {
      console.log(`   - "${mod.title}" in ${mod.courses.title} (${mod.courses.code})`)
    }
  }

  console.log('\n=== End of Report ===\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
