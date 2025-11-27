# File Migration Guide: Local to Cloudflare R2

This guide documents the migration of existing locally-stored files to Cloudflare R2 cloud storage.

## Overview

The migration script (`scripts/migrate-files-to-r2.ts`) transfers all files from `public/uploads/` to Cloudflare R2, updates database records with S3 keys, and archives the original files for rollback capability.

## Prerequisites

### 1. Environment Configuration

Ensure the following environment variables are set in `.env`:

```bash
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

### 2. Verify R2 Credentials

Test R2 connectivity before migration:

```bash
npx tsx scripts/test-r2-upload.ts
```

### 3. Database Backup

Create a database backup before migration:

```bash
# For PostgreSQL
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### 4. Check Upload Directory Size

Verify the uploads directory size fits within R2 free tier (10GB):

```bash
du -sh public/uploads/
```

## Migration Script Usage

### Basic Syntax

```bash
npx tsx scripts/migrate-files-to-r2.ts [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview migration without uploading files |
| `--batch-size N` | Number of files to process concurrently (default: 5) |
| `--skip-db` | Skip database updates (useful for testing) |
| `--skip-archive` | Skip archiving local files |
| `--verbose` | Show detailed progress |

### Examples

**Dry Run (Preview):**
```bash
npx tsx scripts/migrate-files-to-r2.ts --dry-run
```

**Full Migration:**
```bash
npx tsx scripts/migrate-files-to-r2.ts
```

**Migration with Verbose Output:**
```bash
npx tsx scripts/migrate-files-to-r2.ts --verbose
```

**Faster Migration (Higher Concurrency):**
```bash
npx tsx scripts/migrate-files-to-r2.ts --batch-size 10
```

## Migration Process

### Step 1: Dry Run

Always start with a dry run to preview the migration:

```bash
npx tsx scripts/migrate-files-to-r2.ts --dry-run
```

Review the output:
- Total files to be migrated
- Total size
- No errors reported

### Step 2: Execute Migration

Run the full migration:

```bash
npx tsx scripts/migrate-files-to-r2.ts
```

The script will:
1. Scan `public/uploads/` recursively
2. Upload each file to R2 with checksum validation
3. Update database records (`CourseContent`, `Submission`) with S3 keys
4. Move original files to `uploads_archive_{timestamp}/`
5. Generate a migration report

### Step 3: Verify Migration

Run the verification script:

```bash
npx tsx scripts/verify-r2-migration.ts
```

Or spot-check a sample:

```bash
npx tsx scripts/verify-r2-migration.ts --spot-check 10
```

### Step 4: Test Application

1. Load the application
2. Navigate to courses with content
3. Verify images and files load from CDN URLs
4. Test file downloads for submissions

## Post-Migration Validation

### Verification Checklist

- [ ] Migration report shows 100% success rate
- [ ] No checksum mismatches reported
- [ ] Verification script shows all files accessible
- [ ] Course content displays correctly in application
- [ ] Assignment submissions are downloadable
- [ ] Thumbnails display correctly

### Manual Spot Checks

1. Open browser developer tools (Network tab)
2. Load a course content page
3. Verify image/video requests go to `r2.dev` domain
4. Check response status is 200

## Archive Retention Policy

- **Location:** `uploads_archive_{timestamp}/`
- **Retention Period:** 30 days
- **Purpose:** Rollback capability if migration issues detected
- **Manual Deletion:** After 30 days with no issues, manually delete archive

```bash
# After 30 days with confirmed successful migration
rm -rf uploads_archive_*
```

## Troubleshooting

### Common Errors

#### 1. Missing R2 Environment Variables

**Error:** `Missing R2 environment variables: R2_ACCOUNT_ID, ...`

**Solution:** Ensure all R2 variables are set in `.env`:
```bash
cat .env | grep R2_
```

#### 2. Network Timeout During Upload

**Error:** `Upload failed, retrying...`

**Solution:** The script automatically retries with exponential backoff. If persistent:
- Check network connectivity
- Reduce batch size: `--batch-size 2`
- Run during off-peak hours

#### 3. Checksum Mismatch

**Error:** `Checksum mismatch: local=xxx, remote=yyy`

**Solution:**
1. Check network stability
2. Re-run migration (script is idempotent)
3. If persistent, file may be corrupted - check original

#### 4. Permission Denied

**Error:** `Permission denied: /uploads/...`

**Solution:** Check file permissions:
```bash
ls -la public/uploads/
chmod -R 644 public/uploads/*
```

#### 5. Database Update Failed

**Error:** `Database update error for ...`

**Solution:**
1. Check database connectivity
2. Verify Prisma schema is up to date: `npx prisma generate`
3. Re-run migration with `--skip-db` first, then database updates separately

### Recovery Procedures

#### Partial Migration Recovery

If migration fails mid-way:

1. Note the last successful file in the report
2. Re-run migration - script is idempotent
3. Already uploaded files will be skipped (based on database records)

#### Full Rollback

If critical issues detected, use the rollback script:

```bash
npx tsx scripts/rollback-r2-migration.ts
```

See [File Migration Rollback Guide](./file-migration-rollback.md) for details.

## File Storage Architecture

### S3 Key Structure

```
course-content/{courseId}/{timestamp}-{filename}
submissions/{assignmentId}/{timestamp}-{filename}
thumbnails/{timestamp}-{filename}
uploads/{timestamp}-{filename}
```

### Database Fields

**CourseContent:**
- `fileUrl` - Public CDN URL
- `s3Key` - S3 object key
- `thumbnailUrl` - Thumbnail CDN URL
- `thumbnailS3Key` - Thumbnail S3 key

**Submission:**
- `fileUrl` - Signed URL (private)
- `s3Key` - S3 object key

### URL Resolution Logic

The application uses fallback logic for backward compatibility:

1. If `s3Key` exists → Use CDN URL
2. If only `fileUrl` with local path → Use local path (legacy)
3. If `fileUrl` is external URL → Use as-is

## Performance Considerations

### Upload Speed

- **Batch Size:** Increase for faster migration, decrease for stability
- **Recommended:** Start with default (5), increase to 10 for stable networks
- **Large Files:** Automatically uses multipart upload for files >5MB

### Resource Usage

- **Memory:** ~50MB base + file buffer during upload
- **CPU:** Minimal (mostly I/O bound)
- **Network:** Proportional to total upload size

### Timing Recommendations

- Run during low-traffic periods
- Estimate: ~1 minute per 100MB on standard connection
- For 70MB uploads: ~5-10 minutes total

## Related Documentation

- [File Migration Rollback Guide](./file-migration-rollback.md)
- [Architecture: File Storage](./architecture.md#file-storage-architecture)
- [Epic 1 Tech Spec: Stories 1.4-1.6](./tech-spec-epic-1.md)
