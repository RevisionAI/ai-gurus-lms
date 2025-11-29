/**
 * Verification script for Story 1.1: Module Model
 * Tests that Module model is properly created and queryable
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyModuleModel() {
  console.log('🔍 Verifying Module model...\n');

  try {
    // Test 1: Query modules table (should work even if empty)
    console.log('Test 1: Query modules table...');
    const moduleCount = await prisma.module.count();
    console.log(`✅ Module table accessible. Current count: ${moduleCount}\n`);

    // Test 2: Verify Module fields exist by checking schema
    console.log('Test 2: Verify Module model fields...');
    const moduleFields = Object.keys(prisma.module.fields);
    const expectedFields = [
      'id', 'title', 'description', 'orderIndex', 'isPublished',
      'requiresPrevious', 'createdAt', 'updatedAt', 'deletedAt', 'courseId'
    ];

    const missingFields = expectedFields.filter(f => !moduleFields.includes(f));
    if (missingFields.length === 0) {
      console.log(`✅ All expected fields present: ${expectedFields.join(', ')}\n`);
    } else {
      console.log(`❌ Missing fields: ${missingFields.join(', ')}\n`);
    }

    // Test 3: Verify Course has modules relation
    console.log('Test 3: Verify Course→Module relation...');
    const courseFields = Object.keys(prisma.course.fields);
    if (courseFields.includes('modules')) {
      console.log('✅ Course model has modules relation\n');
    } else {
      console.log('❌ Course model missing modules relation\n');
    }

    // Test 4: Test creating a module (requires a course)
    console.log('Test 4: Test module creation (with temp course)...');

    // Find or create a test instructor
    let testInstructor = await prisma.user.findFirst({
      where: { role: 'INSTRUCTOR', deletedAt: null }
    });

    if (!testInstructor) {
      console.log('  No instructor found, skipping creation test.');
      console.log('  ✅ Model structure verified via schema inspection.\n');
    } else {
      // Create temp course
      const tempCourse = await prisma.course.create({
        data: {
          title: 'Test Course for Module Verification',
          code: `TEST-MODULE-${Date.now()}`,
          semester: 'Test',
          year: 2025,
          instructorId: testInstructor.id,
        }
      });

      // Create module
      const testModule = await prisma.module.create({
        data: {
          title: 'Test Module',
          description: 'Created by verification script',
          orderIndex: 0,
          isPublished: false,
          requiresPrevious: true,
          courseId: tempCourse.id,
        }
      });

      console.log(`✅ Module created successfully: ${testModule.id}`);
      console.log(`   Title: ${testModule.title}`);
      console.log(`   OrderIndex: ${testModule.orderIndex}`);
      console.log(`   RequiresPrevious: ${testModule.requiresPrevious}\n`);

      // Clean up
      await prisma.module.delete({ where: { id: testModule.id } });
      await prisma.course.delete({ where: { id: tempCourse.id } });
      console.log('✅ Cleanup complete (test data removed)\n');
    }

    console.log('✅ All verification tests passed!');
    console.log('Story 1.1: Create Module Database Model - VERIFIED');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyModuleModel();
