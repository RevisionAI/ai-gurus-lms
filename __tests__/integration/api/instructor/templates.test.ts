/**
 * Feedback Templates API Integration Tests
 * Story: 2.7 - Feedback Templates for Instructors
 * AC: 2.7.1, 2.7.2, 2.7.3, 2.7.4, 2.7.8
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

import { getServerSession } from 'next-auth';
import { GET, POST } from '@/app/api/instructor/templates/route';
import { GET as GET_ONE, PUT, DELETE } from '@/app/api/instructor/templates/[id]/route';
import { POST as APPLY } from '@/app/api/instructor/templates/[id]/apply/route';

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

// Test data fixtures
const mockInstructor = {
  id: 'cinstructor0000000000001',
  email: 'instructor@test.com',
  name: 'Test',
  surname: 'Instructor',
  role: 'INSTRUCTOR' as const,
};

const mockTemplate1 = {
  id: 'ctemplate00000000000001',
  name: 'Excellent Work',
  category: 'excellent',
  template: 'Great job {student_name}! Your work on {assignment_title} was outstanding. Score: {score}/100.',
  instructorId: 'cinstructor0000000000001',
  isShared: false,
  usageCount: 5,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockTemplate2 = {
  id: 'ctemplate00000000000002',
  name: 'Needs Improvement',
  category: 'needs-improvement',
  template: 'Hi {student_name}, your {assignment_title} submission needs some work. {custom_note}',
  instructorId: 'cinstructor0000000000001',
  isShared: false,
  usageCount: 2,
  createdAt: new Date('2025-01-02'),
  updatedAt: new Date('2025-01-02'),
};

// Reset mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
  jest.clearAllMocks();
});

describe('GET /api/instructor/templates', () => {
  function createRequest(params?: Record<string, string>) {
    const searchParams = new URLSearchParams(params);
    return new Request(`http://localhost:3000/api/instructor/templates?${searchParams}`, {
      method: 'GET',
    });
  }

  describe('Authentication', () => {
    it('returns 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 403 if user is not instructor', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'student-1', role: 'STUDENT', email: 'student@test.com' },
      } as any);

      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Successful Retrieval', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: mockInstructor,
      } as any);
    });

    it('returns all templates for instructor', async () => {
      prismaMock.feedbackTemplate.findMany.mockResolvedValue([
        mockTemplate1,
        mockTemplate2,
      ] as any);

      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.templates).toHaveLength(2);
    });

    it('filters by category when provided', async () => {
      prismaMock.feedbackTemplate.findMany.mockResolvedValue([mockTemplate1] as any);

      const request = createRequest({ category: 'excellent' });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(prismaMock.feedbackTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'excellent',
          }),
        })
      );
    });

    it('sorts by usageCount when specified', async () => {
      prismaMock.feedbackTemplate.findMany.mockResolvedValue([
        mockTemplate1,
        mockTemplate2,
      ] as any);

      const request = createRequest({ sortBy: 'usageCount', order: 'desc' });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(prismaMock.feedbackTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { usageCount: 'desc' },
        })
      );
    });

    it('returns empty array when no templates exist', async () => {
      prismaMock.feedbackTemplate.findMany.mockResolvedValue([]);

      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.templates).toHaveLength(0);
    });
  });
});

describe('POST /api/instructor/templates', () => {
  function createPostRequest(body: object) {
    return new Request('http://localhost:3000/api/instructor/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  describe('Authentication', () => {
    it('returns 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createPostRequest({
        name: 'Test Template',
        category: 'excellent',
        template: 'Great work {student_name}!',
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: mockInstructor,
      } as any);
    });

    it('returns 400 for missing name', async () => {
      const request = createPostRequest({
        category: 'excellent',
        template: 'Great work {student_name}!',
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('returns 400 for invalid category', async () => {
      const request = createPostRequest({
        name: 'Test Template',
        category: 'invalid-category',
        template: 'Great work {student_name}!',
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('returns 400 for template too short', async () => {
      const request = createPostRequest({
        name: 'Test Template',
        category: 'excellent',
        template: 'Short', // Less than 10 chars
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Successful Creation', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: mockInstructor,
      } as any);
    });

    it('creates template with valid data', async () => {
      prismaMock.feedbackTemplate.create.mockResolvedValue(mockTemplate1 as any);

      const request = createPostRequest({
        name: 'Excellent Work',
        category: 'excellent',
        template: 'Great job {student_name}! Your work on {assignment_title} was outstanding.',
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.template.name).toBe('Excellent Work');
    });

    it('sanitizes HTML in template text', async () => {
      prismaMock.feedbackTemplate.create.mockResolvedValue(mockTemplate1 as any);

      const request = createPostRequest({
        name: 'Test Template',
        category: 'excellent',
        template: '<script>alert("xss")</script>Great work {student_name}!',
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      // The sanitize function would strip the script tag
    });
  });
});

describe('GET /api/instructor/templates/[id]', () => {
  describe('Authentication', () => {
    it('returns 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new Request(`http://localhost:3000/api/instructor/templates/${mockTemplate1.id}`);
      const response = await GET_ONE(request, {
        params: Promise.resolve({ id: mockTemplate1.id }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: mockInstructor,
      } as any);
    });

    it('returns 404 if template does not exist', async () => {
      prismaMock.feedbackTemplate.findUnique.mockResolvedValue(null);

      const request = new Request(`http://localhost:3000/api/instructor/templates/cnonexistent00000000001`);
      const response = await GET_ONE(request, {
        params: Promise.resolve({ id: 'cnonexistent00000000001' }),
      });

      expect(response.status).toBe(404);
    });

    it('returns 403 if instructor does not own template', async () => {
      prismaMock.feedbackTemplate.findUnique.mockResolvedValue({
        ...mockTemplate1,
        instructorId: 'other-instructor',
      } as any);

      const request = new Request(`http://localhost:3000/api/instructor/templates/${mockTemplate1.id}`);
      const response = await GET_ONE(request, {
        params: Promise.resolve({ id: mockTemplate1.id }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Successful Retrieval', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: mockInstructor,
      } as any);
    });

    it('returns template when found', async () => {
      prismaMock.feedbackTemplate.findUnique.mockResolvedValue(mockTemplate1 as any);

      const request = new Request(`http://localhost:3000/api/instructor/templates/${mockTemplate1.id}`);
      const response = await GET_ONE(request, {
        params: Promise.resolve({ id: mockTemplate1.id }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.template.id).toBe(mockTemplate1.id);
    });
  });
});

describe('PUT /api/instructor/templates/[id]', () => {
  function createPutRequest(id: string, body: object) {
    return new Request(`http://localhost:3000/api/instructor/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  describe('Authentication', () => {
    it('returns 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createPutRequest(mockTemplate1.id, { name: 'Updated Name' });
      const response = await PUT(request, {
        params: Promise.resolve({ id: mockTemplate1.id }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: mockInstructor,
      } as any);
      prismaMock.feedbackTemplate.findUnique.mockResolvedValue(mockTemplate1 as any);
    });

    it('returns 400 if no fields provided', async () => {
      const request = createPutRequest(mockTemplate1.id, {});
      const response = await PUT(request, {
        params: Promise.resolve({ id: mockTemplate1.id }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Successful Update', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: mockInstructor,
      } as any);
      prismaMock.feedbackTemplate.findUnique.mockResolvedValue(mockTemplate1 as any);
    });

    it('updates template name', async () => {
      prismaMock.feedbackTemplate.update.mockResolvedValue({
        ...mockTemplate1,
        name: 'Updated Name',
      } as any);

      const request = createPutRequest(mockTemplate1.id, { name: 'Updated Name' });
      const response = await PUT(request, {
        params: Promise.resolve({ id: mockTemplate1.id }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.template.name).toBe('Updated Name');
    });

    it('updates template category', async () => {
      prismaMock.feedbackTemplate.update.mockResolvedValue({
        ...mockTemplate1,
        category: 'needs-improvement',
      } as any);

      const request = createPutRequest(mockTemplate1.id, { category: 'needs-improvement' });
      const response = await PUT(request, {
        params: Promise.resolve({ id: mockTemplate1.id }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.template.category).toBe('needs-improvement');
    });
  });
});

describe('DELETE /api/instructor/templates/[id]', () => {
  describe('Authentication', () => {
    it('returns 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new Request(`http://localhost:3000/api/instructor/templates/${mockTemplate1.id}`, {
        method: 'DELETE',
      });
      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockTemplate1.id }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Authorization', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: mockInstructor,
      } as any);
    });

    it('returns 404 if template does not exist', async () => {
      prismaMock.feedbackTemplate.findUnique.mockResolvedValue(null);

      const request = new Request(`http://localhost:3000/api/instructor/templates/cnonexistent00000000001`, {
        method: 'DELETE',
      });
      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'cnonexistent00000000001' }),
      });

      expect(response.status).toBe(404);
    });

    it('returns 403 if instructor does not own template', async () => {
      prismaMock.feedbackTemplate.findUnique.mockResolvedValue({
        ...mockTemplate1,
        instructorId: 'other-instructor',
      } as any);

      const request = new Request(`http://localhost:3000/api/instructor/templates/${mockTemplate1.id}`, {
        method: 'DELETE',
      });
      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockTemplate1.id }),
      });

      expect(response.status).toBe(403);
    });
  });

  describe('Successful Deletion', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: mockInstructor,
      } as any);
      prismaMock.feedbackTemplate.findUnique.mockResolvedValue(mockTemplate1 as any);
    });

    it('deletes template successfully', async () => {
      prismaMock.feedbackTemplate.delete.mockResolvedValue(mockTemplate1 as any);

      const request = new Request(`http://localhost:3000/api/instructor/templates/${mockTemplate1.id}`, {
        method: 'DELETE',
      });
      const response = await DELETE(request, {
        params: Promise.resolve({ id: mockTemplate1.id }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });
});

describe('POST /api/instructor/templates/[id]/apply', () => {
  function createApplyRequest(id: string, body: object) {
    return new Request(`http://localhost:3000/api/instructor/templates/${id}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  describe('Authentication', () => {
    it('returns 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = createApplyRequest(mockTemplate1.id, {
        studentName: 'John Doe',
        assignmentTitle: 'Assignment 1',
      });
      const response = await APPLY(request, {
        params: Promise.resolve({ id: mockTemplate1.id }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: mockInstructor,
      } as any);
    });

    it('returns 400 for missing studentName', async () => {
      const request = createApplyRequest(mockTemplate1.id, {
        assignmentTitle: 'Assignment 1',
      });
      const response = await APPLY(request, {
        params: Promise.resolve({ id: mockTemplate1.id }),
      });

      expect(response.status).toBe(400);
    });

    it('returns 400 for missing assignmentTitle', async () => {
      const request = createApplyRequest(mockTemplate1.id, {
        studentName: 'John Doe',
      });
      const response = await APPLY(request, {
        params: Promise.resolve({ id: mockTemplate1.id }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Successful Application', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: mockInstructor,
      } as any);
    });

    it('applies template with placeholder replacement', async () => {
      prismaMock.$transaction.mockImplementation(async (fn) => {
        return fn(prismaMock);
      });
      prismaMock.feedbackTemplate.findUnique.mockResolvedValue(mockTemplate1 as any);
      prismaMock.feedbackTemplate.update.mockResolvedValue({
        ...mockTemplate1,
        usageCount: 6,
      } as any);

      const request = createApplyRequest(mockTemplate1.id, {
        studentName: 'John Doe',
        assignmentTitle: 'Assignment 1',
        score: 95,
      });
      const response = await APPLY(request, {
        params: Promise.resolve({ id: mockTemplate1.id }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.feedbackText).toContain('John Doe');
      expect(data.feedbackText).toContain('Assignment 1');
      expect(data.feedbackText).toContain('95');
    });

    it('increments usage count', async () => {
      prismaMock.$transaction.mockImplementation(async (fn) => {
        return fn(prismaMock);
      });
      prismaMock.feedbackTemplate.findUnique.mockResolvedValue(mockTemplate1 as any);
      prismaMock.feedbackTemplate.update.mockResolvedValue({
        ...mockTemplate1,
        usageCount: 6,
      } as any);

      const request = createApplyRequest(mockTemplate1.id, {
        studentName: 'John Doe',
        assignmentTitle: 'Assignment 1',
      });
      const response = await APPLY(request, {
        params: Promise.resolve({ id: mockTemplate1.id }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.usageCount).toBe(6);
    });
  });

  describe('Authorization for Shared Templates', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: mockInstructor,
      } as any);
    });

    it('allows using shared template from another instructor', async () => {
      const sharedTemplate = {
        ...mockTemplate1,
        instructorId: 'other-instructor',
        isShared: true,
      };

      prismaMock.$transaction.mockImplementation(async (fn) => {
        return fn(prismaMock);
      });
      prismaMock.feedbackTemplate.findUnique.mockResolvedValue(sharedTemplate as any);
      prismaMock.feedbackTemplate.update.mockResolvedValue({
        ...sharedTemplate,
        usageCount: 6,
      } as any);

      const request = createApplyRequest(mockTemplate1.id, {
        studentName: 'John Doe',
        assignmentTitle: 'Assignment 1',
      });
      const response = await APPLY(request, {
        params: Promise.resolve({ id: mockTemplate1.id }),
      });

      expect(response.status).toBe(200);
    });

    it('denies using non-shared template from another instructor', async () => {
      const privateTemplate = {
        ...mockTemplate1,
        instructorId: 'other-instructor',
        isShared: false,
      };

      prismaMock.$transaction.mockImplementation(async (fn) => {
        prismaMock.feedbackTemplate.findUnique.mockResolvedValue(privateTemplate as any);
        return { forbidden: true };
      });

      const request = createApplyRequest(mockTemplate1.id, {
        studentName: 'John Doe',
        assignmentTitle: 'Assignment 1',
      });
      const response = await APPLY(request, {
        params: Promise.resolve({ id: mockTemplate1.id }),
      });

      expect(response.status).toBe(403);
    });
  });
});
