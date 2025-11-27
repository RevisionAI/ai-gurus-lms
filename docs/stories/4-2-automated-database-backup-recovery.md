# Story 4.2: Automated Database Backup & Recovery

Status: ready-for-dev

## Story

As a system administrator,
I want automated daily database backups with validated recovery procedures,
so that we can recover from data loss or corruption without manual intervention.

## Acceptance Criteria

1. Automated daily database backups configured (midnight UTC)
2. Backup retention policy implemented: 7 days for daily backups, 4 weeks for weekly backups
3. Backups stored in separate availability zone from primary database (disaster recovery)
4. Backup encryption configured (data at rest protection)
5. Automated backup health checks configured (verify backups complete successfully)
6. Backup restoration procedure documented and tested
7. Point-in-time recovery tested (restore database to specific timestamp)
8. Recovery time objective (RTO) measured and documented (< 1 hour target)
9. Recovery point objective (RPO) validated (< 24 hours data loss acceptable)
10. Automated alerts configured (backup failures notify team immediately)
11. Documentation: Database backup and recovery runbook

## Tasks / Subtasks

- [ ] Task 1: Verify Neon Scale Plan Configuration (AC: #1, #2, #3, #4)
  - [ ] Subtask 1.1: Confirm production database is on Neon Scale plan (required for 7-day retention)
  - [ ] Subtask 1.2: Verify automated backup schedule is configured (midnight UTC)
  - [ ] Subtask 1.3: Confirm backup retention policy settings (7-day daily, 4-week weekly)
  - [ ] Subtask 1.4: Verify backups are stored in separate availability zone
  - [ ] Subtask 1.5: Confirm backup encryption at rest is enabled
  - [ ] Subtask 1.6: Document current Neon backup configuration in runbook

- [ ] Task 2: Configure Backup Health Checks (AC: #5, #10)
  - [ ] Subtask 2.1: Create monitoring script to verify daily backup completion
  - [ ] Subtask 2.2: Integrate backup verification with existing health check endpoint
  - [ ] Subtask 2.3: Configure automated alerts for backup failures (Slack/Email)
  - [ ] Subtask 2.4: Set up Better Stack monitoring for backup health
  - [ ] Subtask 2.5: Test backup failure alert triggers
  - [ ] Subtask 2.6: Document backup monitoring configuration

- [ ] Task 3: Test Point-in-Time Recovery (PITR) (AC: #6, #7, #8, #9)
  - [ ] Subtask 3.1: Create test database branch from production backup
  - [ ] Subtask 3.2: Perform PITR to specific timestamp (e.g., 24 hours ago)
  - [ ] Subtask 3.3: Validate data integrity after restore (row counts, sample records)
  - [ ] Subtask 3.4: Measure recovery time from backup selection to functional database
  - [ ] Subtask 3.5: Verify RTO meets < 1 hour target
  - [ ] Subtask 3.6: Validate RPO is within < 24 hours (daily backup interval)
  - [ ] Subtask 3.7: Document observed RTO/RPO metrics
  - [ ] Subtask 3.8: Delete test branch after validation

- [ ] Task 4: Create Database Backup & Recovery Runbook (AC: #11)
  - [ ] Subtask 4.1: Document backup schedule and retention policy
  - [ ] Subtask 4.2: Document step-by-step PITR procedure
  - [ ] Subtask 4.3: Document full database restore procedure
  - [ ] Subtask 4.4: Document backup verification procedure
  - [ ] Subtask 4.5: Document RTO/RPO metrics and targets
  - [ ] Subtask 4.6: Document disaster recovery scenarios and responses
  - [ ] Subtask 4.7: Document monthly backup restore testing schedule
  - [ ] Subtask 4.8: Create checklist for backup restoration validation
  - [ ] Subtask 4.9: Document Neon dashboard access and backup management
  - [ ] Subtask 4.10: Include runbook in `/docs/database-backup-recovery-runbook.md`

- [ ] Task 5: Implement Monthly Backup Restore Testing (AC: #6, #8)
  - [ ] Subtask 5.1: Create calendar reminder for monthly backup testing
  - [ ] Subtask 5.2: Document testing procedure in runbook
  - [ ] Subtask 5.3: Create test validation checklist
  - [ ] Subtask 5.4: Set up test result tracking log
  - [ ] Subtask 5.5: Perform initial monthly backup restore test
  - [ ] Subtask 5.6: Validate test results and update metrics

## Dev Notes

### Neon Scale Plan Backup Features

**Automated Backup Configuration:**
- Neon Scale plan provides automated backups with 7-day retention
- Backups run daily at midnight UTC automatically
- Point-in-time recovery (PITR) available within 7-day retention window
- Backups stored in separate availability zone automatically
- Backup encryption at rest enabled by default

**Backup Management:**
- Access via Neon Console: https://console.neon.tech/app/projects/{project-id}
- Navigate to "Branches" → "History" to view backup snapshots
- PITR allows restore to any point within retention window
- Database branching creates instant test databases from backups

**Recovery Procedures:**

1. **Point-in-Time Recovery (PITR):**
   ```
   1. Access Neon Console
   2. Navigate to project → Branches
   3. Click "Create Branch"
   4. Select "Point in time" option
   5. Choose timestamp for recovery point
   6. Create branch (takes ~30 seconds)
   7. Validate data integrity
   8. Promote branch to production (if needed) or update DATABASE_URL
   ```

2. **Full Database Restore:**
   ```
   1. Access Neon Console
   2. Navigate to Backups section
   3. Select snapshot (daily or weekly)
   4. Click "Restore"
   5. Create new branch from snapshot
   6. Validate data
   7. Update DATABASE_URL to point to restored branch
   8. Verify application connectivity
   ```

**RTO/RPO Targets:**
- **RTO (Recovery Time Objective):** < 1 hour
  - Branch creation: ~30 seconds
  - Data validation: ~15 minutes
  - DNS/connection update: ~5 minutes
  - Application validation: ~10 minutes
- **RPO (Recovery Point Objective):** < 24 hours
  - Daily backups at midnight UTC
  - Maximum data loss: 24 hours (last backup to incident)

**Backup Health Checks:**
- Query Neon API to verify backup completion
- Check backup timestamp is within last 25 hours
- Alert if backup is missing or stale
- Integrate with Better Stack uptime monitoring

### Project Structure Notes

**New Files:**
- `/docs/database-backup-recovery-runbook.md` - Comprehensive backup/recovery procedures
- `/scripts/verify-neon-backups.ts` (optional) - Automated backup verification script

**Modified Files:**
- `/docs/incident-response.md` - Link to backup recovery procedures (from Story 4.5)
- Better Stack dashboard - Add backup health monitoring

**Integration Points:**
- Neon Console API for backup verification
- Better Stack for backup failure alerts
- Existing health check endpoint (`/api/health/db`) for backup status
- Sentry for backup failure logging

### Testing Standards Summary

**Validation Testing:**
- Perform full PITR test during story implementation
- Validate data integrity after restore (compare row counts, sample records)
- Measure actual recovery time and confirm < 1 hour RTO
- Schedule monthly backup restore testing going forward

**Documentation Testing:**
- Peer review runbook for clarity and completeness
- Execute runbook procedures step-by-step to validate accuracy
- Test disaster recovery scenarios (simulated data loss)

### References

- [Source: docs/tech-spec-epic-4.md#Automated Database Backup]
- [Source: docs/architecture.md#Deployment Architecture - Database Backups]
- [Neon Backups Documentation](https://neon.tech/docs/manage/backups)
- [Neon Point-in-Time Recovery Guide](https://neon.tech/docs/manage/branches#point-in-time-restore)

## Dev Agent Record

### Context Reference

**Story Context File:** `/docs/stories/4-2-automated-database-backup-recovery.context.xml`

Context includes:
- Full tech spec for Epic 4 (production deployment infrastructure)
- Database architecture details (Neon PostgreSQL configuration)
- Existing infrastructure setup from Story 4.1 (production hosting)
- Monitoring patterns from Epic 1 (health checks, logging)
- Prisma schema with all 11 database models
- Neon backup configuration and PITR procedures

### Agent Model Used

(To be populated by Dev Agent during implementation)

### Debug Log References

(To be populated by Dev Agent during implementation)

### Completion Notes List

(To be populated by Dev Agent during implementation)
- Note format: [YYYY-MM-DD HH:MM] Description of completion milestone

### File List

**Files Created:**
- `/docs/database-backup-recovery-runbook.md` - Backup and recovery procedures

**Files Modified:**
(To be populated by Dev Agent during implementation)

**Files Referenced:**
- `/docs/tech-spec-epic-4.md` - Technical requirements for backup configuration
- `/docs/architecture.md` - Database architecture and deployment details
- `/src/lib/prisma.ts` - Database client configuration
- `/src/app/api/health/db/route.ts` - Health check endpoint (potential backup status integration)
