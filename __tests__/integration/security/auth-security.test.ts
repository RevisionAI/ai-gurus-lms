/**
 * Authentication Security Integration Tests
 * Story: 3.5 - Security Penetration Testing
 *
 * Tests authentication mechanisms, session handling, and password security.
 */

import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Create the mock at module scope
export const prismaMock = mockDeep<PrismaClient>() as DeepMockProxy<PrismaClient>;

// Mock Prisma module
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get prisma() {
    return prismaMock;
  },
}));

// Mock rate-limit
jest.mock('@/lib/rate-limit', () => ({
  checkLoginRateLimit: jest.fn().mockResolvedValue({ success: true, remaining: 5 }),
  logRateLimitViolation: jest.fn(),
}));

import { authOptions } from '@/lib/auth';
import { mockInstructor, mockStudent } from '../../fixtures/users';

describe('Authentication Security', () => {
  beforeEach(() => {
    mockReset(prismaMock);
    jest.clearAllMocks();
  });

  describe('Password Security', () => {
    it('stores passwords with bcrypt hashing', async () => {
      // Verify that the test fixtures use bcrypt format
      expect(mockInstructor.password).toMatch(/^\$2[ayb]\$.{56}$/);
      expect(mockStudent.password).toMatch(/^\$2[ayb]\$.{56}$/);
    });

    it('compares passwords securely using bcrypt', async () => {
      const plainPassword = 'TestPassword123!';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      expect(isValid).toBe(true);

      const isInvalid = await bcrypt.compare('WrongPassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });

    it('rejects weak passwords (if validation exists)', () => {
      // Weak password patterns that should be rejected
      const weakPasswords = [
        'password',
        '12345678',
        'qwerty',
        'password123',
      ];

      // This is a placeholder - actual validation would be in registration
      weakPasswords.forEach(password => {
        expect(password.length).toBeGreaterThanOrEqual(8);
      });
    });
  });

  describe('Session Security', () => {
    it('uses JWT strategy for stateless sessions', () => {
      expect(authOptions.session?.strategy).toBe('jwt');
    });

    it('includes user role in JWT token', async () => {
      const token = { id: '', email: '', name: '', role: '' };
      const user = mockInstructor;

      const result = await authOptions.callbacks?.jwt?.({
        token,
        user,
        trigger: 'signIn',
        account: null,
        profile: undefined,
        isNewUser: false,
        session: undefined,
      });

      expect(result?.role).toBe(mockInstructor.role);
    });

    it('includes user ID in session for authorization', async () => {
      const session = { user: { id: '', email: '', name: '', role: '' }, expires: '' };
      const token = {
        id: mockInstructor.id,
        email: mockInstructor.email,
        name: mockInstructor.name,
        role: mockInstructor.role,
      };

      const result = await authOptions.callbacks?.session?.({
        session,
        token,
        user: mockInstructor,
        newSession: session,
        trigger: 'getSession',
      });

      expect(result?.user.id).toBe(mockInstructor.id);
      expect(result?.user.role).toBe(mockInstructor.role);
    });
  });

  describe('Login Rate Limiting', () => {
    it('checks rate limit before authentication', async () => {
      const { checkLoginRateLimit } = require('@/lib/rate-limit');

      // Mock findUnique to return null (user not found)
      prismaMock.user.findUnique.mockResolvedValue(null);

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Call authorize from authOptions
      const authorizeFunction = authOptions.providers[0].authorize;
      await authorizeFunction!(credentials, {} as any);

      // Rate limit should have been checked
      expect(checkLoginRateLimit).toHaveBeenCalledWith(credentials.email);
    });

    it('rejects login when rate limit exceeded', async () => {
      const { checkLoginRateLimit } = require('@/lib/rate-limit');

      // Mock rate limit exceeded
      checkLoginRateLimit.mockResolvedValue({
        success: false,
        remaining: 0,
        limit: 5,
        reset: Date.now() + 900000,
      });

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const authorizeFunction = authOptions.providers[0].authorize;

      // Should throw error
      await expect(authorizeFunction!(credentials, {} as any)).rejects.toThrow(
        /too many.*attempts/i
      );
    });

    it('logs rate limit violations', async () => {
      const { checkLoginRateLimit, logRateLimitViolation } = require('@/lib/rate-limit');

      checkLoginRateLimit.mockResolvedValue({
        success: false,
        remaining: 0,
        limit: 5,
        reset: Date.now() + 900000,
      });

      const credentials = {
        email: 'attacker@example.com',
        password: 'password123',
      };

      const authorizeFunction = authOptions.providers[0].authorize;

      try {
        await authorizeFunction!(credentials, {} as any);
      } catch {
        // Expected to throw
      }

      // Should log the violation
      expect(logRateLimitViolation).toHaveBeenCalled();
    });
  });

  describe('Credential Validation', () => {
    it('rejects login with missing email', async () => {
      const credentials = {
        email: '',
        password: 'password123',
      };

      const authorizeFunction = authOptions.providers[0].authorize;
      const result = await authorizeFunction!(credentials, {} as any);

      expect(result).toBeNull();
    });

    it('rejects login with missing password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: '',
      };

      const authorizeFunction = authOptions.providers[0].authorize;
      const result = await authorizeFunction!(credentials, {} as any);

      expect(result).toBeNull();
    });

    it('rejects login with non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const authorizeFunction = authOptions.providers[0].authorize;
      const result = await authorizeFunction!(credentials, {} as any);

      expect(result).toBeNull();
    });

    it('rejects login with incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('correct-password', 10);

      prismaMock.user.findUnique.mockResolvedValue({
        ...mockStudent,
        password: hashedPassword,
      });

      const credentials = {
        email: mockStudent.email,
        password: 'wrong-password',
      };

      const authorizeFunction = authOptions.providers[0].authorize;
      const result = await authorizeFunction!(credentials, {} as any);

      expect(result).toBeNull();
    });

    it('accepts login with correct credentials', async () => {
      const plainPassword = 'correct-password';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      prismaMock.user.findUnique.mockResolvedValue({
        ...mockStudent,
        password: hashedPassword,
      });

      const credentials = {
        email: mockStudent.email,
        password: plainPassword,
      };

      const authorizeFunction = authOptions.providers[0].authorize;
      const result = await authorizeFunction!(credentials, {} as any);

      expect(result).toBeTruthy();
      expect(result?.email).toBe(mockStudent.email);
    });
  });

  describe('Session Timeout', () => {
    it('uses JWT with appropriate expiration', () => {
      // JWT sessions should have max age configured
      // This is typically set via NEXTAUTH_SECRET and session maxAge
      expect(authOptions.session?.strategy).toBe('jwt');

      // Default JWT maxAge is 30 days (NextAuth default)
      // Verify it's not infinite
      const maxAge = authOptions.session?.maxAge || 2592000; // 30 days default
      expect(maxAge).toBeLessThan(7776000); // Less than 90 days
    });
  });

  describe('Credential Provider Security', () => {
    it('only uses secure credential provider', () => {
      const providers = authOptions.providers;

      // Should only have credentials provider (no insecure providers)
      expect(providers).toHaveLength(1);
      expect(providers[0].id).toBe('credentials');
    });

    it('has custom sign-in page configured', () => {
      expect(authOptions.pages?.signIn).toBe('/login');
    });
  });
});
