/**
 * Quick check script to verify migration status
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMigrationStatus() {
  try {
    const moduleCount = await prisma.modules.count();
    const coursesWithModules = await prisma.courses.count({
      where: { modules: { some: {} } }
    });
    const totalCourses = await prisma.courses.count({ where: { deletedAt: null } });

    const contentWithModules = await prisma.course_content.count({
      where: { moduleId: { not: null } }
    });
    const assignmentsWithModules = await prisma.assignments.count({
      where: { moduleId: { not: null } }
    });
    const discussionsWithModules = await prisma.discussions.count({
      where: { moduleId: { not: null } }
    });

    console.log('Migration Status Check');
    console.log('='.repeat(40));
    console.log(`Total modules: ${moduleCount}`);
    console.log(`Courses with modules: ${coursesWithModules}/${totalCourses}`);
    console.log(`Content with moduleId: ${contentWithModules}`);
    console.log(`Assignments with moduleId: ${assignmentsWithModules}`);
    console.log(`Discussions with moduleId: ${discussionsWithModules}`);
  } catch (error) {
    console.error('Error checking status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrationStatus();
