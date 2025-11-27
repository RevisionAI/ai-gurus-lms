-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "assignments" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "course_content" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "discussions" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "grades" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "announcements_deletedAt_idx" ON "announcements"("deletedAt");

-- CreateIndex
CREATE INDEX "assignments_deletedAt_idx" ON "assignments"("deletedAt");

-- CreateIndex
CREATE INDEX "course_content_deletedAt_idx" ON "course_content"("deletedAt");

-- CreateIndex
CREATE INDEX "courses_deletedAt_idx" ON "courses"("deletedAt");

-- CreateIndex
CREATE INDEX "discussions_deletedAt_idx" ON "discussions"("deletedAt");

-- CreateIndex
CREATE INDEX "grades_deletedAt_idx" ON "grades"("deletedAt");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");
