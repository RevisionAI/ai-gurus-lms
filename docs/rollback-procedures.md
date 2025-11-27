# Database Migration Rollback Procedures

## Overview

This document provides step-by-step procedures for rolling back from PostgreSQL to SQLite in case of migration failure. The rollback procedure is designed to be completed within 30 minutes with minimal data loss.

**Target Rollback Time (RTO):** < 30 minutes
**Recovery Point Objective (RPO):** Last SQLite backup

---

## When to Rollback

Execute the rollback procedure when ANY of the following conditions occur:

### Critical (Immediate Rollback Required)
- Data integrity validation fails (missing records, corrupted data)
- Foreign key violations detected in PostgreSQL
- Application crashes repeatedly due to database errors
- Data loss confirmed (records missing that existed in SQLite)

### Severe (Rollback Recommended)
- Performance regression > 50% compared to SQLite baseline
- PostgreSQL connection unstable (frequent disconnections)
- Prisma ORM compatibility issues causing query failures

### Moderate (Evaluate Before Rollback)
- Minor performance degradation (< 50% slower)
- Non-critical queries failing
- Edge case data issues (fixable without rollback)

---

## Pre-Rollback Checklist

Before starting rollback, confirm:

- [ ] SQLite backup exists at `/backups/sample-sqlite-[timestamp].db`
- [ ] Backup file is not corrupted (file size > 0)
- [ ] All team members notified of rollback
- [ ] Current PostgreSQL data exported (if recoverable data exists)
- [ ] Development server stopped

---

## Rollback Procedure

### Step 1: Stop Application (Est. 5 minutes)

1. **Stop the development server**
   ```bash
   # If running in terminal, press Ctrl+C
   # Or kill the process
   pkill -f "next dev"
   ```

2. **Verify server is stopped**
   ```bash
   curl http://localhost:3000/api/health || echo "Server stopped successfully"
   ```

3. **Notify team**
   - Post in team Slack/Discord: "Database rollback in progress. Development paused."
   - Update project status file if applicable

### Step 2: Backup Current PostgreSQL State (Est. 3 minutes)

*Skip this step if PostgreSQL data is corrupted/unusable*

1. **Export PostgreSQL data (optional)**
   ```bash
   # If you need to preserve any PostgreSQL data
   pg_dump $DATABASE_URL > backups/postgres-pre-rollback-$(date +%Y%m%d-%H%M%S).sql
   ```

2. **Document current state**
   - Note any data that may be lost
   - Record error messages that triggered rollback

### Step 3: Restore SQLite Database (Est. 5 minutes)

1. **Locate the SQLite backup**
   ```bash
   ls -la backups/sample-sqlite-*.db
   ```

2. **Copy backup to active location**
   ```bash
   # Use the most recent backup
   cp backups/sample-sqlite-[TIMESTAMP].db prisma/dev.db

   # Example:
   cp backups/sample-sqlite-2024-11-25.db prisma/dev.db
   ```

3. **Verify backup integrity**
   ```bash
   # Check file size (should be > 0)
   ls -la prisma/dev.db

   # Quick integrity check with sqlite3
   sqlite3 prisma/dev.db "SELECT COUNT(*) FROM users;"
   ```

### Step 4: Update Environment Variables (Est. 2 minutes)

1. **Edit `.env.local`**
   ```bash
   # Open .env.local in your editor
   nano .env.local
   # or
   code .env.local
   ```

2. **Change DATABASE_URL to SQLite**
   ```bash
   # Comment out PostgreSQL URL
   # DATABASE_URL="postgresql://..."
   # DIRECT_URL="postgresql://..."

   # Set SQLite URL
   DATABASE_URL="file:./prisma/dev.db"
   ```

3. **Save and close the file**

### Step 5: Update Prisma Schema (Est. 5 minutes)

1. **Edit `prisma/schema.prisma`**
   ```prisma
   // Change provider from postgresql to sqlite
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. **Regenerate Prisma client**
   ```bash
   npx prisma generate
   ```

3. **Verify Prisma can connect**
   ```bash
   npx prisma db pull
   # Should complete without errors
   ```

### Step 6: Validate Application Functionality (Est. 10 minutes)

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Test critical workflows**

   | Workflow | Test Steps | Expected Result |
   |----------|------------|-----------------|
   | User Login | Navigate to login, enter test credentials | Successful login |
   | Course List | View dashboard after login | Courses display correctly |
   | Assignment View | Click on an assignment | Assignment details load |
   | Submission | Submit test content | Submission saves successfully |
   | Gradebook | Navigate to gradebook (as instructor) | Grades display correctly |

3. **Run automated health check**
   ```bash
   curl http://localhost:3000/api/health
   # Should return: {"status":"healthy","database":"connected"}
   ```

4. **Verify data presence**
   ```bash
   # Open Prisma Studio
   npx prisma studio
   # Verify tables have expected data
   ```

### Step 7: Document Rollback (Est. 3 minutes)

1. **Create rollback report**
   ```bash
   # Create report file
   touch docs/rollback-report-$(date +%Y%m%d-%H%M%S).md
   ```

2. **Document the following in the report:**
   - Date and time of rollback
   - Reason for rollback (validation failure, performance, errors)
   - Data loss (if any)
   - Steps taken
   - Issues encountered during rollback
   - Recommendations for retry

3. **Notify team of completion**
   - Post in team channel: "Rollback complete. Development can resume."
   - Share rollback report link

---

## Post-Rollback Actions

### Immediate (Within 1 hour)
- [ ] Verify all critical functionality works
- [ ] Run validation script to confirm SQLite data integrity
- [ ] Update sprint status to reflect rollback

### Short-term (Within 24 hours)
- [ ] Analyze root cause of migration failure
- [ ] Document lessons learned
- [ ] Plan fix for migration issues
- [ ] Schedule retry migration (if appropriate)

### Before Retry Migration
- [ ] Fix all identified issues
- [ ] Test migration on isolated environment
- [ ] Update validation script if needed
- [ ] Ensure fresh SQLite backup exists

---

## Verification Checklist

After completing rollback, verify:

- [ ] `.env.local` points to SQLite (`DATABASE_URL="file:./prisma/dev.db"`)
- [ ] `prisma/schema.prisma` uses `provider = "sqlite"`
- [ ] `prisma/dev.db` file exists and has data
- [ ] Prisma client regenerated (`npx prisma generate`)
- [ ] Development server starts without errors
- [ ] User login works
- [ ] Course list displays
- [ ] Assignment submission works
- [ ] Gradebook accessible
- [ ] No console errors related to database
- [ ] Rollback documented in report file

---

## Troubleshooting

### Common Issues

**Issue: Prisma client fails to generate**
```bash
# Solution: Clear cache and regenerate
rm -rf node_modules/.prisma
npx prisma generate
```

**Issue: SQLite backup file not found**
```bash
# Solution: Check backups directory
ls -la backups/
# If empty, check prisma folder for original dev.db
ls -la prisma/
```

**Issue: Schema mismatch errors**
```bash
# Solution: Reset migrations for SQLite
npx prisma migrate reset --skip-seed
```

**Issue: Application shows "Cannot connect to database"**
```bash
# Solution: Verify environment variables loaded
grep DATABASE_URL .env.local
# Restart terminal/IDE to reload env vars
```

**Issue: Data missing after rollback**
```bash
# Solution: Use older backup if available
ls -la backups/sample-sqlite-*.db
# Choose earlier backup date
```

---

## Emergency Contacts

If rollback fails or critical issues occur:

1. **Primary Contact:** [Project Lead Name] - [Contact Method]
2. **Database Expert:** [DBA Name] - [Contact Method]
3. **On-call Developer:** [Developer Name] - [Contact Method]

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-25 | Dev Agent | Initial rollback procedures |

---

## Related Documents

- [Migration Go/No-Go Criteria](./migration-go-nogo.md)
- [Database Architecture](./architecture.md#Data-Architecture)
- [Validation Results](./validation-results-[timestamp].md)
