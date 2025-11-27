/**
 * Performance Baseline Measurement Script
 *
 * Measures query response times for critical database operations.
 * Compares PostgreSQL performance against target thresholds.
 *
 * Usage: npx tsx scripts/measure-performance.ts
 *
 * Target: < 100ms (p95) for critical queries
 * Acceptable variance: PostgreSQL within 50% of baseline
 */

import { PrismaClient } from '@prisma/client'
import { performance } from 'perf_hooks'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface QueryResult {
  name: string
  description: string
  iterations: number
  latencies: number[]
  p50: number
  p95: number
  p99: number
  min: number
  max: number
  avg: number
  acceptable: boolean
}

interface PerformanceReport {
  timestamp: string
  database: string
  results: QueryResult[]
  summary: {
    totalQueries: number
    passedQueries: number
    failedQueries: number
    overallP95: number
    overallAcceptable: boolean
  }
}

const ITERATIONS = 10 // Number of times to run each query
const P95_TARGET = 100 // Target p95 latency in milliseconds

// Calculate percentile
function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const index = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

// Measure a query's performance
async function measureQuery(
  name: string,
  description: string,
  queryFn: () => Promise<unknown>
): Promise<QueryResult> {
  const latencies: number[] = []

  // Warm up query (discard first result)
  await queryFn()

  // Run iterations
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now()
    await queryFn()
    const end = performance.now()
    latencies.push(end - start)
  }

  const p50 = percentile(latencies, 50)
  const p95 = percentile(latencies, 95)
  const p99 = percentile(latencies, 99)
  const min = Math.min(...latencies)
  const max = Math.max(...latencies)
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length

  return {
    name,
    description,
    iterations: ITERATIONS,
    latencies,
    p50,
    p95,
    p99,
    min,
    max,
    avg,
    acceptable: p95 <= P95_TARGET
  }
}

async function measurePerformance(): Promise<PerformanceReport> {
  console.log('='.repeat(60))
  console.log('Performance Baseline Measurement')
  console.log('='.repeat(60))
  console.log('')
  console.log(`Target: p95 < ${P95_TARGET}ms`)
  console.log(`Iterations per query: ${ITERATIONS}`)
  console.log('')

  // Check if database has data
  const userCount = await prisma.user.count()
  if (userCount === 0) {
    console.log('WARNING: Database is empty. Run db:seed first for accurate measurements.')
    console.log('')
  }

  const results: QueryResult[] = []

  // ========================================
  // Query 1: Course List (Student Dashboard)
  // ========================================
  console.log('Measuring: Course List Query...')
  const courseListResult = await measureQuery(
    'Course List',
    'Fetch active courses with instructor and enrollment count (Student dashboard)',
    async () => {
      return prisma.course.findMany({
        where: { isActive: true },
        include: {
          instructor: {
            select: { id: true, name: true, surname: true, email: true }
          },
          _count: {
            select: { enrollments: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }
  )
  results.push(courseListResult)
  console.log(`  p95: ${courseListResult.p95.toFixed(2)}ms ${courseListResult.acceptable ? '✅' : '❌'}`)

  // ========================================
  // Query 2: Gradebook Query (Instructor)
  // ========================================
  console.log('Measuring: Gradebook Query...')

  // Get a course ID for testing
  const testCourse = await prisma.course.findFirst()

  const gradebookResult = await measureQuery(
    'Gradebook',
    'Fetch all grades for a course with student and assignment details (Instructor)',
    async () => {
      if (!testCourse) return []
      return prisma.grade.findMany({
        where: {
          assignment: { courseId: testCourse.id }
        },
        include: {
          student: {
            select: { id: true, name: true, surname: true, email: true }
          },
          assignment: {
            select: { id: true, title: true, maxPoints: true }
          }
        },
        orderBy: { gradedAt: 'desc' }
      })
    }
  )
  results.push(gradebookResult)
  console.log(`  p95: ${gradebookResult.p95.toFixed(2)}ms ${gradebookResult.acceptable ? '✅' : '❌'}`)

  // ========================================
  // Query 3: Assignment Detail (Student)
  // ========================================
  console.log('Measuring: Assignment Detail Query...')

  const testAssignment = await prisma.assignment.findFirst()

  const assignmentResult = await measureQuery(
    'Assignment Detail',
    'Fetch assignment with course and submissions (Student view)',
    async () => {
      if (!testAssignment) return null
      return prisma.assignment.findUnique({
        where: { id: testAssignment.id },
        include: {
          course: {
            select: { id: true, title: true, code: true }
          },
          submissions: {
            select: { id: true, studentId: true, submittedAt: true }
          }
        }
      })
    }
  )
  results.push(assignmentResult)
  console.log(`  p95: ${assignmentResult.p95.toFixed(2)}ms ${assignmentResult.acceptable ? '✅' : '❌'}`)

  // ========================================
  // Query 4: Discussion Thread (Nested Posts)
  // ========================================
  console.log('Measuring: Discussion Thread Query...')

  const discussionResult = await measureQuery(
    'Discussion Thread',
    'Fetch discussions with nested posts and authors (3 levels)',
    async () => {
      if (!testCourse) return []
      return prisma.discussion.findMany({
        where: { courseId: testCourse.id },
        include: {
          author: {
            select: { id: true, name: true, surname: true }
          },
          posts: {
            include: {
              author: {
                select: { id: true, name: true, surname: true }
              },
              replies: {
                include: {
                  author: {
                    select: { id: true, name: true, surname: true }
                  }
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }
  )
  results.push(discussionResult)
  console.log(`  p95: ${discussionResult.p95.toFixed(2)}ms ${discussionResult.acceptable ? '✅' : '❌'}`)

  // ========================================
  // Query 5: User Enrollments
  // ========================================
  console.log('Measuring: User Enrollments Query...')

  const testUser = await prisma.user.findFirst({ where: { role: 'STUDENT' } })

  const enrollmentsResult = await measureQuery(
    'User Enrollments',
    'Fetch user enrollments with course details',
    async () => {
      if (!testUser) return []
      return prisma.enrollment.findMany({
        where: { userId: testUser.id },
        include: {
          course: {
            include: {
              instructor: {
                select: { id: true, name: true, surname: true }
              },
              _count: {
                select: { assignments: true, content: true }
              }
            }
          }
        }
      })
    }
  )
  results.push(enrollmentsResult)
  console.log(`  p95: ${enrollmentsResult.p95.toFixed(2)}ms ${enrollmentsResult.acceptable ? '✅' : '❌'}`)

  // ========================================
  // Query 6: Course Content List
  // ========================================
  console.log('Measuring: Course Content Query...')

  const contentResult = await measureQuery(
    'Course Content',
    'Fetch all content for a course ordered by index',
    async () => {
      if (!testCourse) return []
      return prisma.courseContent.findMany({
        where: {
          courseId: testCourse.id,
          isPublished: true
        },
        orderBy: { orderIndex: 'asc' }
      })
    }
  )
  results.push(contentResult)
  console.log(`  p95: ${contentResult.p95.toFixed(2)}ms ${contentResult.acceptable ? '✅' : '❌'}`)

  // ========================================
  // Query 7: Announcements List
  // ========================================
  console.log('Measuring: Announcements Query...')

  const announcementsResult = await measureQuery(
    'Announcements',
    'Fetch recent announcements for a course with author',
    async () => {
      if (!testCourse) return []
      return prisma.announcement.findMany({
        where: { courseId: testCourse.id },
        include: {
          author: {
            select: { id: true, name: true, surname: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    }
  )
  results.push(announcementsResult)
  console.log(`  p95: ${announcementsResult.p95.toFixed(2)}ms ${announcementsResult.acceptable ? '✅' : '❌'}`)

  // ========================================
  // Calculate Summary
  // ========================================
  const passedQueries = results.filter(r => r.acceptable).length
  const failedQueries = results.length - passedQueries
  const allP95s = results.map(r => r.p95)
  const overallP95 = percentile(allP95s, 95)

  const report: PerformanceReport = {
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL',
    results,
    summary: {
      totalQueries: results.length,
      passedQueries,
      failedQueries,
      overallP95,
      overallAcceptable: passedQueries === results.length
    }
  }

  // Print summary
  console.log('')
  console.log('='.repeat(60))
  console.log('PERFORMANCE SUMMARY')
  console.log('='.repeat(60))
  console.log('')
  console.log('Query Results:')
  for (const result of results) {
    const status = result.acceptable ? '✅ PASS' : '❌ FAIL'
    console.log(`  ${result.name}: p50=${result.p50.toFixed(2)}ms, p95=${result.p95.toFixed(2)}ms, p99=${result.p99.toFixed(2)}ms [${status}]`)
  }
  console.log('')
  console.log(`Total Queries: ${report.summary.totalQueries}`)
  console.log(`Passed: ${report.summary.passedQueries}`)
  console.log(`Failed: ${report.summary.failedQueries}`)
  console.log(`Overall p95: ${report.summary.overallP95.toFixed(2)}ms`)
  console.log('')
  console.log(`OVERALL: ${report.summary.overallAcceptable ? '✅ PASS' : '❌ FAIL'}`)
  console.log('='.repeat(60))

  // Save report to file
  const reportPath = path.join(process.cwd(), 'docs', `performance-baseline-${new Date().toISOString().split('T')[0]}.json`)
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`\nReport saved to: ${reportPath}`)

  return report
}

// Run performance measurement
measurePerformance()
  .then(report => {
    prisma.$disconnect()
    process.exit(report.summary.overallAcceptable ? 0 : 1)
  })
  .catch(error => {
    console.error('Performance measurement failed:', error)
    prisma.$disconnect()
    process.exit(1)
  })
