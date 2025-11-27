# Story 1.5.4: Test Documentation & Guidelines

Status: done

## Story

As a new developer joining the project,
I want clear documentation on testing practices and guidelines,
So that I can write consistent, high-quality tests following established patterns.

## Acceptance Criteria

1. Testing guide document created (`docs/testing-guide.md`)
2. Documentation includes:
   - How to run tests locally (unit, integration, E2E)
   - How to write new tests (examples for each type)
   - Testing patterns and best practices (AAA pattern, mocking strategies)
   - Page Object Model usage for E2E tests
   - When to write unit vs integration vs E2E tests
   - Test coverage expectations (70%+ for critical paths)
   - Debugging failed tests (common issues and solutions)
3. Code examples provided for common testing scenarios
4. Accessibility testing guidelines included (keyboard navigation, screen readers)
5. CI/CD workflow documented (how automated testing works)
6. Troubleshooting section (common CI/CD failures and fixes)

## Tasks / Subtasks

### Task 1: Create Testing Guide Structure
**Acceptance Criteria Reference:** AC1, AC2

**Subtasks:**
1. Create `docs/testing-guide.md` file
2. Define document structure with clear sections:
   - Introduction (purpose and goals of testing)
   - Getting Started (prerequisites and setup)
   - Running Tests Locally (unit, integration, E2E)
   - Writing Tests (examples and patterns)
   - Testing Strategy (when to use each test type)
   - Best Practices and Patterns
   - Accessibility Testing
   - CI/CD Integration
   - Debugging and Troubleshooting
3. Add table of contents with anchor links
4. Include document metadata (author, date, version)

### Task 2: Document Test Execution
**Acceptance Criteria Reference:** AC2 (bullet 1), AC5

**Subtasks:**
1. Document how to run unit tests:
   - `npm test` - Run all tests
   - `npm run test:watch` - Watch mode for development
   - `npm run test:coverage` - Generate coverage report
   - Examples of running specific test files
2. Document how to run integration tests:
   - Explain integration tests run with unit tests
   - Show filtering by test pattern
3. Document how to run E2E tests:
   - `npm run test:e2e` - Headless mode
   - `npm run test:e2e:ui` - UI mode for debugging
   - `npm run test:e2e:debug` - Debug mode with breakpoints
4. Document CI/CD test workflow:
   - GitHub Actions workflow overview
   - When tests run (PR creation, push to main)
   - How to view test results in GitHub
   - What happens when tests fail

### Task 3: Write Unit Test Examples
**Acceptance Criteria Reference:** AC2 (bullet 2), AC3

**Subtasks:**
1. Document unit testing approach:
   - AAA pattern (Arrange, Act, Assert)
   - Co-location strategy (test files next to source)
   - Naming conventions for test files and test cases
2. Provide example: Testing utility functions
   ```typescript
   // Example: GPA calculation test
   describe('calculateGPA', () => {
     it('calculates GPA correctly for weighted grades', () => {
       const grades = [
         { points: 90, maxPoints: 100, weight: 1 },
         { points: 85, maxPoints: 100, weight: 2 },
       ];
       const gpa = calculateGPA(grades);
       expect(gpa).toBeCloseTo(3.53, 2);
     });
   });
   ```
3. Provide example: Testing React components
   ```typescript
   // Example: Button component test
   describe('Button', () => {
     it('renders with correct text', () => {
       render(<Button>Click me</Button>);
       expect(screen.getByText('Click me')).toBeInTheDocument();
     });
   });
   ```
4. Provide example: Testing with React Testing Library
   - User event simulation
   - Async testing patterns
   - Custom render helpers

### Task 4: Write Integration Test Examples
**Acceptance Criteria Reference:** AC2 (bullet 2), AC3

**Subtasks:**
1. Document integration testing approach:
   - Testing API routes end-to-end
   - Mocking Prisma client
   - Testing with authentication context
2. Provide example: Testing POST endpoint
   ```typescript
   // Example: Course creation API test
   describe('POST /api/instructor/courses', () => {
     it('creates a course successfully', async () => {
       const mockCourse = { id: '1', title: 'Test Course' };
       prismaMock.course.create.mockResolvedValue(mockCourse);

       const request = new Request('http://localhost/api/instructor/courses', {
         method: 'POST',
         body: JSON.stringify({ title: 'Test Course', code: 'CS101' }),
       });

       const response = await POST(request);
       expect(response.status).toBe(201);
     });
   });
   ```
3. Provide example: Testing with authentication
   - Mocking NextAuth session
   - Testing authorization checks
4. Provide example: Testing validation errors
   - Invalid input scenarios
   - Error response format verification

### Task 5: Write E2E Test Examples with Page Object Model
**Acceptance Criteria Reference:** AC2 (bullet 2-4), AC3

**Subtasks:**
1. Document E2E testing approach:
   - Purpose of E2E tests (user journeys)
   - When to write E2E tests vs unit/integration
   - Page Object Model pattern explained
2. Document Page Object Model pattern:
   - Create page objects for reusability
   - Encapsulate page interactions
   - Benefits: maintainability, readability
3. Provide example: Page Object class
   ```typescript
   // Example: LoginPage object
   export class LoginPage {
     constructor(private page: Page) {}

     async goto() {
       await this.page.goto('/login');
     }

     async login(email: string, password: string) {
       await this.page.fill('input[name="email"]', email);
       await this.page.fill('input[name="password"]', password);
       await this.page.click('button[type="submit"]');
     }
   }
   ```
4. Provide example: E2E test using page objects
   ```typescript
   // Example: Student enrollment flow
   test('student can enroll in course', async ({ page }) => {
     const loginPage = new LoginPage(page);
     const catalogPage = new CatalogPage(page);

     await loginPage.goto();
     await loginPage.login('student@example.com', 'password');

     await catalogPage.goto();
     await catalogPage.enrollInCourse('Introduction to AI');

     await expect(page.locator('text=Successfully enrolled')).toBeVisible();
   });
   ```
5. Provide example: Handling async operations
   - Waiting for network requests
   - Waiting for elements to appear
   - Using Playwright auto-waiting features

### Task 6: Document Testing Decision Framework
**Acceptance Criteria Reference:** AC2 (bullet 5), AC6

**Subtasks:**
1. Create decision tree: When to write each test type
   - **Unit tests:** Business logic, utility functions, calculations, validators
   - **Integration tests:** API routes, database interactions, authentication flows
   - **E2E tests:** Critical user journeys, multi-step workflows, accessibility validation
2. Provide guidelines for test coverage:
   - Critical paths: 70%+ coverage required
   - Business logic: 80%+ coverage target
   - UI components: 50%+ coverage target
   - Overall project: 70%+ coverage (PRD requirement)
3. Document test pyramid approach:
   - Many unit tests (fast, isolated)
   - Moderate integration tests (API validation)
   - Few E2E tests (critical flows only)
4. Provide examples of each test type for common scenarios:
   - User registration: Unit (validation) + Integration (API) + E2E (full flow)
   - Assignment submission: Unit (file validation) + Integration (upload API) + E2E (student journey)
   - Gradebook: Unit (GPA calculation) + Integration (gradebook API) + E2E (instructor workflow)

### Task 7: Document Best Practices and Patterns
**Acceptance Criteria Reference:** AC2 (bullet 3, 7)

**Subtasks:**
1. Document AAA pattern (Arrange, Act, Assert):
   - Arrange: Set up test data and mocks
   - Act: Execute the code being tested
   - Assert: Verify expected outcomes
   - Example implementation
2. Document mocking strategies:
   - When to mock (external dependencies, slow operations)
   - Prisma client mocking (jest-mock-extended)
   - NextAuth session mocking
   - File upload mocking
3. Document test data management:
   - Use test fixtures for consistency
   - Location: `__tests__/fixtures/`
   - Examples: mockStudent, mockCourse, mockAssignment
4. Document test isolation:
   - Each test should be independent
   - Reset mocks between tests (beforeEach/afterEach)
   - Avoid shared state between tests
5. Document async testing patterns:
   - Use async/await consistently
   - Handle promises correctly
   - Test loading states and error states

### Task 8: Document Accessibility Testing Guidelines
**Acceptance Criteria Reference:** AC4

**Subtasks:**
1. Document accessibility testing approach:
   - WCAG 2.1 AA compliance target
   - Automated testing with axe-core/Playwright
   - Manual testing with keyboard navigation
   - Screen reader compatibility testing
2. Provide example: Automated accessibility tests
   ```typescript
   // Example: Accessibility test with axe-core
   import { injectAxe, checkA11y } from 'axe-playwright';

   test('homepage has no accessibility violations', async ({ page }) => {
     await page.goto('/');
     await injectAxe(page);
     await checkA11y(page);
   });
   ```
3. Document keyboard navigation testing:
   - Tab order validation
   - Focus indicators visible
   - All interactive elements keyboard-accessible
   - Escape key closes modals
   - Enter key submits forms
4. Document screen reader testing guidelines:
   - Test with NVDA (Windows) or VoiceOver (Mac)
   - Verify ARIA labels present
   - Verify landmarks properly defined
   - Verify dynamic content announced
5. Provide checklist for accessibility validation:
   - Color contrast ratios (4.5:1 for normal text)
   - Form labels properly associated
   - Alt text for images
   - Heading hierarchy logical
   - No keyboard traps

### Task 9: Document Debugging and Troubleshooting
**Acceptance Criteria Reference:** AC2 (bullet 7), AC6

**Subtasks:**
1. Document common test failures and solutions:
   - **Timeout errors:** Increase timeout, check network mocks
   - **Flaky tests:** Add proper waits, fix race conditions
   - **Mock not working:** Verify mock setup, check import paths
   - **Database errors:** Check test database connection, verify migrations
2. Document debugging techniques for unit tests:
   - Use `test.only()` to run single test
   - Use `console.log()` for quick debugging
   - Use VS Code debugger with breakpoints
   - Check test coverage report for gaps
3. Document debugging techniques for E2E tests:
   - Run in UI mode (`npm run test:e2e:ui`)
   - View screenshots on failure (automatic capture)
   - Use `page.pause()` for interactive debugging
   - View trace files for failed tests
4. Document CI/CD troubleshooting:
   - View full logs in GitHub Actions
   - Check environment variables configured
   - Verify test database accessible
   - Check for timeouts in CI environment
5. Provide debugging workflow:
   ```
   1. Identify failing test
   2. Run test locally in isolation
   3. Add console.log or breakpoints
   4. Check mocks and test data
   5. Verify test setup/teardown
   6. Fix issue and verify locally
   7. Push and verify in CI
   ```

### Task 10: Add Code Examples for Common Scenarios
**Acceptance Criteria Reference:** AC3

**Subtasks:**
1. Create comprehensive examples section:
   - Testing authentication flows
   - Testing file uploads
   - Testing forms with validation
   - Testing data tables with sorting/filtering
   - Testing modal dialogs
   - Testing API error handling
2. For each example, provide:
   - Scenario description
   - Complete working code
   - Expected behavior
   - Common pitfalls to avoid
3. Link examples to actual test files in codebase:
   - Reference Story 1.5.1 sample tests
   - Reference Story 1.5.2 sample E2E tests
   - Point to `__tests__/` directory structure

### Task 11: Document CI/CD Workflow Details
**Acceptance Criteria Reference:** AC5

**Subtasks:**
1. Document GitHub Actions workflow:
   - Location: `.github/workflows/ci.yml`
   - Triggers: Pull request, push to main
   - Steps: Install → Lint → Test → Build
2. Document test execution in CI:
   - Parallelization strategy
   - Timeout configuration (retries for E2E)
   - Test results reporting
3. Document coverage reporting:
   - Coverage report uploaded to Codecov
   - Coverage visible in PR comments
   - Coverage trends tracked over time
4. Document required status checks:
   - Tests must pass before merge
   - Coverage threshold enforced (70%+ for critical paths)
   - Linting must pass
5. Provide visual diagram of CI/CD flow:
   ```
   PR Created → GitHub Actions Triggered
             ↓
   Install Dependencies (cached)
             ↓
   Run Linter
             ↓
   Run Unit Tests (parallel)
             ↓
   Run Integration Tests (parallel)
             ↓
   Run E2E Tests (sequential)
             ↓
   Upload Coverage Report
             ↓
   Tests Pass ✅ → Allow Merge
   Tests Fail ❌ → Block Merge
   ```

### Task 12: Review and Validation
**Acceptance Criteria Reference:** All ACs

**Subtasks:**
1. Review complete testing guide for:
   - Clarity and readability
   - Completeness (all ACs covered)
   - Code examples are accurate and working
   - Links and cross-references correct
2. Validate examples by running them:
   - Unit test examples execute successfully
   - Integration test examples execute successfully
   - E2E test examples execute successfully
3. Test accessibility testing examples:
   - Verify axe-core integration works
   - Confirm keyboard navigation examples accurate
4. Peer review with team:
   - Gather feedback on documentation clarity
   - Identify missing scenarios or examples
   - Incorporate feedback and revisions
5. Create index entry in `docs/index.md`:
   - Link to testing guide
   - Brief description of contents

## Dev Notes

### Technical Guidance from Tech Spec and Architecture

**Testing Infrastructure Overview (Epic 1.5):**
- Story 1.5.1 establishes Jest framework with sample unit/integration tests
- Story 1.5.2 establishes Playwright framework with sample E2E tests
- Story 1.5.3 establishes CI/CD pipeline with automated test execution
- **Story 1.5.4 (this story):** Comprehensive documentation of testing practices

**Test Coverage Requirements (Tech Spec):**
- **Critical paths:** 70%+ coverage required (PRD NFR005)
- **Business logic:** 80%+ coverage target
- **API routes:** 70%+ coverage target
- **UI components:** 50%+ coverage target
- **Overall project:** 70%+ coverage goal

**Test Pyramid Distribution (Architecture):**
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

**Testing Tools and Libraries:**
- **Unit/Integration:** Jest ^29.x + React Testing Library ^14.x
- **E2E:** Playwright ^1.40.x with Page Object Model pattern
- **Accessibility:** @axe-core/playwright ^4.x
- **Coverage:** Istanbul/nyc (built into Jest)
- **Mocking:** jest-mock-extended ^3.x for Prisma mocking

**Key Testing Patterns:**
1. **AAA Pattern:** Arrange → Act → Assert
2. **Test Isolation:** Each test independent, no shared state
3. **Mocking Strategy:** Mock external dependencies (DB, APIs, file system)
4. **Page Object Model:** Encapsulate page interactions for E2E tests
5. **Async Testing:** Use async/await, handle promises correctly

**Test File Structure (Architecture):**
```
__tests__/
├── unit/                    # Business logic tests
│   ├── lib/
│   │   ├── gpa.test.ts      # Example from Tech Spec
│   │   └── validation.test.ts
│   └── validators/
├── integration/             # API route tests
│   └── api/
│       ├── instructor/
│       │   └── courses.test.ts  # Example from Tech Spec
│       └── student/
├── e2e/                     # End-to-end tests
│   ├── student.spec.ts      # Student journey (Story 3.1)
│   ├── instructor.spec.ts   # Instructor journey (Story 3.2)
│   ├── admin.spec.ts        # Admin journey (Story 3.3)
│   └── accessibility.spec.ts # Accessibility tests (Story 3.4)
├── fixtures/                # Test data
│   ├── users.ts             # mockStudent, mockInstructor, mockAdmin
│   └── courses.ts           # mockCourse
└── helpers/
    ├── prismaMock.ts        # Prisma client mock
    └── testUtils.tsx        # React Testing Library wrappers
```

**Sample Test Examples (from Tech Spec):**

**Unit Test Example:**
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

**Integration Test Example:**
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

**E2E Test Example:**
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

**CI/CD Test Pipeline (from Tech Spec):**
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

**Accessibility Testing Requirements (Tech Spec):**
- **WCAG 2.1 AA compliance:** Color contrast, keyboard navigation, ARIA labels
- **Automated testing:** Integrated via @axe-core/playwright
- **Manual testing:** Keyboard navigation, screen reader compatibility
- **Lighthouse score target:** > 90 for accessibility

**Performance Targets for Tests (Tech Spec):**
- Unit test execution: < 30 seconds (full suite)
- Integration test execution: < 60 seconds (full suite)
- E2E test execution: < 5 minutes (critical paths)
- CI/CD total pipeline: < 10 minutes

**Common Testing Scenarios to Document:**
1. Testing authentication flows (login, logout, session)
2. Testing file uploads (validation, S3 integration)
3. Testing forms with Zod validation
4. Testing API endpoints with error handling
5. Testing React components with user interactions
6. Testing database operations with Prisma mocks
7. Testing accessibility (keyboard nav, screen readers)
8. Testing responsive design (mobile, tablet, desktop)

### Project Structure Notes

**Documentation Location:**
- **Primary file:** `/docs/testing-guide.md` (create this file)
- **Reference files:**
  - `/docs/tech-spec-epic-1-5.md` (Epic 1.5 technical specification)
  - `/docs/architecture.md` (Testing Strategy section)
  - `/docs/epics.md` (Story 1.5.4 acceptance criteria)

**Test File Locations (for examples and references):**
- **Unit tests:** `__tests__/unit/` (created in Story 1.5.1)
- **Integration tests:** `__tests__/integration/` (created in Story 1.5.1)
- **E2E tests:** `__tests__/e2e/` (created in Story 1.5.2)
- **Test helpers:** `__tests__/helpers/` (prismaMock.ts, testUtils.tsx)
- **Test fixtures:** `__tests__/fixtures/` (users.ts, courses.ts)

**Configuration Files (for reference in documentation):**
- `/jest.config.js` - Jest configuration (created in Story 1.5.1)
- `/playwright.config.ts` - Playwright configuration (created in Story 1.5.2)
- `/.github/workflows/ci.yml` - CI/CD workflow (created in Story 1.5.3)

**NPM Scripts (to document):**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

**Documentation Style Guidelines:**
- Use Markdown formatting consistently
- Include code blocks with syntax highlighting (```typescript)
- Add section navigation (table of contents with anchors)
- Use numbered lists for sequential steps
- Use bullet points for non-sequential items
- Include visual diagrams where helpful (ASCII art or mermaid)
- Provide "copy-paste ready" code examples
- Link to external resources (Jest docs, Playwright docs)

### References

**Primary Source Documents:**
1. **Tech Spec:** `/docs/tech-spec-epic-1-5.md`
   - Section: "Test Strategy Summary" (lines 402-479)
   - Provides test pyramid, coverage targets, sample tests
2. **Architecture:** `/docs/architecture.md`
   - Section: "Testing Strategy" (lines 1417-1711)
   - Provides test pyramid, NPM scripts, CI/CD integration
3. **Epics:** `/docs/epics.md`
   - Section: "Story 1.5.4" (lines 316-338)
   - Provides acceptance criteria and prerequisites

**Related Stories:**
- **Story 1.5.1:** Jest Testing Framework Setup (sample unit/integration tests)
- **Story 1.5.2:** Playwright E2E Testing Framework Setup (sample E2E tests, Page Object Model)
- **Story 1.5.3:** CI/CD Pipeline with GitHub Actions (automated test execution)

**External Documentation References:**
- Jest Documentation: https://jestjs.io/docs/getting-started
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro
- Playwright Documentation: https://playwright.dev/docs/intro
- Playwright Page Object Model: https://playwright.dev/docs/pom
- axe-core Playwright: https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/

## Dev Agent Record

### Context Reference
- Story Context: `/docs/stories/1-5-4-test-documentation-guidelines.context.xml` (Comprehensive story context)
- Tech Spec: `/docs/tech-spec-epic-1-5.md` (Epic 1.5 Testing Infrastructure)
- Architecture: `/docs/architecture.md` (Testing Strategy, CI/CD Integration)
- Epics: `/docs/epics.md` (Story 1.5.4 acceptance criteria)

### Agent Model Used
- Model: Claude Opus 4.5 (claude-opus-4-5-20251101)
- Execution Date: 2025-11-26

### Debug Log References
- Documentation created: `docs/testing-guide.md`
- All sections covered: Introduction, Running Tests, Writing Tests, Best Practices, POM, Accessibility, CI/CD, Debugging

### Completion Notes List
- [x] `docs/testing-guide.md` created with comprehensive testing documentation
- [x] All 6 acceptance criteria addressed in documentation
- [x] Code examples provided (copy-paste ready)
- [x] Unit test examples included
- [x] Integration test examples included
- [x] E2E test examples with Page Object Model included
- [x] Accessibility testing guidelines included
- [x] CI/CD workflow documented
- [x] Debugging and troubleshooting section included
- [ ] Documentation peer-reviewed by team (manual step)

### File List

**Files to Create:**
1. `/docs/testing-guide.md` - Main testing guide document (primary deliverable)

**Files to Reference:**
1. `/docs/tech-spec-epic-1-5.md` - Epic 1.5 technical specification
2. `/docs/architecture.md` - Architecture document (Testing Strategy)
3. `/docs/epics.md` - Epic breakdown document (AC source)
4. `/jest.config.js` - Jest configuration (for examples)
5. `/playwright.config.ts` - Playwright configuration (for examples)
6. `/.github/workflows/ci.yml` - CI/CD workflow (for documentation)
7. `/__tests__/unit/` - Unit test examples (created in Story 1.5.1)
8. `/__tests__/integration/` - Integration test examples (created in Story 1.5.1)
9. `/__tests__/e2e/` - E2E test examples (created in Story 1.5.2)
10. `/__tests__/helpers/prismaMock.ts` - Prisma mock helper (for examples)
11. `/__tests__/helpers/testUtils.tsx` - React Testing Library wrapper (for examples)
12. `/__tests__/fixtures/users.ts` - Test fixtures (for examples)

**Files to Update:**
1. `/docs/index.md` - Add link to testing guide
