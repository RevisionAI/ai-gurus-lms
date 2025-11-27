/**
 * Test Course and Assignment Fixtures for E2E Tests
 *
 * All test courses use the 'E2E-TEST-' prefix for code to enable easy cleanup.
 */

export const testCourse = {
  id: 'e2e-test-course-001',
  title: 'Introduction to E2E Testing',
  description: 'A comprehensive course on end-to-end testing with Playwright. This course covers test automation, browser testing, and CI/CD integration.',
  code: 'E2E-TEST-101',
  semester: 'Fall',
  year: 2025,
};

export const testAssignment = {
  id: 'e2e-test-assignment-001',
  title: 'Write Your First E2E Test',
  description: 'Create a simple end-to-end test that validates user login functionality.',
  dueDate: new Date('2025-12-31T23:59:59Z'),
  maxPoints: 100,
};

// Additional course for testing multiple courses scenario
export const testCourse2 = {
  id: 'e2e-test-course-002',
  title: 'Advanced Playwright Patterns',
  description: 'Deep dive into Page Object Model, fixtures, and advanced Playwright features.',
  code: 'E2E-TEST-201',
  semester: 'Spring',
  year: 2026,
};

// Course with prerequisites for testing prerequisite confirmation flow
export const testCourseWithPrerequisites = {
  id: 'e2e-test-course-003',
  title: 'Machine Learning Fundamentals',
  description: 'An introduction to machine learning algorithms and their applications.',
  code: 'E2E-TEST-301',
  semester: 'Fall',
  year: 2025,
  prerequisites: 'Completion of E2E-TEST-101 or equivalent programming experience. Basic understanding of statistics and linear algebra is recommended.',
  learningObjectives: [
    'Understand supervised and unsupervised learning',
    'Implement basic ML algorithms',
    'Evaluate model performance',
  ],
  targetAudience: 'Students who have completed introductory programming courses',
};

export const testCourses = {
  intro: testCourse,
  advanced: testCourse2,
  withPrerequisites: testCourseWithPrerequisites,
};

export const testAssignments = {
  firstTest: testAssignment,
};
