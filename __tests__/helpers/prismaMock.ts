/**
 * Prisma Client Mock
 *
 * Provides a type-safe mock of the Prisma client for isolated database testing.
 * Uses jest-mock-extended for deep mocking capabilities.
 */

import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Export the mock type for use in tests
export type MockPrismaClient = DeepMockProxy<PrismaClient>;

// Create a singleton mock instance
export const prismaMock = mockDeep<PrismaClient>();

// Reset function to clean up mocks between tests
export function resetPrismaMock(): void {
  mockReset(prismaMock);
}

// Mock the prisma module to return our mock instance
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: prismaMock,
  default: prismaMock,
}));

// Also export for convenience
export default prismaMock;
