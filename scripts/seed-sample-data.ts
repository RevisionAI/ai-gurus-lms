/**
 * Sample Data Seed Script
 *
 * Creates a representative sample dataset for migration validation testing.
 * Includes edge cases: multiple user roles, nested discussions, various content types.
 *
 * Usage: npx tsx scripts/seed-sample-data.ts
 *
 * Minimum dataset (per AC 2):
 * - 5 users (2 students, 2 instructors, 1 admin)
 * - 3 courses (1 active, 1 inactive, 1 with no enrollments)
 * - 10 assignments (various due dates)
 * - 20 submissions
 * - Nested discussion posts (3 levels deep)
 * - Multiple content types
 */

import { PrismaClient, UserRole, ContentType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Helper to hash passwords
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Helper to generate dates
function daysFromNow(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

function daysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

async function seedSampleData() {
  console.log('='.repeat(60))
  console.log('Sample Data Seed Script')
  console.log('='.repeat(60))
  console.log('')

  try {
    // Check if data already exists
    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      console.log(`Database already has ${existingUsers} users.`)
      console.log('To re-seed, first clear the database or use a fresh PostgreSQL instance.')
      console.log('')
      console.log('Exiting without changes.')
      return
    }

    console.log('Creating sample data...')
    console.log('')

    // ========================================
    // 1. Create Users (5 total)
    // ========================================
    console.log('Creating users...')

    const password = await hashPassword('Test123!')

    const admin = await prisma.user.create({
      data: {
        email: 'admin@aigurus.test',
        name: 'Admin',
        surname: 'User',
        password,
        cellNumber: '+1234567890',
        company: 'AI Gurus',
        position: 'Administrator',
        workAddress: '123 Admin Street',
        role: UserRole.ADMIN
      }
    })
    console.log(`  Created admin: ${admin.email}`)

    const instructor1 = await prisma.user.create({
      data: {
        email: 'instructor1@aigurus.test',
        name: 'John',
        surname: 'Smith',
        password,
        cellNumber: '+1234567891',
        company: 'AI Gurus',
        position: 'Senior Instructor',
        workAddress: '456 Teaching Lane',
        role: UserRole.INSTRUCTOR
      }
    })
    console.log(`  Created instructor: ${instructor1.email}`)

    const instructor2 = await prisma.user.create({
      data: {
        email: 'instructor2@aigurus.test',
        name: 'Sarah',
        surname: 'Johnson',
        password,
        cellNumber: '+1234567892',
        company: 'AI Gurus',
        position: 'Instructor',
        workAddress: '789 Education Ave',
        role: UserRole.INSTRUCTOR
      }
    })
    console.log(`  Created instructor: ${instructor2.email}`)

    const student1 = await prisma.user.create({
      data: {
        email: 'student1@aigurus.test',
        name: 'Alice',
        surname: 'Williams',
        password,
        cellNumber: '+1234567893',
        company: 'TechCorp',
        position: 'Junior Developer',
        workAddress: '101 Student Rd',
        role: UserRole.STUDENT
      }
    })
    console.log(`  Created student: ${student1.email}`)

    const student2 = await prisma.user.create({
      data: {
        email: 'student2@aigurus.test',
        name: 'Bob',
        surname: 'Brown',
        password,
        cellNumber: '+1234567894',
        company: 'DataInc',
        position: 'Data Analyst',
        workAddress: '202 Learning Blvd',
        role: UserRole.STUDENT
      }
    })
    console.log(`  Created student: ${student2.email}`)

    console.log('  Total users: 5')
    console.log('')

    // ========================================
    // 2. Create Courses (3 total)
    // ========================================
    console.log('Creating courses...')

    const course1 = await prisma.course.create({
      data: {
        title: 'Introduction to AI',
        description: 'Learn the fundamentals of Artificial Intelligence including machine learning, neural networks, and practical applications.',
        code: 'AI101',
        semester: 'Fall',
        year: 2024,
        isActive: true,
        instructorId: instructor1.id
      }
    })
    console.log(`  Created active course: ${course1.code}`)

    const course2 = await prisma.course.create({
      data: {
        title: 'Advanced Machine Learning',
        description: 'Deep dive into advanced ML techniques including deep learning, reinforcement learning, and transformer architectures.',
        code: 'ML301',
        semester: 'Spring',
        year: 2024,
        isActive: false, // Inactive course
        instructorId: instructor2.id
      }
    })
    console.log(`  Created inactive course: ${course2.code}`)

    const course3 = await prisma.course.create({
      data: {
        title: 'Data Science Fundamentals',
        description: 'Introduction to data science concepts, tools, and methodologies.',
        code: 'DS201',
        semester: 'Fall',
        year: 2024,
        isActive: true,
        instructorId: instructor1.id
      }
    })
    console.log(`  Created course (no enrollments): ${course3.code}`)

    console.log('  Total courses: 3')
    console.log('')

    // ========================================
    // 3. Create Enrollments
    // ========================================
    console.log('Creating enrollments...')

    // Enroll students in course1
    await prisma.enrollment.create({
      data: {
        userId: student1.id,
        courseId: course1.id
      }
    })
    await prisma.enrollment.create({
      data: {
        userId: student2.id,
        courseId: course1.id
      }
    })

    // Enroll student1 in course2 (inactive course - edge case)
    await prisma.enrollment.create({
      data: {
        userId: student1.id,
        courseId: course2.id
      }
    })

    // course3 has no enrollments (edge case)

    console.log('  Total enrollments: 3')
    console.log('')

    // ========================================
    // 4. Create Assignments (10 total)
    // ========================================
    console.log('Creating assignments...')

    const assignments = []

    // Course 1 assignments (6 assignments)
    for (let i = 1; i <= 6; i++) {
      const assignment = await prisma.assignment.create({
        data: {
          title: `AI Assignment ${i}`,
          description: `Complete the AI assignment ${i} covering key concepts.`,
          dueDate: i <= 3 ? daysAgo(i * 7) : daysFromNow(i * 7), // 3 past due, 3 future
          maxPoints: 100,
          isPublished: true,
          courseId: course1.id,
          createdById: instructor1.id
        }
      })
      assignments.push(assignment)
    }

    // Course 2 assignments (3 assignments)
    for (let i = 1; i <= 3; i++) {
      const assignment = await prisma.assignment.create({
        data: {
          title: `ML Assignment ${i}`,
          description: `Advanced ML assignment ${i}.`,
          dueDate: daysFromNow(i * 14),
          maxPoints: 150,
          isPublished: i !== 3, // Last one unpublished
          courseId: course2.id,
          createdById: instructor2.id
        }
      })
      assignments.push(assignment)
    }

    // Course 3 assignment (1 assignment with no submissions - edge case)
    const emptyAssignment = await prisma.assignment.create({
      data: {
        title: 'DS Introduction Quiz',
        description: 'Introductory quiz for data science fundamentals.',
        dueDate: daysFromNow(30),
        maxPoints: 50,
        isPublished: true,
        courseId: course3.id,
        createdById: instructor1.id
      }
    })
    assignments.push(emptyAssignment)

    console.log('  Total assignments: 10')
    console.log('')

    // ========================================
    // 5. Create Submissions (20 total)
    // ========================================
    console.log('Creating submissions...')

    let submissionCount = 0

    // Student submissions for course1 assignments
    for (let i = 0; i < 6; i++) {
      // Student 1 submissions
      await prisma.submission.create({
        data: {
          content: `Student 1's submission for ${assignments[i].title}. This is a detailed response covering all required topics.`,
          fileUrl: i % 2 === 0 ? '/uploads/submission-s1-a' + i + '.pdf' : null,
          assignmentId: assignments[i].id,
          studentId: student1.id
        }
      })
      submissionCount++

      // Student 2 submissions (skip every 3rd to have some unsubmitted)
      if (i % 3 !== 2) {
        await prisma.submission.create({
          data: {
            content: `Student 2's work on ${assignments[i].title}.`,
            fileUrl: i % 2 === 1 ? '/uploads/submission-s2-a' + i + '.pdf' : null,
            assignmentId: assignments[i].id,
            studentId: student2.id
          }
        })
        submissionCount++
      }
    }

    // Student 1 submission for course2 (enrolled in inactive course)
    for (let i = 6; i < 8; i++) {
      await prisma.submission.create({
        data: {
          content: `Advanced ML submission for ${assignments[i].title}.`,
          assignmentId: assignments[i].id,
          studentId: student1.id
        }
      })
      submissionCount++
    }

    console.log(`  Total submissions: ${submissionCount}`)
    console.log('')

    // ========================================
    // 6. Create Grades
    // ========================================
    console.log('Creating grades...')

    // Get all submissions to grade some of them
    const submissions = await prisma.submission.findMany({
      take: 10 // Grade first 10 submissions
    })

    let gradeCount = 0
    for (const submission of submissions) {
      await prisma.grade.create({
        data: {
          points: Math.floor(Math.random() * 30) + 70, // 70-100 points
          feedback: `Good work on this assignment. ${Math.random() > 0.5 ? 'Consider reviewing the key concepts again.' : 'Excellent understanding demonstrated.'}`,
          assignmentId: submission.assignmentId,
          studentId: submission.studentId,
          gradedById: instructor1.id
        }
      })
      gradeCount++
    }

    console.log(`  Total grades: ${gradeCount}`)
    console.log('')

    // ========================================
    // 7. Create Discussions (with nested posts)
    // ========================================
    console.log('Creating discussions...')

    const discussion1 = await prisma.discussion.create({
      data: {
        title: 'Welcome to AI 101',
        description: 'Introduce yourself and share your learning goals.',
        isPinned: true,
        courseId: course1.id,
        createdBy: instructor1.id
      }
    })

    const discussion2 = await prisma.discussion.create({
      data: {
        title: 'Neural Networks Deep Dive',
        description: 'Discuss neural network architectures and their applications.',
        courseId: course1.id,
        createdBy: instructor1.id
      }
    })

    // Locked discussion (edge case)
    await prisma.discussion.create({
      data: {
        title: 'Course Policies [LOCKED]',
        description: 'Important course policies - read only.',
        isLocked: true,
        courseId: course1.id,
        createdBy: instructor1.id
      }
    })

    console.log('  Total discussions: 3')
    console.log('')

    // ========================================
    // 8. Create Discussion Posts (3 levels deep)
    // ========================================
    console.log('Creating discussion posts (nested)...')

    // Level 1: Root posts
    const post1 = await prisma.discussionPost.create({
      data: {
        content: 'Hello everyone! I am excited to learn about AI. My goal is to understand machine learning fundamentals.',
        discussionId: discussion1.id,
        authorId: student1.id
      }
    })

    const post2 = await prisma.discussionPost.create({
      data: {
        content: 'Welcome to the course! Great to have you here. Feel free to ask questions anytime.',
        discussionId: discussion1.id,
        authorId: instructor1.id
      }
    })

    // Level 2: Replies to root posts
    const reply1 = await prisma.discussionPost.create({
      data: {
        content: 'Thanks for the warm welcome! I have a question about the first assignment.',
        discussionId: discussion1.id,
        authorId: student1.id,
        parentId: post2.id
      }
    })

    await prisma.discussionPost.create({
      data: {
        content: 'Hi Alice! I am also new here. Looking forward to learning together.',
        discussionId: discussion1.id,
        authorId: student2.id,
        parentId: post1.id
      }
    })

    // Level 3: Nested replies (3 levels deep)
    await prisma.discussionPost.create({
      data: {
        content: 'Sure, what is your question about the assignment? I am happy to help clarify.',
        discussionId: discussion1.id,
        authorId: instructor1.id,
        parentId: reply1.id
      }
    })

    // More posts for discussion2
    await prisma.discussionPost.create({
      data: {
        content: 'Can someone explain the difference between CNN and RNN?',
        discussionId: discussion2.id,
        authorId: student2.id
      }
    })

    await prisma.discussionPost.create({
      data: {
        content: 'CNNs are great for spatial data like images, while RNNs excel at sequential data like text or time series.',
        discussionId: discussion2.id,
        authorId: instructor1.id
      }
    })

    console.log('  Total discussion posts: 7 (including 3-level nesting)')
    console.log('')

    // ========================================
    // 9. Create Announcements
    // ========================================
    console.log('Creating announcements...')

    await prisma.announcement.create({
      data: {
        title: 'Welcome to Fall 2024!',
        content: 'Welcome to the AI 101 course! Please review the syllabus and complete the first assignment by the due date.',
        courseId: course1.id,
        authorId: instructor1.id
      }
    })

    await prisma.announcement.create({
      data: {
        title: 'Office Hours Update',
        content: 'Office hours will now be held on Tuesdays and Thursdays from 2-4 PM.',
        courseId: course1.id,
        authorId: instructor1.id
      }
    })

    await prisma.announcement.create({
      data: {
        title: 'Course Materials Available',
        content: 'The advanced ML course materials are now available in the content section.',
        courseId: course2.id,
        authorId: instructor2.id
      }
    })

    console.log('  Total announcements: 3')
    console.log('')

    // ========================================
    // 10. Create Course Content (multiple types)
    // ========================================
    console.log('Creating course content (multiple types)...')

    // TEXT content
    await prisma.courseContent.create({
      data: {
        title: 'Introduction to AI - Lecture Notes',
        type: ContentType.TEXT,
        content: '# Introduction to Artificial Intelligence\n\nThis lecture covers the fundamentals of AI including:\n- History of AI\n- Key concepts and terminology\n- Current applications',
        orderIndex: 1,
        isPublished: true,
        courseId: course1.id
      }
    })

    // VIDEO content
    await prisma.courseContent.create({
      data: {
        title: 'Machine Learning Overview',
        type: ContentType.VIDEO,
        fileUrl: '/uploads/videos/ml-overview.mp4',
        thumbnailUrl: '/uploads/thumbnails/ml-overview.jpg',
        orderIndex: 2,
        isPublished: true,
        courseId: course1.id
      }
    })

    // DOCUMENT content
    await prisma.courseContent.create({
      data: {
        title: 'Course Syllabus',
        type: ContentType.DOCUMENT,
        fileUrl: '/uploads/docs/syllabus.pdf',
        orderIndex: 3,
        isPublished: true,
        courseId: course1.id
      }
    })

    // LINK content
    await prisma.courseContent.create({
      data: {
        title: 'Additional Resources',
        type: ContentType.LINK,
        content: 'https://example.com/ai-resources',
        orderIndex: 4,
        isPublished: true,
        courseId: course1.id
      }
    })

    // YOUTUBE content
    await prisma.courseContent.create({
      data: {
        title: 'TED Talk: The Future of AI',
        type: ContentType.YOUTUBE,
        content: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        orderIndex: 5,
        isPublished: true,
        courseId: course1.id
      }
    })

    // SCORM content (edge case)
    await prisma.courseContent.create({
      data: {
        title: 'Interactive AI Module',
        type: ContentType.SCORM,
        fileUrl: '/uploads/scorm/ai-module.zip',
        orderIndex: 6,
        isPublished: false, // Unpublished
        courseId: course1.id
      }
    })

    // Content for course 2
    await prisma.courseContent.create({
      data: {
        title: 'Deep Learning Fundamentals',
        type: ContentType.TEXT,
        content: '# Deep Learning\n\nAdvanced topics in neural networks...',
        orderIndex: 1,
        isPublished: true,
        courseId: course2.id
      }
    })

    console.log('  Total course content: 7 (6 types)')
    console.log('')

    // ========================================
    // Summary
    // ========================================
    console.log('='.repeat(60))
    console.log('SEED COMPLETE')
    console.log('='.repeat(60))
    console.log('')
    console.log('Summary:')
    console.log('  Users: 5 (1 admin, 2 instructors, 2 students)')
    console.log('  Courses: 3 (1 active, 1 inactive, 1 empty)')
    console.log('  Enrollments: 3')
    console.log('  Assignments: 10')
    console.log(`  Submissions: ${submissionCount}`)
    console.log(`  Grades: ${gradeCount}`)
    console.log('  Discussions: 3 (including locked)')
    console.log('  Discussion Posts: 7 (3-level nesting)')
    console.log('  Announcements: 3')
    console.log('  Course Content: 7 (all content types)')
    console.log('')
    console.log('Edge cases included:')
    console.log('  - Inactive course with enrollments')
    console.log('  - Course with no enrollments')
    console.log('  - Assignment with no submissions')
    console.log('  - Unpublished assignments and content')
    console.log('  - Locked discussion')
    console.log('  - Nested discussion posts (3 levels)')
    console.log('  - All content types (TEXT, VIDEO, DOCUMENT, LINK, YOUTUBE, SCORM)')
    console.log('')
    console.log('Test credentials:')
    console.log('  Password for all users: Test123!')
    console.log('  Admin: admin@aigurus.test')
    console.log('  Instructor 1: instructor1@aigurus.test')
    console.log('  Instructor 2: instructor2@aigurus.test')
    console.log('  Student 1: student1@aigurus.test')
    console.log('  Student 2: student2@aigurus.test')
    console.log('')

  } catch (error) {
    console.error('Seed failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run seed
seedSampleData()
  .then(() => {
    console.log('Seed completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
