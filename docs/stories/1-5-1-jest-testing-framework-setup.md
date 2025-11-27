# Story 1.5.1: Jest Testing Framework Setup

Status: done

## Story

As a developer,
I want Jest configured for unit and integration testing,
so that I can write tests for business logic and API endpoints as features are developed.

## Acceptance Criteria

1. Jest installed and configured for Next.js 15 + TypeScript
2. Testing environment setup with proper Next.js App Router mocks
3. Test file structure established (`__tests__/` directories or `.test.ts` co-location)
4. React Testing Library integrated for component testing
5. Sample unit test written and passing (e.g., GPA calculation utility)
6. Sample integration test written and passing (e.g., course creation API endpoint)
7. Test coverage reporting configured (Istanbul/nyc)
8. NPM scripts created: `npm test`, `npm run test:watch`, `npm run test:coverage`
9. `.gitignore` updated to exclude coverage reports

## Tasks / Subtasks

### Task 1: Install Jest and Core Testing Dependencies
**Acceptance Criteria Reference:** AC1, AC4

**Subtasks:**
1. Install Jest core packages:
   - `jest@^29.x`
   - `@types/jest@^29.x`
   - `ts-jest@^29.x` (TypeScript support)
2. Install React Testing Library packages:
   - `@testing-library/react@^14.x`
   - `@testing-library/jest-dom@^6.x`
   - `@testing-library/user-event@^14.x`
3. Install additional testing utilities:
   - `jest-mock-extended@^3.x` (for Prisma mocking)
   - `jest-environment-jsdom` (for React component testing)
4. Verify all packages installed correctly with `npm list` command

---

### Task 2: Configure Jest for Next.js 15 + TypeScript
**Acceptance Criteria Reference:** AC1, AC2

**Subtasks:**
1. Create `/jest.config.js` with Next.js + TypeScript configuration:
   - Set `preset: 'ts-jest'` for TypeScript support
   - Configure `testEnvironment: 'jsdom'` for React component tests
   - Set `moduleNameMapper` to handle Next.js path aliases (`@/`)
   - Configure `setupFilesAfterEnv` to point to test setup file
   - Add `collectCoverageFrom` patterns (include `src/**`, exclude tests and config)
   - Set `coverageThreshold` to 70% for critical paths
2. Create `/__tests__/setup.ts` for global test configuration:
   - Import `@testing-library/jest-dom/extend-expect` for DOM matchers
   - Mock Next.js router (`next/navigation`)
   - Mock Next.js image component
   - Configure global test timeout (10 seconds)
3. Update `tsconfig.json` to include test files:
   - Add `"types": ["jest", "@testing-library/jest-dom"]` to compilerOptions
4. Test configuration by running `npx jest --showConfig`

**Reference:** See architecture.md#Testing-Strategy and tech-spec-epic-1-5.md for detailed configuration patterns

---

### Task 3: Create Test File Structure and Helpers
**Acceptance Criteria Reference:** AC3, AC2

**Subtasks:**
1. Create test directory structure:
   - `/__tests__/unit/` - Business logic unit tests
   - `/__tests__/integration/` - API route integration tests
   - `/__tests__/fixtures/` - Test data fixtures
   - `/__tests__/helpers/` - Shared test utilities
2. Create `/__tests__/helpers/prismaMock.ts`:
   - Import `jest-mock-extended` for Prisma client mocking
   - Export `MockPrismaClient` type
   - Export `prismaMock` singleton instance
   - Export `resetPrismaMock()` function for cleanup between tests
3. Create `/__tests__/helpers/testUtils.tsx`:
   - Import React Testing Library utilities
   - Create `AllProviders` wrapper component (SessionProvider, etc.)
   - Export `renderWithProviders()` custom render function
   - Export utility functions for common test scenarios
4. Create `/__tests__/fixtures/users.ts`:
   - Export `mockStudent`, `mockInstructor`, `mockAdmin` objects
   - Include all required User model fields (id, email, name, role, timestamps)
5. Create `/__tests__/fixtures/courses.ts`:
   - Export `mockCourse` object with complete Course model fields
   - Include instructor relationship reference

**Reference:** See tech-spec-epic-1-5.md#Data-Models-and-Contracts for fixture schemas

---

### Task 4: Write Sample Unit Test (GPA Calculation)
**Acceptance Criteria Reference:** AC5

**Subtasks:**
1. Create `src/lib/gpa.ts` with GPA calculation logic:
   - Function signature: `calculateGPA(grades: Grade[]): number | null`
   - Calculate weighted GPA: Sum(score × weight) / Sum(weights)
   - Return null for empty grades array
   - Convert percentage to 4.0 scale (configurable via environment variable)
2. Create `/__tests__/unit/lib/gpa.test.ts`:
   - Test case: Calculates weighted GPA correctly
   - Test case: Returns null for empty grades array
   - Test case: Handles partial grades (some assignments not graded)
   - Test case: Respects grading scale configuration (4.0 vs 5.0)
   - Use `toBeCloseTo()` matcher for floating-point comparisons
3. Run test: `npm test gpa.test.ts`
4. Verify test passes and coverage includes GPA calculation logic

**Reference:** See tech-spec-epic-1-5.md#Sample-Test-Scenarios for example test code

---

### Task 5: Write Sample Integration Test (Course Creation API)
**Acceptance Criteria Reference:** AC6

**Subtasks:**
1. Ensure course creation API route exists at `src/app/api/instructor/courses/route.ts`
2. Create `/__tests__/integration/api/instructor/courses.test.ts`:
   - Import API route handler (POST function)
   - Import `prismaMock` from test helpers
   - Test case: Creates course successfully with valid data
     - Mock `prismaMock.course.create()` to return `mockCourse`
     - Create Request object with valid course data
     - Assert response status 201
     - Assert response body contains created course
   - Test case: Returns 400 for invalid input (missing required fields)
     - Create Request with incomplete data
     - Assert response status 400
     - Assert error response includes validation details
   - Test case: Returns 401 if user not authenticated
     - Mock session as null
     - Assert response status 401
   - Test case: Returns 403 if user is not instructor
     - Mock session with student role
     - Assert response status 403
3. Run test: `npm test courses.test.ts`
4. Verify all test cases pass

**Reference:** See tech-spec-epic-1-5.md#APIs-and-Interfaces for API testing patterns

---

### Task 6: Configure Test Coverage Reporting
**Acceptance Criteria Reference:** AC7

**Subtasks:**
1. Update `jest.config.js` coverage configuration:
   - Set `collectCoverage: false` (only collect when explicitly requested)
   - Configure `collectCoverageFrom` patterns:
     - Include: `src/**/*.{ts,tsx}`
     - Exclude: `src/**/*.d.ts`, `src/**/*.test.{ts,tsx}`, `__tests__/**`
   - Set `coverageDirectory: 'coverage'`
   - Configure `coverageReporters`: `['text', 'lcov', 'html', 'json']`
   - Set `coverageThreshold` (optional, can be added later):
     - Global: 50% (increase gradually to 70%)
     - Critical paths (`src/lib/`, `src/app/api/`): 70%
2. Test coverage generation:
   - Run `npm run test:coverage` (to be created in next task)
   - Verify `coverage/` directory created
   - Open `coverage/lcov-report/index.html` to view coverage report
3. Verify coverage includes:
   - Line coverage percentage
   - Branch coverage percentage
   - Function coverage percentage
   - Uncovered lines highlighted in HTML report

**Reference:** See tech-spec-epic-1-5.md#Observability for coverage tracking

---

### Task 7: Create NPM Test Scripts
**Acceptance Criteria Reference:** AC8

**Subtasks:**
1. Add test scripts to `package.json`:
   ```json
   "scripts": {
     "test": "jest",
     "test:watch": "jest --watch",
     "test:coverage": "jest --coverage",
     "test:ci": "jest --ci --coverage --maxWorkers=2"
   }
   ```
2. Test each script:
   - `npm test` - Runs all tests once
   - `npm run test:watch` - Runs tests in watch mode (re-run on file changes)
   - `npm run test:coverage` - Runs tests with coverage report
3. Verify scripts work correctly and output is as expected

---

### Task 8: Update .gitignore for Coverage Reports
**Acceptance Criteria Reference:** AC9

**Subtasks:**
1. Open `.gitignore` file
2. Add coverage-related exclusions:
   ```
   # Test coverage
   /coverage/
   *.lcov
   .nyc_output/
   ```
3. Verify `coverage/` directory not tracked by Git:
   - Run `git status`
   - Ensure `coverage/` directory does not appear in untracked files
4. Commit `.gitignore` changes

---

### Task 9: Validation and Documentation
**Acceptance Criteria Reference:** All ACs

**Subtasks:**
1. Run complete test suite:
   - Execute `npm test`
   - Verify all tests pass (2+ tests: unit + integration)
   - Verify no errors or warnings
2. Generate coverage report:
   - Execute `npm run test:coverage`
   - Verify coverage report generated successfully
   - Check coverage percentages meet minimum thresholds
3. Test watch mode:
   - Execute `npm run test:watch`
   - Modify a test file
   - Verify tests re-run automatically
   - Exit watch mode (Ctrl+C)
4. Update project documentation:
   - Add testing section to README.md (or reference testing-guide.md)
   - Document how to run tests locally
   - Document test file structure conventions
5. Verify all acceptance criteria met:
   - AC1: Jest configured for Next.js 15 + TypeScript ✓
   - AC2: Testing environment with App Router mocks ✓
   - AC3: Test file structure established ✓
   - AC4: React Testing Library integrated ✓
   - AC5: Sample unit test passing ✓
   - AC6: Sample integration test passing ✓
   - AC7: Coverage reporting configured ✓
   - AC8: NPM scripts created ✓
   - AC9: .gitignore updated ✓

---

## Dev Notes

### Technical Guidance

**Jest Configuration for Next.js 15:**
- Next.js 15 uses App Router by default, which requires specific mocking strategies
- Use `jest-environment-jsdom` for React component tests
- Mock `next/navigation` for routing functionality
- Mock `next/image` to avoid image optimization errors in tests
- Use `ts-jest` for TypeScript support without build step

**React Testing Library Best Practices:**
- Query priority: `getByRole` > `getByLabelText` > `getByPlaceholderText` > `getByText` > `getByTestId`
- Use `screen` for queries (better error messages)
- Use `userEvent` over `fireEvent` for user interactions
- Test user behavior, not implementation details

**Prisma Mocking Strategy:**
- Use `jest-mock-extended` for deep mocking of Prisma client
- Mock at the client level, not individual methods
- Reset mocks between tests with `jest.clearAllMocks()`
- Use type-safe mocks: `DeepMockProxy<PrismaClient>`

**Test Coverage Guidelines:**
- Start with 50% coverage threshold, gradually increase to 70%
- Focus on critical paths: Business logic (src/lib/), API routes (src/app/api/)
- UI components can have lower coverage initially (50%+)
- Exclude generated files, type definitions, and test files from coverage

**Common Testing Patterns:**
```typescript
// AAA Pattern (Arrange, Act, Assert)
describe('calculateGPA', () => {
  it('calculates weighted GPA correctly', () => {
    // Arrange - Set up test data
    const grades = [{ points: 90, maxPoints: 100, weight: 1 }];

    // Act - Execute function under test
    const gpa = calculateGPA(grades);

    // Assert - Verify expected outcome
    expect(gpa).toBeCloseTo(3.6, 1);
  });
});
```

### Project Structure Notes

**Test File Locations:**
- **Unit tests:** `/__tests__/unit/` - Mirror source directory structure
  - Example: `src/lib/gpa.ts` → `__tests__/unit/lib/gpa.test.ts`
- **Integration tests:** `/__tests__/integration/api/` - Mirror API route structure
  - Example: `src/app/api/instructor/courses/route.ts` → `__tests__/integration/api/instructor/courses.test.ts`
- **Test fixtures:** `/__tests__/fixtures/` - Organized by model type
  - `users.ts`, `courses.ts`, `assignments.ts`, etc.
- **Test helpers:** `/__tests__/helpers/` - Shared utilities
  - `prismaMock.ts`, `testUtils.tsx`, `setup.ts`

**Naming Conventions:**
- Test files: `*.test.ts` or `*.test.tsx` (for components)
- Describe blocks: Use function/component name
- Test cases: Use "it" with user-facing behavior description
- Mock objects: Prefix with `mock` (e.g., `mockCourse`, `mockStudent`)

**File Organization:**
```
/__tests__/
├── setup.ts                          # Global test setup
├── helpers/
│   ├── prismaMock.ts                # Prisma client mock
│   └── testUtils.tsx                # React Testing Library utilities
├── fixtures/
│   ├── users.ts                     # User test data
│   ├── courses.ts                   # Course test data
│   └── assignments.ts               # Assignment test data
├── unit/
│   └── lib/
│       └── gpa.test.ts              # GPA calculation tests
└── integration/
    └── api/
        └── instructor/
            └── courses.test.ts      # Course API tests
```

### References

**Source Documents:**
- Epic 1.5 Technical Specification: `/docs/tech-spec-epic-1-5.md`
  - Section: "Detailed Design" - Test helper interfaces and fixtures
  - Section: "Sample Test Scenarios" - Unit and integration test examples
  - Section: "NPM Dependencies" - Jest and testing library versions
- Architecture Document: `/docs/architecture.md`
  - Section: "Testing Strategy" - Test pyramid and coverage targets
  - Section: "Project Structure" - `__tests__/` directory organization
- Epic Breakdown: `/docs/epics.md`
  - Story 1.5.1 Acceptance Criteria (authoritative source)

**External Documentation:**
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Next.js Applications](https://nextjs.org/docs/app/building-your-application/testing/jest)
- [jest-mock-extended](https://github.com/marchaos/jest-mock-extended)

**Key Decisions:**
- Use `__tests__/` directory structure (not co-located `.test.ts` files) for clarity
- Mock Prisma client at client level (not individual methods) for type safety
- Start with 50% coverage threshold, increase gradually to 70% for critical paths
- Use React Testing Library for component tests (not Enzyme)
- Configure tests to run in parallel by default (Jest default behavior)

---

## Dev Agent Record

### Context Reference
- **Story Context XML:** `docs/stories/1-5-1-jest-testing-framework-setup.context.xml` (Generated 2025-11-26)
- **Tech Spec:** `/docs/tech-spec-epic-1-5.md` (Epic 1.5 Testing Infrastructure Setup)
- **Architecture:** `/docs/architecture.md` (Testing Strategy section)
- **Epics:** `/docs/epics.md` (Story 1.5.1 acceptance criteria)
- **Prisma Schema:** `/prisma/schema.prisma` (Database models for fixtures)
- **Existing API Routes:** `/src/app/api/` (Integration test targets)

### Agent Model Used
- Model: Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)
- Date: 2025-11-26

### Debug Log References
- Test execution logs: `npm test` output
- Coverage reports: `/coverage/lcov-report/index.html`
- Jest configuration validation: `npx jest --showConfig`

### Completion Notes List
- [x] All Jest packages installed successfully (jest@29.7.0, @testing-library/react@16.3.0)
- [x] `jest.config.js` created and validated
- [x] Test directory structure created (`__tests__/unit/`, `__tests__/integration/`, etc.)
- [x] Prisma mock helper created and tested
- [x] React Testing Library utilities helper created
- [x] Test fixtures created (users, courses)
- [x] Sample unit test (GPA calculation) written and passing (18 tests)
- [x] Sample integration test (course creation API) written and passing (8 tests)
- [x] Coverage reporting configured and generating reports
- [x] NPM scripts created and tested (`test`, `test:watch`, `test:coverage`)
- [x] `.gitignore` updated to exclude coverage reports
- [x] All acceptance criteria validated and met

**Implementation Date:** 2025-11-26
**Total Tests:** 26 passing (18 unit + 8 integration)

### File List
**Created Files:**
- `/jest.config.js` - Jest configuration for Next.js 15 + TypeScript
- `/__tests__/setup.ts` - Global test setup (DOM matchers, Next.js mocks)
- `/__tests__/helpers/prismaMock.ts` - Prisma client mock singleton
- `/__tests__/helpers/testUtils.tsx` - React Testing Library utilities
- `/__tests__/fixtures/users.ts` - User test data fixtures
- `/__tests__/fixtures/courses.ts` - Course test data fixtures
- `/__tests__/unit/lib/gpa.test.ts` - GPA calculation unit tests
- `/__tests__/integration/api/instructor/courses.test.ts` - Course API integration tests
- `/src/lib/gpa.ts` - GPA calculation logic (if not exists)

**Modified Files:**
- `/package.json` - Added test scripts and testing dependencies
- `/.gitignore` - Added coverage report exclusions
- `/tsconfig.json` - Added Jest types to compilerOptions
- `/README.md` - Added testing section (optional)

**Generated Files (excluded from Git):**
- `/coverage/` - Test coverage reports (HTML, LCOV, JSON)
- `/node_modules/` - Installed testing packages

---

**Story Status:** Drafted
**Ready for Development:** Yes
**Prerequisites:** None (foundational testing story)
**Next Story:** 1.5.2 - Playwright E2E Testing Framework Setup
