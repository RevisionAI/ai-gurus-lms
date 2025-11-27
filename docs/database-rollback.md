# Database Rollback Procedure

## Overview

This document describes the procedure to rollback from PostgreSQL to SQLite in case of critical issues. This should only be used as a last resort during development or in emergency scenarios.

## When to Rollback

Consider rollback when:
- Critical data corruption occurs that cannot be recovered
- Major PostgreSQL-specific bugs blocking development
- Neon service outage lasting more than acceptable downtime
- Incompatible PostgreSQL features causing application failures

**Do NOT rollback for:**
- Minor performance issues (optimize instead)
- Temporary connection issues (retry with exponential backoff)
- Learning curve challenges (consult documentation)

## Prerequisites

Before starting rollback:
- [ ] Backup PostgreSQL data (if any exists)
- [ ] Notify team members of rollback
- [ ] Ensure no active database operations
- [ ] Have SQLite backup ready (if reverting to previous state)

## Step-by-Step Rollback Procedure

### Step 1: Backup PostgreSQL Data

```bash
# Export all data from PostgreSQL (if data exists)
# Option A: Using pg_dump (requires psql client)
pg_dump "$DATABASE_URL" > backup-postgresql-$(date +%Y%m%d-%H%M%S).sql

# Option B: Using Prisma (recommended for development)
npx prisma db pull  # Ensure schema is in sync
# Then manually export data via Prisma Studio if needed
```

### Step 2: Stop Application

```bash
# Stop the Next.js development server
# Press Ctrl+C in terminal running npm run dev

# Or kill by port
lsof -ti:3000 | xargs kill -9
```

### Step 3: Revert Prisma Schema

Edit `prisma/schema.prisma`:

```prisma
// Change FROM:
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// Change TO:
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

### Step 4: Update Environment Variables

Edit `.env` and `.env.local`:

```bash
# Change FROM:
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Change TO:
DATABASE_URL="file:./prisma/dev.db"
# Remove DIRECT_URL (not needed for SQLite)
```

### Step 5: Reset Migrations

```bash
# Archive PostgreSQL migrations
mv prisma/migrations prisma/migrations-archive-postgresql

# Restore SQLite migrations (if archived)
mv prisma/migrations-archive-sqlite prisma/migrations

# Or create fresh SQLite migrations
mkdir -p prisma/migrations
npx prisma migrate dev --name init_sqlite
```

### Step 6: Generate Prisma Client

```bash
npx prisma generate
```

### Step 7: Initialize SQLite Database

```bash
# Push schema to SQLite
npx prisma db push

# Or apply migrations
npx prisma migrate deploy
```

### Step 8: Restore Data (Optional)

If you have data to restore:

```bash
# Use Prisma Studio to manually import data
npx prisma studio

# Or create a seed script
npx prisma db seed
```

### Step 9: Verify Application

```bash
# Start development server
npm run dev

# Test application functionality
# - Visit http://localhost:3000
# - Verify database operations work
# - Check Prisma Studio shows SQLite data
```

### Step 10: Document Rollback

- Log the reason for rollback
- Document any issues encountered
- Update team on rollback completion
- Create ticket to investigate and resolve PostgreSQL issues

## Rollback Verification Checklist

After rollback, verify:

- [ ] Application starts without errors
- [ ] Database health check passes (if endpoint exists)
- [ ] CRUD operations work on all models
- [ ] No PostgreSQL-specific code remains
- [ ] Environment variables correctly point to SQLite
- [ ] Prisma Studio connects to SQLite database

## Recovery Time Objectives

| Scenario | Target RTO |
|----------|------------|
| Empty database (dev) | < 10 minutes |
| Small dataset (< 1000 records) | < 30 minutes |
| Production data | N/A (not recommended) |

## Rollback Risks

1. **Data Loss**: Any data in PostgreSQL not backed up will be lost
2. **Feature Regression**: SQLite lacks some PostgreSQL features (concurrent writes, advanced indexes)
3. **Schema Differences**: Some PostgreSQL-specific types may not map cleanly to SQLite
4. **Team Disruption**: All developers must update their local environments

## Emergency Contacts

- **Database Issues**: Check Neon status at https://status.neon.tech
- **Application Issues**: Review logs in terminal or Vercel dashboard
- **Prisma Issues**: Consult https://www.prisma.io/docs

## Post-Rollback Actions

1. Create incident report documenting:
   - Root cause of rollback
   - Duration of outage
   - Data impact assessment
   - Prevention measures

2. Schedule post-mortem meeting

3. Update runbooks with lessons learned

4. Plan re-migration to PostgreSQL once issues resolved

## References

- [Prisma Migration Guide](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate)
- [Prisma Provider Switching](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate/troubleshooting-development#provider-switch)
- [Neon Documentation](https://neon.tech/docs)
- [Story 1.1: PostgreSQL Setup](./stories/1-1-postgresql-setup-configuration.md)
- [Story 1.2: Schema Migration](./stories/1-2-database-schema-migration-to-postgresql.md)
