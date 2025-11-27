/**
 * Gradebook API Integration Tests
 * Story: 2.1 - Gradebook Grid View Implementation
 * Story: 2.2 - Gradebook Inline Editing with Confirmation
 * AC: 2.1.9, 2.2.9
 */

import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Create mock at module scope
const prismaMock = mockDeep<PrismaClient>() as DeepMockProxy<PrismaClient>;

// Mock the Prisma module
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get prisma() {
    return prismaMock;
  },
}));

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock rate limiting (allow all requests in tests)
jest.mock('@/lib/rate-limit', () => ({
  applyUserRateLimit: jest.fn().mockResolvedValue(null),
}));

import { getServerSession } from 'next-auth';
import { GET } from '@/app/api/instructor/gradebook/[courseId]/route';
import { PUT } from '@/app/api/instructor/gradebook/[courseId]/grade/route';

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

// Test data fixtures
const mockInstructor = {
  id: 'instructor-1',
  email: 'instructor@test.com',
  name: 'Test',
  surname: 'Instructor',
  role: 'INSTRUCTOR' as const,
};

const mockStudent1 = {
  id: 'student-1',
  email: 'student1@test.com',
  name: 'Alice',
  surname: 'Smith',
};

const mockStudent2 = {
  id: 'student-2',
  email: 'student2@test.com',
  name: 'Bob',
  surname: 'Jones',
};

const mockCourse = {
  id: 'course-1',
  title: 'Introduction to AI',
  code: 'CS101',
  instructorId: 'instructor-1',
  deletedAt: null,
};

const mockAssignment1 = {
  id: 'assignment-1',
  title: 'Assignment 1',
  maxPoints: 100,
  dueDate: new Date('2025-01-15'),
  isPublished: true,
  deletedAt: null,
  grades: [
    { id: 'grade-1', studentId: 'student-1', points: 85, deletedAt: null },
    { id: 'grade-2', studentId: 'student-2', points: 90, deletedAt: null },
  ],
  submissions: [
    { id: 'sub-1', studentId: 'student-1', submittedAt: new Date('2025-01-14') },
    { id: 'sub-2', studentId: 'student-2', submittedAt: new Date('2025-01-14') },
  ],
};

const mockAssignment2 = {
  id: 'assignment-2',
  title: 'Assignment 2',
  maxPoints: 50,
  dueDate: new Date('2025-01-20'),
  isPublished: true,
  deletedAt: null,
  grades: [{ id: 'grade-3', studentId: 'student-1', points: 45, deletedAt: null }],
  submissions: [
    { id: 'sub-3', studentId: 'student-1', submittedAt: new Date('2025-01-19') },
    { id: 'sub-4', studentId: 'student-2', submittedAt: new Date('2025-01-21') }, // Late
  ],
};

// Helper to create request
function createRequest(courseId: string) {
  return new Request(`http://localhost:3000/api/instructor/gradebook/${courseId}`, {
    method: 'GET',
  });
}

// Reset mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
  jest.clearAllMocks();
});

describe('GET /api/instructor/gradebook/[courseId]', () => {
  describe('Authentication', () => {
    it('returns 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createRequest('course-1');
      const response = await GET(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 403 if user is not instructor', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'student-1', role: 'STUDENT', email: 'student@test.com' },
      } as any);

      const request = createRequest('course-1');
      const response = await GET(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Authorization', () => {
    it('returns 404 if course does not exist', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'instructor-1', role: 'INSTRUCTOR', email: 'instructor@test.com' },
      } as any);

      prismaMock.course.findUnique.mockResolvedValue(null);

      const request = createRequest('non-existent');
      const response = await GET(request, {
        params: Promise.resolve({ courseId: 'non-existent' }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('returns 403 if instructor does not own the course', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'other-instructor', role: 'INSTRUCTOR', email: 'other@test.com' },
      } as any);

      prismaMock.course.findUnique.mockResolvedValue(mockCourse as any);

      const request = createRequest('course-1');
      const response = await GET(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error.code).toBe('FORBIDDEN');
      expect(data.error.message).toBe('Not instructor for this course');
    });

    it('allows admin to access any course', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN', email: 'admin@test.com' },
      } as any);

      prismaMock.course.findUnique.mockResolvedValue(mockCourse as any);
      prismaMock.enrollment.findMany.mockResolvedValue([]);
      prismaMock.assignment.findMany.mockResolvedValue([]);

      const request = createRequest('course-1');
      const response = await GET(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Response Structure', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'instructor-1', role: 'INSTRUCTOR', email: 'instructor@test.com' },
      } as any);

      prismaMock.course.findUnique.mockResolvedValue(mockCourse as any);
    });

    it('returns 200 with valid GradebookMatrix structure', async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([
        { id: 'enrollment-1', userId: 'student-1', user: mockStudent1 },
        { id: 'enrollment-2', userId: 'student-2', user: mockStudent2 },
      ] as any);

      prismaMock.assignment.findMany.mockResolvedValue([
        mockAssignment1,
        mockAssignment2,
      ] as any);

      const request = createRequest('course-1');
      const response = await GET(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.data).toHaveProperty('students');
      expect(data.data).toHaveProperty('assignments');
      expect(data.data).toHaveProperty('courseId');
      expect(data.data).toHaveProperty('courseTitle');
      expect(data.data).toHaveProperty('courseCode');
    });

    it('includes all enrolled students', async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([
        { id: 'enrollment-1', userId: 'student-1', user: mockStudent1 },
        { id: 'enrollment-2', userId: 'student-2', user: mockStudent2 },
      ] as any);

      prismaMock.assignment.findMany.mockResolvedValue([mockAssignment1] as any);

      const request = createRequest('course-1');
      const response = await GET(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      const data = await response.json();
      expect(data.data.students).toHaveLength(2);
      expect(data.data.students[0].name).toBe('Alice Smith');
      expect(data.data.students[1].name).toBe('Bob Jones');
    });

    it('includes all published assignments', async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([
        { id: 'enrollment-1', userId: 'student-1', user: mockStudent1 },
      ] as any);

      prismaMock.assignment.findMany.mockResolvedValue([
        mockAssignment1,
        mockAssignment2,
      ] as any);

      const request = createRequest('course-1');
      const response = await GET(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      const data = await response.json();
      expect(data.data.assignments).toHaveLength(2);
      expect(data.data.assignments[0].title).toBe('Assignment 1');
      expect(data.data.assignments[1].title).toBe('Assignment 2');
    });

    it('correctly maps grades to student/assignment combinations', async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([
        { id: 'enrollment-1', userId: 'student-1', user: mockStudent1 },
      ] as any);

      prismaMock.assignment.findMany.mockResolvedValue([mockAssignment1] as any);

      const request = createRequest('course-1');
      const response = await GET(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      const data = await response.json();
      const student = data.data.students[0];
      expect(student.grades).toHaveLength(1);
      expect(student.grades[0].assignmentId).toBe('assignment-1');
      expect(student.grades[0].score).toBe(85);
      expect(student.grades[0].status).toBe('graded');
    });
  });

  describe('Grade Status Calculation', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'instructor-1', role: 'INSTRUCTOR', email: 'instructor@test.com' },
      } as any);

      prismaMock.course.findUnique.mockResolvedValue(mockCourse as any);
    });

    it('marks cell as graded when grade exists', async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([
        { id: 'enrollment-1', userId: 'student-1', user: mockStudent1 },
      ] as any);

      prismaMock.assignment.findMany.mockResolvedValue([mockAssignment1] as any);

      const request = createRequest('course-1');
      const response = await GET(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      const data = await response.json();
      const grade = data.data.students[0].grades[0];
      expect(grade.status).toBe('graded');
      expect(grade.score).toBe(85);
    });

    it('marks cell as pending when submitted but not graded', async () => {
      const assignmentWithPending = {
        ...mockAssignment1,
        grades: [],
        submissions: [
          { id: 'sub-1', studentId: 'student-1', submittedAt: new Date('2025-01-14') },
        ],
      };

      prismaMock.enrollment.findMany.mockResolvedValue([
        { id: 'enrollment-1', userId: 'student-1', user: mockStudent1 },
      ] as any);

      prismaMock.assignment.findMany.mockResolvedValue([assignmentWithPending] as any);

      const request = createRequest('course-1');
      const response = await GET(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      const data = await response.json();
      const grade = data.data.students[0].grades[0];
      expect(grade.status).toBe('pending');
      expect(grade.score).toBeNull();
    });

    it('marks cell as late when submitted after due date', async () => {
      const assignmentWithLate = {
        id: 'assignment-1',
        title: 'Assignment 1',
        maxPoints: 100,
        dueDate: new Date('2025-01-10'),
        isPublished: true,
        deletedAt: null,
        grades: [],
        submissions: [
          { id: 'sub-1', studentId: 'student-1', submittedAt: new Date('2025-01-15') }, // After due date
        ],
      };

      prismaMock.enrollment.findMany.mockResolvedValue([
        { id: 'enrollment-1', userId: 'student-1', user: mockStudent1 },
      ] as any);

      prismaMock.assignment.findMany.mockResolvedValue([assignmentWithLate] as any);

      const request = createRequest('course-1');
      const response = await GET(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      const data = await response.json();
      const grade = data.data.students[0].grades[0];
      expect(grade.status).toBe('late');
    });

    it('marks cell as missing when no submission', async () => {
      const assignmentWithMissing = {
        id: 'assignment-1',
        title: 'Assignment 1',
        maxPoints: 100,
        dueDate: new Date('2025-01-01'), // Past due
        isPublished: true,
        deletedAt: null,
        grades: [],
        submissions: [],
      };

      prismaMock.enrollment.findMany.mockResolvedValue([
        { id: 'enrollment-1', userId: 'student-1', user: mockStudent1 },
      ] as any);

      prismaMock.assignment.findMany.mockResolvedValue([assignmentWithMissing] as any);

      const request = createRequest('course-1');
      const response = await GET(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      const data = await response.json();
      const grade = data.data.students[0].grades[0];
      expect(grade.status).toBe('missing');
    });
  });

  describe('GPA Calculation', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'instructor-1', role: 'INSTRUCTOR', email: 'instructor@test.com' },
      } as any);

      prismaMock.course.findUnique.mockResolvedValue(mockCourse as any);
    });

    it('calculates GPA correctly for student with all grades', async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([
        { id: 'enrollment-1', userId: 'student-1', user: mockStudent1 },
      ] as any);

      // Student 1 has 85/100 (85%) and 45/50 (90%) = average ~87% = B = 3.0 GPA
      prismaMock.assignment.findMany.mockResolvedValue([
        mockAssignment1,
        mockAssignment2,
      ] as any);

      const request = createRequest('course-1');
      const response = await GET(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      const data = await response.json();
      const student = data.data.students[0];
      expect(student.gpa).toBeGreaterThanOrEqual(3.0);
      expect(student.gpa).toBeLessThanOrEqual(4.0);
    });

    it('returns null GPA when no grades exist', async () => {
      const assignmentNoGrades = {
        ...mockAssignment1,
        grades: [],
        submissions: [],
      };

      prismaMock.enrollment.findMany.mockResolvedValue([
        { id: 'enrollment-1', userId: 'student-1', user: mockStudent1 },
      ] as any);

      prismaMock.assignment.findMany.mockResolvedValue([assignmentNoGrades] as any);

      const request = createRequest('course-1');
      const response = await GET(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      const data = await response.json();
      expect(data.data.students[0].gpa).toBeNull();
    });

    it('calculates percentage correctly', async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([
        { id: 'enrollment-1', userId: 'student-1', user: mockStudent1 },
      ] as any);

      // Student 1 has 85/100 + 45/50 = 130/150 = 86.67%
      prismaMock.assignment.findMany.mockResolvedValue([
        mockAssignment1,
        mockAssignment2,
      ] as any);

      const request = createRequest('course-1');
      const response = await GET(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      const data = await response.json();
      const student = data.data.students[0];
      expect(student.percentage).toBeCloseTo(86.67, 0);
      expect(student.totalPoints).toBe(130);
    });
  });

  describe('Empty States', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'instructor-1', role: 'INSTRUCTOR', email: 'instructor@test.com' },
      } as any);

      prismaMock.course.findUnique.mockResolvedValue(mockCourse as any);
    });

    it('returns empty students array when no enrollments', async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([]);
      prismaMock.assignment.findMany.mockResolvedValue([mockAssignment1] as any);

      const request = createRequest('course-1');
      const response = await GET(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      const data = await response.json();
      expect(data.data.students).toHaveLength(0);
    });

    it('returns empty assignments array when no assignments', async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([
        { id: 'enrollment-1', userId: 'student-1', user: mockStudent1 },
      ] as any);
      prismaMock.assignment.findMany.mockResolvedValue([]);

      const request = createRequest('course-1');
      const response = await GET(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      const data = await response.json();
      expect(data.data.assignments).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('returns 500 for database errors', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'instructor-1', role: 'INSTRUCTOR', email: 'instructor@test.com' },
      } as any);

      prismaMock.course.findUnique.mockRejectedValue(new Error('DB connection failed'));

      const request = createRequest('course-1');
      const response = await GET(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });
});

/**
 * PUT /api/instructor/gradebook/[courseId]/grade Tests
 * Story: 2.2 - Gradebook Inline Editing with Confirmation
 */
describe('PUT /api/instructor/gradebook/[courseId]/grade', () => {
  // Helper to create PUT request
  function createPutRequest(courseId: string, body: object) {
    return new Request(
      `http://localhost:3000/api/instructor/gradebook/${courseId}/grade`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
  }

  // Mock submission for grade tests
  const mockSubmission = {
    id: 'cjld2cjxh0000qzrmn831i7rn',
    studentId: 'student-1',
    assignmentId: 'assignment-1',
    assignment: {
      id: 'assignment-1',
      courseId: 'course-1',
      maxPoints: 100,
      title: 'Assignment 1',
      deletedAt: null,
    },
  };

  describe('Authentication', () => {
    it('returns 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createPutRequest('course-1', {
        submissionId: mockSubmission.id,
        grade: 85,
      });
      const response = await PUT(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 403 if user is not instructor', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'student-1', role: 'STUDENT', email: 'student@test.com' },
      } as any);

      const request = createPutRequest('course-1', {
        submissionId: mockSubmission.id,
        grade: 85,
      });
      const response = await PUT(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'instructor-1', role: 'INSTRUCTOR', email: 'instructor@test.com' },
      } as any);
      prismaMock.course.findUnique.mockResolvedValue(mockCourse as any);
    });

    it('returns 400 for missing submissionId', async () => {
      const request = createPutRequest('course-1', {
        grade: 85,
      });
      const response = await PUT(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_INPUT');
    });

    it('returns 400 for invalid submissionId format', async () => {
      const request = createPutRequest('course-1', {
        submissionId: 'invalid-id',
        grade: 85,
      });
      const response = await PUT(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_INPUT');
    });

    it('returns 400 for negative grade', async () => {
      const request = createPutRequest('course-1', {
        submissionId: mockSubmission.id,
        grade: -5,
      });
      const response = await PUT(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_INPUT');
    });

    it('returns 400 for grade exceeding max points', async () => {
      prismaMock.submission.findUnique.mockResolvedValue(mockSubmission as any);

      const request = createPutRequest('course-1', {
        submissionId: mockSubmission.id,
        grade: 150, // Exceeds max of 100
      });
      const response = await PUT(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_INPUT');
    });

    it('returns 400 for missing grade', async () => {
      const request = createPutRequest('course-1', {
        submissionId: mockSubmission.id,
      });
      const response = await PUT(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('INVALID_INPUT');
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'instructor-1', role: 'INSTRUCTOR', email: 'instructor@test.com' },
      } as any);
    });

    it('returns 404 if course does not exist', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      const request = createPutRequest('non-existent', {
        submissionId: mockSubmission.id,
        grade: 85,
      });
      const response = await PUT(request, {
        params: Promise.resolve({ courseId: 'non-existent' }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('returns 403 if instructor does not own the course', async () => {
      prismaMock.course.findUnique.mockResolvedValue({
        ...mockCourse,
        instructorId: 'other-instructor',
      } as any);

      const request = createPutRequest('course-1', {
        submissionId: mockSubmission.id,
        grade: 85,
      });
      const response = await PUT(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('returns 404 if submission does not exist', async () => {
      prismaMock.course.findUnique.mockResolvedValue(mockCourse as any);
      prismaMock.submission.findUnique.mockResolvedValue(null);

      const request = createPutRequest('course-1', {
        submissionId: mockSubmission.id,
        grade: 85,
      });
      const response = await PUT(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('returns 404 if submission is for different course', async () => {
      prismaMock.course.findUnique.mockResolvedValue(mockCourse as any);
      prismaMock.submission.findUnique.mockResolvedValue({
        ...mockSubmission,
        assignment: {
          ...mockSubmission.assignment,
          courseId: 'other-course',
        },
      } as any);

      const request = createPutRequest('course-1', {
        submissionId: mockSubmission.id,
        grade: 85,
      });
      const response = await PUT(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error.message).toContain('not found');
    });
  });

  describe('Successful Grade Update', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'instructor-1', role: 'INSTRUCTOR', email: 'instructor@test.com' },
      } as any);
      prismaMock.course.findUnique.mockResolvedValue(mockCourse as any);
      prismaMock.submission.findUnique.mockResolvedValue(mockSubmission as any);
    });

    it('creates new grade when none exists', async () => {
      prismaMock.grade.findUnique.mockResolvedValue(null);
      prismaMock.grade.upsert.mockResolvedValue({
        id: 'new-grade-id',
        points: 85,
        studentId: 'student-1',
        assignmentId: 'assignment-1',
        gradedById: 'instructor-1',
        gradedAt: new Date(),
        feedback: null,
        deletedAt: null,
      } as any);

      const request = createPutRequest('course-1', {
        submissionId: mockSubmission.id,
        grade: 85,
      });
      const response = await PUT(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.grade.points).toBe(85);
      expect(data.previousPoints).toBeNull();
    });

    it('updates existing grade', async () => {
      prismaMock.grade.findUnique.mockResolvedValue({
        id: 'existing-grade-id',
        points: 75, // Previous grade
      } as any);
      prismaMock.grade.upsert.mockResolvedValue({
        id: 'existing-grade-id',
        points: 90,
        studentId: 'student-1',
        assignmentId: 'assignment-1',
        gradedById: 'instructor-1',
        gradedAt: new Date(),
        feedback: null,
        deletedAt: null,
      } as any);

      const request = createPutRequest('course-1', {
        submissionId: mockSubmission.id,
        grade: 90,
      });
      const response = await PUT(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.grade.points).toBe(90);
      expect(data.previousPoints).toBe(75);
    });

    it('accepts decimal grades', async () => {
      prismaMock.grade.findUnique.mockResolvedValue(null);
      prismaMock.grade.upsert.mockResolvedValue({
        id: 'new-grade-id',
        points: 85.5,
        studentId: 'student-1',
        assignmentId: 'assignment-1',
        gradedById: 'instructor-1',
        gradedAt: new Date(),
        feedback: null,
        deletedAt: null,
      } as any);

      const request = createPutRequest('course-1', {
        submissionId: mockSubmission.id,
        grade: 85.5,
      });
      const response = await PUT(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.grade.points).toBe(85.5);
    });

    it('accepts grade of 0', async () => {
      prismaMock.grade.findUnique.mockResolvedValue(null);
      prismaMock.grade.upsert.mockResolvedValue({
        id: 'new-grade-id',
        points: 0,
        studentId: 'student-1',
        assignmentId: 'assignment-1',
        gradedById: 'instructor-1',
        gradedAt: new Date(),
        feedback: null,
        deletedAt: null,
      } as any);

      const request = createPutRequest('course-1', {
        submissionId: mockSubmission.id,
        grade: 0,
      });
      const response = await PUT(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.grade.points).toBe(0);
    });

    it('allows admin to update grades for any course', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN', email: 'admin@test.com' },
      } as any);

      prismaMock.grade.findUnique.mockResolvedValue(null);
      prismaMock.grade.upsert.mockResolvedValue({
        id: 'new-grade-id',
        points: 85,
        studentId: 'student-1',
        assignmentId: 'assignment-1',
        gradedById: 'admin-1',
        gradedAt: new Date(),
        feedback: null,
        deletedAt: null,
      } as any);

      const request = createPutRequest('course-1', {
        submissionId: mockSubmission.id,
        grade: 85,
      });
      const response = await PUT(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'instructor-1', role: 'INSTRUCTOR', email: 'instructor@test.com' },
      } as any);
      prismaMock.course.findUnique.mockResolvedValue(mockCourse as any);
      prismaMock.submission.findUnique.mockResolvedValue(mockSubmission as any);
    });

    it('returns 500 for database errors on grade upsert', async () => {
      prismaMock.grade.findUnique.mockResolvedValue(null);
      prismaMock.grade.upsert.mockRejectedValue(new Error('DB connection failed'));

      const request = createPutRequest('course-1', {
        submissionId: mockSubmission.id,
        grade: 85,
      });
      const response = await PUT(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
