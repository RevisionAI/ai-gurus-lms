/**
 * Student GPA API Integration Tests
 *
 * Story: 2-4-gpa-calculation-implementation
 * AC: 2.4.2, 2.4.4, 2.4.6
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

// Mock NextResponse for Jest environment
jest.mock('next/server', () => {
  return {
    NextRequest: jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      return new Request(url, init);
    }),
    NextResponse: {
      json: (data: unknown, init?: ResponseInit) => {
        return new Response(JSON.stringify(data), {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            ...init?.headers,
          },
        });
      },
    },
  };
});

import { getServerSession } from 'next-auth';
import { GET as getCourseGPA } from '@/app/api/students/gpa/course/[courseId]/route';
import { GET as getOverallGPA } from '@/app/api/students/gpa/overall/route';

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

// Test data fixtures
const mockStudent = {
  id: 'student-1',
  email: 'student@test.com',
  name: 'Alice',
  surname: 'Smith',
  role: 'STUDENT' as const,
};

const mockCourse = {
  id: 'course-1',
  title: 'Introduction to AI',
  code: 'CS101',
  deletedAt: null,
};

const mockCourse2 = {
  id: 'course-2',
  title: 'Data Science',
  code: 'DS201',
  deletedAt: null,
};

const mockEnrollment = {
  userId: 'student-1',
  courseId: 'course-1',
};

// Grade data for 12-point scale testing
const mockGradesA = [
  {
    id: 'grade-1',
    points: 95,
    deletedAt: null,
    assignment: { maxPoints: 100, deletedAt: null },
  },
];

const mockGradesB = [
  {
    id: 'grade-2',
    points: 85,
    deletedAt: null,
    assignment: { maxPoints: 100, deletedAt: null },
  },
];

const mockGradesC = [
  {
    id: 'grade-3',
    points: 75,
    deletedAt: null,
    assignment: { maxPoints: 100, deletedAt: null },
  },
];

// Reset mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
  jest.clearAllMocks();
});

describe('GET /api/students/gpa/course/[courseId]', () => {
  // Helper to create request
  function createRequest(courseId: string) {
    return new Request(
      `http://localhost:3000/api/students/gpa/course/${courseId}`,
      {
        method: 'GET',
      }
    );
  }

  describe('Authentication', () => {
    it('returns 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createRequest('course-1');
      const response = await getCourseGPA(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: mockStudent,
      } as any);
    });

    it('returns 404 if course does not exist', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      const request = createRequest('non-existent');
      const response = await getCourseGPA(request, {
        params: Promise.resolve({ courseId: 'non-existent' }),
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Course not found');
    });

    it('returns 403 if student is not enrolled', async () => {
      prismaMock.course.findUnique.mockResolvedValue(mockCourse as any);
      prismaMock.enrollment.findUnique.mockResolvedValue(null);

      const request = createRequest('course-1');
      const response = await getCourseGPA(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Not enrolled in this course');
    });
  });

  describe('GPA Calculation - 12-Point Scale', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: mockStudent,
      } as any);
      prismaMock.course.findUnique.mockResolvedValue(mockCourse as any);
      prismaMock.enrollment.findUnique.mockResolvedValue(mockEnrollment as any);
    });

    it('calculates 4.0 GPA for A grade (93-100%)', async () => {
      prismaMock.grade.findMany.mockResolvedValue([
        {
          id: 'grade-1',
          points: 95,
          deletedAt: null,
          assignment: { maxPoints: 100, deletedAt: null },
        },
      ] as any);

      const request = createRequest('course-1');
      const response = await getCourseGPA(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.gpa).toBe(4.0);
      expect(data.letterGrade).toBe('A');
      expect(data.isCalculated).toBe(true);
    });

    it('calculates 3.7 GPA for A- grade (90-92.9%)', async () => {
      prismaMock.grade.findMany.mockResolvedValue([
        {
          id: 'grade-1',
          points: 91,
          deletedAt: null,
          assignment: { maxPoints: 100, deletedAt: null },
        },
      ] as any);

      const request = createRequest('course-1');
      const response = await getCourseGPA(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      const data = await response.json();
      expect(data.gpa).toBe(3.7);
      expect(data.letterGrade).toBe('A-');
    });

    it('calculates 3.3 GPA for B+ grade (87-89.9%)', async () => {
      prismaMock.grade.findMany.mockResolvedValue([
        {
          id: 'grade-1',
          points: 88,
          deletedAt: null,
          assignment: { maxPoints: 100, deletedAt: null },
        },
      ] as any);

      const request = createRequest('course-1');
      const response = await getCourseGPA(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      const data = await response.json();
      expect(data.gpa).toBe(3.3);
      expect(data.letterGrade).toBe('B+');
    });

    it('calculates 3.0 GPA for B grade (83-86.9%)', async () => {
      prismaMock.grade.findMany.mockResolvedValue([
        {
          id: 'grade-1',
          points: 85,
          deletedAt: null,
          assignment: { maxPoints: 100, deletedAt: null },
        },
      ] as any);

      const request = createRequest('course-1');
      const response = await getCourseGPA(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      const data = await response.json();
      expect(data.gpa).toBe(3.0);
      expect(data.letterGrade).toBe('B');
    });

    it('returns N/A when no grades exist', async () => {
      prismaMock.grade.findMany.mockResolvedValue([]);

      const request = createRequest('course-1');
      const response = await getCourseGPA(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      const data = await response.json();
      expect(data.gpa).toBeNull();
      expect(data.letterGrade).toBe('N/A');
      expect(data.isCalculated).toBe(false);
      expect(data.gradedCount).toBe(0);
    });

    it('includes course info in response', async () => {
      prismaMock.grade.findMany.mockResolvedValue(mockGradesA as any);

      const request = createRequest('course-1');
      const response = await getCourseGPA(request, {
        params: Promise.resolve({ courseId: 'course-1' }),
      });

      const data = await response.json();
      expect(data.courseId).toBe('course-1');
      expect(data.courseTitle).toBe('Introduction to AI');
      expect(data.courseCode).toBe('CS101');
    });
  });
});

describe('GET /api/students/gpa/overall', () => {
  describe('Authentication', () => {
    it('returns 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const response = await getOverallGPA();

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Overall GPA Calculation', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: mockStudent,
      } as any);
    });

    it('returns N/A when student has no enrollments', async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([]);

      const response = await getOverallGPA();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.overallGPA).toBeNull();
      expect(data.letterGrade).toBe('N/A');
      expect(data.isCalculated).toBe(false);
      expect(data.courseGPAs).toHaveLength(0);
      expect(data.courseCount).toBe(0);
    });

    it('calculates overall GPA across multiple courses', async () => {
      // Two courses: one with A (95%), one with B (85%)
      prismaMock.enrollment.findMany.mockResolvedValue([
        { userId: 'student-1', courseId: 'course-1', course: mockCourse },
        { userId: 'student-1', courseId: 'course-2', course: mockCourse2 },
      ] as any);

      // First call for course-1
      prismaMock.grade.findMany
        .mockResolvedValueOnce(mockGradesA as any) // Course 1: 95%
        .mockResolvedValueOnce(mockGradesB as any); // Course 2: 85%

      const response = await getOverallGPA();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.courseCount).toBe(2);
      expect(data.coursesWithGrades).toBe(2);
      expect(data.courseGPAs).toHaveLength(2);

      // Overall GPA = (4.0 + 3.0) / 2 = 3.5
      expect(data.overallGPA).toBe(3.5);
    });

    it('handles courses without grades in overall calculation', async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([
        { userId: 'student-1', courseId: 'course-1', course: mockCourse },
        { userId: 'student-1', courseId: 'course-2', course: mockCourse2 },
      ] as any);

      // First course has grades, second has none
      prismaMock.grade.findMany
        .mockResolvedValueOnce(mockGradesA as any) // Course 1: 95% = 4.0
        .mockResolvedValueOnce([]); // Course 2: no grades

      const response = await getOverallGPA();

      const data = await response.json();
      expect(data.courseCount).toBe(2);
      expect(data.coursesWithGrades).toBe(1);
      expect(data.overallGPA).toBe(4.0); // Only course 1 counts
    });

    it('returns null overall GPA when no courses have grades', async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([
        { userId: 'student-1', courseId: 'course-1', course: mockCourse },
      ] as any);

      prismaMock.grade.findMany.mockResolvedValue([]);

      const response = await getOverallGPA();

      const data = await response.json();
      expect(data.overallGPA).toBeNull();
      expect(data.letterGrade).toBe('N/A');
      expect(data.isCalculated).toBe(false);
    });

    it('includes per-course GPA breakdown', async () => {
      prismaMock.enrollment.findMany.mockResolvedValue([
        { userId: 'student-1', courseId: 'course-1', course: mockCourse },
        { userId: 'student-1', courseId: 'course-2', course: mockCourse2 },
      ] as any);

      prismaMock.grade.findMany
        .mockResolvedValueOnce(mockGradesA as any)
        .mockResolvedValueOnce(mockGradesC as any);

      const response = await getOverallGPA();

      const data = await response.json();
      expect(data.courseGPAs).toHaveLength(2);

      const course1GPA = data.courseGPAs.find(
        (c: any) => c.courseId === 'course-1'
      );
      expect(course1GPA.gpa).toBe(4.0);
      expect(course1GPA.letterGrade).toBe('A');
      expect(course1GPA.courseName).toBe('Introduction to AI');

      const course2GPA = data.courseGPAs.find(
        (c: any) => c.courseId === 'course-2'
      );
      expect(course2GPA.gpa).toBe(2.0);
      expect(course2GPA.letterGrade).toBe('C');
      expect(course2GPA.courseName).toBe('Data Science');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: mockStudent,
      } as any);
    });

    it('returns 500 for database errors', async () => {
      prismaMock.enrollment.findMany.mockRejectedValue(
        new Error('DB connection failed')
      );

      const response = await getOverallGPA();

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Internal server error');
    });
  });
});
