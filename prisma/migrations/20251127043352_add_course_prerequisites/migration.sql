-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "learningObjectives" TEXT[],
ADD COLUMN     "prerequisites" TEXT,
ADD COLUMN     "targetAudience" TEXT;
