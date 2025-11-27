# ai-gurus-lms Product Requirements Document (PRD)

**Author:** Ed
**Date:** 2025-11-24
**Project Level:** 3
**Target Scale:** Production-Ready LMS for AI Fluency Program (Beta: 1-10 users, Scale: 100-1000+ users)

---

## Goals and Background Context

### Goals

1. **Enable Bundled Product Offering:** Launch AI Readiness Assessment + Fluency Program as integrated solution by Q1 2026
2. **Achieve Production Readiness:** Transform prototype LMS into enterprise-grade platform supporting 99.5%+ uptime and zero security incidents
3. **Successful Beta Validation:** Deploy to 1-10 SME executive testers achieving 80%+ satisfaction and validating product-market fit
4. **Replace Notion Delivery:** Achieve feature parity with professional LMS capabilities and measurable instructor efficiency improvements (30%+ time savings)
5. **Establish Scalable Foundation:** Build infrastructure supporting growth from 10 → 100 → 1000+ users without major refactoring

### Background Context

The launch of the AI Readiness Assessment Program creates a strategic opportunity to offer a comprehensive bundled solution combining assessment with AI fluency education. This bundled approach represents market table stakes—every competitor offering AI readiness assessments also provides integrated educational programs. However, the current AI Gurus LMS is not production-ready: it runs on SQLite (development database), uses local file storage, has zero test coverage, and lacks critical features like a complete gradebook and admin dashboard. This technical debt creates a critical business blocker preventing the professional delivery of the AI Fluency Program as part of a paid bundled offering.

The current workaround using Notion for program delivery lacks the programmatic capabilities, scalability, and professional polish expected by SME executives. Without a production-grade LMS, AI Gurus cannot confidently capture the 5% target conversion rate from assessment clients to bundled packages, representing significant lost revenue and competitive disadvantage. The initiative focuses on strategic enhancement of the existing platform (88 TypeScript files, 42 API endpoints, 10 database models) to achieve production readiness within a 3-month timeline, enabling beta launch with 1-10 testers in Q1 2026 and establishing a scalable foundation for future growth.

---

## Requirements

### Functional Requirements

**Infrastructure & Data Management**
- FR001: System shall migrate from SQLite to PostgreSQL with full data integrity validation and rollback capability
- FR002: System shall store all uploaded files (course content, assignments, submissions) in S3-compatible cloud storage with CDN delivery
- FR003: System shall implement automated daily database backups with 7-day retention and validated restore procedures
- FR004: System shall support concurrent user access with connection pooling and transaction management

**Security & Access Control**
- FR005: System shall implement rate limiting (100 requests/minute per IP, 200 requests/minute per authenticated user)
- FR006: System shall validate all API inputs using Zod schemas to prevent injection attacks and data corruption
- FR007: System shall implement soft deletes with audit trail for compliance (User, Course, Assignment, Grade models)
- FR008: System shall validate uploaded files for MIME type, size limits, and malware scanning before storage
- FR009: System shall maintain role-based access control (Student, Instructor, Admin) with protected routes and API endpoints

**Course & Content Management**
- FR010: Instructors shall create, edit, activate/deactivate courses with comprehensive metadata (code, semester, description, thumbnail)
- FR011: System shall support multiple content types (TEXT, VIDEO, DOCUMENT, LINK, SCORM, YOUTUBE) with drag-and-drop reordering
- FR012: Instructors shall upload course content files up to configurable size limits with automatic CDN distribution
- FR013: System shall manage student enrollment (manual and self-enrollment) with duplicate prevention

**Assignment & Grading**
- FR014: Instructors shall create assignments with due dates, point values, descriptions, and file attachment requirements
- FR015: Students shall submit assignments with text responses and file attachments, viewable by instructors
- FR016: Instructors shall grade submissions with numeric scores and written feedback visible to students
- FR017: System shall display complete gradebook grid view (students × assignments matrix) with inline editing (confirmation dialogs required), filtering, and CSV export
- FR018: System shall calculate and display GPA per course and overall GPA based on weighted assignment grades with configurable grading scale

**Communication & Collaboration**
- FR019: System shall support threaded discussion forums with nested replies, pinning, and locking controls
- FR020: Instructors and admins shall create course-specific announcements visible to enrolled students

**Administration & Monitoring**
- FR021: Admin dashboard shall display real-time system statistics (users, courses, enrollments, assignments) and user management capabilities
- FR022: System shall track and log errors with alerting for critical issues (Sentry or equivalent integration)
- FR023: System shall monitor performance metrics (page load time, API response time, uptime) with configurable dashboards

**Testing & Quality Assurance**
- FR024: System shall maintain automated test suite covering critical user flows (enrollment, assignment submission, grading, discussions) with 70%+ code coverage, including accessibility tests (keyboard navigation, screen reader compatibility)

**User Experience & Onboarding**
- FR025: System shall display course prerequisites, learning objectives, and target audience description on enrollment page to support informed enrollment decisions
- FR026: Gradebook shall support feedback templates and rubric-based commenting to improve instructor efficiency and consistency

### Non-Functional Requirements

- NFR001: **Performance** - System shall achieve page load times < 2 seconds (p95), API response times < 500ms (p95), and Lighthouse score > 80 across all metrics
- NFR002: **Reliability** - System shall maintain 99.5%+ uptime during production operation with automated monitoring and alerting for critical errors
- NFR003: **Scalability** - System architecture shall support concurrent usage by 10 → 100 → 1000+ users without major refactoring, with predictable infrastructure cost scaling
- NFR004: **Security** - System shall pass external security audit with all P0/P1 vulnerabilities remediated, implementing OWASP Top 10 protections and encryption for data at rest and in transit
- NFR005: **Maintainability** - Codebase shall maintain 70%+ test coverage for critical paths with comprehensive documentation (deployment runbooks, incident response procedures, troubleshooting guides)
- NFR006: **Accessibility** - System shall pass automated accessibility audits (Lighthouse Accessibility score > 90) and support full keyboard navigation for all critical workflows

---

## User Journeys

**Journey 1: SME Executive Student - Course Enrollment & Assignment Completion**

1. **Discovery & Enrollment**
   - Student receives bundled package invitation (post-assessment)
   - Logs in → Views course catalog
   - Reviews AI Fluency Program details (description, syllabus, duration)
   - Reviews prerequisites, learning objectives, and target audience → Confirms course fit
   - **Decision Point:** Self-enroll or request instructor enrollment?
   - Confirms enrollment → Receives welcome/onboarding materials

2. **Course Navigation & Content Consumption**
   - Accesses course dashboard → Views content modules
   - Progresses through content (videos, documents, readings)
   - **Decision Point:** Need clarification? → Posts discussion question
   - Completes module → Moves to next section

3. **Assignment Submission**
   - Views assignment details (due date, requirements, rubric)
   - **Decision Point:** Text response only or file attachment needed?
   - Drafts response → Attaches files (if applicable)
   - Submits → Receives confirmation
   - **Edge Case:** Late submission → System allows with timestamp

4. **Feedback & Progress Tracking**
   - Receives grade notification → Views instructor feedback
   - Checks gradebook → Monitors GPA and progress
   - **Decision Point:** Disagree with grade? → Contacts instructor via discussion
   - Completes course → Views final GPA and achievement

**Journey 2: Instructor - Course Setup & Grading Workflow**

1. **Course Preparation**
   - Logs in as instructor → Accesses course management
   - Creates/updates course (code, description, thumbnail)
   - Uploads content modules (drag-and-drop reordering)
   - **Decision Point:** YouTube embed or file upload?
   - Creates assignments with rubrics and due dates
   - Publishes course → Activates for student enrollment

2. **Student Management & Engagement**
   - Reviews enrollment list → Manually enrolls additional students (if needed)
   - Posts announcements (course updates, reminders)
   - Monitors discussion forums → Responds to student questions
   - **Decision Point:** Pin important discussion? Lock off-topic thread?

3. **Grading Workflow**
   - Opens gradebook → Views pending submissions
   - **Decision Point:** Grade individually or use grid view for batch?
   - Reviews student submission → Assigns numeric grade + written feedback
   - Uses feedback templates for common assignment patterns → Speeds up written feedback
   - Saves grade → Student receives notification
   - **Edge Case:** Grade dispute → Revises grade in gradebook
   - Exports grades to CSV for records

4. **Analytics & Course Management**
   - Views admin dashboard → Monitors student engagement
   - Identifies struggling students (low grades, missed assignments)
   - **Decision Point:** Send individual outreach or general announcement?
   - Reviews course completion rates → Plans improvements for next cohort

**Journey 3: Admin - Platform Health Monitoring & User Management**

1. **Daily Operations**
   - Logs in as admin → Views system dashboard
   - Reviews key metrics (active users, course enrollments, system uptime)
   - **Decision Point:** Any critical alerts? → Investigates errors
   - Checks performance metrics (page load time, API response time)

2. **User Management**
   - Receives new user request → Creates account
   - **Decision Point:** Assign role (Student, Instructor, Admin)?
   - Manages user permissions → Activates/deactivates accounts
   - **Edge Case:** User locked out → Resets credentials

3. **Incident Response**
   - Receives critical error alert (Sentry notification)
   - **Decision Point:** Severity? → P0 (fix immediately) vs. P1 (next sprint)
   - Reviews error logs → Identifies root cause
   - Deploys hotfix or schedules repair
   - **Edge Case:** Database backup needed → Triggers manual backup

4. **Reporting & Planning**
   - Generates usage reports (weekly/monthly)
   - Reviews beta tester feedback → Prioritizes backlog (P0/P1/P2)
   - Validates feedback against MVP success criteria (80% satisfaction, 99.5% uptime)
   - **Decision Point:** Add to current sprint or defer to post-MVP?
   - Communicates status to stakeholders

---

## UX Design Principles

- **Professional Credibility:** Interface reflects enterprise-grade quality expected by executive users with distinctive AI-focused visual language (polished and trustworthy, not generic LMS aesthetic)
- **Clarity Over Complexity:** Information hierarchy prioritizes essential actions; SME executives are busy and need efficient navigation
- **Progress Visibility:** Students always see where they are in learning journey (completion status, grades, upcoming deadlines)
- **Instructor Efficiency:** Minimize clicks and repetitive tasks; automation and batch operations targeting 30% reduction in grading and content management time (excluding communication overhead accepted for MVP)

---

## User Interface Design Goals

**Target Platforms:**
- Responsive web application (desktop primary, mobile/tablet secondary)

**Core Screens:**
- **Student:** Dashboard, Course Catalog, Course Detail (tabbed: Overview/Content/Assignments/Discussions/Announcements), Gradebook View, Profile
- **Instructor:** Dashboard, Course Management, Content Editor (drag-and-drop), Gradebook (grid view), Grading Interface, Analytics
- **Admin:** Dashboard (system stats), User Management, Course Management, Monitoring/Logs

**Key Interaction Patterns:**
- Tabbed navigation for course sections (existing pattern to maintain; monitor beta feedback on tabbed vs. unified course navigation for post-MVP optimization)
- Drag-and-drop for content reordering (existing @dnd-kit implementation)
- Inline editing for gradebook with confirmation dialogs (reduce modal fatigue while preventing accidental modifications)
- Rich text editing with TinyMCE (existing)

**Design Constraints:**
- **Existing Design System:** Tailwind CSS 4 + Radix UI accessible components (maintain consistency)
- **Browser Support:** Modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions); no IE11 support needed
- **Accessibility Requirements:** WCAG 2.1 AA compliance (Radix UI provides foundation)
- **Technical UI Constraints:** Next.js App Router (Server Components + Client Components), React 19 features

---

## Epic List

**Epic 1: Infrastructure Foundation & Security Hardening**
- **Goal:** Migrate to production-grade infrastructure (PostgreSQL, S3/CDN) and implement security protections to enable safe beta deployment
- **Estimated Stories:** 8-10 stories
- **Key Deliverables:** Database migration with rollback plan, cloud file storage with CDN, rate limiting, input validation, soft deletes, security audit readiness
- **Timeline:** Weeks 1-3

**Epic 1.5: Testing Infrastructure Setup**
- **Goal:** Establish testing framework and CI/CD pipeline BEFORE feature development to enable shift-left testing approach
- **Estimated Stories:** 3-4 stories
- **Key Deliverables:** Jest + Playwright setup, CI/CD pipeline with GitHub Actions, test automation on PR merges, test documentation
- **Timeline:** Concurrent with Epic 1 (weeks 2-3)
- **Rationale:** Testing infrastructure operational early prevents waterfall anti-pattern and enables test-driven development in Epic 2

**Epic 2: Feature Completion & Admin Capabilities**
- **Goal:** Complete partially implemented features (gradebook, admin dashboard, GPA calculation) to achieve feature parity with Notion delivery
- **Estimated Stories:** 6-8 stories (each story includes unit/integration tests)
- **Key Deliverables:** Full gradebook grid view with inline editing, complete admin dashboard with user management, GPA calculation logic, feedback templates for instructors
- **Timeline:** Weeks 4-6
- **Testing Approach:** Test-driven development with CI/CD validation on every PR

**Epic 3: E2E Testing & Quality Validation**
- **Goal:** Validate critical user journeys end-to-end and achieve 70%+ test coverage across all workflows
- **Estimated Stories:** 4-5 stories
- **Key Deliverables:** E2E tests for enrollment/assignment/grading workflows, accessibility tests, security penetration testing, test coverage validation
- **Timeline:** Weeks 7-8

**Epic 4: Production Deployment & Monitoring**
- **Goal:** Deploy to production environment with monitoring, logging, and operational procedures to support 99.5%+ uptime during beta
- **Estimated Stories:** 5-7 stories
- **Key Deliverables:** Production hosting configuration, database backups automation, error tracking (Sentry), performance monitoring, deployment runbooks, beta tester onboarding materials
- **Timeline:** Weeks 9-10

**Beta Iteration Buffer:** 2-4 weeks (remainder of Q1 2026) for beta onboarding, feedback collection, and critical bug fixes

**Total: 5 Epics, 26-34 Stories**

> **Note:** Detailed epic breakdown with full story specifications is available in [epics.md](./epics.md)

---

## Out of Scope

**Out of Scope for MVP (Post-Beta Priorities):**

**Email Notifications (Post-MVP - High Priority)**
- Automated email notifications for grades, announcements, assignment reminders deferred
- Rationale: Manual instructor notifications acceptable for 1-10 beta users
- Mitigation: Instructors email students manually during beta period
- Post-MVP Priority: HIGH - required for scaling beyond beta

**Advanced Analytics & Reporting (Post-MVP - High Priority)**
- Detailed learning analytics, student engagement heatmaps, predictive insights deferred
- Rationale: Basic admin dashboard metrics sufficient for beta scale
- Post-MVP Priority: HIGH - needed for understanding user behavior at scale

**Automated Quiz/Assessment Builder (Post-MVP - Medium Priority)**
- Interactive quiz creation tools, automatic grading, question banks deferred
- Rationale: Admin-uploaded quizzes (current approach) sufficient for MVP
- Post-MVP Priority: MEDIUM - improves instructor efficiency at scale

**Certificate Generation (Post-MVP - Medium Priority)**
- Automated completion certificates with custom branding deferred
- Rationale: Manual certificate creation acceptable for 10 beta users
- Post-MVP Priority: MEDIUM - professional touch for paid offerings

**API Pagination & Versioning (Post-MVP - Medium Priority)**
- REST API pagination, versioning, and rate limiting per endpoint deferred
- Rationale: Low user volume during beta (not performance bottleneck)
- Post-MVP Priority: MEDIUM - required for scaling beyond 100 users

**Multi-Language Support (Post-MVP - Low Priority)**
- Internationalization (i18n) and localization (l10n) for non-English markets deferred
- Rationale: Beta users are English-speaking SME executives
- Post-MVP Priority: LOW - depends on international expansion plans

**Mobile Native Apps (Post-MVP - Low Priority)**
- iOS and Android native applications deferred
- Rationale: Responsive web app sufficient for MVP
- Post-MVP Priority: LOW-MEDIUM - depends on beta feedback about mobile experience

---

**Explicitly Out of Scope (Foreseeable Future):**

**Multi-Tenancy & White-Label SaaS**
- Platform designed for single organization (AI Gurus), not multi-tenant SaaS
- No white-labeling or customer isolation architecture needed

**Advanced SCORM Compliance**
- Basic SCORM content support via CourseContent model sufficient
- Full SCORM 1.2/2004 specification compliance not required for AI Fluency curriculum

**Gamification & Leaderboards**
- Badges, points, achievements, leaderboards deferred indefinitely
- Rationale: Not differentiator for executive education audience

**Third-Party LMS Integration**
- No integration with Canvas, Moodle, Blackboard, or other LMS platforms
- Rationale: Not selling to other organizations

**Real-Time Collaboration Tools**
- Whiteboard, video conferencing, live chat, co-editing deferred
- Rationale: Asynchronous learning model; external tools (Zoom) used if needed

**Advanced Content Authoring**
- Built-in video editing, interactive simulations, branching scenarios deferred
- Rationale: Content created externally and uploaded

---

**Accepted Manual Workarounds for Beta:**
- Manual email notifications (instructor sends directly)
- Manual certificate generation (10 users max)
- Manual user onboarding (admin creates accounts)
- Basic reporting (CSV exports, manual analysis)
