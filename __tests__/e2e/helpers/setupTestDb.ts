/**
 * Test Database Setup
 *
 * Initialize Prisma client for E2E tests.
 * Uses the same database with test-specific data prefixed with 'e2e-test-'.
 */

import { PrismaClient } from '@prisma/client';

// Create a dedicated Prisma client for E2E tests
const prisma = new PrismaClient({
  log: process.env.DEBUG ? ['query', 'error', 'warn'] : ['error'],
});

export { prisma };

/**
 * Connect to the database
 */
export async function connectTestDb(): Promise<void> {
  await prisma.$connect();
}

/**
 * Disconnect from the database
 */
export async function disconnectTestDb(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Reset test data between tests
 * Only deletes data with 'e2e-test-' prefix to avoid affecting development data
 */
export async function resetTestData(): Promise<void> {
  // Delete in order to respect foreign key constraints
  await prisma.submission.deleteMany({
    where: {
      student: {
        email: { startsWith: 'e2e-test-' },
      },
    },
  });

  await prisma.enrollment.deleteMany({
    where: {
      student: {
        email: { startsWith: 'e2e-test-' },
      },
    },
  });

  await prisma.assignment.deleteMany({
    where: {
      course: {
        code: { startsWith: 'E2E-TEST-' },
      },
    },
  });

  await prisma.content.deleteMany({
    where: {
      course: {
        code: { startsWith: 'E2E-TEST-' },
      },
    },
  });

  await prisma.announcement.deleteMany({
    where: {
      course: {
        code: { startsWith: 'E2E-TEST-' },
      },
    },
  });

  await prisma.discussion.deleteMany({
    where: {
      course: {
        code: { startsWith: 'E2E-TEST-' },
      },
    },
  });

  await prisma.course.deleteMany({
    where: {
      code: { startsWith: 'E2E-TEST-' },
    },
  });

  await prisma.user.deleteMany({
    where: {
      email: { startsWith: 'e2e-test-' },
    },
  });
}
