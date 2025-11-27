# Epic Technical Specification: Testing Infrastructure Setup

Date: 2025-11-26
Author: Ed
Epic ID: 1.5
Status: Draft

---

## Overview

Epic 1.5 establishes a comprehensive testing framework and CI/CD pipeline BEFORE feature development begins in Epic 2. This shift-left testing approach prevents the waterfall anti-pattern of building features first and testing later, which leads to costly rework when bugs are discovered late. By having Jest (unit/integration tests) and Playwright (E2E tests) operational with automated CI/CD validation, Epic 2 feature development can follow test-driven development principles, catching bugs immediately rather than weeks later.

This epic runs concurrently with Epic 1 infrastructure work (weeks 2-3) to maximize timeline efficiency. The testing infrastructure will support the PRD requirement of 70%+ code coverage for critical paths (NFR005) and automated accessibility tests (NFR006).

[Source: docs/PRD.md#Epic-1.5, docs/architecture.md#Testing-Strategy]

## Objectives and Scope

### In Scope

- **Jest Configuration:** Install and configure Jest for Next.js 15 + TypeScript with React Testing Library
- **Playwright Configuration:** Install and configure Playwright for E2E browser testing
- **Test Structure:** Establish test file organization (`__tests__/unit/`, `__tests__/integration/`, `__tests__/e2e/`)
- **CI/CD Pipeline:** Create GitHub Actions workflow for automated testing on PRs
- **Test Database:** Configure isolated test database environment (Neon branch or in-memory)
- **Coverage Reporting:** Configure Istanbul/nyc for code coverage tracking
- **Sample Tests:** Create sample unit, integration, and E2E tests as patterns for Epic 2
- **Documentation:** Create comprehensive testing guide for developers

### Out of Scope

- Writing tests for existing features (deferred to Epic 2 stories which include tests)
- Visual regression testing (post-MVP enhancement)
- Performance/load testing (covered in Epic 3)
- Security penetration testing (covered in Epic 3, Story 3.5)
- Mobile device testing in CI (responsive web tested on desktop browsers)

[Source: docs/epics.md#Epic-1.5]

## System Architecture Alignment

### Component Boundaries

| Component | Location | Purpose |
|-----------|----------|---------|
| Jest Config | `/jest.config.js` | Unit/integration test configuration |
| Playwright Config | `/playwright.config.ts` | E2E test configuration |
| Unit Tests | `/__tests__/unit/` | Business logic tests |
| Integration Tests | `/__tests__/integration/` | API route tests |
| E2E Tests | `/__tests__/e2e/` | Browser-based user journey tests |
| Test Fixtures | `/__tests__/fixtures/` | Test data and mocks |
| Test Helpers | `/__tests__/helpers/` | Shared test utilities |
| CI/CD Workflow | `/.github/workflows/ci.yml` | Automated test pipeline |

### Integration Points

- **Jest → Prisma:** Mock Prisma client for isolated database testing
- **Playwright → Next.js:** Playwright web server starts Next.js dev server for E2E tests
- **GitHub Actions → Vercel:** CI tests run before Vercel deployment proceeds
- **Coverage Reports → PR Comments:** Coverage displayed on GitHub pull requests

[Source: docs/architecture.md#Project-Structure, docs/architecture.md#Testing-Strategy]

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs |
|--------|---------------|--------|---------|
| `jest.config.js` | Configure Jest for Next.js + TypeScript | tsconfig.json, next.config.js | Test runner configuration |
| `playwright.config.ts` | Configure Playwright browsers and settings | Environment variables | E2E test runner configuration |
| `__tests__/helpers/prismaMock.ts` | Provide mocked Prisma client | Prisma schema types | Mock database operations |
| `__tests__/helpers/testUtils.tsx` | Provide React Testing Library wrappers | React components | Rendered test components |
| `__tests__/fixtures/users.ts` | Sample user data for tests | None | User objects |
| `__tests__/fixtures/courses.ts` | Sample course data for tests | None | Course objects |
| `prisma/seed.ts` | Seed test database with sample data | Fixtures | Database records |

### Data Models and Contracts

**Test Fixtures Schema:**

```typescript
// __tests__/fixtures/users.ts
export const mockStudent = {
  id: 'student-1',
  email: 'student@test.com',
  name: 'Test Student',
  role: 'STUDENT',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  deletedAt: null,
};

export const mockInstructor = {
  id: 'instructor-1',
  email: 'instructor@test.com',
  name: 'Test Instructor',
  role: 'INSTRUCTOR',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  deletedAt: null,
};

export const mockAdmin = {
  id: 'admin-1',
  email: 'admin@test.com',
  name: 'Test Admin',
  role: 'ADMIN',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  deletedAt: null,
};
```

```typescript
// __tests__/fixtures/courses.ts
export const mockCourse = {
  id: 'course-1',
  title: 'Introduction to AI',
  code: 'AI101',
  description: 'Learn AI fundamentals',
  semester: 'Spring',
  year: 2025,
  isActive: true,
  instructorId: 'instructor-1',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  deletedAt: null,
};
```

### APIs and Interfaces

**Test Helper Interfaces:**

```typescript
// __tests__/helpers/prismaMock.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

export type MockPrismaClient = DeepMockProxy<PrismaClient>;

export const prismaMock = mockDeep<PrismaClient>();

// Reset mocks between tests
export function resetPrismaMock() {
  jest.clearAllMocks();
}
```

```typescript
// __tests__/helpers/testUtils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';

interface WrapperProps {
  children: React.ReactNode;
}

const AllProviders = ({ children }: WrapperProps) => {
  return (
    <SessionProvider session={null}>
      {children}
    </SessionProvider>
  );
};

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}
```

### Workflows and Sequencing

**CI/CD Test Pipeline Flow:**

```
1. Developer opens Pull Request
   ↓
2. GitHub Actions triggered (.github/workflows/ci.yml)
   ↓
3. Install dependencies (npm ci, cached)
   ↓
4. Run linter (npm run lint)
   ↓
5. Run unit tests (npm test -- --coverage)
   ↓
6. Run integration tests (included in npm test)
   ↓
7. Run E2E tests (npm run test:e2e)
   ↓
8. Build application (npm run build)
   ↓
9. Upload coverage to Codecov
   ↓
10. Report status to PR (pass/fail)
    ↓
11. If all pass → Vercel deploys preview
```

**E2E Test Execution Flow:**

```
1. Playwright starts Next.js dev server (port 3000)
   ↓
2. Create isolated test database (Neon branch or SQLite)
   ↓
3. Seed test data (prisma/seed.ts)
   ↓
4. Execute test suites in parallel
   ↓
5. Capture screenshots on failure
   ↓
6. Generate HTML test report
   ↓
7. Cleanup test database
```

[Source: docs/architecture.md#CI/CD-Integration]

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Unit test execution time | < 30 seconds (full suite) | Jest timer |
| Integration test execution time | < 60 seconds (full suite) | Jest timer |
| E2E test execution time | < 5 minutes (critical paths) | Playwright timer |
| CI/CD total pipeline time | < 10 minutes | GitHub Actions duration |

**Optimization Strategies:**
- Jest runs tests in parallel by default
- Playwright tests run in parallel across 3 workers
- npm dependency caching in GitHub Actions
- Selective test running (only affected tests on file changes)

[Source: docs/PRD.md#NFR001]

### Security

- **Test database isolation:** E2E tests use separate Neon branch or in-memory SQLite, never production data
- **Secret management:** Test credentials stored in GitHub Secrets, never in code
- **No production access:** CI/CD pipeline cannot access production database or storage
- **Sanitized test data:** Fixtures contain no real PII (use fake names, emails)

[Source: docs/architecture.md#Security-Architecture]

### Reliability/Availability

- **Flaky test mitigation:** Playwright configured with 2 retries on CI
- **Deterministic tests:** Tests use fixed dates/times (mock Date.now())
- **Isolated environments:** Each PR gets fresh test environment
- **Failure visibility:** Screenshot capture on E2E test failure for debugging

### Observability

- **Test coverage reports:** Generated on every CI run, visible in PR
- **Coverage trends:** Tracked via Codecov dashboard over time
- **Failed test logs:** Full stack traces captured in GitHub Actions logs
- **E2E test artifacts:** Screenshots and traces uploaded as workflow artifacts

## Dependencies and Integrations

### NPM Dependencies (New)

| Package | Version | Purpose |
|---------|---------|---------|
| `jest` | ^29.x | Unit/integration test runner |
| `@types/jest` | ^29.x | TypeScript types for Jest |
| `ts-jest` | ^29.x | TypeScript support for Jest |
| `@testing-library/react` | ^14.x | React component testing |
| `@testing-library/jest-dom` | ^6.x | DOM matchers for Jest |
| `@testing-library/user-event` | ^14.x | User interaction simulation |
| `jest-mock-extended` | ^3.x | Deep mocking for Prisma |
| `@playwright/test` | ^1.40.x | E2E browser testing |
| `@axe-core/playwright` | ^4.x | Accessibility testing integration |

### Existing Dependencies (Used)

| Package | Purpose in Testing |
|---------|-------------------|
| `next` | Next.js test environment |
| `react` / `react-dom` | Component rendering |
| `prisma` | Database mocking |
| `next-auth` | Session mocking |

### External Services

| Service | Purpose | Cost |
|---------|---------|------|
| GitHub Actions | CI/CD runner | Free (public repo) / 2000 min/mo (private) |
| Codecov | Coverage tracking | Free (open source) |
| Neon | Test database branches | Free tier (included) |

[Source: docs/architecture.md#Technology-Stack]

## Acceptance Criteria (Authoritative)

### Story 1.5.1: Jest Testing Framework Setup

1. Jest installed and configured for Next.js 15 + TypeScript
2. Testing environment setup with proper Next.js App Router mocks
3. Test file structure established (`__tests__/` directories)
4. React Testing Library integrated for component testing
5. Sample unit test written and passing (e.g., utility function)
6. Sample integration test written and passing (e.g., API endpoint)
7. Test coverage reporting configured (Istanbul/nyc)
8. NPM scripts created: `npm test`, `npm run test:watch`, `npm run test:coverage`
9. `.gitignore` updated to exclude coverage reports

### Story 1.5.2: Playwright E2E Testing Framework Setup

1. Playwright installed and configured for Next.js application
2. Test environment setup with test database (isolated from development)
3. Browser contexts configured (Chromium primary, Firefox/WebKit optional)
4. Sample E2E test written and passing (e.g., login flow)
5. Page Object Model (POM) pattern established for test maintainability
6. Test data seeding scripts created (populate test database)
7. NPM scripts created: `npm run test:e2e`, `npm run test:e2e:ui`
8. Screenshots on failure configured
9. Headless mode working (for CI/CD execution)

### Story 1.5.3: CI/CD Pipeline with GitHub Actions

1. GitHub Actions workflow created (`.github/workflows/ci.yml`)
2. Workflow triggers: On pull request, on push to main branch
3. CI steps: Install → Lint → Unit tests → Integration tests → E2E tests → Build
4. Test failures block PR merge (required status check)
5. Environment variables configured via GitHub Secrets
6. Workflow status badges added to README.md
7. Workflow execution time optimized (parallel jobs, dependency caching)

### Story 1.5.4: Test Documentation & Guidelines

1. Testing guide document created (`docs/testing-guide.md`)
2. Documentation includes:
   - How to run tests locally (unit, integration, E2E)
   - How to write new tests (examples for each type)
   - Testing patterns and best practices (AAA pattern, mocking)
   - Page Object Model usage for E2E tests
   - When to write unit vs integration vs E2E tests
   - Test coverage expectations (70%+ for critical paths)
   - Debugging failed tests
3. Code examples provided for common testing scenarios
4. Accessibility testing guidelines included
5. CI/CD workflow documented

[Source: docs/epics.md#Epic-1.5]

## Traceability Mapping

| AC # | Spec Section | Component/File | Test Idea |
|------|-------------|----------------|-----------|
| 1.5.1-1 | Detailed Design | `/jest.config.js` | Config loads without errors |
| 1.5.1-2 | Detailed Design | `/__tests__/helpers/` | Next.js mocks work correctly |
| 1.5.1-3 | Detailed Design | `/__tests__/` structure | Directory structure exists |
| 1.5.1-4 | Detailed Design | `/__tests__/helpers/testUtils.tsx` | Component renders with providers |
| 1.5.1-5 | Detailed Design | `/__tests__/unit/sample.test.ts` | Sample test passes |
| 1.5.1-6 | APIs and Interfaces | `/__tests__/integration/api/sample.test.ts` | API test passes |
| 1.5.1-7 | Observability | Coverage config | Coverage report generated |
| 1.5.1-8 | Workflows | `package.json` scripts | All npm scripts work |
| 1.5.2-1 | Detailed Design | `/playwright.config.ts` | Config loads without errors |
| 1.5.2-2 | Security | Test database | Isolated from development |
| 1.5.2-4 | Detailed Design | `/__tests__/e2e/sample.spec.ts` | Sample E2E test passes |
| 1.5.2-5 | Detailed Design | `/__tests__/e2e/pages/` | Page objects work |
| 1.5.3-1 | Workflows | `/.github/workflows/ci.yml` | Workflow file valid |
| 1.5.3-2 | Workflows | GitHub triggers | PR triggers workflow |
| 1.5.3-3 | Workflows | CI steps | All steps execute in order |
| 1.5.3-4 | Workflows | Branch protection | Failing tests block merge |
| 1.5.4-1 | Documentation | `/docs/testing-guide.md` | Document exists |

## Risks, Assumptions, Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| E2E tests flaky in CI | Medium | High | Configure retries, use stable selectors, add waits for network |
| Test database sync issues | Low | Medium | Use Prisma migrations for test DB, reset between runs |
| CI pipeline slow | Medium | Medium | Parallelize tests, cache dependencies, run only affected tests |
| Coverage threshold blocks PRs | Low | Low | Start at 50% threshold, gradually increase to 70% |

### Assumptions

- **A1:** GitHub Actions free tier sufficient for beta development pace
- **A2:** Neon database branching available on free tier for test isolation
- **A3:** Team familiar with Jest/React Testing Library patterns
- **A4:** Vercel deployment waits for CI pipeline completion

### Open Questions

- **Q1:** Should we use Neon database branches or in-memory SQLite for integration tests?
  - **Recommendation:** SQLite for speed, Neon branch for production parity
- **Q2:** Multi-browser E2E testing (Firefox, WebKit) required for MVP?
  - **Recommendation:** Chromium-only for MVP, add others post-beta based on user feedback

## Test Strategy Summary

### Test Pyramid

```
         /\
        /  \
       / E2E \          ← Playwright (5-10 tests, critical flows)
      /______\
     /        \
    / Integ.  \         ← Jest (20-30 tests, API routes)
   /___________\
  /             \
 /     Unit      \      ← Jest (50-100 tests, business logic)
/_________________\
```

### Coverage Targets

| Category | Target Coverage | Rationale |
|----------|----------------|-----------|
| Business logic (`/src/lib/`) | 80%+ | Critical calculations (GPA, grades) |
| API routes (`/src/app/api/`) | 70%+ | Primary system interface |
| UI components | 50%+ | Focus on interactive components |
| Overall | 70%+ | PRD requirement (NFR005) |

### Testing Approach by Story Type

| Story Type | Unit Tests | Integration Tests | E2E Tests |
|------------|------------|-------------------|-----------|
| API endpoint | Logic tests | Route handler tests | User journey |
| UI component | Render tests | N/A | User interaction |
| Business logic | Calculation tests | N/A | N/A |
| Database migration | N/A | Schema validation | Data integrity |

### Sample Test Scenarios (Epic 1.5 Deliverables)

**Unit Test Sample:** GPA calculation utility
```typescript
// __tests__/unit/lib/gpa.test.ts
describe('calculateGPA', () => {
  it('calculates weighted GPA correctly', () => {
    const grades = [{ points: 90, maxPoints: 100, weight: 1 }];
    expect(calculateGPA(grades)).toBeCloseTo(3.6, 1);
  });

  it('returns null for empty grades', () => {
    expect(calculateGPA([])).toBeNull();
  });
});
```

**Integration Test Sample:** Course creation API
```typescript
// __tests__/integration/api/instructor/courses.test.ts
describe('POST /api/instructor/courses', () => {
  it('creates course with valid data', async () => {
    prismaMock.course.create.mockResolvedValue(mockCourse);
    const response = await POST(createRequest({ title: 'Test', code: 'CS101' }));
    expect(response.status).toBe(201);
  });
});
```

**E2E Test Sample:** Student login flow
```typescript
// __tests__/e2e/auth.spec.ts
test('student can login and see dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'student@test.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

[Source: docs/architecture.md#Testing-Strategy, docs/PRD.md#FR024]

---

**Document Status:** Draft
**Generated by:** BMM Epic Tech Context Workflow
**Next Steps:** Review and approve, then proceed to Story 1.5.1
