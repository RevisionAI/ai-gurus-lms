-- AlterTable
ALTER TABLE "course_content" ADD COLUMN     "s3Key" TEXT,
ADD COLUMN     "thumbnailS3Key" TEXT;

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN     "s3Key" TEXT;
