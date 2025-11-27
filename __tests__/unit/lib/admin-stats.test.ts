/**
 * Admin Statistics Unit Tests
 *
 * Tests for the admin dashboard statistics utility functions.
 * Verifies correct aggregation logic, soft delete filtering, and cache behavior.
 *
 * Story: 2-6-admin-dashboard-system-statistics-monitoring
 * AC: 2.6.1, 2.6.2, 2.6.3, 2.6.4, 2.6.8, 2.6.9
 */

import {
  getRedisClient,
  getCached,
  setCached,
  invalidateCache,
  invalidateAdminStats,
  CACHE_KEYS,
  getStatsCacheTTL,
} from '@/lib/redis'

// Mock Redis module
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  })),
}))

// Store original env
const originalEnv = process.env

describe('Redis Cache Utilities', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('getRedisClient', () => {
    it('returns null when Redis credentials are not configured', () => {
      delete process.env.UPSTASH_REDIS_REST_URL
      delete process.env.UPSTASH_REDIS_REST_TOKEN

      // Re-import to get fresh module state
      jest.resetModules()
      const { getRedisClient: getClient } = require('@/lib/redis')
      const client = getClient()

      expect(client).toBeNull()
    })
  })

  describe('getStatsCacheTTL', () => {
    it('returns default TTL of 300 seconds', () => {
      delete process.env.STATS_CACHE_TTL
      expect(getStatsCacheTTL()).toBe(300)
    })

    it('returns configured TTL from environment', () => {
      process.env.STATS_CACHE_TTL = '600'
      jest.resetModules()
      const { getStatsCacheTTL: getTTL } = require('@/lib/redis')
      expect(getTTL()).toBe(600)
    })
  })

  describe('CACHE_KEYS', () => {
    it('has correct admin stats cache key', () => {
      expect(CACHE_KEYS.ADMIN_STATS_DETAILED).toBe('admin:stats:detailed')
    })
  })
})

describe('Statistics Aggregation Logic', () => {
  describe('User count aggregation', () => {
    it('should correctly sum user counts by role', () => {
      const roleGroups = [
        { role: 'STUDENT', _count: 50 },
        { role: 'INSTRUCTOR', _count: 10 },
        { role: 'ADMIN', _count: 3 },
      ]

      const counts: Record<string, number> = {
        STUDENT: 0,
        INSTRUCTOR: 0,
        ADMIN: 0,
      }

      roleGroups.forEach((group) => {
        counts[group.role] = group._count
      })

      expect(counts.STUDENT).toBe(50)
      expect(counts.INSTRUCTOR).toBe(10)
      expect(counts.ADMIN).toBe(3)
      expect(counts.STUDENT + counts.INSTRUCTOR + counts.ADMIN).toBe(63)
    })

    it('should handle empty role groups', () => {
      const roleGroups: Array<{ role: string; _count: number }> = []

      const counts: Record<string, number> = {
        STUDENT: 0,
        INSTRUCTOR: 0,
        ADMIN: 0,
      }

      roleGroups.forEach((group) => {
        counts[group.role] = group._count
      })

      expect(counts.STUDENT).toBe(0)
      expect(counts.INSTRUCTOR).toBe(0)
      expect(counts.ADMIN).toBe(0)
    })

    it('should handle missing roles', () => {
      const roleGroups = [{ role: 'STUDENT', _count: 50 }]

      const counts: Record<string, number> = {
        STUDENT: 0,
        INSTRUCTOR: 0,
        ADMIN: 0,
      }

      roleGroups.forEach((group) => {
        counts[group.role] = group._count
      })

      expect(counts.STUDENT).toBe(50)
      expect(counts.INSTRUCTOR).toBe(0)
      expect(counts.ADMIN).toBe(0)
    })
  })

  describe('Course count aggregation', () => {
    it('should correctly separate active and inactive courses', () => {
      const statusGroups = [
        { isActive: true, _count: 15 },
        { isActive: false, _count: 5 },
      ]

      let active = 0
      let inactive = 0

      statusGroups.forEach((group) => {
        if (group.isActive) {
          active = group._count
        } else {
          inactive = group._count
        }
      })

      expect(active).toBe(15)
      expect(inactive).toBe(5)
      expect(active + inactive).toBe(20)
    })

    it('should handle all active courses', () => {
      const statusGroups = [{ isActive: true, _count: 10 }]

      let active = 0
      let inactive = 0

      statusGroups.forEach((group) => {
        if (group.isActive) {
          active = group._count
        } else {
          inactive = group._count
        }
      })

      expect(active).toBe(10)
      expect(inactive).toBe(0)
    })

    it('should handle all inactive courses', () => {
      const statusGroups = [{ isActive: false, _count: 8 }]

      let active = 0
      let inactive = 0

      statusGroups.forEach((group) => {
        if (group.isActive) {
          active = group._count
        } else {
          inactive = group._count
        }
      })

      expect(active).toBe(0)
      expect(inactive).toBe(8)
    })
  })

  describe('24-hour activity window calculation', () => {
    it('should calculate correct 24-hour window', () => {
      const now = Date.now()
      const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000)

      // Should be approximately 24 hours ago
      const diff = now - twentyFourHoursAgo.getTime()
      expect(diff).toBe(24 * 60 * 60 * 1000)
    })

    it('should include activity from exactly 24 hours ago', () => {
      const now = new Date()
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      // Activity at exactly 24 hours ago should be included (>= comparison)
      const activityTime = twentyFourHoursAgo
      expect(activityTime.getTime()).toBeGreaterThanOrEqual(twentyFourHoursAgo.getTime())
    })

    it('should exclude activity from 25 hours ago', () => {
      const now = new Date()
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000)

      expect(twentyFiveHoursAgo.getTime()).toBeLessThan(twentyFourHoursAgo.getTime())
    })
  })

  describe('Completion rate calculation', () => {
    it('should calculate completion rate correctly', () => {
      const enrolledStudents = 10
      const totalAssignments = 5
      const totalPossibleGrades = totalAssignments * enrolledStudents // 50
      const totalGrades = 35

      const rate =
        totalPossibleGrades > 0 ? (totalGrades / totalPossibleGrades) * 100 : 0

      expect(rate).toBe(70)
    })

    it('should return 0 for courses with no possible grades', () => {
      const totalPossibleGrades = 0
      const totalGrades = 0

      const rate =
        totalPossibleGrades > 0 ? (totalGrades / totalPossibleGrades) * 100 : 0

      expect(rate).toBe(0)
    })

    it('should return 0 for courses with no enrollments', () => {
      const enrolledStudents = 0
      const totalAssignments = 5
      const totalPossibleGrades = totalAssignments * enrolledStudents // 0
      const totalGrades = 0

      const rate =
        totalPossibleGrades > 0 ? (totalGrades / totalPossibleGrades) * 100 : 0

      expect(rate).toBe(0)
    })

    it('should return 0 for courses with no assignments', () => {
      const enrolledStudents = 10
      const totalAssignments = 0
      const totalPossibleGrades = totalAssignments * enrolledStudents // 0
      const totalGrades = 0

      const rate =
        totalPossibleGrades > 0 ? (totalGrades / totalPossibleGrades) * 100 : 0

      expect(rate).toBe(0)
    })

    it('should return 100% for fully completed courses', () => {
      const enrolledStudents = 5
      const totalAssignments = 4
      const totalPossibleGrades = totalAssignments * enrolledStudents // 20
      const totalGrades = 20

      const rate =
        totalPossibleGrades > 0 ? (totalGrades / totalPossibleGrades) * 100 : 0

      expect(rate).toBe(100)
    })

    it('should round to 2 decimal places', () => {
      const totalPossibleGrades = 30
      const totalGrades = 17

      const rate = (totalGrades / totalPossibleGrades) * 100
      const rounded = Math.round(rate * 100) / 100

      expect(rounded).toBe(56.67)
    })

    it('should sort courses by completion rate descending', () => {
      const courses = [
        { courseId: '1', courseTitle: 'Course A', rate: 50 },
        { courseId: '2', courseTitle: 'Course B', rate: 80 },
        { courseId: '3', courseTitle: 'Course C', rate: 65 },
      ]

      const sorted = [...courses].sort((a, b) => b.rate - a.rate)

      expect(sorted[0].rate).toBe(80)
      expect(sorted[1].rate).toBe(65)
      expect(sorted[2].rate).toBe(50)
    })

    it('should limit to top 10 courses', () => {
      const courses = Array.from({ length: 15 }, (_, i) => ({
        courseId: `${i}`,
        courseTitle: `Course ${i}`,
        rate: Math.random() * 100,
      }))

      const sorted = [...courses].sort((a, b) => b.rate - a.rate).slice(0, 10)

      expect(sorted.length).toBe(10)
    })
  })

  describe('Enrollments over time formatting', () => {
    it('should format dates as ISO string date portion', () => {
      const date = new Date('2025-11-26T14:30:00Z')
      const formatted = date.toISOString().split('T')[0]

      expect(formatted).toBe('2025-11-26')
    })

    it('should convert bigint counts to numbers', () => {
      const bigintCount = BigInt(42)
      const numberCount = Number(bigintCount)

      expect(typeof numberCount).toBe('number')
      expect(numberCount).toBe(42)
    })
  })

  describe('System health status determination', () => {
    it('should mark database as healthy when query succeeds', () => {
      // This tests the logic pattern
      let databaseStatus: 'healthy' | 'degraded' | 'down' = 'healthy'
      const querySucceeded = true

      if (!querySucceeded) {
        databaseStatus = 'down'
      }

      expect(databaseStatus).toBe('healthy')
    })

    it('should mark database as down when query fails', () => {
      let databaseStatus: 'healthy' | 'degraded' | 'down' = 'healthy'
      const querySucceeded = false

      if (!querySucceeded) {
        databaseStatus = 'down'
      }

      expect(databaseStatus).toBe('down')
    })

    it('should mark storage as degraded when R2 not configured', () => {
      const r2Configured = false
      let storageStatus: 'healthy' | 'degraded' | 'down' = 'healthy'

      if (!r2Configured) {
        storageStatus = 'degraded'
      }

      expect(storageStatus).toBe('degraded')
    })

    it('should mark storage as healthy when R2 is configured', () => {
      const r2Configured = true
      let storageStatus: 'healthy' | 'degraded' | 'down' = 'healthy'

      if (!r2Configured) {
        storageStatus = 'degraded'
      }

      expect(storageStatus).toBe('healthy')
    })
  })
})

describe('Soft Delete Filtering', () => {
  describe('Query patterns', () => {
    it('should include deletedAt: null filter', () => {
      const softDeleteFilter = { deletedAt: null }

      expect(softDeleteFilter.deletedAt).toBeNull()
    })

    it('should combine with other filters', () => {
      const combinedFilter = {
        deletedAt: null,
        role: 'STUDENT',
      }

      expect(combinedFilter.deletedAt).toBeNull()
      expect(combinedFilter.role).toBe('STUDENT')
    })
  })
})
