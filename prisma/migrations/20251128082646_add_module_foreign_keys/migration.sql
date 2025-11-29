-- AlterTable
ALTER TABLE "assignments" ADD COLUMN     "moduleId" TEXT;

-- AlterTable
ALTER TABLE "course_content" ADD COLUMN     "moduleId" TEXT;

-- AlterTable
ALTER TABLE "discussions" ADD COLUMN     "moduleId" TEXT;

-- CreateIndex
CREATE INDEX "assignments_moduleId_idx" ON "assignments"("moduleId");

-- CreateIndex
CREATE INDEX "course_content_moduleId_idx" ON "course_content"("moduleId");

-- CreateIndex
CREATE INDEX "discussions_moduleId_idx" ON "discussions"("moduleId");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discussions" ADD CONSTRAINT "discussions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_content" ADD CONSTRAINT "course_content_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
