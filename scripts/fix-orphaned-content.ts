/**
 * Script to associate orphaned content with the Week 1 module
 *
 * Run with: npx tsx scripts/fix-orphaned-content.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Finding orphaned content (content without moduleId)...\n')

  // Find all content without a moduleId
  const orphanedContent = await prisma.course_content.findMany({
    where: {
      moduleId: null,
      deletedAt: null,
    },
    include: {
      courses: {
        select: {
          id: true,
          title: true,
          code: true,
        },
      },
    },
  })

  if (orphanedContent.length === 0) {
    console.log('No orphaned content found!')
    return
  }

  console.log(`Found ${orphanedContent.length} orphaned content item(s):\n`)

  // Group by course
  const byCourse = new Map<string, typeof orphanedContent>()
  for (const content of orphanedContent) {
    const courseId = content.courseId
    if (!byCourse.has(courseId)) {
      byCourse.set(courseId, [])
    }
    byCourse.get(courseId)!.push(content)
  }

  // Process each course
  for (const [courseId, contentItems] of byCourse) {
    const course = contentItems[0].courses
    console.log(`\nCourse: ${course?.title} (${course?.code})`)
    console.log(`  Orphaned content: ${contentItems.length} items`)

    // Find Week 1 module for this course
    const week1Module = await prisma.modules.findFirst({
      where: {
        courseId: courseId,
        title: {
          contains: 'Week 1',
          mode: 'insensitive',
        },
        deletedAt: null,
      },
    })

    if (!week1Module) {
      // Try to find the first module if "Week 1" doesn't exist
      const firstModule = await prisma.modules.findFirst({
        where: {
          courseId: courseId,
          deletedAt: null,
        },
        orderBy: {
          orderIndex: 'asc',
        },
      })

      if (!firstModule) {
        console.log(`  ⚠️  No modules found for this course. Skipping.`)
        continue
      }

      console.log(`  📦 No "Week 1" module found. Using first module: "${firstModule.title}"`)

      // Update content to use first module
      const result = await prisma.course_content.updateMany({
        where: {
          id: {
            in: contentItems.map((c) => c.id),
          },
        },
        data: {
          moduleId: firstModule.id,
        },
      })

      console.log(`  ✅ Updated ${result.count} content items to module "${firstModule.title}"`)
    } else {
      console.log(`  📦 Found module: "${week1Module.title}"`)

      // Update content to use Week 1 module
      const result = await prisma.course_content.updateMany({
        where: {
          id: {
            in: contentItems.map((c) => c.id),
          },
        },
        data: {
          moduleId: week1Module.id,
        },
      })

      console.log(`  ✅ Updated ${result.count} content items to module "${week1Module.title}"`)
    }

    // List the content items
    console.log(`  Content items:`)
    for (const content of contentItems) {
      console.log(`    - ${content.title} (${content.type})`)
    }
  }

  console.log('\n✅ Done!')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
