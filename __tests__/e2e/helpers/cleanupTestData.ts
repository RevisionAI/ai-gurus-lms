/**
 * Test Data Cleanup Script
 *
 * Removes all test data from the database after E2E tests complete.
 */

import { prisma, resetTestData, disconnectTestDb } from './setupTestDb';

/**
 * Cleanup all test data from the database
 */
export async function cleanupTestData(): Promise<void> {
  try {
    await resetTestData();
  } finally {
    await disconnectTestDb();
  }
}

/**
 * Emergency cleanup - force delete all test data
 * Use when standard cleanup fails
 */
export async function forceCleanup(): Promise<void> {
  try {
    // Delete in reverse order of creation to respect FK constraints
    await prisma.$executeRaw`DELETE FROM "Submission" WHERE "studentId" IN (SELECT id FROM "User" WHERE email LIKE 'e2e-test-%')`;
    await prisma.$executeRaw`DELETE FROM "Enrollment" WHERE "studentId" IN (SELECT id FROM "User" WHERE email LIKE 'e2e-test-%')`;
    await prisma.$executeRaw`DELETE FROM "Assignment" WHERE "courseId" IN (SELECT id FROM "Course" WHERE code LIKE 'E2E-TEST-%')`;
    await prisma.$executeRaw`DELETE FROM "Content" WHERE "courseId" IN (SELECT id FROM "Course" WHERE code LIKE 'E2E-TEST-%')`;
    await prisma.$executeRaw`DELETE FROM "Announcement" WHERE "courseId" IN (SELECT id FROM "Course" WHERE code LIKE 'E2E-TEST-%')`;
    await prisma.$executeRaw`DELETE FROM "Discussion" WHERE "courseId" IN (SELECT id FROM "Course" WHERE code LIKE 'E2E-TEST-%')`;
    await prisma.$executeRaw`DELETE FROM "Course" WHERE code LIKE 'E2E-TEST-%'`;
    await prisma.$executeRaw`DELETE FROM "User" WHERE email LIKE 'e2e-test-%'`;
  } finally {
    await disconnectTestDb();
  }
}
