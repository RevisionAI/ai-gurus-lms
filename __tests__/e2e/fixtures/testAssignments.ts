/**
 * Test Assignment Fixtures for E2E Tests
 *
 * All test assignments use the 'e2e-test-' prefix for easy identification and cleanup.
 */

export const testAssignmentUpcoming = {
  id: 'e2e-test-assignment-upcoming-001',
  title: 'Upcoming Assignment: Research Paper',
  description: 'Write a comprehensive research paper on the topic of your choice.',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  maxPoints: 100,
  isPublished: true,
};

export const testAssignmentPastDue = {
  id: 'e2e-test-assignment-pastdue-001',
  title: 'Past Due Assignment: Quick Quiz',
  description: 'Short quiz covering week 1 materials.',
  dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  maxPoints: 50,
  isPublished: true,
};

export const testAssignmentWithFile = {
  id: 'e2e-test-assignment-file-001',
  title: 'File Upload Assignment',
  description: 'Submit your project files and documentation.',
  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
  maxPoints: 150,
  isPublished: true,
};

export const testAssignmentGraded = {
  id: 'e2e-test-assignment-graded-001',
  title: 'Graded Assignment: Essay',
  description: 'This assignment has been graded.',
  dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  maxPoints: 100,
  isPublished: true,
};

export const testSubmission = {
  id: 'e2e-test-submission-001',
  text: 'This is my assignment submission. I have completed all the required tasks and included supporting documentation.',
  fileUrl: null,
  submittedAt: new Date(),
};

export const testSubmissionWithFile = {
  id: 'e2e-test-submission-file-001',
  text: 'Please see the attached file for my complete submission.',
  fileUrl: 's3://test-bucket/submissions/sample-document.pdf',
  submittedAt: new Date(),
};

export const testGrade = {
  score: 85,
  feedback: 'Excellent work! Your research was thorough and well-presented. Consider adding more sources for future assignments.',
  letterGrade: 'B+',
};

// Test file for upload scenarios
export const testFile = {
  name: 'test-submission.txt',
  content: 'This is a test file for E2E testing purposes.',
  mimeType: 'text/plain',
};

export const testFileInvalid = {
  name: 'malicious.exe',
  content: 'This should be rejected',
  mimeType: 'application/x-msdownload',
};

export const testFileLarge = {
  name: 'large-file.pdf',
  size: 50 * 1024 * 1024, // 50MB - should test file size limits
  mimeType: 'application/pdf',
};

export const testAssignments = {
  upcoming: testAssignmentUpcoming,
  pastDue: testAssignmentPastDue,
  withFile: testAssignmentWithFile,
  graded: testAssignmentGraded,
};

export const testSubmissions = {
  basic: testSubmission,
  withFile: testSubmissionWithFile,
};
