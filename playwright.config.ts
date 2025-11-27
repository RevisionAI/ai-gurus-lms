import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for AI Gurus LMS E2E Tests
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './__tests__/e2e',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI (single worker for stability)
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Capture screenshot only on failure
    screenshot: 'only-on-failure',

    // Record video only on failure
    video: 'retain-on-failure',

    // Default viewport size
    viewport: { width: 1280, height: 720 },

    // Headless mode (default true, explicit for clarity)
    headless: true,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes for dev server to start
  },

  // Global setup and teardown
  globalSetup: './__tests__/e2e/global-setup.ts',
  globalTeardown: './__tests__/e2e/global-teardown.ts',

  // Test timeout (30 seconds per test)
  timeout: 30000,

  // Expect timeout (5 seconds for assertions)
  expect: {
    timeout: 5000,
  },

  // Output folder for test artifacts
  outputDir: 'test-results',
});
