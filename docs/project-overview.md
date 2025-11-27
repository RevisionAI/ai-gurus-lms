# Project Overview - AI Gurus LMS

**Generated:** 2025-11-24
**Project Name:** AI Gurus LMS
**Type:** Full-Stack Learning Management System
**Status:** Mid-Stage MVP (Development)

---

## Executive Summary

AI Gurus LMS is a comprehensive learning management system designed specifically for AI fluency training programs. Built with modern web technologies (Next.js 15, React 19, TypeScript), the platform provides a complete educational environment where administrators create courses, instructors manage content and grade assignments, and students engage with learning materials, submit work, and participate in discussions.

**Current State:**
- ✅ Core functionality operational (courses, assignments, discussions, grading)
- ✅ Advanced features implemented (drag-and-drop content, YouTube integration, file uploads)
- ⚠️ Several features partially complete (gradebook, admin dashboard)
- ❌ Production readiness features missing (testing, scalability, deployment optimization)

---

## Project Classification

| Attribute | Value |
|-----------|-------|
| **Repository Type** | Monolith (single application) |
| **Primary Language** | TypeScript |
| **Framework** | Next.js 15 (App Router) |
| **Architecture** | Full-Stack (Server + Client Components) |
| **Database** | SQLite (dev) → PostgreSQL (production recommended) |
| **Deployment Target** | Vercel / Docker |

---

## Purpose & Vision

### Problem Statement
Educational institutions and corporate training programs need a modern, scalable platform to deliver AI fluency courses with comprehensive content management, assessment tools, and student engagement features.

### Solution
AI Gurus LMS provides:
- **For Administrators:** Multi-course platform management
- **For Instructors:** Intuitive course creation, content management, and grading tools
- **For Students:** Seamless learning experience with content access, assignment submission, and collaborative discussions

### Target Users
1. **AI Training Organizations** - Companies offering AI fluency programs
2. **Educational Institutions** - Universities/colleges teaching AI courses
3. **Corporate Training Departments** - Internal AI upskilling programs

---

## Technical Architecture

### Technology Stack Summary

**Frontend:**
- React 19.0.0 (latest with concurrent features)
- Next.js 15.3.3 (App Router, Server Components)
- Tailwind CSS 4 (utility-first styling)
- TypeScript 5 (type safety)

**Backend:**
- Next.js API Routes (REST-ful)
- Prisma 6.9.0 (ORM)
- SQLite (development database)
- NextAuth 4.24.11 (authentication)

**Additional Libraries:**
- TinyMCE 7.9.1 (rich text editing)
- @dnd-kit (drag-and-drop)
- Radix UI (accessible components)
- bcryptjs (password hashing)
- date-fns (date utilities)

### Architecture Pattern
**Full-Stack Monolithic Next.js Application**
- Server-Side Rendering (SSR) + Static Site Generation (SSG)
- API Routes for backend logic
- Direct database access from Server Components
- JWT-based authentication
- Role-based access control (Student, Instructor, Admin)

---

## Core Features

### 1. User Management & Authentication
✅ **Implemented**
- User registration with comprehensive profile data
- Secure email/password authentication (bcrypt + JWT)
- Role-based access (Student, Instructor, Admin)
- Session management via NextAuth

### 2. Course Management
✅ **Implemented**
- Create, edit, activate/deactivate courses
- Unique course codes + semester/year organization
- Instructor assignment
- Student enrollment system
- Course detail pages with tabbed interface

### 3. Content Delivery System
✅ **Implemented** (Advanced)
- Multiple content types: TEXT, VIDEO, DOCUMENT, LINK, SCORM, YOUTUBE
- Drag-and-drop content reordering
- File upload (200MB limit)
- YouTube video integration with automatic metadata fetching
- Draft/publish workflow
- Thumbnail management

### 4. Assignment & Grading System
✅ **Implemented**
- Assignment creation with due dates & point values
- Student text + file submissions
- Instructor grading with feedback
- Submission tracking
- Grade storage and retrieval

### 5. Discussion Forums
✅ **Implemented**
- Threaded discussions with nested replies
- Pin/lock discussion controls
- Student participation tracking
- Course-specific forums

### 6. Announcements
✅ **Implemented**
- Course-specific announcements
- Create/edit/delete functionality
- Recent announcements feed
- Author attribution

### 7. Gradebook
⚠️ **Partially Implemented**
- Route exists (`/instructor/gradebook`)
- Dashboard shows pending grades stat
- Full gradebook grid view incomplete

### 8. Admin Dashboard
⚠️ **Partially Implemented**
- Component exists
- Stats API endpoint present
- Full functionality scope unclear

---

## Project Statistics

| Metric | Count |
|--------|-------|
| **TypeScript Files** | 88 (in src/) |
| **API Endpoints** | 42 |
| **Database Models** | 10 |
| **Database Relations** | 25 |
| **UI Components** | ~15-20 |
| **Total Dependencies** | 340+ npm packages |

---

## Known Limitations

### Technical Debt
1. **Database:** SQLite (not production-ready, requires PostgreSQL migration)
2. **File Storage:** Local filesystem (should use S3/CDN)
3. **Testing:** No test suite implemented
4. **API:** No pagination, rate limiting, or versioning
5. **Structural:** Dual LMS directories (vibe-code-lms should be integrated)

### Missing Features
1. **Quizzes/Exams** - Not implemented
2. **Progress Tracking** - No explicit completion tracking
3. **Certificates** - Not implemented
4. **Notifications** - No email or push notifications
5. **Groups/Cohorts** - No student grouping functionality
6. **Advanced Analytics** - No reporting or analytics dashboards

### Security Considerations
- ⚠️ File upload validation needed
- ⚠️ Rate limiting not implemented
- ⚠️ Soft deletes recommended (currently hard deletes)
- ⚠️ Input sanitization should be enhanced

---

## Deployment Architecture

### Current (Development)
```
Developer Machine
├── Next.js Dev Server (localhost:3000)
├── SQLite Database (dev.db)
└── Local File Storage
```

### Recommended (Production)
```
Vercel/Cloud Platform
├── Next.js Production Server
├── PostgreSQL Database (managed service)
├── S3/CDN (file storage)
├── Redis (session caching)
└── Monitoring/Logging (Sentry, etc.)
```

---

## Development Workflow

### Quick Start
```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Check code quality
- `npx prisma studio` - Visual database editor

---

## Project Structure (High-Level)

```
ai-gurus-lms/
├── docs/                      # This documentation
├── prisma/                    # Database schema
├── src/
│   ├── app/                   # Pages + API routes
│   ├── components/            # React components
│   ├── lib/                   # Utilities
│   └── types/                 # TypeScript types
├── public/                    # Static assets
└── vibe-code-lms/             # Separate LMS (to be integrated)
```

---

## Success Metrics (Current Implementation)

### Completed ✅
- [x] User authentication and authorization
- [x] Course creation and management
- [x] Advanced content management (drag-and-drop, YouTube)
- [x] Assignment submission and grading
- [x] Discussion forums with nested replies
- [x] Announcements system
- [x] Student enrollment workflow
- [x] File upload functionality
- [x] Responsive UI with modern design

### In Progress ⚠️
- [ ] Gradebook completion
- [ ] Admin dashboard full functionality
- [ ] GPA calculation system
- [ ] Activity feed/tracking

### Not Started ❌
- [ ] Test suite (unit, integration, e2e)
- [ ] Production database migration
- [ ] Email notification system
- [ ] Advanced analytics/reporting
- [ ] Quizzes and exams
- [ ] Certificate generation

---

## Roadmap to Production

### Phase 1: Stability & Testing
1. Implement comprehensive test suite
2. Add input validation (Zod schemas)
3. Complete partially implemented features (gradebook, admin)

### Phase 2: Infrastructure
1. Migrate to PostgreSQL
2. Implement file storage solution (S3/CDN)
3. Add caching layer (Redis)
4. Set up CI/CD pipeline

### Phase 3: Enhancement
1. Add pagination to all list endpoints
2. Implement rate limiting
3. Add email notifications
4. Optimize performance (bundle size, image optimization)

### Phase 4: Scale
1. Add advanced analytics
2. Implement quizzes/exams
3. Add certificate generation
4. Enable multi-tenancy (if needed)

---

## Team Recommendations

### Immediate Priorities
1. **Testing:** Implement Jest + React Testing Library
2. **Database:** Plan PostgreSQL migration strategy
3. **File Storage:** Evaluate S3 vs alternatives
4. **Documentation:** Keep this doc updated as features evolve

### Nice-to-Have Improvements
1. Storybook for component documentation
2. API documentation (Swagger/OpenAPI)
3. Performance monitoring (Vercel Analytics)
4. Error tracking (Sentry)

---

## Contact & Resources

### Documentation Files
- **API Reference:** [api-contracts.md](./api-contracts.md)
- **Database Schema:** [data-models.md](./data-models.md)
- **Component Inventory:** [component-inventory.md](./component-inventory.md)
- **Development Guide:** [development-guide.md](./development-guide.md)
- **Source Tree:** [source-tree-analysis.md](./source-tree-analysis.md)
- **Master Index:** [index.md](./index.md)

### External Resources
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- NextAuth Docs: https://next-auth.js.org

---

## Quick Reference

| Aspect | Detail |
|--------|--------|
| **Languages** | TypeScript, SQL (via Prisma) |
| **Rendering** | SSR + SSG (Next.js App Router) |
| **Data Fetching** | Server Components (direct DB), API Routes (client) |
| **Styling** | Tailwind CSS (utility-first) |
| **State Management** | React Server Components + minimal client state |
| **Authentication** | NextAuth (JWT sessions) |
| **Authorization** | Role-based (Student, Instructor, Admin) |
| **Database ORM** | Prisma 6.9.0 |
| **File Uploads** | Local filesystem (temp, needs S3) |
| **Dev Server** | http://localhost:3000 |
| **Build Time** | ~30-60 seconds |

---

**Document Version:** 1.0
**Last Updated:** 2025-11-24
**Project Status:** Active Development
**Next Review:** Before production deployment

---

**Generated by:** BMM Document Project Workflow
**For detailed technical documentation, see the individual files listed above.**
