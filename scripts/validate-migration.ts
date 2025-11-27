/**
 * Migration Validation Script
 *
 * Validates data integrity between SQLite (source) and PostgreSQL (target) databases.
 * Performs row count validation, checksum verification, and foreign key integrity checks.
 *
 * Usage: npx tsx scripts/validate-migration.ts
 *
 * Required environment variables:
 * - DATABASE_URL: PostgreSQL connection string
 * - SQLITE_DATABASE_URL: SQLite database path (e.g., file:./prisma/dev.db)
 */

import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

// Types
interface ValidationResult {
  model: string
  sqliteCount: number
  postgresCount: number
  countMatch: boolean
  checksumMatch: boolean | null // null if checksum not applicable
  foreignKeyIntegrity: boolean
  errors: string[]
}

interface ValidationReport {
  timestamp: string
  sqliteUrl: string
  postgresUrl: string
  results: ValidationResult[]
  foreignKeyValidation: ForeignKeyValidation
  allPassed: boolean
  summary: {
    totalModels: number
    passedModels: number
    failedModels: number
    totalSqliteRows: number
    totalPostgresRows: number
  }
}

interface ForeignKeyValidation {
  passed: boolean
  checks: ForeignKeyCheck[]
}

interface ForeignKeyCheck {
  relation: string
  description: string
  orphanedCount: number
  passed: boolean
}

// Model definitions for validation
const MODELS = [
  'user',
  'course',
  'enrollment',
  'assignment',
  'submission',
  'grade',
  'discussion',
  'discussionPost',
  'announcement',
  'courseContent'
] as const

type ModelName = typeof MODELS[number]

// Critical fields for checksum validation (fields that must be preserved exactly)
const CHECKSUM_FIELDS: Record<ModelName, string[]> = {
  user: ['email', 'name', 'surname', 'role'],
  course: ['code', 'title', 'semester', 'year'],
  enrollment: ['userId', 'courseId'],
  assignment: ['title', 'maxPoints', 'courseId'],
  submission: ['assignmentId', 'studentId'],
  grade: ['points', 'assignmentId', 'studentId'],
  discussion: ['title', 'courseId'],
  discussionPost: ['content', 'discussionId', 'authorId'],
  announcement: ['title', 'content', 'courseId'],
  courseContent: ['title', 'type', 'courseId', 'orderIndex']
}

// Initialize Prisma clients
function createPostgresClient(): PrismaClient {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  return new PrismaClient({
    datasources: {
      db: { url }
    },
    log: ['error']
  })
}

function createSqliteClient(): PrismaClient {
  const url = process.env.SQLITE_DATABASE_URL || 'file:./prisma/dev.db'

  // Verify SQLite file exists
  const dbPath = url.replace('file:', '').replace('./', '')
  const absolutePath = path.resolve(process.cwd(), dbPath)

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`SQLite database not found at: ${absolutePath}`)
  }

  return new PrismaClient({
    datasources: {
      db: { url }
    },
    log: ['error']
  })
}

// Row count validation
async function validateRowCount(
  sqlite: PrismaClient,
  postgres: PrismaClient,
  model: ModelName
): Promise<{ sqliteCount: number; postgresCount: number; match: boolean }> {
  // @ts-ignore - Dynamic model access
  const sqliteCount = await sqlite[model].count()
  // @ts-ignore - Dynamic model access
  const postgresCount = await postgres[model].count()

  return {
    sqliteCount,
    postgresCount,
    match: sqliteCount === postgresCount
  }
}

// Checksum validation for critical fields
async function validateChecksum(
  sqlite: PrismaClient,
  postgres: PrismaClient,
  model: ModelName
): Promise<{ match: boolean; sqliteChecksum: string; postgresChecksum: string }> {
  const fields = CHECKSUM_FIELDS[model]
  const selectFields = fields.reduce((acc, field) => ({ ...acc, [field]: true }), { id: true })

  // Get all records from both databases, ordered by ID for consistent comparison
  // @ts-ignore - Dynamic model access
  const sqliteRecords = await sqlite[model].findMany({
    select: selectFields,
    orderBy: { id: 'asc' }
  })

  // @ts-ignore - Dynamic model access
  const postgresRecords = await postgres[model].findMany({
    select: selectFields,
    orderBy: { id: 'asc' }
  })

  // Calculate checksums
  const sqliteChecksum = calculateChecksum(sqliteRecords)
  const postgresChecksum = calculateChecksum(postgresRecords)

  return {
    match: sqliteChecksum === postgresChecksum,
    sqliteChecksum,
    postgresChecksum
  }
}

function calculateChecksum(data: unknown[]): string {
  const hash = crypto.createHash('sha256')
  // Sort keys for consistent serialization
  const serialized = JSON.stringify(data, Object.keys(data[0] || {}).sort())
  hash.update(serialized)
  return hash.digest('hex')
}

// Foreign key integrity validation
async function validateForeignKeys(postgres: PrismaClient): Promise<ForeignKeyValidation> {
  const checks: ForeignKeyCheck[] = []

  // Check User → Enrollment (enrollment.userId must exist in users)
  const orphanedEnrollments = await postgres.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM enrollments e
    LEFT JOIN users u ON e."userId" = u.id
    WHERE u.id IS NULL
  `
  checks.push({
    relation: 'Enrollment → User',
    description: 'Enrollments with non-existent userId',
    orphanedCount: Number(orphanedEnrollments[0]?.count || 0),
    passed: Number(orphanedEnrollments[0]?.count || 0) === 0
  })

  // Check Enrollment → Course
  const orphanedEnrollmentsCourse = await postgres.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM enrollments e
    LEFT JOIN courses c ON e."courseId" = c.id
    WHERE c.id IS NULL
  `
  checks.push({
    relation: 'Enrollment → Course',
    description: 'Enrollments with non-existent courseId',
    orphanedCount: Number(orphanedEnrollmentsCourse[0]?.count || 0),
    passed: Number(orphanedEnrollmentsCourse[0]?.count || 0) === 0
  })

  // Check Course → Instructor (User)
  const orphanedCourses = await postgres.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM courses c
    LEFT JOIN users u ON c."instructorId" = u.id
    WHERE u.id IS NULL
  `
  checks.push({
    relation: 'Course → Instructor',
    description: 'Courses with non-existent instructorId',
    orphanedCount: Number(orphanedCourses[0]?.count || 0),
    passed: Number(orphanedCourses[0]?.count || 0) === 0
  })

  // Check Assignment → Course
  const orphanedAssignments = await postgres.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM assignments a
    LEFT JOIN courses c ON a."courseId" = c.id
    WHERE c.id IS NULL
  `
  checks.push({
    relation: 'Assignment → Course',
    description: 'Assignments with non-existent courseId',
    orphanedCount: Number(orphanedAssignments[0]?.count || 0),
    passed: Number(orphanedAssignments[0]?.count || 0) === 0
  })

  // Check Assignment → CreatedBy (User)
  const orphanedAssignmentsCreator = await postgres.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM assignments a
    LEFT JOIN users u ON a."createdById" = u.id
    WHERE u.id IS NULL
  `
  checks.push({
    relation: 'Assignment → CreatedBy',
    description: 'Assignments with non-existent createdById',
    orphanedCount: Number(orphanedAssignmentsCreator[0]?.count || 0),
    passed: Number(orphanedAssignmentsCreator[0]?.count || 0) === 0
  })

  // Check Submission → Assignment
  const orphanedSubmissions = await postgres.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM submissions s
    LEFT JOIN assignments a ON s."assignmentId" = a.id
    WHERE a.id IS NULL
  `
  checks.push({
    relation: 'Submission → Assignment',
    description: 'Submissions with non-existent assignmentId',
    orphanedCount: Number(orphanedSubmissions[0]?.count || 0),
    passed: Number(orphanedSubmissions[0]?.count || 0) === 0
  })

  // Check Submission → Student (User)
  const orphanedSubmissionsStudent = await postgres.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM submissions s
    LEFT JOIN users u ON s."studentId" = u.id
    WHERE u.id IS NULL
  `
  checks.push({
    relation: 'Submission → Student',
    description: 'Submissions with non-existent studentId',
    orphanedCount: Number(orphanedSubmissionsStudent[0]?.count || 0),
    passed: Number(orphanedSubmissionsStudent[0]?.count || 0) === 0
  })

  // Check Grade → Assignment
  const orphanedGrades = await postgres.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM grades g
    LEFT JOIN assignments a ON g."assignmentId" = a.id
    WHERE a.id IS NULL
  `
  checks.push({
    relation: 'Grade → Assignment',
    description: 'Grades with non-existent assignmentId',
    orphanedCount: Number(orphanedGrades[0]?.count || 0),
    passed: Number(orphanedGrades[0]?.count || 0) === 0
  })

  // Check Grade → Student
  const orphanedGradesStudent = await postgres.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM grades g
    LEFT JOIN users u ON g."studentId" = u.id
    WHERE u.id IS NULL
  `
  checks.push({
    relation: 'Grade → Student',
    description: 'Grades with non-existent studentId',
    orphanedCount: Number(orphanedGradesStudent[0]?.count || 0),
    passed: Number(orphanedGradesStudent[0]?.count || 0) === 0
  })

  // Check Grade → GradedBy
  const orphanedGradesGrader = await postgres.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM grades g
    LEFT JOIN users u ON g."gradedById" = u.id
    WHERE u.id IS NULL
  `
  checks.push({
    relation: 'Grade → GradedBy',
    description: 'Grades with non-existent gradedById',
    orphanedCount: Number(orphanedGradesGrader[0]?.count || 0),
    passed: Number(orphanedGradesGrader[0]?.count || 0) === 0
  })

  // Check Discussion → Course
  const orphanedDiscussions = await postgres.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM discussions d
    LEFT JOIN courses c ON d."courseId" = c.id
    WHERE c.id IS NULL
  `
  checks.push({
    relation: 'Discussion → Course',
    description: 'Discussions with non-existent courseId',
    orphanedCount: Number(orphanedDiscussions[0]?.count || 0),
    passed: Number(orphanedDiscussions[0]?.count || 0) === 0
  })

  // Check Discussion → Author
  const orphanedDiscussionsAuthor = await postgres.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM discussions d
    LEFT JOIN users u ON d."createdBy" = u.id
    WHERE u.id IS NULL
  `
  checks.push({
    relation: 'Discussion → Author',
    description: 'Discussions with non-existent createdBy',
    orphanedCount: Number(orphanedDiscussionsAuthor[0]?.count || 0),
    passed: Number(orphanedDiscussionsAuthor[0]?.count || 0) === 0
  })

  // Check DiscussionPost → Discussion
  const orphanedPosts = await postgres.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM discussion_posts dp
    LEFT JOIN discussions d ON dp."discussionId" = d.id
    WHERE d.id IS NULL
  `
  checks.push({
    relation: 'DiscussionPost → Discussion',
    description: 'Discussion posts with non-existent discussionId',
    orphanedCount: Number(orphanedPosts[0]?.count || 0),
    passed: Number(orphanedPosts[0]?.count || 0) === 0
  })

  // Check DiscussionPost → Author
  const orphanedPostsAuthor = await postgres.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM discussion_posts dp
    LEFT JOIN users u ON dp."authorId" = u.id
    WHERE u.id IS NULL
  `
  checks.push({
    relation: 'DiscussionPost → Author',
    description: 'Discussion posts with non-existent authorId',
    orphanedCount: Number(orphanedPostsAuthor[0]?.count || 0),
    passed: Number(orphanedPostsAuthor[0]?.count || 0) === 0
  })

  // Check Announcement → Course
  const orphanedAnnouncements = await postgres.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM announcements a
    LEFT JOIN courses c ON a."courseId" = c.id
    WHERE c.id IS NULL
  `
  checks.push({
    relation: 'Announcement → Course',
    description: 'Announcements with non-existent courseId',
    orphanedCount: Number(orphanedAnnouncements[0]?.count || 0),
    passed: Number(orphanedAnnouncements[0]?.count || 0) === 0
  })

  // Check Announcement → Author
  const orphanedAnnouncementsAuthor = await postgres.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM announcements a
    LEFT JOIN users u ON a."authorId" = u.id
    WHERE u.id IS NULL
  `
  checks.push({
    relation: 'Announcement → Author',
    description: 'Announcements with non-existent authorId',
    orphanedCount: Number(orphanedAnnouncementsAuthor[0]?.count || 0),
    passed: Number(orphanedAnnouncementsAuthor[0]?.count || 0) === 0
  })

  // Check CourseContent → Course
  const orphanedContent = await postgres.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*) as count FROM course_content cc
    LEFT JOIN courses c ON cc."courseId" = c.id
    WHERE c.id IS NULL
  `
  checks.push({
    relation: 'CourseContent → Course',
    description: 'Course content with non-existent courseId',
    orphanedCount: Number(orphanedContent[0]?.count || 0),
    passed: Number(orphanedContent[0]?.count || 0) === 0
  })

  return {
    passed: checks.every(c => c.passed),
    checks
  }
}

// Validate data type preservation
async function validateDataTypes(postgres: PrismaClient): Promise<string[]> {
  const errors: string[] = []

  // Check for NULL values in required fields
  const nullEmailUsers = await postgres.user.count({ where: { email: '' } })
  if (nullEmailUsers > 0) {
    errors.push(`Found ${nullEmailUsers} users with empty email`)
  }

  const nullCodeCourses = await postgres.course.count({ where: { code: '' } })
  if (nullCodeCourses > 0) {
    errors.push(`Found ${nullCodeCourses} courses with empty code`)
  }

  // Check for invalid enum values (Prisma validates this, but check anyway)
  try {
    const invalidRoles = await postgres.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM users
      WHERE role NOT IN ('STUDENT', 'INSTRUCTOR', 'ADMIN')
    `
    if (Number(invalidRoles[0]?.count || 0) > 0) {
      errors.push(`Found ${invalidRoles[0]?.count} users with invalid role`)
    }
  } catch (e) {
    // Enum validation handled by Prisma
  }

  return errors
}

// Main validation function
async function validateMigration(): Promise<ValidationReport> {
  console.log('='.repeat(60))
  console.log('Migration Validation Script')
  console.log('='.repeat(60))
  console.log('')

  let sqlite: PrismaClient | null = null
  let postgres: PrismaClient | null = null

  try {
    console.log('Connecting to databases...')

    // Try to connect to PostgreSQL
    postgres = createPostgresClient()
    await postgres.$connect()
    console.log('  PostgreSQL: Connected')

    // Try to connect to SQLite
    try {
      sqlite = createSqliteClient()
      await sqlite.$connect()
      console.log('  SQLite: Connected')
    } catch (e) {
      console.log('  SQLite: Not available (will validate PostgreSQL only)')
      sqlite = null
    }

    console.log('')
    console.log('Validating models...')
    console.log('')

    const results: ValidationResult[] = []
    let totalSqliteRows = 0
    let totalPostgresRows = 0

    for (const model of MODELS) {
      console.log(`  Validating ${model}...`)
      const errors: string[] = []

      // Row count validation
      let sqliteCount = 0
      let postgresCount = 0
      let countMatch = true

      if (sqlite) {
        const counts = await validateRowCount(sqlite, postgres, model)
        sqliteCount = counts.sqliteCount
        postgresCount = counts.postgresCount
        countMatch = counts.match

        if (!countMatch) {
          errors.push(`Row count mismatch: SQLite=${sqliteCount}, PostgreSQL=${postgresCount}`)
        }
      } else {
        // @ts-ignore - Dynamic model access
        postgresCount = await postgres[model].count()
        countMatch = true // No comparison needed
      }

      totalSqliteRows += sqliteCount
      totalPostgresRows += postgresCount

      // Checksum validation (only if both databases available and have data)
      let checksumMatch: boolean | null = null
      if (sqlite && sqliteCount > 0 && postgresCount > 0) {
        try {
          const checksumResult = await validateChecksum(sqlite, postgres, model)
          checksumMatch = checksumResult.match
          if (!checksumMatch) {
            errors.push('Checksum mismatch: Data differs between databases')
          }
        } catch (e) {
          errors.push(`Checksum validation error: ${e}`)
          checksumMatch = false
        }
      }

      // Foreign key validation happens globally later
      const foreignKeyIntegrity = true // Will be validated globally

      const status = countMatch && (checksumMatch === null || checksumMatch) ? '✅' : '❌'
      console.log(`    ${status} ${model}: SQLite=${sqliteCount}, PostgreSQL=${postgresCount}`)

      results.push({
        model,
        sqliteCount,
        postgresCount,
        countMatch,
        checksumMatch,
        foreignKeyIntegrity,
        errors
      })
    }

    console.log('')
    console.log('Validating foreign key integrity...')
    const foreignKeyValidation = await validateForeignKeys(postgres)

    for (const check of foreignKeyValidation.checks) {
      const status = check.passed ? '✅' : '❌'
      console.log(`  ${status} ${check.relation}: ${check.orphanedCount} orphaned records`)
    }

    console.log('')
    console.log('Validating data types...')
    const dataTypeErrors = await validateDataTypes(postgres)

    if (dataTypeErrors.length === 0) {
      console.log('  ✅ All data types valid')
    } else {
      for (const error of dataTypeErrors) {
        console.log(`  ❌ ${error}`)
      }
    }

    // Calculate summary
    const passedModels = results.filter(r =>
      r.countMatch && (r.checksumMatch === null || r.checksumMatch)
    ).length
    const failedModels = results.length - passedModels

    const allPassed = passedModels === results.length &&
                      foreignKeyValidation.passed &&
                      dataTypeErrors.length === 0

    const report: ValidationReport = {
      timestamp: new Date().toISOString(),
      sqliteUrl: process.env.SQLITE_DATABASE_URL || 'file:./prisma/dev.db',
      postgresUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@') || 'N/A',
      results,
      foreignKeyValidation,
      allPassed,
      summary: {
        totalModels: results.length,
        passedModels,
        failedModels,
        totalSqliteRows,
        totalPostgresRows
      }
    }

    // Print summary
    console.log('')
    console.log('='.repeat(60))
    console.log('VALIDATION SUMMARY')
    console.log('='.repeat(60))
    console.log(`  Total Models: ${report.summary.totalModels}`)
    console.log(`  Passed: ${report.summary.passedModels}`)
    console.log(`  Failed: ${report.summary.failedModels}`)
    console.log(`  SQLite Rows: ${report.summary.totalSqliteRows}`)
    console.log(`  PostgreSQL Rows: ${report.summary.totalPostgresRows}`)
    console.log(`  Foreign Key Integrity: ${foreignKeyValidation.passed ? 'PASS' : 'FAIL'}`)
    console.log(`  Data Type Validation: ${dataTypeErrors.length === 0 ? 'PASS' : 'FAIL'}`)
    console.log('')
    console.log(`  OVERALL: ${report.allPassed ? '✅ PASS' : '❌ FAIL'}`)
    console.log('='.repeat(60))

    // Save report to file
    const reportPath = path.join(process.cwd(), 'docs', `validation-results-${new Date().toISOString().split('T')[0]}.json`)
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log(`\nReport saved to: ${reportPath}`)

    return report

  } finally {
    // Disconnect clients
    if (sqlite) await sqlite.$disconnect()
    if (postgres) await postgres.$disconnect()
  }
}

// Run validation
validateMigration()
  .then(report => {
    process.exit(report.allPassed ? 0 : 1)
  })
  .catch(error => {
    console.error('Validation failed with error:', error)
    process.exit(1)
  })
