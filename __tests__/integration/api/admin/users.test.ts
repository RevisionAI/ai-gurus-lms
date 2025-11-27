/**
 * Admin User Management API Tests
 *
 * Integration tests for the admin user management endpoints:
 * - GET /api/admin/users - List users
 * - POST /api/admin/users - Create user
 * - GET /api/admin/users/[id] - Get single user
 * - PUT /api/admin/users/[id] - Update user
 * - DELETE /api/admin/users/[id] - Soft delete user
 * - POST /api/admin/users/[id]/reset-password - Reset password
 * - GET /api/admin/users/[id]/activity - Get user activity
 *
 * Story: 2.5 - Admin Dashboard User Management
 */

import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended'
import { PrismaClient } from '@prisma/client'

// Create the mock at module scope
export const prismaMock = mockDeep<PrismaClient>() as DeepMockProxy<PrismaClient>

// Mock Prisma module
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get prisma() {
    return prismaMock
  },
}))

// Mock rate-limit before importing routes
jest.mock('@/lib/rate-limit', () => ({
  applyUserRateLimit: jest.fn().mockResolvedValue(null),
  rateLimit: {
    limit: jest.fn().mockResolvedValue({ success: true, remaining: 100 }),
  },
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}))

// Mock next-auth before importing routes
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$mockedhashedpassword'),
  compare: jest.fn().mockResolvedValue(true),
}))

// Mock next/server before importing routes
jest.mock('next/server', () => {
  return {
    NextRequest: class MockNextRequest {
      url: string
      method: string
      headers: Map<string, string>
      private _body: string | null

      constructor(
        url: string,
        init?: { method?: string; headers?: Record<string, string>; body?: string }
      ) {
        this.url = url
        this.method = init?.method || 'GET'
        this.headers = new Map(Object.entries(init?.headers || {}))
        this._body = init?.body || null
      }

      async json() {
        return this._body ? JSON.parse(this._body) : {}
      }
    },
    NextResponse: {
      json: (data: unknown, init?: { status?: number }) => ({
        json: async () => data,
        status: init?.status || 200,
      }),
    },
  }
})

// Now import route handlers and fixtures
import { GET as listUsers, POST as createUser } from '@/app/api/admin/users/route'
import {
  GET as getUser,
  PUT as updateUser,
  DELETE as deleteUser,
} from '@/app/api/admin/users/[id]/route'
import { POST as resetPassword } from '@/app/api/admin/users/[id]/reset-password/route'
import { GET as getActivity } from '@/app/api/admin/users/[id]/activity/route'
import { mockAdmin, mockStudent, mockInstructor, createMockUser } from '../../../fixtures/users'
import { getServerSession } from 'next-auth'

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

// Reset function for prismaMock
function resetPrismaMock() {
  mockReset(prismaMock)
}

// Helper to create a mock request
function createRequest(
  url: string,
  options: { method?: string; body?: unknown } = {}
) {
  const { NextRequest } = jest.requireMock('next/server')
  return new NextRequest(url, {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
}

// Admin session for tests
const adminSession = {
  user: {
    id: mockAdmin.id,
    email: mockAdmin.email,
    name: mockAdmin.name,
    role: 'ADMIN',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

describe('Admin User Management API', () => {
  beforeEach(() => {
    resetPrismaMock()
    jest.clearAllMocks()
    // Default to admin session
    mockGetServerSession.mockResolvedValue(adminSession)
  })

  describe('GET /api/admin/users (List Users)', () => {
    it('should return 403 if not admin', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { ...adminSession.user, role: 'STUDENT' },
        expires: adminSession.expires,
      })

      const request = createRequest('http://localhost/api/admin/users')
      const response = await listUsers(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error.code).toBe('FORBIDDEN')
    })

    it('should return 403 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = createRequest('http://localhost/api/admin/users')
      const response = await listUsers(request)

      expect(response.status).toBe(403)
    })

    it('should return paginated users for admin', async () => {
      prismaMock.user.count.mockResolvedValue(1)
      prismaMock.user.findMany.mockResolvedValue([mockStudent])

      const request = createRequest('http://localhost/api/admin/users?page=1&limit=10')
      const response = await listUsers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toBeDefined()
      expect(data.meta).toBeDefined()
      expect(data.meta.page).toBe(1)
      expect(data.meta.pageSize).toBe(10)
    })

    it('should filter users by role', async () => {
      prismaMock.user.count.mockResolvedValue(1)
      prismaMock.user.findMany.mockResolvedValue([mockStudent])

      const request = createRequest('http://localhost/api/admin/users?role=STUDENT')
      const response = await listUsers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: 'STUDENT',
          }),
        })
      )
    })

    it('should filter users by search term', async () => {
      prismaMock.user.count.mockResolvedValue(1)
      prismaMock.user.findMany.mockResolvedValue([mockStudent])

      const request = createRequest('http://localhost/api/admin/users?search=student')
      const response = await listUsers(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      )
    })
  })

  describe('POST /api/admin/users (Create User)', () => {
    it('should return 403 if not admin', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { ...adminSession.user, role: 'INSTRUCTOR' },
        expires: adminSession.expires,
      })

      const request = createRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: { name: 'Test', email: 'newuser@test.com', role: 'STUDENT' },
      })
      const response = await createUser(request)

      expect(response.status).toBe(403)
    })

    it('should create a new user', async () => {
      const newUser = createMockUser({
        id: 'new-user-id',
        email: 'newuser@test.com',
        name: 'New User',
        role: 'STUDENT',
      })

      prismaMock.user.findUnique.mockResolvedValue(null) // No existing user
      prismaMock.user.create.mockResolvedValue(newUser)

      const request = createRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: { name: 'New User', email: 'newuser@test.com', role: 'STUDENT' },
      })
      const response = await createUser(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.email).toBe('newuser@test.com')
      expect(data.data.name).toBe('New User')
      expect(data.data.role).toBe('STUDENT')
    })

    it('should return 409 for duplicate email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockStudent) // Email exists

      const request = createRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: { name: 'Dup User', email: mockStudent.email, role: 'STUDENT' },
      })
      const response = await createUser(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error.code).toBe('DUPLICATE_EMAIL')
    })

    it('should return 400 for invalid input', async () => {
      const request = createRequest('http://localhost/api/admin/users', {
        method: 'POST',
        body: { name: '', email: 'invalid', role: 'INVALID' },
      })
      const response = await createUser(request)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/admin/users/[id] (Get Single User)', () => {
    it('should return user details', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockStudent)

      const request = createRequest(`http://localhost/api/admin/users/${mockStudent.id}`)
      const response = await getUser(request, {
        params: Promise.resolve({ id: mockStudent.id }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.id).toBe(mockStudent.id)
      expect(data.data.email).toBe(mockStudent.email)
    })

    it('should return 404 for non-existent user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null)

      const request = createRequest('http://localhost/api/admin/users/non-existent-id')
      const response = await getUser(request, {
        params: Promise.resolve({ id: 'non-existent-id' }),
      })

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/admin/users/[id] (Update User)', () => {
    it('should update user name', async () => {
      const updatedUser = { ...mockStudent, name: 'Updated Name' }
      prismaMock.user.findFirst.mockResolvedValue(mockStudent)
      prismaMock.user.update.mockResolvedValue(updatedUser)

      const request = createRequest(`http://localhost/api/admin/users/${mockStudent.id}`, {
        method: 'PUT',
        body: { name: 'Updated Name' },
      })
      const response = await updateUser(request, {
        params: Promise.resolve({ id: mockStudent.id }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.name).toBe('Updated Name')
    })

    it('should update user role', async () => {
      const updatedUser = { ...mockStudent, role: 'INSTRUCTOR' as const }
      prismaMock.user.findFirst.mockResolvedValue(mockStudent)
      prismaMock.user.update.mockResolvedValue(updatedUser)

      const request = createRequest(`http://localhost/api/admin/users/${mockStudent.id}`, {
        method: 'PUT',
        body: { role: 'INSTRUCTOR' },
      })
      const response = await updateUser(request, {
        params: Promise.resolve({ id: mockStudent.id }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.role).toBe('INSTRUCTOR')
    })

    it('should return 404 for non-existent user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null)

      const request = createRequest('http://localhost/api/admin/users/non-existent-id', {
        method: 'PUT',
        body: { name: 'Test' },
      })
      const response = await updateUser(request, {
        params: Promise.resolve({ id: 'non-existent-id' }),
      })

      expect(response.status).toBe(404)
    })

    it('should prevent removing last admin', async () => {
      const lastAdmin = { ...mockAdmin, id: 'last-admin-id' }
      prismaMock.user.findFirst.mockResolvedValue(lastAdmin)
      prismaMock.user.count.mockResolvedValue(0) // No other admins

      const request = createRequest(`http://localhost/api/admin/users/${lastAdmin.id}`, {
        method: 'PUT',
        body: { role: 'STUDENT' },
      })
      const response = await updateUser(request, {
        params: Promise.resolve({ id: lastAdmin.id }),
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('LAST_ADMIN')
    })
  })

  describe('DELETE /api/admin/users/[id] (Soft Delete User)', () => {
    it('should soft delete a user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockStudent)
      prismaMock.user.update.mockResolvedValue({
        ...mockStudent,
        deletedAt: new Date(),
      })

      const request = createRequest(`http://localhost/api/admin/users/${mockStudent.id}`, {
        method: 'DELETE',
      })
      const response = await deleteUser(request, {
        params: Promise.resolve({ id: mockStudent.id }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.deleted).toBe(true)
    })

    it('should prevent self-deletion', async () => {
      // Set the admin session to match the user being deleted
      mockGetServerSession.mockResolvedValue({
        user: { ...adminSession.user, id: mockStudent.id },
        expires: adminSession.expires,
      })

      prismaMock.user.findFirst.mockResolvedValue({ ...mockStudent, role: 'ADMIN' as const })

      const request = createRequest(`http://localhost/api/admin/users/${mockStudent.id}`, {
        method: 'DELETE',
      })
      const response = await deleteUser(request, {
        params: Promise.resolve({ id: mockStudent.id }),
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error.code).toBe('SELF_DELETION')
    })

    it('should return 404 for non-existent user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null)

      const request = createRequest('http://localhost/api/admin/users/non-existent-id', {
        method: 'DELETE',
      })
      const response = await deleteUser(request, {
        params: Promise.resolve({ id: 'non-existent-id' }),
      })

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/admin/users/[id]/reset-password', () => {
    it('should reset user password and return new password', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockStudent)
      prismaMock.user.update.mockResolvedValue(mockStudent)

      const request = createRequest(
        `http://localhost/api/admin/users/${mockStudent.id}/reset-password`,
        { method: 'POST' }
      )
      const response = await resetPassword(request, {
        params: Promise.resolve({ id: mockStudent.id }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.newPassword).toBeDefined()
      expect(typeof data.data.newPassword).toBe('string')
    })

    it('should return 404 for non-existent user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null)

      const request = createRequest(
        'http://localhost/api/admin/users/non-existent-id/reset-password',
        { method: 'POST' }
      )
      const response = await resetPassword(request, {
        params: Promise.resolve({ id: 'non-existent-id' }),
      })

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/admin/users/[id]/activity', () => {
    it('should return user activity', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockStudent)
      prismaMock.enrollment.findMany.mockResolvedValue([])
      prismaMock.submission.findMany.mockResolvedValue([])
      prismaMock.grade.findMany.mockResolvedValue([])

      const request = createRequest(
        `http://localhost/api/admin/users/${mockStudent.id}/activity`
      )
      const response = await getActivity(request, {
        params: Promise.resolve({ id: mockStudent.id }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toBeDefined()
      expect(data.meta).toBeDefined()
    })

    it('should return 404 for non-existent user', async () => {
      prismaMock.user.findFirst.mockResolvedValue(null)

      const request = createRequest(
        'http://localhost/api/admin/users/non-existent-id/activity'
      )
      const response = await getActivity(request, {
        params: Promise.resolve({ id: 'non-existent-id' }),
      })

      expect(response.status).toBe(404)
    })

    it('should paginate activity results', async () => {
      prismaMock.user.findFirst.mockResolvedValue(mockStudent)
      prismaMock.enrollment.findMany.mockResolvedValue([])
      prismaMock.submission.findMany.mockResolvedValue([])
      prismaMock.grade.findMany.mockResolvedValue([])

      const request = createRequest(
        `http://localhost/api/admin/users/${mockStudent.id}/activity?page=1&limit=5`
      )
      const response = await getActivity(request, {
        params: Promise.resolve({ id: mockStudent.id }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.meta.page).toBe(1)
      expect(data.meta.pageSize).toBe(5)
    })
  })
})
