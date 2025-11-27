# File Migration Rollback Guide

This guide documents how to rollback the R2 migration and restore files to local filesystem storage.

## When to Rollback

Consider rollback if:
- Critical files are inaccessible via CDN
- Application functionality is broken due to file URLs
- Significant checksum mismatches detected
- R2 service disruption affecting file delivery

## Rollback Options

### Option 1: Restore from Archive (Fastest)

If local files were archived (not deleted), simply restore them:

```bash
# Find archive directory
ls -d uploads_archive_*

# Copy files back to uploads directory
cp -r uploads_archive_*/. public/uploads/
```

Then revert database records (see Database Rollback below).

### Option 2: Download from R2 (Full Rollback)

Use the rollback script to download all files from R2:

```bash
npx tsx scripts/rollback-r2-migration.ts [options]
```

#### Options

| Option | Description |
|--------|-------------|
| `--dry-run` | Preview rollback without downloading files |
| `--skip-db` | Skip database rollback |
| `--verbose` | Show detailed progress |

#### Examples

**Dry Run:**
```bash
npx tsx scripts/rollback-r2-migration.ts --dry-run
```

**Full Rollback:**
```bash
npx tsx scripts/rollback-r2-migration.ts
```

## Rollback Process

### Step 1: Assess the Situation

Before rolling back, determine:
1. **Scope:** All files or specific files?
2. **Urgency:** Critical (production down) or planned?
3. **Root Cause:** Why is rollback needed?

### Step 2: Dry Run

Preview the rollback:

```bash
npx tsx scripts/rollback-r2-migration.ts --dry-run
```

Verify:
- Total files to be downloaded
- Expected local paths

### Step 3: Execute Rollback

**Option A: Full Rollback (Archive Available)**

If archive exists:
```bash
# Restore from archive
cp -r uploads_archive_*/. public/uploads/

# Verify files restored
ls -la public/uploads/

# Revert database
npx tsx scripts/rollback-r2-migration.ts --skip-db=false
```

**Option B: Full Rollback (Download from R2)**

If archive was deleted:
```bash
npx tsx scripts/rollback-r2-migration.ts
```

### Step 4: Database Rollback

The rollback script automatically reverts database records:
- Clears `s3Key` and `thumbnailS3Key` fields
- Updates `fileUrl` and `thumbnailUrl` to local paths

To manually revert database:

```sql
-- Revert CourseContent records
UPDATE course_content
SET s3_key = NULL,
    thumbnail_s3_key = NULL,
    file_url = REPLACE(file_url, 'https://pub-xxx.r2.dev/', '/uploads/')
WHERE s3_key IS NOT NULL;

-- Revert Submission records
UPDATE submissions
SET s3_key = NULL,
    file_url = REPLACE(file_url, 'https://pub-xxx.r2.dev/', '/uploads/')
WHERE s3_key IS NOT NULL;
```

### Step 5: Verify Rollback

1. Check files restored:
```bash
find public/uploads -type f | wc -l
```

2. Check database reverted:
```sql
SELECT COUNT(*) FROM course_content WHERE s3_key IS NOT NULL;
-- Should be 0
```

3. Test application:
- Load course content pages
- Verify images display from local paths
- Test file downloads

## Partial Rollback

For specific files only:

### 1. Identify Files to Rollback

```sql
SELECT id, title, file_url, s3_key
FROM course_content
WHERE s3_key IS NOT NULL
AND id IN ('id1', 'id2', ...);
```

### 2. Download Specific Files

```bash
# Download from R2 using AWS CLI
aws s3 cp s3://your-bucket/path/to/file.pdf public/uploads/path/to/file.pdf \
    --endpoint-url https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
```

### 3. Update Specific Database Records

```sql
UPDATE course_content
SET s3_key = NULL,
    file_url = '/uploads/path/to/file.pdf'
WHERE id = 'specific_id';
```

## Post-Rollback Steps

### 1. Verify Application

- [ ] Course content displays correctly
- [ ] File downloads work
- [ ] Thumbnails display
- [ ] No 404 errors in browser console

### 2. Document the Rollback

Record:
- Date/time of rollback
- Reason for rollback
- Files affected
- Root cause analysis

### 3. Plan Re-Migration

If rollback was due to fixable issues:
1. Identify and fix root cause
2. Test fix in staging environment
3. Schedule re-migration during maintenance window

## Emergency Rollback (Production Down)

If production is down due to file access issues:

### Immediate Actions (< 5 minutes)

1. **Check if archive exists:**
   ```bash
   ls -d uploads_archive_*
   ```

2. **Quick restore:**
   ```bash
   # If archive exists
   rsync -av uploads_archive_*/. public/uploads/

   # Restart application
   pm2 restart all  # or your restart command
   ```

3. **Verify critical paths:**
   - Homepage loads
   - Course pages display content
   - Users can log in

### Follow-up Actions

1. Investigate root cause
2. Plan proper rollback or fix
3. Document incident

## Cleanup After Successful Re-Migration

After confirming migration is successful and stable:

1. Delete archive directory:
   ```bash
   rm -rf uploads_archive_*
   ```

2. Update documentation with lessons learned

3. Consider implementing automated backup verification

## Related Documentation

- [File Migration Guide](./file-migration-guide.md)
- [Architecture: File Storage](./architecture.md#file-storage-architecture)
