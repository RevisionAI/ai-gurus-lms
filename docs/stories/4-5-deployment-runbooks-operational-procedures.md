# Story 4.5: Deployment Runbooks & Operational Procedures

Status: ready-for-dev

## Story

As a DevOps engineer,
I want comprehensive deployment runbooks and operational procedures,
so that any team member can deploy updates, respond to incidents, and maintain the platform.

## Acceptance Criteria

1. Deployment runbook created (docs/deployment-runbook.md) with pre-deployment checklist, deployment steps, post-deployment validation, rollback procedure
2. Incident response playbook created (docs/incident-response.md) with severity classification, escalation procedures, common incidents and resolutions, post-incident review template
3. Troubleshooting guide created (docs/troubleshooting.md) with common errors and fixes, log access instructions, database diagnostic queries, performance debugging techniques
4. Monitoring dashboard guide created with metric interpretation, escalation thresholds, historical baseline comparisons
5. All runbooks peer-reviewed by team (ensure clarity and completeness)
6. Runbook tested via tabletop exercise (simulate incident, follow procedures)

## Tasks / Subtasks

- [ ] Task 1: Create Deployment Runbook (AC: #1)
  - [ ] 1.1: Document pre-deployment checklist (tests passed, security scan, database migrations prepared)
  - [ ] 1.2: Document step-by-step deployment procedure for Vercel (automatic on push to main)
  - [ ] 1.3: Document post-deployment validation steps (health checks, smoke tests)
  - [ ] 1.4: Document rollback procedure (Vercel dashboard or CLI approach)
  - [ ] 1.5: Include environment variable verification checklist
  - [ ] 1.6: Document zero-downtime deployment strategy

- [ ] Task 2: Create Incident Response Playbook (AC: #2)
  - [ ] 2.1: Define severity classification system (P0: immediate, P1: 1 hour, P2: 4 hours, P3: next business day)
  - [ ] 2.2: Document escalation procedures and contact tree
  - [ ] 2.3: Create common incident response procedures:
    - [ ] Site down / database unreachable
    - [ ] Deployment failure
    - [ ] Performance degradation
    - [ ] Error spike in Sentry
    - [ ] Authentication/authorization failures
  - [ ] 2.4: Create post-incident review template
  - [ ] 2.5: Document communication protocols (stakeholder notification)
  - [ ] 2.6: Include incident workflow diagram

- [ ] Task 3: Create Troubleshooting Guide (AC: #3)
  - [ ] 3.1: Document common errors and fixes:
    - [ ] Database connection failures
    - [ ] File upload/R2 storage errors
    - [ ] Authentication errors
    - [ ] Rate limiting triggered
    - [ ] Build/deployment failures
  - [ ] 3.2: Document log access procedures:
    - [ ] Accessing Vercel Logs
    - [ ] Accessing Sentry errors
    - [ ] Filtering and searching logs
  - [ ] 3.3: Document database diagnostic queries:
    - [ ] Connection health check
    - [ ] Performance bottleneck queries
    - [ ] Data integrity checks
  - [ ] 3.4: Document performance debugging techniques:
    - [ ] Using Vercel Analytics
    - [ ] Identifying slow queries
    - [ ] Frontend performance profiling

- [ ] Task 4: Create Monitoring Dashboard Guide (AC: #4)
  - [ ] 4.1: Document Sentry dashboard interpretation:
    - [ ] Error trends and patterns
    - [ ] Most common errors
    - [ ] Error rate by endpoint
    - [ ] Session replay usage
  - [ ] 4.2: Document Vercel Analytics interpretation:
    - [ ] Core Web Vitals scores (LCP, FID, CLS)
    - [ ] Page load times by page
    - [ ] Geographic performance breakdown
  - [ ] 4.3: Document Better Stack monitoring:
    - [ ] Uptime percentage interpretation
    - [ ] Incident history analysis
    - [ ] Response time trends
  - [ ] 4.4: Define escalation thresholds:
    - [ ] Error rate thresholds
    - [ ] Response time thresholds
    - [ ] Uptime thresholds
  - [ ] 4.5: Document historical baseline comparisons
  - [ ] 4.6: Create monitoring checklist (daily/weekly checks)

- [ ] Task 5: Peer Review All Runbooks (AC: #5)
  - [ ] 5.1: Schedule peer review session with team
  - [ ] 5.2: Review deployment runbook for clarity and completeness
  - [ ] 5.3: Review incident response playbook for actionability
  - [ ] 5.4: Review troubleshooting guide for coverage
  - [ ] 5.5: Review monitoring dashboard guide for accuracy
  - [ ] 5.6: Incorporate feedback and finalize all documents

- [ ] Task 6: Conduct Tabletop Exercise (AC: #6)
  - [ ] 6.1: Design incident simulation scenarios:
    - [ ] Scenario 1: Production site down
    - [ ] Scenario 2: Database performance degradation
    - [ ] Scenario 3: Deployment rollback required
  - [ ] 6.2: Execute tabletop exercise with team
  - [ ] 6.3: Follow runbook procedures step-by-step
  - [ ] 6.4: Document gaps or confusion points
  - [ ] 6.5: Refine runbooks based on exercise learnings
  - [ ] 6.6: Document exercise results and improvements made

## Dev Notes

### References

- [Source: docs/tech-spec-epic-4.md#Workflows and Sequencing]
- [Source: docs/tech-spec-epic-4.md#Services and Modules]
- [Source: docs/tech-spec-epic-4.md#Observability]

### Deployment Runbook Outline

The deployment-runbook.md should include:

**1. Pre-Deployment Checklist**
- All tests passing in CI/CD (GitHub Actions)
- Security scan completed (no P0/P1 vulnerabilities)
- Database migrations prepared and tested
- Environment variables validated
- Stakeholder approval obtained

**2. Deployment Steps (Vercel)**
- Automatic deployment on push to main branch
- Manual deployment via Vercel CLI if needed
- Preview deployment validation process
- Production environment variable verification

**3. Post-Deployment Validation**
- Health check endpoint verification (`/api/health/db` returns 200 OK)
- Smoke test execution (login, course access, file upload)
- Sentry error monitoring (no new critical errors)
- Better Stack uptime confirmation
- Vercel Analytics performance check

**4. Rollback Procedure**
- When to rollback (decision criteria)
- Rollback via Vercel dashboard (instant rollback to previous deployment)
- Rollback via Vercel CLI command
- Post-rollback validation steps
- Communication to stakeholders

### Incident Response Playbook Outline

The incident-response.md should include:

**1. Severity Classification**
- P0 (Critical): Site down, data loss risk, security breach → Immediate response
- P1 (High): Major feature broken, significant user impact → Response within 1 hour
- P2 (Medium): Minor feature issue, workaround available → Response within 4 hours
- P3 (Low): Cosmetic issue, minimal impact → Next business day

**2. Incident Response Flow**
```
Alert Triggered → Classification → Investigation → Resolution → Post-Incident Review
```

**3. Common Incident Scenarios**
- **Site Down**: Check Better Stack, verify database connection, check Vercel status
- **Database Unreachable**: Check Neon status, verify connection string, restart if needed
- **Deployment Failure**: Check build logs, verify environment variables, rollback if needed
- **Error Spike**: Check Sentry for patterns, identify root cause, deploy hotfix or rollback
- **Performance Degradation**: Check Vercel Analytics, identify slow queries, optimize or scale

**4. Escalation Procedures**
- Primary contact: [DevOps Lead]
- Secondary contact: [Tech Lead]
- Stakeholder notification protocol (when and how)

**5. Post-Incident Review Template**
- Incident timeline
- Root cause analysis
- Resolution steps taken
- Preventive measures for future
- Runbook updates needed

### Troubleshooting Guide Outline

The troubleshooting.md should include:

**1. Common Errors and Fixes**

| Error | Symptoms | Diagnosis | Resolution |
|-------|----------|-----------|------------|
| Database Connection Failure | 503 errors, health check fails | Check Neon dashboard, verify DATABASE_URL | Restart database, verify connection string |
| R2 Storage Error | File upload fails, 500 errors | Check Cloudflare R2 dashboard, verify credentials | Verify R2_* environment variables, check bucket permissions |
| Authentication Error | Login fails, 401 errors | Check NextAuth logs, verify NEXTAUTH_SECRET | Verify environment variables, clear session cookies |
| Rate Limiting | 429 errors | Check Upstash Redis logs | Adjust rate limits or investigate abuse |
| Build Failure | Deployment fails | Check Vercel build logs | Fix TypeScript errors, verify dependencies |

**2. Log Access Instructions**
- **Vercel Logs**: Dashboard → Project → Logs (filter by function, status, time range)
- **Sentry Errors**: Sentry dashboard → Issues (filter by severity, environment)
- **Structured Logs**: Pino logs in Vercel Logs, JSON format, searchable

**3. Database Diagnostic Queries**
```sql
-- Connection health check
SELECT 1;

-- Active connections count
SELECT count(*) FROM pg_stat_activity;

-- Long-running queries (> 5 seconds)
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 seconds';

-- Database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**4. Performance Debugging Techniques**
- Use Vercel Analytics to identify slow pages
- Check Sentry Performance for slow transactions
- Review database query performance (Prisma query logs)
- Use browser DevTools Performance tab for frontend profiling
- Check Core Web Vitals for user experience metrics

### Monitoring Dashboard Guide Outline

The monitoring dashboard guide should be integrated into the incident-response.md and troubleshooting.md, covering:

**1. Sentry Dashboard**
- Error trends: Look for spikes or unusual patterns
- Most common errors: Prioritize high-frequency issues
- Error rate by endpoint: Identify problematic API routes
- Session replay: Use for debugging user-reported issues
- Release tracking: Compare error rates across deployments

**2. Vercel Analytics Dashboard**
- Core Web Vitals: Target LCP < 2.5s, FID < 100ms, CLS < 0.1
- Page load times: p95 should be < 2 seconds
- Geographic performance: Identify regional issues
- Real User Monitoring (RUM): Actual user experience data
- Traffic trends: Monitor for unexpected spikes or drops

**3. Better Stack Monitoring**
- Uptime percentage: Target 99.5%+ (7-day rolling)
- Incident history: Review patterns and root causes
- Response time trends: Baseline < 500ms, alert > 5s
- Status page: Communicate incidents to users
- Multi-location checks: Verify global availability

**4. Escalation Thresholds**
- Error rate > 10x baseline → P1 incident
- Uptime < 99.5% (7-day) → P1 incident
- Response time p95 > 5 seconds → P2 incident
- Critical errors (auth, data loss) → P0 incident (any occurrence)

**5. Daily Monitoring Checklist**
- Check Sentry for new critical errors
- Review Better Stack uptime (last 24 hours)
- Check Vercel Analytics for performance anomalies
- Verify backup completion (Neon dashboard)

**6. Weekly Monitoring Checklist**
- Review incident history and trends
- Analyze performance baselines (compare to previous week)
- Review error patterns for recurring issues
- Check storage usage (R2 bucket size)
- Validate monitoring alerts are working (test alert)

### Technical Implementation Notes

**File Locations:**
- `/Users/eddyh/Documents/2025/Q3/Projects/Vibe Tribe/Vibe Tribe/AI GURUS v12claude/ai-gurus-lms/docs/deployment-runbook.md`
- `/Users/eddyh/Documents/2025/Q3/Projects/Vibe Tribe/Vibe Tribe/AI GURUS v12claude/ai-gurus-lms/docs/incident-response.md`
- `/Users/eddyh/Documents/2025/Q3/Projects/Vibe Tribe/Vibe Tribe/AI GURUS v12claude/ai-gurus-lms/docs/troubleshooting.md`

**Dependencies:**
- Story 4.1 complete (production deployment operational)
- Story 4.2 complete (database backups documented)
- Story 4.3 complete (error tracking operational)
- Story 4.4 complete (monitoring operational)

**Verification:**
- All runbooks are clear and actionable
- Team can follow procedures without additional guidance
- Tabletop exercise validates completeness
- Runbooks cover all operational scenarios from tech spec

## Dev Agent Record

### Context Reference

Story context XML file created:
- **Context File**: docs/stories/4-5-deployment-runbooks-operational-procedures.context.xml
- **Generated**: 2025-11-27
- **Status**: Complete

Key context sources for this story:
- docs/tech-spec-epic-4.md (sections: Workflows and Sequencing, Services and Modules, Observability)
- docs/epics.md (Story 4.5 acceptance criteria)
- docs/architecture.md (Deployment Architecture, Monitoring & Observability)
- src/app/api/health/db/route.ts (Health check endpoint implementation)
- next.config.js (Security headers configuration)

Story context includes:
- Deployment architecture (Vercel automatic deployment on push to main)
- Database configuration (Neon PostgreSQL with automated backups)
- Monitoring services (Sentry, Vercel Analytics, Better Stack, Vercel Logs)
- Incident severity classification (P0/P1/P2/P3 definitions)
- Common error scenarios with diagnostic and resolution steps
- Environment variables required for deployment
- Escalation thresholds and monitoring checklists
- Files to create (deployment-runbook.md, incident-response.md, troubleshooting.md)

### Agent Model Used

(To be filled by Dev Agent)

### Debug Log References

(To be filled by Dev Agent)

### Completion Notes List

(To be filled by Dev Agent)

### File List

Documents to be created:
- docs/deployment-runbook.md
- docs/incident-response.md
- docs/troubleshooting.md
