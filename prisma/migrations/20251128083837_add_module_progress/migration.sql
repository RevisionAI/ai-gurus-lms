-- CreateTable
CREATE TABLE "module_progress" (
    "id" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "contentViewed" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "moduleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "module_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "module_progress_userId_idx" ON "module_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "module_progress_moduleId_userId_key" ON "module_progress"("moduleId", "userId");

-- AddForeignKey
ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_progress" ADD CONSTRAINT "module_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
