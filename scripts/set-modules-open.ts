/**
 * Set all modules to Open access (requiresPrevious: false)
 * Run with: TMPDIR=/tmp npx tsx scripts/set-modules-open.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n=== Setting All Modules to Open Access ===\n')

  // Update all modules to requiresPrevious: false
  const result = await prisma.modules.updateMany({
    where: {
      requiresPrevious: true,
    },
    data: {
      requiresPrevious: false,
    },
  })

  console.log(`Updated ${result.count} modules to Open access (requiresPrevious: false)`)

  // Verify the changes
  const modules = await prisma.modules.findMany({
    where: { deletedAt: null },
    include: {
      courses: {
        select: { title: true, code: true }
      }
    },
    orderBy: [{ courseId: 'asc' }, { orderIndex: 'asc' }]
  })

  console.log('\n=== Module Status After Update ===\n')

  let currentCourse = ''
  for (const mod of modules) {
    if (mod.courses.title !== currentCourse) {
      currentCourse = mod.courses.title
      console.log(`\n📚 ${currentCourse} (${mod.courses.code})`)
    }

    const accessIcon = mod.requiresPrevious ? '🔒 Sequential' : '🔓 Open'
    const publishIcon = mod.isPublished ? '✅' : '❌'
    console.log(`   ${publishIcon} ${mod.title} - ${accessIcon}`)
  }

  console.log('\n=== Done ===\n')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
