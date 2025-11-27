# Input Validation Guide

This guide documents the input validation implementation in AI Gurus LMS using Zod schemas and DOMPurify for XSS prevention.

## Overview

All API endpoints use Zod schemas for input validation:
- **Type Safety**: TypeScript types inferred from schemas
- **XSS Prevention**: HTML content sanitized with DOMPurify
- **SQL Injection Prevention**: Prisma's parameterized queries
- **Consistent Error Responses**: Standardized 400 error format

## Architecture

```
/src/validators/          # Zod schemas organized by domain
├── index.ts             # Barrel export
├── user.ts              # User registration, login, update
├── course.ts            # Course CRUD, enrollment
├── assignment.ts        # Assignment CRUD, submissions
├── grade.ts             # Grading schemas
├── discussion.ts        # Discussion and posts
├── announcement.ts      # Announcement schemas
└── file.ts              # File upload validation

/src/lib/
├── validation.ts        # validateRequest helper
└── sanitize.ts          # XSS sanitization utilities
```

## Usage

### Basic API Route Validation

```typescript
import { NextResponse } from 'next/server'
import { validateRequest } from '@/lib/validation'
import { createCourseSchema } from '@/validators'

export async function POST(request: Request) {
  // Validate request body
  const validation = await validateRequest(request, createCourseSchema)
  if (!validation.success) {
    return validation.response // Returns 400 with error details
  }

  // Use validated data with type safety
  const { title, code, description, semester, year } = validation.data

  // Continue with business logic...
}
```

### Error Response Format

When validation fails, the API returns:

**Status Code:** `400 Bad Request`

**Response Body:**
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Validation failed",
    "details": [
      { "path": "email", "message": "Invalid email format" },
      { "path": "password", "message": "Password must be at least 8 characters" }
    ]
  }
}
```

## Validation Schemas

### User Schemas

```typescript
import { registerUserSchema, loginSchema } from '@/validators'

// Registration requires:
// - email: valid email format (normalized to lowercase)
// - name, surname: 1-100 characters
// - password: 8+ chars with uppercase, lowercase, number
// - cellNumber, company, position, workAddress: required fields

// Login requires:
// - email: valid email format
// - password: non-empty string
```

### Course Schemas

```typescript
import { createCourseSchema, enrollmentSchema } from '@/validators'

// Course creation requires:
// - title: 3-200 characters
// - code: format "XX-123" or "XXXX1234" (uppercase)
// - description: max 5000 chars (HTML sanitized)
// - semester: format "Fall 2025"
// - year: positive integer
// - isActive: boolean (default: true)
```

### Assignment Schemas

```typescript
import { createAssignmentSchema, createSubmissionSchema } from '@/validators'

// Assignment creation:
// - title: 3-200 characters
// - description: max 10000 chars (HTML sanitized)
// - dueDate: ISO 8601 datetime (optional)
// - maxPoints: 1-10000 (default: 100)
// - courseId: valid CUID

// Submission:
// - content: max 50000 chars (HTML sanitized)
// - fileUrl: valid URL (optional)
// At least one of content or fileUrl required
```

### Grade Schemas

```typescript
import { gradeSubmissionSchema } from '@/validators'

// Grading:
// - submissionId: valid CUID
// - points: 0-10000
// - feedback: max 5000 chars (HTML sanitized, optional)
```

## XSS Sanitization

### Automatic Sanitization

Rich text fields are automatically sanitized during validation:

```typescript
export const createCourseSchema = z.object({
  description: z
    .string()
    .max(5000)
    .transform(sanitizeHtml), // <-- Automatic XSS prevention
})
```

### Manual Sanitization

For custom use cases:

```typescript
import { sanitizeHtml, stripHtml, sanitizeStrict } from '@/lib/sanitize'

// Full HTML sanitization (safe tags preserved)
const safe = sanitizeHtml('<p>Hello <script>alert("xss")</script></p>')
// Result: '<p>Hello </p>'

// Strip all HTML (plain text)
const text = stripHtml('<p>Hello <strong>World</strong></p>')
// Result: 'Hello World'

// Strict sanitization (basic formatting only)
const basic = sanitizeStrict('<p>Hello <table>...</table></p>')
// Result: '<p>Hello </p>'
```

### Allowed HTML Tags

The sanitizer allows safe formatting tags:
- Block: `p`, `div`, `br`, `hr`
- Headings: `h1`-`h6`
- Lists: `ul`, `ol`, `li`
- Text: `strong`, `b`, `em`, `i`, `u`, `s`
- Links: `a` (with `href`, `target`, `rel`)
- Tables: `table`, `thead`, `tbody`, `tr`, `th`, `td`
- Code: `pre`, `code`, `blockquote`
- Images: `img` (with `src`, `alt`, `width`, `height`)

### Blocked Content

The sanitizer removes:
- `<script>` tags and inline JavaScript
- `<iframe>`, `<object>`, `<embed>` tags
- Event handlers (`onclick`, `onerror`, etc.)
- `javascript:` URLs
- `data:` URLs
- `style` attributes (prevents CSS injection)

## SQL Injection Prevention

### Prisma Parameterized Queries

All database operations use Prisma's ORM, which automatically parameterizes queries:

```typescript
// SAFE - Prisma parameterizes this automatically
const user = await prisma.user.findUnique({
  where: { email: userInput } // No SQL injection risk
})

// NEVER DO THIS - Raw SQL with string concatenation
// prisma.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${userInput}'`)
```

### Input Validation First

Validation happens before any database operation:

```typescript
export async function POST(request: Request) {
  // 1. Validate input with Zod schema
  const validation = await validateRequest(request, createUserSchema)
  if (!validation.success) return validation.response

  // 2. Input is now validated and typed
  const { email, name } = validation.data

  // 3. Database operation with safe, validated input
  const user = await prisma.user.create({
    data: { email, name }
  })
}
```

## Common Validation Helpers

### CUID Validation

```typescript
import { cuidSchema } from '@/lib/validation'

const schema = z.object({
  userId: cuidSchema, // Validates CUID format
})
```

### String Length Validation

```typescript
import { stringWithLength } from '@/lib/validation'

const schema = z.object({
  title: stringWithLength(3, 200, 'Title'), // 3-200 chars with custom error
})
```

### Email Validation

```typescript
import { emailSchema } from '@/lib/validation'

const schema = z.object({
  email: emailSchema, // Validates and normalizes (lowercase, trim)
})
```

## Adding Validation to New Endpoints

1. **Create or update schema** in `/src/validators/`
2. **Export from index.ts** for easy importing
3. **Use validateRequest helper** in API route

```typescript
// 1. Create schema (src/validators/myFeature.ts)
export const myFeatureSchema = z.object({
  name: stringWithLength(1, 100, 'Name'),
  description: z.string().max(1000).transform(sanitizeHtml),
})

// 2. Export from index.ts
export { myFeatureSchema } from './myFeature'

// 3. Use in API route
import { validateRequest } from '@/lib/validation'
import { myFeatureSchema } from '@/validators'

export async function POST(request: Request) {
  const validation = await validateRequest(request, myFeatureSchema)
  if (!validation.success) return validation.response

  // Use validation.data...
}
```

## Troubleshooting

### "Validation failed" with no details

**Cause:** Malformed JSON in request body

**Solution:** Ensure Content-Type is `application/json` and body is valid JSON

### HTML content being stripped

**Cause:** DOMPurify removing unsafe content

**Solution:** Check if the content contains blocked tags. Use allowed tags only.

### CUID validation failing

**Cause:** Invalid ID format

**Solution:** CUIDs must match pattern `/^c[a-z0-9]{24}$/`

### Password validation failing

**Cause:** Password doesn't meet complexity requirements

**Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Security Best Practices

1. **Always validate** - Never trust user input
2. **Use schemas** - Define schemas for all POST/PUT/DELETE endpoints
3. **Sanitize HTML** - Use `sanitizeHtml` for rich text fields
4. **Log suspicious content** - Monitor for XSS attempts
5. **Keep schemas updated** - Update when data model changes

## Related Documentation

- [Rate Limiting](./rate-limiting.md)
- [API Architecture](./architecture.md#API-Architecture)
- [Zod Documentation](https://zod.dev)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
