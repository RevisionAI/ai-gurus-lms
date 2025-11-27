/**
 * Playwright Global Setup
 *
 * Runs once before all tests.
 * - Seeds test database with sample data
 * - Applies Prisma migrations to test database
 */

async function globalSetup() {
  console.log('\n🚀 Running global setup...');

  // Only seed if DATABASE_URL is available
  if (process.env.DATABASE_URL) {
    try {
      const { seedTestData } = await import('./helpers/seedTestData');
      await seedTestData();
      console.log('✅ Test data seeded successfully');
    } catch (error) {
      console.warn('⚠️ Could not seed test data (database may not be available):', error);
      // Don't throw - allow tests to continue even without seeded data
    }
  } else {
    console.log('ℹ️ DATABASE_URL not set - skipping test data seeding');
    console.log('   Tests requiring seeded data may fail');
  }

  console.log('🎯 Global setup complete\n');
}

export default globalSetup;
