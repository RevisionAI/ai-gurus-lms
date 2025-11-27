/**
 * Admin Statistics API Integration Tests
 *
 * Integration tests for the admin dashboard statistics endpoint:
 * - GET /api/admin/stats/detailed
 *
 * Story: 2-6-admin-dashboard-system-statistics-monitoring
 * AC: 2.6.1-2.6.11
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

// Mock Redis module
jest.mock('@/lib/redis', () => ({
  getCached: jest.fn().mockResolvedValue(null),
  setCached: jest.fn().mockResolvedValue(undefined),
  invalidateAdminStats: jest.fn().mockResolvedValue(undefined),
  CACHE_KEYS: { ADMIN_STATS_DETAILED: 'admin:stats:detailed' },
  getStatsCacheTTL: jest.fn().mockReturnValue(300),
}))

// Mock rate-limit
jest.mock('@/lib/rate-limit', () => ({
  applyUserRateLimit: jest.fn().mockResolvedValue(null),
}))

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock next/server
jest.mock('next/server', () => {
  return {
    NextRequest: class MockNextRequest {
      url: string
      method: string
      headers: Map<string, string>

      constructor(url: string, init?: { method?: string; headers?: Record<string, string> }) {
        this.url = url
        this.method = init?.method || 'GET'
        this.headers = new Map(Object.entries(init?.headers || {}))
      }
    },
    NextResponse: {
      json: (data: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
        json: async () => data,
        status: init?.status || 200,
        headers: init?.headers || {},
      }),
    },
  }
})

// Import after mocks
import { GET } from '@/app/api/admin/stats/detailed/route'
import { getServerSession } from 'next-auth'
import { getCached } from '@/lib/redis'

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockGetCached = getCached as jest.MockedFunction<typeof getCached>

// Admin session for tests
const adminSession = {
  user: {
    id: 'admin-1',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'ADMIN',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

// Student session for tests
const studentSession = {
  user: {
    id: 'student-1',
    email: 'student@test.com',
    name: 'Student User',
    role: 'STUDENT',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
}

describe('Admin Statistics API', () => {
  beforeEach(() => {
    mockReset(prismaMock)
    jest.clearAllMocks()
    mockGetServerSession.mockResolvedValue(adminSession)
    mockGetCached.mockResolvedValue(null)
  })

  describe('GET /api/admin/stats/detailed', () => {
    describe('Authorization', () => {
      it('should return 401 if not authenticated', async () => {
        mockGetServerSession.mockResolvedValue(null)

        const response = await GET()
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Unauthorized')
        expect(data.code).toBe('UNAUTHORIZED')
      })

      it('should return 403 if not admin', async () => {
        mockGetServerSession.mockResolvedValue(studentSession)

        const response = await GET()
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.error).toBe('Forbidden - Admin access required')
        expect(data.code).toBe('FORBIDDEN')
      })

      it('should return 200 for admin user', async () => {
        // Setup mock responses
        prismaMock.user.groupBy.mockResolvedValue([
          { role: 'STUDENT', _count: 10 },
          { role: 'INSTRUCTOR', _count: 3 },
          { role: 'ADMIN', _count: 1 },
        ] as any)
        prismaMock.course.groupBy.mockResolvedValue([
          { isActive: true, _count: 5 },
          { isActive: false, _count: 2 },
        ] as any)
        prismaMock.enrollment.count.mockResolvedValue(20)
        prismaMock.assignment.count.mockResolvedValue(15)
        prismaMock.submission.count.mockResolvedValue(50)
        prismaMock.discussion.count.mockResolvedValue(8)
        prismaMock.discussionPost.count.mockResolvedValue(25)
        prismaMock.user.count.mockResolvedValue(5) // Recent logins
        prismaMock.$queryRaw.mockResolvedValue([]) // Enrollments over time
        prismaMock.course.findMany.mockResolvedValue([]) // Completion rates

        const response = await GET()

        expect(response.status).toBe(200)
      })
    })

    describe('Response Structure', () => {
      beforeEach(() => {
        // Setup default mock responses
        // Note: groupBy returns _count as just a number when using _count: true
        prismaMock.user.groupBy.mockResolvedValue([
          { role: 'STUDENT', _count: 50 },
          { role: 'INSTRUCTOR', _count: 10 },
          { role: 'ADMIN', _count: 3 },
        ] as any)
        prismaMock.course.groupBy.mockResolvedValue([
          { isActive: true, _count: 15 },
          { isActive: false, _count: 5 },
        ] as any)
        prismaMock.enrollment.count.mockResolvedValue(200)
        prismaMock.assignment.count.mockResolvedValue(30)
        prismaMock.submission.count.mockResolvedValue(150)
        prismaMock.discussion.count.mockResolvedValue(20)
        prismaMock.discussionPost.count.mockResolvedValue(100)
        prismaMock.user.count.mockResolvedValue(25) // Recent logins
        prismaMock.$queryRaw.mockResolvedValue([
          { date: new Date('2025-11-25'), count: BigInt(5) },
          { date: new Date('2025-11-26'), count: BigInt(8) },
        ])
        prismaMock.course.findMany.mockResolvedValue([
          {
            id: 'course-1',
            title: 'Course 1',
            _count: { enrollments: 10, assignments: 5 },
            assignments: [
              { _count: { grades: 35 } },
              { _count: { grades: 30 } },
            ],
          },
        ] as any)
      })

      it('should return users object with role breakdown', async () => {
        const response = await GET()
        const data = await response.json()

        expect(data.users).toBeDefined()
        expect(typeof data.users.total).toBe('number')
        expect(typeof data.users.students).toBe('number')
        expect(typeof data.users.instructors).toBe('number')
        expect(typeof data.users.admins).toBe('number')
      })

      it('should return courses object with active/inactive counts', async () => {
        const response = await GET()
        const data = await response.json()

        expect(data.courses).toBeDefined()
        expect(typeof data.courses.total).toBe('number')
        expect(typeof data.courses.active).toBe('number')
        expect(typeof data.courses.inactive).toBe('number')
      })

      it('should return enrollment count', async () => {
        const response = await GET()
        const data = await response.json()

        expect(typeof data.enrollments).toBe('number')
      })

      it('should return assignments object', async () => {
        const response = await GET()
        const data = await response.json()

        expect(data.assignments).toBeDefined()
        expect(typeof data.assignments.total).toBe('number')
        expect(typeof data.assignments.submissions).toBe('number')
      })

      it('should return discussions object', async () => {
        const response = await GET()
        const data = await response.json()

        expect(data.discussions).toBeDefined()
        expect(typeof data.discussions.total).toBe('number')
        expect(typeof data.discussions.posts).toBe('number')
      })

      it('should return recentActivity object with timestamp', async () => {
        const response = await GET()
        const data = await response.json()

        expect(data.recentActivity).toBeDefined()
        expect(typeof data.recentActivity.logins).toBe('number')
        expect(typeof data.recentActivity.enrollments).toBe('number')
        expect(typeof data.recentActivity.submissions).toBe('number')
        expect(typeof data.recentActivity.timestamp).toBe('string')
      })

      it('should return systemHealth object', async () => {
        const response = await GET()
        const data = await response.json()

        expect(data.systemHealth).toBeDefined()
        expect(['healthy', 'degraded', 'down']).toContain(data.systemHealth.database)
        expect(['healthy', 'degraded', 'down']).toContain(data.systemHealth.storage)
        expect(typeof data.systemHealth.lastChecked).toBe('string')
      })

      it('should return enrollmentsOverTime array', async () => {
        const response = await GET()
        const data = await response.json()

        expect(Array.isArray(data.enrollmentsOverTime)).toBe(true)
      })

      it('should return completionRates array', async () => {
        const response = await GET()
        const data = await response.json()

        expect(Array.isArray(data.completionRates)).toBe(true)
      })
    })

    describe('Caching Behavior', () => {
      it('should return cached data when available', async () => {
        const cachedStats = {
          users: { total: 100, students: 80, instructors: 15, admins: 5 },
          courses: { total: 20, active: 15, inactive: 5 },
          enrollments: 200,
          assignments: { total: 30, submissions: 150 },
          discussions: { total: 20, posts: 100 },
          recentActivity: {
            logins: 25,
            enrollments: 10,
            submissions: 50,
            timestamp: '2025-11-26T10:00:00Z',
          },
          systemHealth: {
            database: 'healthy',
            storage: 'healthy',
            lastChecked: '2025-11-26T10:00:00Z',
          },
          enrollmentsOverTime: [],
          completionRates: [],
        }

        mockGetCached.mockResolvedValue(cachedStats)

        const response = await GET()
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.users.total).toBe(100)

        // Verify no database calls were made when cache hit
        expect(prismaMock.user.groupBy).not.toHaveBeenCalled()
      })

      it('should set X-Cache header to HIT for cached response', async () => {
        const cachedStats = {
          users: { total: 100, students: 80, instructors: 15, admins: 5 },
          courses: { total: 20, active: 15, inactive: 5 },
          enrollments: 200,
          assignments: { total: 30, submissions: 150 },
          discussions: { total: 20, posts: 100 },
          recentActivity: {
            logins: 25,
            enrollments: 10,
            submissions: 50,
            timestamp: '2025-11-26T10:00:00Z',
          },
          systemHealth: {
            database: 'healthy',
            storage: 'healthy',
            lastChecked: '2025-11-26T10:00:00Z',
          },
          enrollmentsOverTime: [],
          completionRates: [],
        }

        mockGetCached.mockResolvedValue(cachedStats)

        const response = await GET()

        expect(response.headers).toHaveProperty('X-Cache', 'HIT')
      })

      it('should query database when cache misses', async () => {
        mockGetCached.mockResolvedValue(null)

        // Setup mock responses
        prismaMock.user.groupBy.mockResolvedValue([
          { role: 'STUDENT', _count: { _all: 10 } },
        ] as any)
        prismaMock.course.groupBy.mockResolvedValue([
          { isActive: true, _count: { _all: 5 } },
        ] as any)
        prismaMock.enrollment.count.mockResolvedValue(20)
        prismaMock.assignment.count.mockResolvedValue(15)
        prismaMock.submission.count.mockResolvedValue(50)
        prismaMock.discussion.count.mockResolvedValue(8)
        prismaMock.discussionPost.count.mockResolvedValue(25)
        prismaMock.user.count.mockResolvedValue(5)
        prismaMock.$queryRaw.mockResolvedValue([])
        prismaMock.course.findMany.mockResolvedValue([])

        const response = await GET()

        expect(response.status).toBe(200)
        expect(prismaMock.user.groupBy).toHaveBeenCalled()
      })

      it('should set X-Cache header to MISS when querying database', async () => {
        mockGetCached.mockResolvedValue(null)

        // Setup mock responses
        prismaMock.user.groupBy.mockResolvedValue([{ role: 'STUDENT', _count: 10 }] as any)
        prismaMock.course.groupBy.mockResolvedValue([{ isActive: true, _count: 5 }] as any)
        prismaMock.enrollment.count.mockResolvedValue(20)
        prismaMock.assignment.count.mockResolvedValue(15)
        prismaMock.submission.count.mockResolvedValue(50)
        prismaMock.discussion.count.mockResolvedValue(8)
        prismaMock.discussionPost.count.mockResolvedValue(25)
        prismaMock.user.count.mockResolvedValue(5)
        prismaMock.$queryRaw.mockResolvedValue([])
        prismaMock.course.findMany.mockResolvedValue([])

        const response = await GET()

        expect(response.headers).toHaveProperty('X-Cache', 'MISS')
      })
    })

    describe('Soft Delete Filtering', () => {
      beforeEach(() => {
        mockGetCached.mockResolvedValue(null)
        prismaMock.$queryRaw.mockResolvedValue([])
        prismaMock.course.findMany.mockResolvedValue([])
      })

      it('should filter users by deletedAt: null', async () => {
        prismaMock.user.groupBy.mockResolvedValue([])
        prismaMock.course.groupBy.mockResolvedValue([])
        prismaMock.enrollment.count.mockResolvedValue(0)
        prismaMock.assignment.count.mockResolvedValue(0)
        prismaMock.submission.count.mockResolvedValue(0)
        prismaMock.discussion.count.mockResolvedValue(0)
        prismaMock.discussionPost.count.mockResolvedValue(0)
        prismaMock.user.count.mockResolvedValue(0)

        await GET()

        expect(prismaMock.user.groupBy).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              deletedAt: null,
            }),
          })
        )
      })

      it('should filter courses by deletedAt: null', async () => {
        prismaMock.user.groupBy.mockResolvedValue([])
        prismaMock.course.groupBy.mockResolvedValue([])
        prismaMock.enrollment.count.mockResolvedValue(0)
        prismaMock.assignment.count.mockResolvedValue(0)
        prismaMock.submission.count.mockResolvedValue(0)
        prismaMock.discussion.count.mockResolvedValue(0)
        prismaMock.discussionPost.count.mockResolvedValue(0)
        prismaMock.user.count.mockResolvedValue(0)

        await GET()

        expect(prismaMock.course.groupBy).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              deletedAt: null,
            }),
          })
        )
      })

      it('should filter assignments by deletedAt: null', async () => {
        prismaMock.user.groupBy.mockResolvedValue([])
        prismaMock.course.groupBy.mockResolvedValue([])
        prismaMock.enrollment.count.mockResolvedValue(0)
        prismaMock.assignment.count.mockResolvedValue(0)
        prismaMock.submission.count.mockResolvedValue(0)
        prismaMock.discussion.count.mockResolvedValue(0)
        prismaMock.discussionPost.count.mockResolvedValue(0)
        prismaMock.user.count.mockResolvedValue(0)

        await GET()

        expect(prismaMock.assignment.count).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              deletedAt: null,
            }),
          })
        )
      })
    })

    describe('Error Handling', () => {
      it('should return 500 on database error', async () => {
        mockGetCached.mockResolvedValue(null)
        prismaMock.user.groupBy.mockRejectedValue(new Error('Database connection failed'))

        const response = await GET()
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Internal server error')
        expect(data.code).toBe('INTERNAL_SERVER_ERROR')
      })
    })

    describe('Data Accuracy', () => {
      beforeEach(() => {
        mockGetCached.mockResolvedValue(null)
      })

      it('should return correct user counts', async () => {
        prismaMock.user.groupBy.mockResolvedValue([
          { role: 'STUDENT', _count: 50 },
          { role: 'INSTRUCTOR', _count: 10 },
          { role: 'ADMIN', _count: 3 },
        ] as any)
        prismaMock.course.groupBy.mockResolvedValue([])
        prismaMock.enrollment.count.mockResolvedValue(0)
        prismaMock.assignment.count.mockResolvedValue(0)
        prismaMock.submission.count.mockResolvedValue(0)
        prismaMock.discussion.count.mockResolvedValue(0)
        prismaMock.discussionPost.count.mockResolvedValue(0)
        prismaMock.user.count.mockResolvedValue(0)
        prismaMock.$queryRaw.mockResolvedValue([])
        prismaMock.course.findMany.mockResolvedValue([])

        const response = await GET()
        const data = await response.json()

        expect(data.users.students).toBe(50)
        expect(data.users.instructors).toBe(10)
        expect(data.users.admins).toBe(3)
        expect(data.users.total).toBe(63)
      })

      it('should return correct course counts', async () => {
        prismaMock.user.groupBy.mockResolvedValue([])
        prismaMock.course.groupBy.mockResolvedValue([
          { isActive: true, _count: 15 },
          { isActive: false, _count: 5 },
        ] as any)
        prismaMock.enrollment.count.mockResolvedValue(0)
        prismaMock.assignment.count.mockResolvedValue(0)
        prismaMock.submission.count.mockResolvedValue(0)
        prismaMock.discussion.count.mockResolvedValue(0)
        prismaMock.discussionPost.count.mockResolvedValue(0)
        prismaMock.user.count.mockResolvedValue(0)
        prismaMock.$queryRaw.mockResolvedValue([])
        prismaMock.course.findMany.mockResolvedValue([])

        const response = await GET()
        const data = await response.json()

        expect(data.courses.active).toBe(15)
        expect(data.courses.inactive).toBe(5)
        expect(data.courses.total).toBe(20)
      })
    })
  })
})
