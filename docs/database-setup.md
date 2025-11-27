# Database Setup Guide

## Overview

The AI Gurus LMS uses **Neon PostgreSQL** as its production database. Neon provides a serverless PostgreSQL solution with:

- Auto-scaling compute
- Connection pooling
- Database branching for development
- Free tier: 3GB storage, 10 concurrent connections

## Prerequisites

- Node.js 18+ installed
- Neon account (free tier available)
- Project cloned locally

## Setup Instructions

### 1. Create Neon Account and Database

1. Go to [https://neon.tech](https://neon.tech) and create a free account
2. Create a new project (suggested name: `ai-gurus-lms`)
3. Neon will automatically create a default database called `neondb`
4. Copy the connection string from the Neon dashboard

### 2. Configure Environment Variables

Create or update `.env.local` in the project root:

```bash
# PostgreSQL Database (Neon)
DATABASE_URL="postgresql://user:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require"
DB_CONNECTION_LIMIT=10
```

Also update `.env` for Prisma CLI access:

```bash
# PostgreSQL Database (Neon) - loaded by Prisma CLI
DATABASE_URL="postgresql://user:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxxxx.region.aws.neon.tech/neondb?sslmode=require"
```

> **Security Note:** Both `.env` and `.env.local` are gitignored. Never commit database credentials to version control.

### 3. Environment Variable Descriptions

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Connection string for Prisma client (uses connection pooler) |
| `DIRECT_URL` | Direct connection for Prisma migrations (bypasses pooler) |
| `DB_CONNECTION_LIMIT` | Maximum concurrent connections (default: 10, matches Neon free tier) |

### 4. Initialize Database Schema

Generate the Prisma client and push schema to the database:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push
```

### 5. Verify Connection

Test the database connection:

```bash
# Open Prisma Studio to browse data
npx prisma studio

# Or run the dev server and check health endpoint
npm run dev
# Then visit: http://localhost:3000/api/health/db
```

## Health Check Endpoint

The application includes a database health check endpoint:

**Endpoint:** `GET /api/health/db`

**Success Response (200):**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-25T08:30:00.000Z",
  "responseTime": "45ms"
}
```

**Failure Response (503):**
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "Database connection failed",
  "timestamp": "2025-11-25T08:30:00.000Z",
  "responseTime": "5000ms"
}
```

## Connection Pooling

### Why Connection Pooling?

Next.js API routes run as serverless functions. Without connection pooling, each function invocation would create a new database connection, quickly exhausting the connection limit.

### Implementation

The Prisma client uses a singleton pattern (`src/lib/prisma.ts`) to:

1. Reuse connections across API requests
2. Prevent connection exhaustion during Next.js hot reload
3. Respect the `DB_CONNECTION_LIMIT` configuration

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## Troubleshooting

### Connection Refused

**Symptom:** `Connection refused` or `ECONNREFUSED`

**Solutions:**
1. Verify the connection string is correct
2. Check Neon dashboard for database status
3. Ensure SSL is enabled (`sslmode=require` in connection string)

### Too Many Connections

**Symptom:** `too many connections for role`

**Solutions:**
1. Ensure `DB_CONNECTION_LIMIT=10` is set (matches Neon free tier)
2. Check for connection leaks (always use singleton Prisma client)
3. Consider upgrading to Neon paid tier for more connections

### Migration Errors

**Symptom:** `P1012: Environment variable not found: DIRECT_URL`

**Solutions:**
1. Ensure `DIRECT_URL` is set in both `.env` and `.env.local`
2. Run `source .env` before Prisma commands if needed

### SSL Certificate Errors

**Symptom:** `SSL SYSCALL error` or certificate validation failures

**Solutions:**
1. Ensure `sslmode=require` is in the connection string
2. If using `channel_binding=require`, ensure your Prisma version supports it

## Neon Free Tier Limits

| Resource | Limit |
|----------|-------|
| Storage | 3 GB |
| Concurrent Connections | 10 |
| Projects | 1 |
| Compute | 0.25 vCPU |

When exceeding these limits, consider upgrading to Neon Launch plan ($19/month).

## References

- [Neon Documentation](https://neon.tech/docs)
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
