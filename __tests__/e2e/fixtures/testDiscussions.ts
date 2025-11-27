/**
 * Test Discussion Fixtures for E2E Tests
 *
 * All test discussions use the 'e2e-test-' prefix for easy identification and cleanup.
 */

export const testDiscussion = {
  id: 'e2e-test-discussion-001',
  title: 'Week 1 Discussion: Introduction',
  content: 'Welcome to the course! Please introduce yourself and share your learning goals.',
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
};

export const testDiscussion2 = {
  id: 'e2e-test-discussion-002',
  title: 'Study Group Formation',
  content: 'Looking to form a study group. Anyone interested in collaborating?',
  createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
};

export const testDiscussionPost = {
  id: 'e2e-test-post-001',
  content: 'Hello everyone! I\'m excited to be part of this course. My goal is to learn practical AI applications for business.',
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
};

export const testDiscussionReply = {
  id: 'e2e-test-reply-001',
  content: 'Welcome! That\'s a great goal. I\'m also interested in business applications.',
  createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
};

export const testDiscussionNewThread = {
  title: 'E2E Test Discussion - Technical Question',
  content: 'Can someone explain the difference between supervised and unsupervised learning? This is a test discussion created by E2E tests.',
};

export const testDiscussionNewReply = {
  content: 'Great question! Supervised learning uses labeled data, while unsupervised learning finds patterns in unlabeled data. This is a test reply created by E2E tests.',
};

export const testDiscussions = {
  intro: testDiscussion,
  studyGroup: testDiscussion2,
  newThread: testDiscussionNewThread,
  newReply: testDiscussionNewReply,
};

export const testPosts = {
  sample: testDiscussionPost,
  reply: testDiscussionReply,
};
