/**
 * Data Migration Script: Migrate Existing Content to Modules
 * Story 1.3 - Creates default modules for existing courses and assigns content
 *
 * USAGE:
 *   npx tsx prisma/scripts/migrate-to-modules.ts
 *
 * ROLLBACK PROCEDURE:
 *   If you need to rollback this migration, run the following SQL:
 *
 *   -- Step 1: Remove module assignments from all content
 *   UPDATE course_content SET "moduleId" = NULL;
 *   UPDATE assignments SET "moduleId" = NULL;
 *   UPDATE discussions SET "moduleId" = NULL;
 *
 *   -- Step 2: Delete the migrated modules
 *   DELETE FROM modules WHERE description LIKE '%migrated from existing content%';
 *
 *   Or use the rollback script:
 *   npx tsx prisma/scripts/migrate-to-modules.ts --rollback
 */

import { prisma } from '../../src/lib/prisma';
import { randomUUID } from 'crypto';

interface MigrationStats {
  coursesProcessed: number;
  coursesSkipped: number;
  coursesFailed: number;
  modulesCreated: number;
  contentUpdated: number;
  assignmentsUpdated: number;
  discussionsUpdated: number;
}

async function migrateToModules(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    coursesProcessed: 0,
    coursesSkipped: 0,
    coursesFailed: 0,
    modulesCreated: 0,
    contentUpdated: 0,
    assignmentsUpdated: 0,
    discussionsUpdated: 0,
  };

  console.log('='.repeat(60));
  console.log('Data Migration: Migrate Existing Content to Modules');
  console.log('='.repeat(60));
  console.log();

  // Fetch all active courses
  const courses = await prisma.courses.findMany({
    where: { deletedAt: null },
    include: {
      course_content: { where: { deletedAt: null, moduleId: null } },
      assignments: { where: { deletedAt: null, moduleId: null } },
      discussions: { where: { deletedAt: null, moduleId: null } },
      modules: true,
    },
    orderBy: { title: 'asc' },
  });

  console.log(`Found ${courses.length} active courses to process.\n`);

  for (const course of courses) {
    try {
      console.log(`Processing: "${course.title}" (${course.code})`);

      // Idempotency check: Skip if course already has modules
      if (course.modules.length > 0) {
        console.log(`  SKIPPED - Already has ${course.modules.length} module(s)`);
        stats.coursesSkipped++;
        continue;
      }

      // Check if there's any content to migrate
      const hasContent = course.course_content.length > 0;
      const hasAssignments = course.assignments.length > 0;
      const hasDiscussions = course.discussions.length > 0;

      if (!hasContent && !hasAssignments && !hasDiscussions) {
        console.log(`  SKIPPED - No content to migrate`);
        stats.coursesSkipped++;
        continue;
      }

      // Create default "Module 1"
      const defaultModule = await prisma.modules.create({
        data: {
          id: randomUUID(),
          title: 'Module 1',
          description: 'Default module (migrated from existing content)',
          orderIndex: 0,
          isPublished: true,
          requiresPrevious: false,
          courseId: course.id,
          updatedAt: new Date(),
        },
      });
      stats.modulesCreated++;
      console.log(`  Created module: "${defaultModule.title}" (${defaultModule.id})`);

      // Update CourseContent records
      if (hasContent) {
        const contentResult = await prisma.course_content.updateMany({
          where: {
            courseId: course.id,
            moduleId: null,
            deletedAt: null,
          },
          data: {
            moduleId: defaultModule.id,
          },
        });
        stats.contentUpdated += contentResult.count;
        console.log(`  Updated ${contentResult.count} content item(s)`);
      }

      // Update Assignment records
      if (hasAssignments) {
        const assignmentResult = await prisma.assignments.updateMany({
          where: {
            courseId: course.id,
            moduleId: null,
            deletedAt: null,
          },
          data: {
            moduleId: defaultModule.id,
          },
        });
        stats.assignmentsUpdated += assignmentResult.count;
        console.log(`  Updated ${assignmentResult.count} assignment(s)`);
      }

      // Update Discussion records
      if (hasDiscussions) {
        const discussionResult = await prisma.discussions.updateMany({
          where: {
            courseId: course.id,
            moduleId: null,
            deletedAt: null,
          },
          data: {
            moduleId: defaultModule.id,
          },
        });
        stats.discussionsUpdated += discussionResult.count;
        console.log(`  Updated ${discussionResult.count} discussion(s)`);
      }

      stats.coursesProcessed++;
      console.log(`  SUCCESS`);
    } catch (error) {
      stats.coursesFailed++;
      console.error(`  FAILED - Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log();
  }

  return stats;
}

async function rollbackMigration(): Promise<void> {
  console.log('='.repeat(60));
  console.log('ROLLBACK: Removing module assignments and deleting migrated modules');
  console.log('='.repeat(60));
  console.log();

  // Step 1: Remove module assignments from all content
  console.log('Step 1: Removing module assignments from CourseContent...');
  const contentResult = await prisma.course_content.updateMany({
    where: { moduleId: { not: null } },
    data: { moduleId: null },
  });
  console.log(`  Updated ${contentResult.count} content item(s)`);

  console.log('Step 2: Removing module assignments from Assignments...');
  const assignmentResult = await prisma.assignments.updateMany({
    where: { moduleId: { not: null } },
    data: { moduleId: null },
  });
  console.log(`  Updated ${assignmentResult.count} assignment(s)`);

  console.log('Step 3: Removing module assignments from Discussions...');
  const discussionResult = await prisma.discussions.updateMany({
    where: { moduleId: { not: null } },
    data: { moduleId: null },
  });
  console.log(`  Updated ${discussionResult.count} discussion(s)`);

  // Step 2: Delete migrated modules
  console.log('Step 4: Deleting migrated modules...');
  const moduleResult = await prisma.modules.deleteMany({
    where: {
      description: { contains: 'migrated from existing content' },
    },
  });
  console.log(`  Deleted ${moduleResult.count} module(s)`);

  console.log();
  console.log('Rollback complete!');
}

async function main() {
  const args = process.argv.slice(2);
  const isRollback = args.includes('--rollback');

  try {
    if (isRollback) {
      await rollbackMigration();
    } else {
      const stats = await migrateToModules();

      // Print summary
      console.log('='.repeat(60));
      console.log('Migration Summary');
      console.log('='.repeat(60));
      console.log(`Courses processed: ${stats.coursesProcessed}`);
      console.log(`Courses skipped:   ${stats.coursesSkipped}`);
      console.log(`Courses failed:    ${stats.coursesFailed}`);
      console.log('-'.repeat(30));
      console.log(`Modules created:   ${stats.modulesCreated}`);
      console.log(`Content updated:   ${stats.contentUpdated}`);
      console.log(`Assignments:       ${stats.assignmentsUpdated}`);
      console.log(`Discussions:       ${stats.discussionsUpdated}`);
      console.log('='.repeat(60));

      if (stats.coursesFailed > 0) {
        console.log('\nWARNING: Some courses failed to migrate. Review errors above.');
        process.exit(1);
      } else {
        console.log('\nMigration completed successfully!');
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
