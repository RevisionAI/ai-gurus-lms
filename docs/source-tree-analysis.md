# Source Tree Analysis - AI Gurus LMS

**Generated:** 2025-11-24
**Project:** AI Gurus LMS

---

## Annotated Directory Tree

```
ai-gurus-lms/
├── .claude/                      # Claude Code configuration
├── .next/                        # Next.js build output (generated, gitignored)
├── bmad/                         # BMAD workflow framework
│   ├── bmm/                      # BMM methodology workflows
│   │   ├── workflows/            # Workflow definitions
│   │   └── config.yaml           # Project configuration
│   └── core/                     # Core BMAD tasks
├── docs/                         # **PROJECT DOCUMENTATION (THIS FOLDER)**
│   ├── api-contracts.md          # REST API documentation (42 endpoints)
│   ├── component-inventory.md    # UI component catalog
│   ├── data-models.md            # Database schema documentation
│   ├── development-guide.md      # Setup & development instructions
│   ├── project-overview.md       # High-level project summary
│   ├── source-tree-analysis.md   # This file
│   ├── bmm-workflow-status.yaml  # Workflow progress tracking
│   ├── project-scan-report.json  # Documentation workflow state
│   └── stories/                  # User stories folder (empty)
├── node_modules/                 # Dependencies (gitignored)
├── prisma/                       # **DATABASE SCHEMA & MIGRATIONS**
│   ├── schema.prisma             # Prisma schema (10 models, 25 relations)
│   └── dev.db                    # SQLite database (development only)
├── public/                       # **STATIC ASSETS**
│   ├── images/                   # Image assets
│   ├── media/                    # Media files
│   └── ...
├── src/                          # **APPLICATION SOURCE CODE**
│   ├── app/                      # **NEXT.JS APP ROUTER (PAGES & API)**
│   │   ├── (auth)/               # Authentication pages
│   │   │   ├── login/            # Login page
│   │   │   └── register/         # Registration page
│   │   ├── admin/                # **ADMIN ROUTES**
│   │   │   └── dashboard/        # Admin dashboard
│   │   ├── courses/              # **STUDENT COURSE ROUTES**
│   │   │   ├── page.tsx          # Course browse/list
│   │   │   └── [id]/             # Course detail (dynamic route)
│   │   │       ├── page.tsx      # Course overview
│   │   │       ├── assignments/  # Course assignments
│   │   │       ├── discussions/  # Course discussions
│   │   │       └── announcements/# Course announcements
│   │   ├── dashboard/            # Student dashboard
│   │   ├── instructor/           # **INSTRUCTOR ROUTES**
│   │   │   ├── assignments/      # Assignment management
│   │   │   ├── courses/          # Course management
│   │   │   │   ├── new/          # Create course
│   │   │   │   └── [id]/         # Course management hub
│   │   │   │       ├── edit/     # Edit course details
│   │   │   │       ├── content/  # **CONTENT MGMT (drag-and-drop)**
│   │   │   │       ├── assignments/
│   │   │   │       ├── discussions/
│   │   │   │       └── announcements/
│   │   │   ├── gradebook/        # Gradebook (partial implementation)
│   │   │   └── announcements/    # Instructor announcements
│   │   ├── api/                  # **REST API ROUTES (42 endpoints)**
│   │   │   ├── auth/             # Authentication endpoints
│   │   │   │   ├── [...nextauth]/# NextAuth handler
│   │   │   │   └── register/     # User registration
│   │   │   ├── student/          # Student API endpoints
│   │   │   │   ├── courses/      # Course enrollment & access
│   │   │   │   ├── assignments/  # Assignment submission
│   │   │   │   ├── announcements/# Student announcements feed
│   │   │   │   ├── available-courses/
│   │   │   │   └── enroll/       # Course enrollment
│   │   │   ├── instructor/       # Instructor API endpoints
│   │   │   │   ├── courses/      # Course CRUD
│   │   │   │   │   └── [id]/     # Course-specific endpoints
│   │   │   │   │       ├── content/      # Content management
│   │   │   │   │       ├── upload/       # File upload
│   │   │   │   │       ├── upload-thumbnail/
│   │   │   │   │       ├── youtube-info/ # YouTube metadata fetch
│   │   │   │   │       ├── assignments/
│   │   │   │   │       ├── discussions/
│   │   │   │   │       ├── announcements/
│   │   │   │   │       └── enrollments/
│   │   │   │   └── assignments/  # Assignment grading
│   │   │   ├── admin/            # Admin API endpoints
│   │   │   │   └── dashboard/stats/
│   │   │   ├── users/            # User management
│   │   │   │   ├── search/
│   │   │   │   └── students/
│   │   │   └── courses/          # Public course list
│   │   ├── globals.css           # Global styles
│   │   ├── layout.tsx            # Root layout component
│   │   └── page.tsx              # Landing page
│   ├── components/               # **REACT COMPONENTS**
│   │   ├── AdminDashboard.tsx    # Admin dashboard UI
│   │   ├── Breadcrumb.tsx        # Navigation breadcrumbs
│   │   ├── InstructorDashboard.tsx
│   │   ├── Navbar.tsx            # Main navigation bar
│   │   ├── ProtectedRoute.tsx    # Auth wrapper component
│   │   ├── RichTextEditor.tsx    # TinyMCE wrapper
│   │   └── StudentDashboard.tsx
│   ├── lib/                      # **UTILITY LIBRARIES**
│   │   └── prisma.ts             # Prisma client singleton
│   └── types/                    # **TYPESCRIPT TYPE DEFINITIONS**
│       └── next-auth.d.ts        # NextAuth type extensions
├── vibe-code-lms/                # **SEPARATE LMS INSTANCE**
│   ├── src/                      # (Similar structure to main app)
│   ├── prisma/
│   ├── package.json
│   └── ...                       # (Note: Structural issue - should be integrated)
├── .env                          # Environment variables (gitignored)
├── .env.local                    # Local overrides (gitignored)
├── .gitignore                    # Git ignore rules
├── AIF.md                        # AI Fluency documentation
├── board.md                      # Project board/planning
├── eslint.config.mjs             # ESLint configuration
├── next.config.js                # Next.js configuration
├── next.config.ts                # TypeScript Next config
├── package.json                  # Dependencies & scripts
├── package-lock.json             # Locked dependency versions
├── postcss.config.mjs            # PostCSS configuration
├── README.md                     # Project readme
├── tailwind.config.js            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

---

## Critical Directories Explained

### `/src/app/` - Application Core
**Purpose:** Next.js 15 App Router structure
**Pattern:** File-system based routing
- **Folders** = routes (e.g., `/courses` → `courses/`)
- **page.tsx** = page component
- **layout.tsx** = shared layout
- **route.ts** = API endpoint

**Key Subdirectories:**
- `(auth)/` - Parentheses = route group (doesn't affect URL)
- `[id]/` - Brackets = dynamic route parameter
- `api/` - REST API routes

### `/src/components/` - UI Components
**Purpose:** Reusable React components
**Pattern:** PascalCase naming (e.g., `Navbar.tsx`)
**Note:** Should be organized by category (layouts, forms, etc.)

### `/prisma/` - Database Layer
**Files:**
- `schema.prisma` - Database schema definition
- `dev.db` - SQLite database (development)
- `migrations/` - Would contain migration files (not present - using db push)

### `/public/` - Static Assets
**Purpose:** Publicly accessible files
**Served from:** `/` path (e.g., `/public/logo.png` → `/logo.png`)

### `/docs/` - Project Documentation
**Purpose:** Comprehensive project documentation
**Generated by:** BMM Document Project Workflow
**Files:**
- `api-contracts.md` - Complete API reference
- `data-models.md` - Database schema documentation
- `component-inventory.md` - UI component catalog
- `development-guide.md` - Setup & development guide
- `source-tree-analysis.md` - This file
- `project-overview.md` - High-level summary

---

## Entry Points

### Application Entry
- **Root Layout:** `src/app/layout.tsx`
- **Landing Page:** `src/app/page.tsx`
- **Authentication:** NextAuth handler at `src/app/api/auth/[...nextauth]/route.ts`

### Database Entry
- **Prisma Client:** `src/lib/prisma.ts` (singleton instance)
- **Schema:** `prisma/schema.prisma`

### Styling Entry
- **Global Styles:** `src/app/globals.css`
- **Tailwind Config:** `tailwind.config.js`

---

## Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, metadata |
| `tsconfig.json` | TypeScript compiler options |
| `next.config.js` | Next.js framework configuration |
| `tailwind.config.js` | Tailwind CSS customization |
| `eslint.config.mjs` | ESLint rules |
| `postcss.config.mjs` | PostCSS plugins |
| `.env` | Environment variables |
| `prisma/schema.prisma` | Database schema |

---

## Integration Points

### Authentication Flow
```
User Request
  ↓
NextAuth Middleware (src/app/api/auth/[...nextauth]/route.ts)
  ↓
Session Validation (JWT)
  ↓
ProtectedRoute Component
  ↓
Page/API Route
```

### Data Flow (Server Component)
```
Page Component (src/app/.../page.tsx)
  ↓
Direct Prisma Query (via src/lib/prisma.ts)
  ↓
Database (prisma/dev.db)
```

### Data Flow (Client Component)
```
Client Component (src/components/...)
  ↓
API Route Call (fetch to /api/...)
  ↓
API Handler (src/app/api/.../route.ts)
  ↓
Prisma Query
  ↓
Database
```

---

## File Naming Conventions

### Pages
- `page.tsx` - Page component
- `layout.tsx` - Layout wrapper
- `loading.tsx` - Loading UI
- `error.tsx` - Error boundary
- `not-found.tsx` - 404 page

### API Routes
- `route.ts` - API endpoint (GET, POST, PUT, DELETE handlers)

### Components
- PascalCase: `ComponentName.tsx`
- Descriptive names: `ProtectedRoute.tsx`, `RichTextEditor.tsx`

### Utilities
- camelCase: `utilityName.ts`
- Example: `prisma.ts`, `auth.ts`

---

## Build Output

### `.next/` Directory Structure
```
.next/
├── cache/              # Build cache
├── server/             # Server-side code
│   ├── app/            # Compiled pages
│   └── chunks/         # Code chunks
├── static/             # Static assets
│   ├── chunks/         # Client-side JavaScript
│   └── css/            # Compiled CSS
└── trace              # Performance traces
```

**Note:** Always gitignored, regenerated on each build

---

## Identified Structural Issues

### 1. Dual LMS Structure
**Issue:** `vibe-code-lms/` is a separate application
**Problem:** Code duplication, inconsistent features
**Recommendation:**
- Treat as single multi-course platform
- Move vibe-code content into main app as course data
- Remove duplicate directory structure

### 2. Component Organization
**Current:** Flat structure in `/src/components/`
**Recommendation:**
```
src/components/
├── layouts/
│   ├── Navbar.tsx
│   └── Breadcrumb.tsx
├── dashboards/
│   ├── StudentDashboard.tsx
│   ├── InstructorDashboard.tsx
│   └── AdminDashboard.tsx
├── common/
│   ├── ProtectedRoute.tsx
│   └── RichTextEditor.tsx
└── ui/
    ├── Button.tsx
    ├── Input.tsx
    └── Card.tsx
```

### 3. Missing Test Directory
**Issue:** No `__tests__/` or `*.test.tsx` files
**Recommendation:** Add test structure:
```
src/
├── __tests__/
│   ├── components/
│   ├── api/
│   └── lib/
```

---

## Dependency Graph (Simplified)

```
Pages/API Routes
    ↓
Components
    ↓
Lib/Utils (Prisma Client, Auth)
    ↓
Database Schema
    ↓
SQLite Database
```

**External Dependencies:**
- NextAuth → Authentication
- Prisma → Database ORM
- Tailwind → Styling
- TinyMCE → Rich Text Editing
- Radix UI → UI Primitives
- @dnd-kit → Drag & Drop

---

## Shared Code Patterns

### 1. Prisma Client Usage
```tsx
import { prisma } from '@/lib/prisma'

const courses = await prisma.course.findMany({
  where: { isActive: true },
  include: { instructor: true }
})
```

### 2. Protected Routes
```tsx
import ProtectedRoute from '@/components/ProtectedRoute'

export default function Page() {
  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
      <YourComponent />
    </ProtectedRoute>
  )
}
```

### 3. API Route Pattern
```tsx
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Logic here
  return NextResponse.json({ data })
}
```

---

## Future Structure Recommendations

1. **Feature-Based Organization:**
   ```
   src/features/
   ├── courses/
   │   ├── components/
   │   ├── api/
   │   └── types/
   ├── assignments/
   └── discussions/
   ```

2. **Shared Components Library:**
   Extract reusable components to separate package

3. **API Versioning:**
   ```
   src/app/api/v1/
   src/app/api/v2/
   ```

4. **Testing Structure:**
   Mirror source structure in tests

---

**Total Files:** 88 TypeScript files in src/
**Total API Routes:** 42
**Total Components:** ~15-20
**Database Models:** 10

---

**Generated by:** BMM Document Project Workflow
**Last Analyzed:** 2025-11-24
