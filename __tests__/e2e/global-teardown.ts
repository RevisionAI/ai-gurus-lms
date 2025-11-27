/**
 * Playwright Global Teardown
 *
 * Runs once after all tests complete.
 * - Cleans up test data from database
 */

async function globalTeardown() {
  console.log('\n🧹 Running global teardown...');

  // Only cleanup if DATABASE_URL is available
  if (process.env.DATABASE_URL) {
    try {
      const { cleanupTestData } = await import('./helpers/cleanupTestData');
      await cleanupTestData();
      console.log('✅ Test data cleaned up successfully');
    } catch (error) {
      console.warn('⚠️ Warning: Failed to cleanup test data:', error);
      // Don't throw - allow tests to complete even if cleanup fails
    }
  } else {
    console.log('ℹ️ DATABASE_URL not set - skipping test data cleanup');
  }

  console.log('🏁 Global teardown complete\n');
}

export default globalTeardown;
