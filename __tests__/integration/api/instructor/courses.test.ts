/**
 * Course API Integration Tests
 *
 * Tests for the instructor courses API endpoints.
 * Uses mocked Prisma client and NextAuth session.
 */

import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Create the mock at module scope
export const prismaMock = mockDeep<PrismaClient>() as DeepMockProxy<PrismaClient>;

// Mock Prisma module
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get prisma() {
    return prismaMock;
  },
}));

// Mock rate-limit before importing routes (to avoid ESM issues with @upstash)
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: {
    limit: jest.fn().mockResolvedValue({ success: true, remaining: 100 }),
  },
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}));

// Mock next-auth before importing routes
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock next/server before importing routes
jest.mock('next/server', () => {
  return {
    NextRequest: class MockNextRequest {
      url: string;
      method: string;
      headers: Map<string, string>;
      private _body: string | null;

      constructor(url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) {
        this.url = url;
        this.method = init?.method || 'GET';
        this.headers = new Map(Object.entries(init?.headers || {}));
        this._body = init?.body || null;
      }

      async json() {
        return this._body ? JSON.parse(this._body) : {};
      }
    },
    NextResponse: {
      json: (data: unknown, init?: { status?: number }) => ({
        json: async () => data,
        status: init?.status || 200,
      }),
    },
  };
});

import { GET, POST } from '@/app/api/instructor/courses/route';
import { mockInstructor, mockStudent } from '../../../fixtures/users';
import { mockCourse, createMockCourse } from '../../../fixtures/courses';

// Import the mocked function
import { getServerSession } from 'next-auth';
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

// Reset function for prismaMock
function resetPrismaMock() {
  mockReset(prismaMock);
}

// Helper to create a mock request with JSON body
function createRequest(body: unknown, method = 'POST') {
  const { NextRequest } = jest.requireMock('next/server');
  return new NextRequest('http://localhost:3000/api/instructor/courses', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('Instructor Courses API', () => {
  beforeEach(() => {
    resetPrismaMock();
    jest.clearAllMocks();
  });

  describe('POST /api/instructor/courses', () => {
    it('creates course successfully with valid data', async () => {
      // Arrange
      const session = {
        user: {
          id: mockInstructor.id,
          email: mockInstructor.email,
          name: mockInstructor.name,
          role: 'INSTRUCTOR',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      mockGetServerSession.mockResolvedValue(session);

      const courseData = {
        title: 'New Course',
        description: 'Course description',
        code: 'NEW-101',
        semester: 'Spring',
        year: 2025,
      };

      const createdCourse = createMockCourse({
        ...courseData,
        year: 2025,
        instructorId: mockInstructor.id,
      });

      prismaMock.course.findUnique.mockResolvedValue(null); // No existing course
      prismaMock.course.create.mockResolvedValue(createdCourse);

      const request = createRequest(courseData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data.title).toBe(courseData.title);
      expect(data.code).toBe(courseData.code);
    });

    it('creates course with prerequisites fields', async () => {
      // Arrange - Story 2.8: Course Prerequisites
      const session = {
        user: {
          id: mockInstructor.id,
          email: mockInstructor.email,
          name: mockInstructor.name,
          role: 'INSTRUCTOR',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      mockGetServerSession.mockResolvedValue(session);

      const courseData = {
        title: 'Advanced Programming',
        description: 'Advanced course',
        code: 'CS-201',
        semester: 'Fall',
        year: 2025,
        prerequisites: 'Basic understanding of programming concepts, completion of CS-101',
        learningObjectives: ['Master advanced algorithms', 'Understand design patterns'],
        targetAudience: 'Students who have completed introductory programming',
      };

      const createdCourse = createMockCourse({
        ...courseData,
        instructorId: mockInstructor.id,
      });

      prismaMock.course.findUnique.mockResolvedValue(null);
      prismaMock.course.create.mockResolvedValue(createdCourse);

      const request = createRequest(courseData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(prismaMock.course.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          prerequisites: courseData.prerequisites,
          learningObjectives: courseData.learningObjectives,
          targetAudience: courseData.targetAudience,
        }),
      });
    });

    it('creates course without optional prerequisites fields', async () => {
      // Arrange - Story 2.8: Prerequisites are optional
      const session = {
        user: {
          id: mockInstructor.id,
          email: mockInstructor.email,
          name: mockInstructor.name,
          role: 'INSTRUCTOR',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      mockGetServerSession.mockResolvedValue(session);

      const courseData = {
        title: 'Intro Course',
        code: 'INTRO-100',
        semester: 'Spring',
        year: 2025,
        // No prerequisites fields
      };

      const createdCourse = createMockCourse({
        ...courseData,
        instructorId: mockInstructor.id,
        prerequisites: null,
        learningObjectives: [],
        targetAudience: null,
      });

      prismaMock.course.findUnique.mockResolvedValue(null);
      prismaMock.course.create.mockResolvedValue(createdCourse);

      const request = createRequest(courseData);

      // Act
      const response = await POST(request);

      // Assert
      expect(response.status).toBe(201);
      expect(prismaMock.course.create).toHaveBeenCalled();
    });

    it('returns 400 for missing required fields (Zod validation)', async () => {
      // Arrange
      const session = {
        user: {
          id: mockInstructor.id,
          email: mockInstructor.email,
          name: mockInstructor.name,
          role: 'INSTRUCTOR',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      mockGetServerSession.mockResolvedValue(session);

      // Missing 'code' field
      const incompleteData = {
        title: 'New Course',
        semester: 'Spring',
        year: 2025,
      };

      const request = createRequest(incompleteData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(prismaMock.course.create).not.toHaveBeenCalled();
    });

    it('returns 400 if course code already exists', async () => {
      // Arrange
      const session = {
        user: {
          id: mockInstructor.id,
          email: mockInstructor.email,
          name: mockInstructor.name,
          role: 'INSTRUCTOR',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      mockGetServerSession.mockResolvedValue(session);

      const existingCode = 'AI-101'; // Valid format for Zod validation
      const courseData = {
        title: 'New Course',
        code: existingCode, // Code that already exists
        semester: 'Spring',
        year: 2025,
      };

      const existingCourse = createMockCourse({ code: existingCode });
      prismaMock.course.findUnique.mockResolvedValue(existingCourse); // Course exists

      const request = createRequest(courseData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Course code already exists');
      expect(prismaMock.course.create).not.toHaveBeenCalled();
    });

    it('returns 401 if user not authenticated', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue(null);

      const courseData = {
        title: 'New Course',
        code: 'NEW101',
        semester: 'Spring',
        year: '2025',
      };

      const request = createRequest(courseData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(prismaMock.course.create).not.toHaveBeenCalled();
    });

    it('returns 401 if user is not an instructor', async () => {
      // Arrange
      const session = {
        user: {
          id: mockStudent.id,
          email: mockStudent.email,
          name: mockStudent.name,
          role: 'STUDENT', // Not an instructor
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      mockGetServerSession.mockResolvedValue(session);

      const courseData = {
        title: 'New Course',
        code: 'NEW101',
        semester: 'Spring',
        year: '2025',
      };

      const request = createRequest(courseData);

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
      expect(prismaMock.course.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/instructor/courses', () => {
    it('returns instructor courses successfully', async () => {
      // Arrange
      const session = {
        user: {
          id: mockInstructor.id,
          email: mockInstructor.email,
          name: mockInstructor.name,
          role: 'INSTRUCTOR',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      mockGetServerSession.mockResolvedValue(session);

      const coursesWithCount = [
        {
          ...mockCourse,
          _count: {
            enrollments: 25,
            assignments: 5,
          },
        },
      ];

      prismaMock.course.findMany.mockResolvedValue(coursesWithCount);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1);
      expect(data[0].title).toBe(mockCourse.title);
      expect(data[0]._count.enrollments).toBe(25);
    });

    it('returns 401 if user not authenticated', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue(null);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 401 if user is not an instructor', async () => {
      // Arrange
      const session = {
        user: {
          id: mockStudent.id,
          email: mockStudent.email,
          name: mockStudent.name,
          role: 'STUDENT',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      mockGetServerSession.mockResolvedValue(session);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
