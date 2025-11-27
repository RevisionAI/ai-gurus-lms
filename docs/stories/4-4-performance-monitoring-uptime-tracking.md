# Story 4.4: Performance Monitoring & Uptime Tracking

Status: ready-for-dev

## Story

As a system administrator,
I want real-time performance monitoring and uptime tracking,
so that I can ensure 99.5%+ uptime and detect performance degradation proactively.

## Acceptance Criteria

1. Uptime monitoring service configured (Better Stack)
2. Monitors configured for critical endpoints (Homepage, Login, API health, Course catalog)
3. Monitoring frequency: Every 3 minutes from multiple global locations
4. Incident detection threshold: 2 consecutive failures = downtime incident
5. Automated alerts configured (downtime → immediate, slow response → warning)
6. Performance monitoring configured (Vercel Analytics)
7. Metrics tracked: Page load times (p50, p95, p99), API response times, Core Web Vitals
8. Dashboard created: Uptime percentage, incident history, performance trends
9. SLA tracking: 99.5%+ uptime validated (7-day rolling average)
10. Performance baselines documented (current response times for comparison)
11. Documentation: Performance monitoring and incident response guide

## Tasks / Subtasks

### Task 1: Better Stack Account Setup & Configuration (AC: #1)
- [ ] Create Better Stack account (free tier: 10 monitors)
- [ ] Configure organization settings and team access
- [ ] Generate API key for automation (store in environment variables)
- [ ] Configure alert channels (Slack webhook, SMS, Email)

### Task 2: Critical Endpoint Monitors Configuration (AC: #2, #3, #4)
- [ ] Create monitor for homepage (/)
- [ ] Create monitor for login page (/login)
- [ ] Create monitor for API health check (/api/health/db)
- [ ] Create monitor for course catalog (/courses)
- [ ] Configure monitoring frequency: 3-minute intervals
- [ ] Configure geographic locations: US-East, US-West, EU (minimum 3 locations)
- [ ] Set incident detection threshold: 2 consecutive failures
- [ ] Configure expected HTTP status codes (200 OK for all endpoints)
- [ ] Set response time warning threshold (5 seconds)

### Task 3: Better Stack Alert Configuration (AC: #5)
- [ ] Configure downtime alerts:
  - Channel: Slack + SMS + Email
  - Trigger: Immediate on incident detection
  - Message template: Include endpoint, location, failure reason
- [ ] Configure slow response alerts:
  - Channel: Slack + Email
  - Trigger: Response time > 5 seconds
  - Message template: Include endpoint, response time, p95 baseline
- [ ] Configure recovery notifications:
  - Channel: Slack + Email
  - Message template: Include downtime duration, incident timeline
- [ ] Configure SSL certificate expiry alerts:
  - Channel: Email
  - Trigger: Certificate expires in < 14 days
- [ ] Test alert delivery (trigger test incident, verify notifications received)

### Task 4: Vercel Analytics Setup & Integration (AC: #6)
- [ ] Enable Vercel Analytics in project settings (included in Pro plan)
- [ ] Verify Analytics tracking script injected automatically
- [ ] Configure data collection settings (enable all metrics)
- [ ] Set up custom events for critical user actions (optional enhancement)
- [ ] Validate Analytics dashboard accessible from Vercel project

### Task 5: Core Web Vitals & Performance Metrics Tracking (AC: #7)
- [ ] Verify Core Web Vitals tracking active:
  - Largest Contentful Paint (LCP) - Target: < 2.5s
  - First Contentful Paint (FCP) - Target: < 1.8s
  - Cumulative Layout Shift (CLS) - Target: < 0.1
  - Time to First Byte (TTFB) - Target: < 200ms
- [ ] Configure page load time metrics (p50, p95, p99)
- [ ] Configure API response time tracking (automatic via Vercel Functions)
- [ ] Set up geographic performance breakdown
- [ ] Configure device type segmentation (desktop, mobile, tablet)

### Task 6: Monitoring Dashboards Creation (AC: #8)
- [ ] Create Better Stack dashboard:
  - Uptime percentage widget (current, 7-day, 30-day)
  - Incident history timeline
  - Response time trends by endpoint
  - Status indicators for all monitors
- [ ] Configure Vercel Analytics dashboard views:
  - Overview: Traffic, performance summary
  - Page Performance: Load times by page
  - Core Web Vitals: LCP, FCP, CLS, TTFB scores
  - Real User Metrics: Geographic distribution, device breakdown
- [ ] Create combined monitoring dashboard (optional):
  - Embed Better Stack status widget
  - Link to Vercel Analytics
  - Quick access to Sentry (from Story 4.3)
  - Incident response runbook links

### Task 7: SLA Tracking & Validation (AC: #9)
- [ ] Configure Better Stack SLA tracking (99.5% target)
- [ ] Set up 7-day rolling average calculation
- [ ] Create uptime report automation (weekly email)
- [ ] Establish baseline: Monitor uptime for 7 days post-deployment
- [ ] Document uptime targets per endpoint:
  - Critical endpoints (homepage, login, API): 99.5%+
  - Non-critical endpoints: 99.0%+
- [ ] Create uptime validation checklist for Story 4.7 (launch validation)

### Task 8: Performance Baselines Documentation (AC: #10)
- [ ] Measure and document baseline metrics:
  - Homepage load time: p50, p95, p99
  - Login page load time: p50, p95, p99
  - Course catalog load time: p50, p95, p99
  - API health check response time: p50, p95, p99
- [ ] Document Core Web Vitals baselines:
  - LCP, FCP, CLS, TTFB per critical page
- [ ] Create performance baseline comparison table:
  - Current vs PRD targets (NFR001)
  - Identify pages needing optimization
- [ ] Document performance trends over first week
- [ ] Establish performance regression thresholds (when to investigate)

### Task 9: Monitoring Documentation & Incident Response Guide (AC: #11)
- [ ] Create performance monitoring guide (`docs/performance-monitoring.md`):
  - How to access Better Stack dashboard
  - How to access Vercel Analytics
  - How to interpret metrics (LCP, FCP, CLS, TTFB)
  - How to investigate slow response times
  - How to correlate performance with deployments
- [ ] Create incident response guide (`docs/incident-response.md`):
  - Severity classification (P0: site down, P1: major feature broken, P2/P3: minor issues)
  - Alert triage procedures (what to check first)
  - Common incidents and resolutions:
    - Site down: Check Vercel status, database health, rollback procedure
    - Slow response: Check Vercel Analytics, database query performance, recent deployments
    - SSL errors: Check certificate expiry, DNS configuration
  - Escalation procedures (who to contact for P0/P1 incidents)
  - Post-incident review template
- [ ] Create uptime monitoring troubleshooting guide:
  - False positive handling (temporary network blips)
  - Monitor reconfiguration (adjusting thresholds)
  - Geographic location selection (optimizing coverage)
- [ ] Document alert notification management:
  - How to update Slack webhook, email addresses, SMS numbers
  - How to silence alerts during planned maintenance
  - How to test alert delivery

### Task 10: Testing & Validation
- [ ] Trigger test downtime incident:
  - Temporarily disable health check endpoint
  - Verify Better Stack detects failure within 6 minutes (2 x 3-minute checks)
  - Verify alerts received via all configured channels
  - Re-enable endpoint, verify recovery notification
- [ ] Trigger slow response alert:
  - Introduce artificial delay (5+ seconds) in test endpoint
  - Verify Better Stack detects slow response
  - Verify warning notification received
  - Remove delay, verify recovery
- [ ] Validate Vercel Analytics data collection:
  - Perform test page loads on critical pages
  - Wait 5-10 minutes for data propagation
  - Verify page views appear in Analytics dashboard
  - Verify Core Web Vitals metrics recorded
- [ ] Validate geographic monitoring:
  - Check Better Stack dashboard for all configured locations
  - Verify response times from each location
  - Identify any geographic performance issues
- [ ] Validate dashboard accessibility:
  - Share Better Stack dashboard with team
  - Verify Vercel Analytics accessible to all team members
  - Test dashboard on mobile devices (optional)

## Dev Notes

### Critical Endpoints to Monitor

| Endpoint | URL | Expected Status | Warning Threshold | Critical Threshold |
|----------|-----|-----------------|-------------------|-------------------|
| Homepage | `https://learn.aigurus.com/` | 200 OK | > 3s response | > 5s or error |
| Login | `https://learn.aigurus.com/login` | 200 OK | > 3s response | > 5s or error |
| API Health | `https://learn.aigurus.com/api/health/db` | 200 OK | > 1s response | > 2s or error |
| Course Catalog | `https://learn.aigurus.com/courses` | 200 OK | > 3s response | > 5s or error |

### Alert Configuration

**Downtime Alert (Immediate):**
```
Incident Type: Site Down
Trigger: 2 consecutive failures (6 minutes)
Channels: Slack (#alerts-prod) + SMS + Email
Message Template:
  🚨 DOWNTIME ALERT
  Endpoint: {endpoint_url}
  Location: {check_location}
  Status: {status_code}
  Error: {error_message}
  Time: {timestamp}
  Action: Investigate immediately, follow incident-response.md
```

**Slow Response Alert (Warning):**
```
Incident Type: Performance Degradation
Trigger: Response time > 5 seconds
Channels: Slack (#alerts-prod) + Email
Message Template:
  ⚠️ SLOW RESPONSE ALERT
  Endpoint: {endpoint_url}
  Response Time: {response_time}ms
  Baseline (p95): {baseline_p95}ms
  Location: {check_location}
  Time: {timestamp}
  Action: Investigate within 4 hours, check Vercel Analytics
```

**Recovery Notification:**
```
Incident Type: Service Restored
Channels: Slack (#alerts-prod) + Email
Message Template:
  ✅ SERVICE RESTORED
  Endpoint: {endpoint_url}
  Downtime Duration: {duration}
  Incident Start: {start_time}
  Incident End: {end_time}
  Action: Review incident logs, document in incident-response.md
```

### Core Web Vitals Targets

| Metric | Target | Good | Needs Improvement | Poor |
|--------|--------|------|-------------------|------|
| LCP (Largest Contentful Paint) | < 2.5s | < 2.5s | 2.5s - 4.0s | > 4.0s |
| FCP (First Contentful Paint) | < 1.8s | < 1.8s | 1.8s - 3.0s | > 3.0s |
| CLS (Cumulative Layout Shift) | < 0.1 | < 0.1 | 0.1 - 0.25 | > 0.25 |
| TTFB (Time to First Byte) | < 200ms | < 200ms | 200ms - 500ms | > 500ms |

### Better Stack Configuration Details

**Free Tier Limits:**
- 10 monitors (sufficient for 4 critical endpoints + future expansion)
- 3-minute check frequency (meets MTTD < 5 minutes requirement)
- Multiple locations included
- Unlimited alerts

**Upgrade to Paid ($18/month) if needed:**
- 1-minute check frequency (faster detection)
- Status page hosting (public uptime dashboard)
- Advanced incident management
- Custom alert integrations

### Vercel Analytics Details

**Included in Vercel Pro Plan:**
- Automatic Core Web Vitals tracking
- Real User Monitoring (RUM)
- Page-level performance metrics
- Geographic breakdown
- Device segmentation
- Unlimited data retention

**No Configuration Required:**
- Analytics automatically injected via Vercel deployment
- No code changes needed
- Data appears in Vercel dashboard

### Geographic Monitoring Locations

**Better Stack Recommended Locations:**
1. **US-East (N. Virginia)** - Primary production region
2. **US-West (California)** - West coast user coverage
3. **EU-West (Ireland)** - International user coverage (optional for beta)

**Why Multiple Locations:**
- Detect region-specific outages
- Validate CDN performance globally
- Identify DNS propagation issues
- Meet diverse user geographic distribution

### Performance Baseline Template

```markdown
# Performance Baselines - AI Gurus LMS

**Measurement Date:** 2025-11-27
**Deployment Version:** v1.0.0-prod

## Page Load Times (p95)

| Page | Baseline | Target | Status |
|------|----------|--------|--------|
| Homepage (/) | 1.8s | < 2.0s | ✅ Pass |
| Login (/login) | 1.2s | < 2.0s | ✅ Pass |
| Course Catalog (/courses) | 2.1s | < 2.0s | ⚠️ Needs optimization |
| Course Detail (/courses/[id]) | 1.9s | < 2.0s | ✅ Pass |

## API Response Times (p95)

| Endpoint | Baseline | Target | Status |
|----------|----------|--------|--------|
| /api/health/db | 85ms | < 200ms | ✅ Pass |
| /api/instructor/courses | 320ms | < 500ms | ✅ Pass |
| /api/students/gpa/course | 280ms | < 500ms | ✅ Pass |

## Core Web Vitals

| Page | LCP | FCP | CLS | TTFB | Status |
|------|-----|-----|-----|------|--------|
| Homepage | 2.1s | 1.5s | 0.05 | 180ms | ✅ Pass |
| Login | 1.8s | 1.2s | 0.02 | 150ms | ✅ Pass |
| Course Catalog | 2.6s | 1.8s | 0.08 | 220ms | ⚠️ LCP exceeds target |

## Optimization Recommendations

1. **Course Catalog Page:**
   - LCP exceeds 2.5s target (current: 2.6s)
   - Investigate: Large course image loading, consider lazy loading
   - Action: Optimize images, implement skeleton loaders

2. **TTFB for Course Catalog:**
   - 220ms (acceptable but near threshold)
   - Monitor database query performance
   - Consider implementing Redis caching if TTFB increases
```

### References

- [Source: docs/tech-spec-epic-4.md#Performance Monitoring]
- [Source: docs/tech-spec-epic-4.md#Observability]
- [Source: docs/tech-spec-epic-4.md#Non-Functional Requirements - Performance]
- [Source: docs/epics.md#Story 4.4: Performance Monitoring & Uptime Tracking]
- [PRD Reference: NFR001 - Performance Requirements]
- [PRD Reference: NFR002 - 99.5%+ Uptime Requirement]

### Integration Dependencies

- **Story 4.1 (Production Hosting):** Required - production endpoints must exist for monitoring
- **Story 4.3 (Error Tracking):** Recommended - correlate performance issues with errors in Sentry
- **Epic 1 (Health Check Endpoint):** Required - `/api/health/db` must be operational

### Environment Variables

```bash
# Better Stack Configuration
BETTER_STACK_API_KEY="<api-key-from-better-stack-dashboard>"

# Alert Channels
SLACK_WEBHOOK_URL_PROD="<slack-webhook-for-alerts-prod-channel>"
ALERT_EMAIL="ops@aigurus.com"
ALERT_SMS_NUMBER="+1234567890"

# Monitoring Configuration (optional overrides)
UPTIME_CHECK_FREQUENCY_MINUTES="3"
PERFORMANCE_WARNING_THRESHOLD_MS="5000"
```

### Testing Checklist

- [ ] Better Stack monitors active for all 4 critical endpoints
- [ ] 3-minute check frequency confirmed in Better Stack dashboard
- [ ] Geographic locations configured (US-East, US-West, EU)
- [ ] Downtime alert tested (endpoint disabled → alert received → endpoint restored)
- [ ] Slow response alert tested (artificial delay → alert received)
- [ ] Vercel Analytics tracking verified (page views appearing in dashboard)
- [ ] Core Web Vitals metrics recorded (LCP, FCP, CLS, TTFB)
- [ ] Performance baselines documented in `docs/performance-baselines.md`
- [ ] Monitoring documentation complete (`docs/performance-monitoring.md`)
- [ ] Incident response guide complete (`docs/incident-response.md`)
- [ ] Team has access to Better Stack and Vercel Analytics dashboards
- [ ] SLA tracking configured (99.5% target, 7-day rolling average)

## Dev Agent Record

### Context Reference

**Story Context XML:** `docs/stories/4-4-performance-monitoring-uptime-tracking.context.xml`

**Created:** 2025-11-27

**Key Integration Points:**
- Better Stack Uptime: 3-minute checks from 3+ global locations, 10 free monitors
- Vercel Analytics: Core Web Vitals (LCP < 2.5s, FCP < 1.8s, CLS < 0.1, TTFB < 200ms)
- Critical endpoints: /, /login, /api/health/db, /courses
- Alert channels: Slack (#alerts-prod), SMS, Email
- SLA target: 99.5%+ uptime (7-day rolling average)
- Health check endpoint: src/app/api/health/db/route.ts (already production-ready)

**Documentation to Create:**
- docs/performance-monitoring.md - Dashboard access and metric interpretation
- docs/incident-response.md - Severity classification and response procedures
- docs/performance-baselines.md - Baseline measurements post-deployment

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
