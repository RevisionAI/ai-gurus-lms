// One-time script to publish unpublished course content
// Run this with: node -r dotenv/config src/app/publish-content.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function publishUnpublishedContent() {
  try {
    console.log('Finding unpublished course content...');
    
    // Find all unpublished content items
    const unpublishedContent = await prisma.courseContent.findMany({
      where: {
        isPublished: false
      },
      include: {
        course: {
          select: {
            title: true
          }
        }
      }
    });
    
    if (unpublishedContent.length === 0) {
      console.log('No unpublished content found. All content is already published.');
      return;
    }
    
    console.log(`Found ${unpublishedContent.length} unpublished content items:`);
    
    // Display unpublished content
    unpublishedContent.forEach((item, index) => {
      console.log(`${index + 1}. "${item.title}" in course "${item.course.title}"`);
    });
    
    // Update all unpublished content to be published
    const updateResult = await prisma.courseContent.updateMany({
      where: {
        isPublished: false
      },
      data: {
        isPublished: true
      }
    });
    
    console.log(`Successfully published ${updateResult.count} content items.`);
    console.log('Students should now be able to see all content items.');
    
  } catch (error) {
    console.error('Error publishing content:', error);
  } finally {
    await prisma.$disconnect();
  }
}

publishUnpublishedContent();
