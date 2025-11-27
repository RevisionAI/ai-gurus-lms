# Testing Guide

**Version:** 1.0
**Last Updated:** 2025-11-26
**Author:** Development Team

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Running Tests Locally](#running-tests-locally)
4. [Writing Tests](#writing-tests)
   - [Unit Tests](#unit-tests)
   - [Integration Tests](#integration-tests)
   - [E2E Tests](#e2e-tests)
5. [Testing Strategy](#testing-strategy)
6. [Best Practices and Patterns](#best-practices-and-patterns)
7. [Page Object Model](#page-object-model)
8. [Accessibility Testing](#accessibility-testing)
9. [CI/CD Integration](#cicd-integration)
10. [Debugging and Troubleshooting](#debugging-and-troubleshooting)
11. [Code Examples](#code-examples)

---

## Introduction

This guide documents the testing practices and guidelines for the AI Gurus LMS project. Following these patterns ensures consistent, high-quality tests across the codebase.

### Testing Framework Overview

| Test Type | Framework | Location | Purpose |
|-----------|-----------|----------|---------|
| Unit | Jest | `__tests__/unit/` | Business logic, utilities, calculations |
| Integration | Jest | `__tests__/integration/` | API routes, database operations |
| E2E | Playwright | `__tests__/e2e/` | User journeys, full workflows |

### Coverage Requirements

- **Critical paths:** 70%+ coverage (API routes, business logic)
- **Overall project:** 70%+ coverage goal
- **UI components:** 50%+ coverage target

---

## Getting Started

### Prerequisites

1. Node.js 22.x or later
2. npm 10.x or later
3. PostgreSQL database (for integration tests)

### Installation

```bash
# Install all dependencies including test frameworks
npm install

# Install Playwright browsers (for E2E tests)
npx playwright install chromium firefox webkit
```

---

## Running Tests Locally

### Unit and Integration Tests (Jest)

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- gpa.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="calculates GPA"

# Run tests in CI mode (used by GitHub Actions)
npm run test:ci
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run E2E tests with UI mode (interactive debugging)
npm run test:e2e:ui

# Run E2E tests in debug mode (step through tests)
npm run test:e2e:debug

# Run E2E tests with browser visible
npm run test:e2e:headed

# View HTML test report
npm run test:e2e:report

# Run specific browser only
npx playwright test --project=chromium
```

---

## Writing Tests

### Unit Tests

Unit tests validate isolated pieces of business logic. They should be fast and not require external dependencies.

#### Location
`__tests__/unit/` - Mirror the source directory structure

#### Example: Testing Utility Functions

```typescript
// __tests__/unit/lib/gpa.test.ts
import { calculateGPA, GradeInput } from '@/lib/gpa';

describe('calculateGPA', () => {
  // Arrange, Act, Assert (AAA) pattern
  it('calculates weighted GPA correctly', () => {
    // Arrange
    const grades: GradeInput[] = [
      { points: 90, maxPoints: 100, weight: 1 },
      { points: 85, maxPoints: 100, weight: 2 },
    ];

    // Act
    const result = calculateGPA(grades);

    // Assert
    expect(result).not.toBeNull();
    expect(result!.percentage).toBeCloseTo(86.67, 1);
  });

  it('returns null for empty grades array', () => {
    expect(calculateGPA([])).toBeNull();
  });

  it('handles partial grades (some not graded)', () => {
    const grades: GradeInput[] = [
      { points: 90, maxPoints: 100, isGraded: true },
      { points: 0, maxPoints: 100, isGraded: false },
    ];

    const result = calculateGPA(grades);
    expect(result!.gradedCount).toBe(1);
  });
});
```

#### Example: Testing React Components

```typescript
// __tests__/unit/components/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByText('Click me'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### Integration Tests

Integration tests validate API routes and database interactions using mocked Prisma client.

#### Location
`__tests__/integration/api/` - Mirror the API route structure

#### Mocking Prisma

```typescript
// __tests__/integration/api/instructor/courses.test.ts
import { DeepMockProxy, mockDeep, mockReset } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

// Create mock at module scope
export const prismaMock = mockDeep<PrismaClient>() as DeepMockProxy<PrismaClient>;

// Mock the Prisma module - use getter to reference prismaMock
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  get prisma() {
    return prismaMock;
  },
}));

// Reset mocks between tests
beforeEach(() => {
  mockReset(prismaMock);
  jest.clearAllMocks();
});
```

#### Example: Testing POST Endpoint

```typescript
import { POST } from '@/app/api/instructor/courses/route';
import { mockInstructor } from '../../../fixtures/users';
import { mockCourse } from '../../../fixtures/courses';

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));
import { getServerSession } from 'next-auth';
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('POST /api/instructor/courses', () => {
  it('creates course successfully with valid data', async () => {
    // Arrange
    mockGetServerSession.mockResolvedValue({
      user: { id: mockInstructor.id, role: 'INSTRUCTOR' },
    });
    prismaMock.course.findUnique.mockResolvedValue(null);
    prismaMock.course.create.mockResolvedValue(mockCourse);

    const request = createRequest({
      title: 'New Course',
      code: 'CS101',
      semester: 'Fall',
      year: '2025',
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(data.title).toBe('New Course');
    expect(prismaMock.course.create).toHaveBeenCalled();
  });

  it('returns 401 if user not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const request = createRequest({ title: 'Test' });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('returns 400 for missing required fields', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: mockInstructor.id, role: 'INSTRUCTOR' },
    });

    const request = createRequest({ title: 'Test' }); // Missing code
    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});

// Helper to create mock request
function createRequest(body: unknown) {
  return new Request('http://localhost:3000/api/instructor/courses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
```

### E2E Tests

E2E tests validate complete user journeys through the application.

#### Location
`__tests__/e2e/` - Organized by user journey or feature

#### Example: Student Login Flow

```typescript
// __tests__/e2e/student-login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { testStudent } from './fixtures/testUsers';

test.describe('Student Login', () => {
  test('student can login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Navigate to login
    await loginPage.goto();

    // Login with test credentials
    await loginPage.login(testStudent.email, testStudent.password);

    // Verify redirect to dashboard
    await loginPage.expectLoginSuccess();
    await dashboardPage.expectVisible();
  });

  test('login fails with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'wrongpassword');

    await expect(page).toHaveURL(/signin|error/);
  });
});
```

---

## Testing Strategy

### When to Use Each Test Type

```
┌──────────────────────────────────────────────────────────────┐
│                    TESTING DECISION TREE                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Is it business logic or a utility function?                 │
│  YES → Unit Test (Jest)                                      │
│                                                              │
│  Is it an API endpoint or database operation?                │
│  YES → Integration Test (Jest + Prisma mock)                 │
│                                                              │
│  Is it a critical user journey (login, enrollment, submit)?  │
│  YES → E2E Test (Playwright)                                 │
│                                                              │
│  Is it UI component behavior?                                │
│  YES → Unit Test with React Testing Library                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Test Pyramid

```
         /\
        /  \
       / E2E \          ← 5-10 tests (critical flows only)
      /______\
     /        \
    / Integ.  \         ← 20-30 tests (API routes)
   /___________\
  /             \
 /     Unit      \      ← 50-100 tests (business logic)
/_________________\
```

### Examples by Scenario

| Scenario | Unit | Integration | E2E |
|----------|------|-------------|-----|
| GPA Calculation | ✅ Calculate function | - | - |
| Course Creation | ✅ Validation | ✅ API route | ✅ Full flow |
| User Registration | ✅ Email validation | ✅ Register API | ✅ Signup journey |
| File Upload | ✅ File type validation | ✅ Upload API | - |
| Authentication | - | ✅ Auth endpoints | ✅ Login flow |

---

## Best Practices and Patterns

### AAA Pattern (Arrange, Act, Assert)

```typescript
it('calculates total correctly', () => {
  // Arrange - Set up test data and mocks
  const items = [{ price: 10 }, { price: 20 }];

  // Act - Execute the code being tested
  const total = calculateTotal(items);

  // Assert - Verify expected outcomes
  expect(total).toBe(30);
});
```

### Test Isolation

Each test should be independent and not rely on other tests:

```typescript
describe('CourseService', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    mockReset(prismaMock);
  });

  // Clean up after each test
  afterEach(() => {
    jest.restoreAllMocks();
  });
});
```

### Test Data Management

Use fixtures for consistent test data:

```typescript
// __tests__/fixtures/users.ts
export const mockStudent = {
  id: 'student-1',
  email: 'student@test.com',
  name: 'Test Student',
  role: 'STUDENT' as const,
};

export const mockInstructor = {
  id: 'instructor-1',
  email: 'instructor@test.com',
  name: 'Test Instructor',
  role: 'INSTRUCTOR' as const,
};
```

### Async Testing

Always use async/await for asynchronous tests:

```typescript
// Good
it('fetches data successfully', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});

// Bad - Don't forget to await
it('fetches data successfully', () => {
  const data = fetchData(); // Missing await!
  expect(data).toBeDefined(); // This will fail
});
```

---

## Page Object Model

The Page Object Model (POM) pattern encapsulates page interactions for maintainability.

### Benefits
- **Single source of truth:** Change selectors in one place
- **Readability:** Tests read like user stories
- **Reusability:** Share page interactions across tests

### Structure

```
__tests__/e2e/
├── pages/
│   ├── BasePage.ts         # Common page methods
│   ├── LoginPage.ts        # Login page interactions
│   ├── DashboardPage.ts    # Dashboard interactions
│   └── CourseDetailPage.ts # Course page interactions
├── fixtures/
│   └── testUsers.ts        # Test user data
└── helpers/
    └── auth.ts             # Authentication utilities
```

### Example Page Object

```typescript
// __tests__/e2e/pages/LoginPage.ts
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
  }

  async goto() {
    await this.page.goto('/api/auth/signin');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectLoginSuccess() {
    await expect(this.page).not.toHaveURL(/signin/);
  }
}
```

### Using Page Objects in Tests

```typescript
test('student enrollment flow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const catalogPage = new CatalogPage(page);
  const coursePage = new CourseDetailPage(page);

  await loginPage.goto();
  await loginPage.login('student@test.com', 'password123');

  await catalogPage.goto();
  await catalogPage.searchCourse('Introduction to AI');
  await catalogPage.clickFirstResult();

  await coursePage.clickEnroll();
  await coursePage.expectEnrolled();
});
```

---

## Accessibility Testing

### WCAG 2.1 AA Compliance

The project targets WCAG 2.1 AA compliance. Test accessibility using:

1. **Automated testing:** axe-core with Playwright
2. **Manual testing:** Keyboard navigation, screen readers

### Automated Accessibility Tests

```typescript
// Install: npm install @axe-core/playwright
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('homepage has no accessibility violations', async ({ page }) => {
  await page.goto('/');

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});

test('login form is accessible', async ({ page }) => {
  await page.goto('/api/auth/signin');

  const results = await new AxeBuilder({ page })
    .include('form')
    .analyze();

  expect(results.violations).toEqual([]);
});
```

### Keyboard Navigation Testing

```typescript
test('can navigate forms with keyboard', async ({ page }) => {
  await page.goto('/api/auth/signin');

  // Tab to email field
  await page.keyboard.press('Tab');
  await expect(page.locator('input[name="email"]')).toBeFocused();

  // Tab to password field
  await page.keyboard.press('Tab');
  await expect(page.locator('input[name="password"]')).toBeFocused();

  // Tab to submit button
  await page.keyboard.press('Tab');
  await expect(page.locator('button[type="submit"]')).toBeFocused();

  // Enter submits the form
  await page.keyboard.press('Enter');
});
```

### Accessibility Checklist

- [ ] Color contrast ratio: 4.5:1 for normal text
- [ ] All form inputs have associated labels
- [ ] Images have alt text
- [ ] Heading hierarchy is logical (h1 → h2 → h3)
- [ ] Focus indicators are visible
- [ ] No keyboard traps
- [ ] Modal dialogs trap focus appropriately
- [ ] ARIA labels present where needed

---

## CI/CD Integration

### GitHub Actions Workflow

Tests run automatically on:
- Pull requests to `main` branch
- Direct pushes to `main` branch

### Workflow Steps

```
PR Created/Updated → GitHub Actions Triggered
                   ↓
         Install Dependencies (cached)
                   ↓
              Run Linter
                   ↓
         Run Unit/Integration Tests
                   ↓
            Run E2E Tests
                   ↓
          Build Application
                   ↓
    Tests Pass ✅ → Allow Merge
    Tests Fail ❌ → Block Merge
```

### Viewing Test Results

1. Go to the Pull Request page
2. Click "Checks" tab
3. Click on the failed job to view logs
4. Download artifacts (coverage reports, Playwright traces) if available

### Required Status Checks

- All tests must pass before merging
- Linting must pass
- Build must succeed

---

## Debugging and Troubleshooting

### Common Test Failures

| Error | Cause | Solution |
|-------|-------|----------|
| `Timeout` | Slow operation | Increase timeout or add proper waits |
| `Element not found` | Wrong selector | Check selector, use Playwright inspector |
| `Mock not working` | Import order | Ensure `jest.mock()` before imports |
| `Database error` | Missing env vars | Check DATABASE_URL in .env |
| `Session null` | Auth not mocked | Mock `getServerSession` |

### Debugging Unit Tests

```bash
# Run single test file
npm test -- gpa.test.ts

# Run single test by name
npm test -- --testNamePattern="calculates GPA"

# Run with verbose output
npm test -- --verbose

# Debug with VS Code
# Add breakpoint, then run "Debug Jest Tests" launch config
```

### Debugging E2E Tests

```bash
# Open Playwright UI mode for interactive debugging
npm run test:e2e:ui

# Run with browser visible
npm run test:e2e:headed

# Debug mode with step-through
npm run test:e2e:debug
```

#### Using `page.pause()` for Interactive Debugging

```typescript
test('debug this test', async ({ page }) => {
  await page.goto('/');

  await page.pause(); // Pauses execution, opens inspector

  await page.click('button');
});
```

### Debugging CI Failures

1. Check the GitHub Actions log for the failing step
2. Download artifacts (Playwright report, screenshots)
3. Open `playwright-report/index.html` locally
4. Review trace files for step-by-step replay

### Debugging Workflow

```
1. Identify failing test
        ↓
2. Run test locally in isolation
        ↓
3. Add console.log or page.pause()
        ↓
4. Check mocks and test data
        ↓
5. Verify test setup/teardown
        ↓
6. Fix issue and verify locally
        ↓
7. Push and verify in CI
```

---

## Code Examples

### Testing Authentication Flows

```typescript
describe('Authentication', () => {
  it('redirects unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/signin/);
  });

  it('allows authenticated users to access dashboard', async ({ page }) => {
    // Login first
    await loginAsStudent(page);

    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');
  });
});
```

### Testing Form Validation

```typescript
describe('Course Creation Form', () => {
  it('shows validation errors for empty fields', async ({ page }) => {
    await loginAsInstructor(page);
    await page.goto('/instructor/courses/new');

    // Submit empty form
    await page.click('button[type="submit"]');

    // Check for validation errors
    await expect(page.locator('text=Title is required')).toBeVisible();
    await expect(page.locator('text=Code is required')).toBeVisible();
  });

  it('successfully creates course with valid data', async ({ page }) => {
    await loginAsInstructor(page);
    await page.goto('/instructor/courses/new');

    await page.fill('input[name="title"]', 'New Course');
    await page.fill('input[name="code"]', 'CS101');
    await page.selectOption('select[name="semester"]', 'Fall');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Course created')).toBeVisible();
  });
});
```

### Testing API Error Handling

```typescript
describe('API Error Handling', () => {
  it('returns 500 for database errors', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', role: 'INSTRUCTOR' },
    });
    prismaMock.course.findMany.mockRejectedValue(new Error('DB connection failed'));

    const response = await GET();

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Internal server error');
  });

  it('returns 404 for non-existent resources', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', role: 'INSTRUCTOR' },
    });
    prismaMock.course.findUnique.mockResolvedValue(null);

    const response = await GET({ params: { id: 'non-existent' } });

    expect(response.status).toBe(404);
  });
});
```

---

## External Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Page Object Model](https://playwright.dev/docs/pom)
- [axe-core Playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Document Version:** 1.0
**Maintained by:** Development Team
