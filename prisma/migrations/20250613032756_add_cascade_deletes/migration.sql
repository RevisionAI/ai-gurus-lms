/*
  Warnings:

  - Added the required column `createdBy` to the `discussions` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_announcements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "courseId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "announcements_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_announcements" ("authorId", "content", "courseId", "createdAt", "id", "title") SELECT "authorId", "content", "courseId", "createdAt", "id", "title" FROM "announcements";
DROP TABLE "announcements";
ALTER TABLE "new_announcements" RENAME TO "announcements";
CREATE TABLE "new_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATETIME,
    "maxPoints" INTEGER NOT NULL DEFAULT 100,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "assignments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assignments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_assignments" ("courseId", "createdAt", "createdById", "description", "dueDate", "id", "isPublished", "maxPoints", "title", "updatedAt") SELECT "courseId", "createdAt", "createdById", "description", "dueDate", "id", "isPublished", "maxPoints", "title", "updatedAt" FROM "assignments";
DROP TABLE "assignments";
ALTER TABLE "new_assignments" RENAME TO "assignments";
CREATE TABLE "new_course_content" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT,
    "fileUrl" TEXT,
    "thumbnailUrl" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "courseId" TEXT NOT NULL,
    CONSTRAINT "course_content_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_course_content" ("content", "courseId", "createdAt", "fileUrl", "id", "isPublished", "orderIndex", "title", "type") SELECT "content", "courseId", "createdAt", "fileUrl", "id", "isPublished", "orderIndex", "title", "type" FROM "course_content";
DROP TABLE "course_content";
ALTER TABLE "new_course_content" RENAME TO "course_content";
CREATE TABLE "new_discussion_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "discussionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "discussion_posts_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "discussions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "discussion_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "discussion_posts_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "discussion_posts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_discussion_posts" ("authorId", "content", "createdAt", "discussionId", "id", "updatedAt") SELECT "authorId", "content", "createdAt", "discussionId", "id", "updatedAt" FROM "discussion_posts";
DROP TABLE "discussion_posts";
ALTER TABLE "new_discussion_posts" RENAME TO "discussion_posts";
CREATE TABLE "new_discussions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "courseId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "discussions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "discussions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_discussions" ("courseId", "createdAt", "description", "id", "title") SELECT "courseId", "createdAt", "description", "id", "title" FROM "discussions";
DROP TABLE "discussions";
ALTER TABLE "new_discussions" RENAME TO "discussions";
CREATE TABLE "new_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    CONSTRAINT "enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_enrollments" ("courseId", "enrolledAt", "id", "userId") SELECT "courseId", "enrolledAt", "id", "userId" FROM "enrollments";
DROP TABLE "enrollments";
ALTER TABLE "new_enrollments" RENAME TO "enrollments";
CREATE UNIQUE INDEX "enrollments_userId_courseId_key" ON "enrollments"("userId", "courseId");
CREATE TABLE "new_grades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "points" REAL NOT NULL,
    "feedback" TEXT,
    "gradedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "gradedById" TEXT NOT NULL,
    CONSTRAINT "grades_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "grades_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_grades" ("assignmentId", "feedback", "gradedAt", "gradedById", "id", "points", "studentId") SELECT "assignmentId", "feedback", "gradedAt", "gradedById", "id", "points", "studentId" FROM "grades";
DROP TABLE "grades";
ALTER TABLE "new_grades" RENAME TO "grades";
CREATE UNIQUE INDEX "grades_assignmentId_studentId_key" ON "grades"("assignmentId", "studentId");
CREATE TABLE "new_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT,
    "fileUrl" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    CONSTRAINT "submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_submissions" ("assignmentId", "content", "fileUrl", "id", "studentId", "submittedAt") SELECT "assignmentId", "content", "fileUrl", "id", "studentId", "submittedAt" FROM "submissions";
DROP TABLE "submissions";
ALTER TABLE "new_submissions" RENAME TO "submissions";
CREATE UNIQUE INDEX "submissions_assignmentId_studentId_key" ON "submissions"("assignmentId", "studentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
