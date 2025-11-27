-- CreateTable
CREATE TABLE "feedback_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedback_templates_instructorId_idx" ON "feedback_templates"("instructorId");

-- CreateIndex
CREATE INDEX "feedback_templates_category_idx" ON "feedback_templates"("category");

-- AddForeignKey
ALTER TABLE "feedback_templates" ADD CONSTRAINT "feedback_templates_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
