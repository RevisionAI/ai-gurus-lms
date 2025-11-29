-- AlterTable
ALTER TABLE "module_progress" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "module_progress_moduleId_idx" ON "module_progress"("moduleId");

-- CreateIndex
CREATE INDEX "module_progress_deletedAt_idx" ON "module_progress"("deletedAt");
