/**
 * Fix Week 2 Assignment - publish it and link to Week 2 module
 * Run with: TMPDIR=/tmp npx tsx scripts/fix-week2-assignment.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n=== Fixing Week 2 Assignment ===\n')

  // Find Week 2 module in AI Fluency 2025
  const week2Module = await prisma.modules.findFirst({
    where: {
      title: 'Week 2',
      courses: { code: 'AIF-2025' },
      deletedAt: null,
    }
  })

  if (!week2Module) {
    console.log('❌ Week 2 module not found!')
    return
  }

  console.log(`✅ Found Week 2 module: ${week2Module.id}`)

  // Find the unpublished assignment
  const assignment = await prisma.assignments.findFirst({
    where: {
      title: { contains: 'Week 2' },
      courses: { code: 'AIF-2025' },
      deletedAt: null,
    }
  })

  if (!assignment) {
    console.log('❌ Week 2 Assignment not found!')
    return
  }

  console.log(`✅ Found assignment: ${assignment.title}`)
  console.log(`   Current isPublished: ${assignment.isPublished}`)
  console.log(`   Current moduleId: ${assignment.moduleId || 'NULL'}`)

  // Update the assignment
  const updated = await prisma.assignments.update({
    where: { id: assignment.id },
    data: {
      isPublished: true,
      moduleId: week2Module.id,
    }
  })

  console.log('\n✅ Assignment updated!')
  console.log(`   isPublished: ${updated.isPublished}`)
  console.log(`   moduleId: ${updated.moduleId}`)

  console.log('\n=== Done ===\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
