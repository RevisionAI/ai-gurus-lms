# AI Gurus LMS - Project Documentation Index

**Generated:** 2025-11-24
**Project:** AI Gurus LMS
**Version:** Development (Mid-Stage MVP)
**Documentation Status:** ✅ Complete

---

## 🎯 Quick Start

**New to this project?** Start here:
1. Read [Project Overview](./project-overview.md) for high-level understanding
2. Check [Development Guide](./development-guide.md) to set up your environment
3. Review [Source Tree Analysis](./source-tree-analysis.md) to understand the codebase structure

**Planning new features?** Reference:
- [API Contracts](./api-contracts.md) - All existing endpoints
- [Data Models](./data-models.md) - Database schema and relationships
- [Component Inventory](./component-inventory.md) - Available UI components

---

## 📚 Documentation Overview

### Project Overview
**Type:** Monolith Web Application
**Framework:** Next.js 15 + React 19 + TypeScript
**Architecture:** Full-Stack LMS Platform
**Database:** Prisma ORM + SQLite (dev) → PostgreSQL (production)

**Key Stats:**
- 88 TypeScript files
- 42 API endpoints
- 10 database models
- 25 database relations
- ~15-20 UI components

---

## 🗂️ Complete Documentation Index

### 1. [Project Overview](./project-overview.md)
**Essential for:** Project managers, new developers, stakeholders

**Contents:**
- Executive summary
- Technical architecture
- Core features status
- Known limitations
- Roadmap to production
- Quick reference guide

**When to use:** Understanding project scope, planning features, onboarding

---

### 2. [API Contracts](./api-contracts.md)
**Essential for:** Backend developers, frontend developers, API consumers

**Contents:**
- 42 REST-ful endpoints documented
- Authentication & session management
- Student endpoints (courses, assignments, discussions)
- Instructor endpoints (course management, grading)
- Admin endpoints (system stats)
- Request/response formats
- Common patterns and error codes

**When to use:** Building new features, integrating with API, troubleshooting endpoints

**Coverage:**
- ✅ Authentication: NextAuth endpoints, user registration
- ✅ Student API: Courses, assignments, discussions, announcements, enrollment
- ✅ Instructor API: Course CRUD, content management, grading, file uploads
- ✅ Admin API: Dashboard statistics
- ✅ User Management: Search, student listing

---

### 3. [Data Models](./data-models.md)
**Essential for:** Backend developers, database administrators, architects

**Contents:**
- Complete Prisma schema documentation
- 10 core models: User, Course, Enrollment, Assignment, Submission, Grade, Discussion, DiscussionPost, Announcement, CourseContent
- 25 database relations
- Entity relationship diagrams (text-based)
- Cascade delete behaviors
- Unique constraints
- Migration strategy for production
- Performance considerations

**When to use:** Adding new database features, planning schema changes, understanding data relationships

**Key Models:**
- **User:** Student/Instructor/Admin with comprehensive profile
- **Course:** Course offerings with instructor assignment
- **Assignment:** With submissions and grading
- **Discussion:** Threaded forums with nested replies
- **CourseContent:** Multi-type content (TEXT, VIDEO, DOCUMENT, LINK, SCORM, YOUTUBE)

---

### 4. [Component Inventory](./component-inventory.md)
**Essential for:** Frontend developers, UI/UX designers

**Contents:**
- Navigation components (Navbar, Breadcrumb)
- Dashboard components (Student, Instructor, Admin)
- Authentication components (ProtectedRoute)
- Content components (RichTextEditor - TinyMCE)
- Design system elements (colors, typography, spacing)
- Third-party libraries (Radix UI, @dnd-kit, Lucide icons)
- Responsive design patterns
- Reusable UI patterns

**When to use:** Building new UI features, maintaining design consistency, refactoring components

**Highlights:**
- Drag-and-drop content management (@dnd-kit)
- Rich text editing (TinyMCE 7.9.1)
- Accessible components (Radix UI primitives)
- Tailwind CSS design system

---

### 5. [Development Guide](./development-guide.md)
**Essential for:** All developers, DevOps engineers

**Contents:**
- Prerequisites and setup instructions
- Installation steps (npm install, Prisma setup)
- Development workflow (npm scripts)
- Build and production deployment
- Database management (Prisma commands)
- Testing setup (recommended, not yet implemented)
- Debugging tips
- Environment variables
- Deployment preparation checklist
- Troubleshooting common issues

**When to use:** Setting up development environment, deploying, troubleshooting

**Key Commands:**
```bash
npm install              # Install dependencies
npx prisma generate      # Generate Prisma client
npx prisma db push       # Sync database schema
npm run dev              # Start dev server
npm run build            # Production build
npx prisma studio        # Visual database editor
```

---

### 6. [Source Tree Analysis](./source-tree-analysis.md)
**Essential for:** All developers, architects

**Contents:**
- Annotated directory tree with explanations
- Critical directories explained (src/app, src/components, prisma)
- Entry points (layouts, pages, API routes)
- Configuration files overview
- Integration points (auth flow, data flow)
- File naming conventions
- Identified structural issues
- Recommended improvements

**When to use:** Understanding codebase structure, navigating files, planning refactoring

**Key Directories:**
- `/src/app/` - Next.js App Router (pages + API)
- `/src/components/` - React components
- `/prisma/` - Database schema
- `/docs/` - This documentation

---

## 🚀 Getting Started Paths

### For New Developers
1. **Day 1:** Read [Project Overview](./project-overview.md)
2. **Day 1:** Follow [Development Guide](./development-guide.md) to set up environment
3. **Day 2:** Explore [Source Tree Analysis](./source-tree-analysis.md)
4. **Day 3:** Review [API Contracts](./api-contracts.md) and [Data Models](./data-models.md)
5. **Week 1:** Browse [Component Inventory](./component-inventory.md) while building first feature

### For Planning New Features
1. Check [API Contracts](./api-contracts.md) for existing endpoints
2. Review [Data Models](./data-models.md) for database schema
3. Check [Component Inventory](./component-inventory.md) for reusable components
4. Reference [Development Guide](./development-guide.md) for implementation patterns

### For Troubleshooting
1. [Development Guide](./development-guide.md) - Common issues section
2. [Source Tree Analysis](./source-tree-analysis.md) - Find file locations
3. [API Contracts](./api-contracts.md) - Endpoint specifications
4. [Data Models](./data-models.md) - Database relationships

---

## 📊 Project Status Summary

### Fully Implemented ✅
- User authentication & authorization (NextAuth + JWT)
- Course management (create, edit, activate, enroll)
- **Advanced content management** (drag-and-drop, YouTube, file uploads)
- Assignment system (creation, submission, grading)
- Discussion forums (threaded, nested replies)
- Announcements system
- Student enrollment workflow
- Role-based access control

### Partially Implemented ⚠️
- Gradebook (route exists, full grid view incomplete)
- Admin dashboard (basic stats, full functionality unclear)
- GPA calculation (placeholder, no logic)

### Not Implemented ❌
- Testing suite (unit, integration, e2e)
- Production database (requires PostgreSQL migration)
- File storage solution (needs S3/CDN)
- Email notifications
- Quizzes/exams
- Certificate generation
- Advanced analytics/reporting

---

## 🏗️ Architecture Quick Reference

### Tech Stack
| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Next.js 15, Tailwind CSS 4, TypeScript 5 |
| **Backend** | Next.js API Routes, Prisma 6.9, NextAuth 4.24 |
| **Database** | SQLite (dev) / PostgreSQL (prod recommended) |
| **Auth** | NextAuth (JWT sessions, bcrypt passwords) |
| **Storage** | Local filesystem (temp, needs S3) |
| **Styling** | Tailwind CSS + Radix UI primitives |
| **Rich Text** | TinyMCE 7.9 |
| **Drag & Drop** | @dnd-kit 6.3 |

### Architecture Pattern
- **Full-Stack Monolith:** Single Next.js application
- **Rendering:** Server-Side Rendering + Static Generation
- **Data Fetching:** Server Components (direct Prisma) + API Routes (client)
- **Authentication:** JWT-based sessions
- **Authorization:** Role-based (Student, Instructor, Admin)

---

## 🎓 Learning Resources

### Framework Documentation
- **Next.js:** https://nextjs.org/docs
- **React:** https://react.dev
- **Prisma:** https://www.prisma.io/docs
- **NextAuth:** https://next-auth.js.org
- **Tailwind CSS:** https://tailwindcss.com/docs

### Internal Documentation
- **API Reference:** [api-contracts.md](./api-contracts.md)
- **Database Schema:** [data-models.md](./data-models.md)
- **Setup Guide:** [development-guide.md](./development-guide.md)

---

## 🔧 Common Tasks Quick Reference

### Development
```bash
# Start development server
npm run dev

# Start both applications
npm run dev:both

# View database
npx prisma studio

# Run linting
npm run lint
```

### Database
```bash
# Generate Prisma client
npx prisma generate

# Sync schema to database
npx prisma db push

# Create migration (PostgreSQL)
npx prisma migrate dev

# Reset database (⚠️ deletes data)
npx prisma migrate reset
```

### Production
```bash
# Build for production
npm run build

# Start production server
npm run start:prod

# Build both applications
npm run build:both
```

---

## 🚨 Critical Notes

### Before Production Deployment
1. ✅ **Migrate to PostgreSQL** - SQLite is development-only
2. ✅ **Implement S3/CDN** - Local file storage won't scale
3. ✅ **Add comprehensive testing** - No tests currently exist
4. ✅ **Implement monitoring** - Add Sentry, logging, analytics
5. ✅ **Security audit** - Review authentication, input validation
6. ✅ **Performance optimization** - Bundle analysis, image optimization

### Known Structural Issues
1. **Dual LMS Structure:** `vibe-code-lms/` directory should be integrated into main app
2. **Component Organization:** Flat structure should be hierarchical
3. **Testing:** No test files exist
4. **API:** Missing pagination, rate limiting, versioning

---

## 📝 Documentation Maintenance

### When to Update This Documentation
- After adding new API endpoints → Update [api-contracts.md](./api-contracts.md)
- After database schema changes → Update [data-models.md](./data-models.md)
- After adding new components → Update [component-inventory.md](./component-inventory.md)
- After major refactoring → Update [source-tree-analysis.md](./source-tree-analysis.md)
- After deployment changes → Update [development-guide.md](./development-guide.md)

### Documentation Files (Generated)
All files in `/docs/` were generated by the **BMM Document Project Workflow** on 2025-11-24:
- `index.md` (this file)
- `project-overview.md`
- `api-contracts.md`
- `data-models.md`
- `component-inventory.md`
- `development-guide.md`
- `source-tree-analysis.md`

### Sprint Planning Documentation
Product requirements, architecture, and epic technical specifications:
- [PRD.md](./PRD.md) - Product Requirements Document
- [architecture.md](./architecture.md) - Technical Architecture
- [epics.md](./epics.md) - Epic Breakdown (all stories)
- [tech-spec-epic-1.md](./tech-spec-epic-1.md) - Epic 1: Infrastructure Foundation
- [tech-spec-epic-1.5.md](./tech-spec-epic-1.5.md) - Epic 1.5: Testing Infrastructure
- [tech-spec-epic-2.md](./tech-spec-epic-2.md) - Epic 2: Feature Completion
- [tech-spec-epic-3.md](./tech-spec-epic-3.md) - Epic 3: E2E Testing & Quality
- [tech-spec-epic-4.md](./tech-spec-epic-4.md) - Epic 4: Production Deployment & Monitoring
- [sprint-status.yaml](./sprint-status.yaml) - Current sprint status tracking

---

## 🤝 Contributing

### For Developers
1. Read relevant documentation before making changes
2. Update documentation when adding features
3. Follow established patterns (see [Source Tree](./source-tree-analysis.md))
4. Test locally before committing
5. Keep this index updated

### Code Standards
- TypeScript for all new code
- Tailwind CSS for styling
- Prisma for database access
- Server Components by default (add 'use client' only when needed)

---

## 📬 Support & Resources

### Internal Resources
- **Project Board:** `board.md` (in project root)
- **AI Fluency Doc:** `AIF.md` (in project root)
- **README:** `README.md` (in project root)

### Getting Help
1. Check [Development Guide](./development-guide.md) troubleshooting section
2. Review relevant documentation file
3. Search codebase for similar patterns
4. Consult framework documentation (links above)

---

## 📈 Project Health

| Metric | Status |
|--------|--------|
| **Documentation** | ✅ Complete (7 comprehensive documents) |
| **Core Features** | ✅ Implemented (courses, assignments, discussions) |
| **Testing** | ❌ Not implemented |
| **Production Ready** | ⚠️ Partial (needs DB migration, file storage, testing) |
| **Code Quality** | ✅ Good (TypeScript, ESLint, organized structure) |
| **Performance** | ✅ Good for dev (optimization needed for production) |

---

## 🎯 Next Steps Recommendation

### Immediate (Week 1-2)
1. Set up testing framework (Jest + React Testing Library)
2. Complete gradebook functionality
3. Fix structural issue (integrate vibe-code-lms)

### Short Term (Month 1)
1. Plan PostgreSQL migration
2. Evaluate S3/file storage solutions
3. Add input validation (Zod schemas)
4. Implement pagination

### Medium Term (Months 2-3)
1. Execute database migration
2. Implement file storage solution
3. Add email notifications
4. Performance optimization

### Long Term (Months 4-6)
1. Add quizzes/exams
2. Implement certificate generation
3. Advanced analytics dashboard
4. Production deployment

---

**Welcome to AI Gurus LMS Documentation!**

This index is your gateway to understanding, developing, and maintaining the platform. Start with the [Project Overview](./project-overview.md) and explore from there.

**Last Updated:** 2025-11-24
**Documentation Version:** 1.0
**Status:** ✅ Complete and Ready for Use

---

**Generated by:** BMM Document Project Workflow
**Maintained by:** Development Team
**Questions?** Refer to individual documentation files linked above.
