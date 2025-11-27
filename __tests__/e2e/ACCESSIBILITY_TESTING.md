# Accessibility Testing Guide

## Overview

This guide covers accessibility testing for the AI Gurus LMS application, ensuring WCAG 2.1 AA compliance across all pages and features.

## Test Coverage

### Automated Tests (axe-core)

Our accessibility test suite uses `@axe-core/playwright` to validate WCAG 2.1 AA compliance on:

1. **Authentication Pages**
   - Login page
   - Sign-in flow

2. **Student Pages**
   - Student Dashboard (with GPA display)
   - Course Catalog
   - Course Detail page
   - Assignment page
   - Discussion page
   - Gradebook

3. **Instructor Pages**
   - Instructor Dashboard
   - Instructor Gradebook
   - Course Management

4. **Admin Pages**
   - Admin Dashboard
   - System Statistics
   - User Management

### Manual Tests (Keyboard Navigation)

Keyboard navigation tests verify:
- Tab order is logical
- No keyboard traps exist
- Enter/Space key activation works
- Escape key closes modals
- Arrow keys work for appropriate controls
- Focus indicators are visible

## Running Tests

### Run All Accessibility Tests

```bash
npm run test:e2e -- accessibility.spec.ts keyboard-navigation.spec.ts
```

### Run Only Automated WCAG Tests

```bash
npm run test:e2e -- accessibility.spec.ts
```

### Run Only Keyboard Navigation Tests

```bash
npm run test:e2e -- keyboard-navigation.spec.ts
```

### Run Tests in UI Mode (Debugging)

```bash
npm run test:e2e:ui -- accessibility.spec.ts
```

### Run Tests in Headed Mode (Watch Browser)

```bash
npm run test:e2e:headed -- accessibility.spec.ts
```

## Understanding Test Results

### Severity Levels

Accessibility violations are classified by severity:

- **P0 (Critical)**: Blocks accessibility, must fix before merge
- **P1 (Serious)**: Severely impacts accessibility, must fix before merge
- **P2 (Moderate)**: Impacts accessibility, should fix soon
- **P3 (Minor)**: Minor accessibility issue, nice to fix

### Blocking Issues

Tests will **fail** (blocking merge) if there are P0 or P1 violations:
- Critical color contrast issues
- Missing form labels
- Missing ARIA labels on complex components
- Keyboard navigation failures
- Missing alt text on images

### Warnings

Tests will **warn** (but not block) for P2 and P3 violations.

## Common WCAG 2.1 AA Requirements

### Color Contrast

- **Normal text**: 4.5:1 contrast ratio
- **Large text** (18pt+, 14pt+ bold): 3:1 contrast ratio
- **UI components**: 3:1 contrast ratio

### Keyboard Navigation

All interactive elements must be:
- Reachable via Tab key
- Activatable with Enter or Space
- Have visible focus indicators
- Not create keyboard traps

### Form Labels

All form inputs must have:
- Associated `<label>` element, OR
- `aria-label` attribute, OR
- `aria-labelledby` attribute

### Images

All `<img>` elements must have:
- `alt` attribute with descriptive text, OR
- `alt=""` for decorative images, OR
- Proper ARIA role if complex

### ARIA

Interactive components must have:
- Proper `role` attributes
- `aria-label` or `aria-labelledby` for complex components
- Valid ARIA attributes and values
- Proper parent-child relationships

## Test Reports

### Console Output

Test reports are printed to console with:
- Total violations count
- Violations by severity (P0/P1/P2/P3)
- Detailed violation information
- Links to WCAG guidelines

### JSON Reports (CI Only)

In CI environment, JSON reports are saved to:
```
test-results/accessibility/[page-name]-[timestamp].json
```

These reports can be uploaded as artifacts for later review.

## CI/CD Integration

### GitHub Actions

Accessibility tests run automatically on every PR via GitHub Actions.

- Tests must pass before PR can be merged
- Failures automatically comment on PR with details
- Test reports uploaded as artifacts (30-day retention)

### Workflow

```yaml
# .github/workflows/ci.yml
accessibility:
  name: Accessibility Tests
  runs-on: ubuntu-latest
  steps:
    - Run WCAG 2.1 AA compliance tests
    - Upload accessibility reports
    - Comment on PR if failures
```

### Viewing Reports in CI

1. Go to PR "Checks" tab
2. Find "Accessibility Tests" workflow
3. Download "accessibility-reports" artifact
4. Review JSON reports for detailed violations

## Fixing Accessibility Issues

### Color Contrast Issues

```tsx
// Bad
<div className="text-gray-400 bg-gray-100">Low contrast text</div>

// Good
<div className="text-gray-900 bg-white">High contrast text</div>
```

Use contrast checker: https://webaim.org/resources/contrastchecker/

### Form Label Issues

```tsx
// Bad
<input type="email" placeholder="Email" />

// Good
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// Also Good
<input type="email" aria-label="Email address" />
```

### Missing Alt Text

```tsx
// Bad
<img src="/logo.png" />

// Good
<img src="/logo.png" alt="AI Gurus LMS Logo" />

// Decorative images
<img src="/decoration.png" alt="" role="presentation" />
```

### ARIA Labels

```tsx
// Bad
<button onClick={handleClose}>×</button>

// Good
<button onClick={handleClose} aria-label="Close dialog">×</button>

// For complex components
<div role="navigation" aria-label="Course navigation">
  {/* navigation content */}
</div>
```

### Keyboard Navigation

```tsx
// Ensure all interactive elements are keyboard accessible
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Click me
</div>

// Better: Use semantic HTML
<button onClick={handleClick}>Click me</button>
```

### Focus Indicators

```css
/* Ensure visible focus indicators */
button:focus,
a:focus,
input:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}

/* Or use custom focus styles */
button:focus-visible {
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.5);
  outline: none;
}
```

## Tools & Resources

### Browser Extensions

- **axe DevTools**: Browser extension for manual testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Built into Chrome DevTools

### Online Tools

- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **WAVE Web Accessibility Tool**: https://wave.webaim.org/
- **axe Browser Extension**: https://www.deque.com/axe/browser-extensions/

### Documentation

- **WCAG 2.1 Quick Reference**: https://www.w3.org/WAI/WCAG21/quickref/
- **MDN Accessibility**: https://developer.mozilla.org/en-US/docs/Web/Accessibility
- **WebAIM Articles**: https://webaim.org/articles/

## Troubleshooting

### Tests Failing Locally But Passing in CI

- Ensure you have latest dependencies: `npm ci`
- Clear Playwright cache: `npx playwright install --force`
- Check Node version matches CI (v22)

### Tests Timing Out

- Increase timeout in test: `test.setTimeout(60000)`
- Check if dev server is running properly
- Verify database is accessible

### False Positives

If you believe a violation is a false positive:
1. Document why it's a false positive
2. Add axe exclusion in test file
3. Get approval from team/accessibility expert

```typescript
// Exclude specific elements from axe scan
const results = await getAxeBuilder(page)
  .exclude('#known-false-positive')
  .analyze();
```

## Contributing

When adding new features:

1. Run accessibility tests: `npm run test:e2e -- accessibility.spec.ts`
2. Fix any P0/P1 violations before committing
3. Address P2/P3 violations when possible
4. Test keyboard navigation manually
5. Verify with browser accessibility tools

## Questions?

- Review WCAG 2.1 AA guidelines
- Check existing test implementations
- Ask team for accessibility review
- Consider hiring accessibility consultant for complex features

---

**Last Updated**: 2024-11-27
**WCAG Version**: 2.1 Level AA
**Test Framework**: Playwright + axe-core
