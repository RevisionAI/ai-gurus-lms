# Cloudflare R2 Storage Setup

## Overview

AI Gurus LMS uses Cloudflare R2 for file storage. R2 is an S3-compatible object storage service with zero egress fees.

## Configuration

### Environment Variables

Required variables in `.env.local`:

```bash
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=lmsystem
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

### Bucket Details

- **Bucket Name**: `lmsystem`
- **Region**: Auto (Cloudflare manages distribution)
- **Public Access**: Enabled via r2.dev subdomain

## API Token Requirements

The R2 API token must have:
- **Object Read** - Download files, check existence, get metadata
- **Object Write** - Upload files, delete files

## Storage Client Usage

### Import

```typescript
import {
  uploadFile,
  deleteFile,
  fileExists,
  getFileMetadata,
  listFiles,
  generateSignedUploadUrl,
  generateSignedDownloadUrl,
  getPublicUrl,
  generateFileKey,
  validateFile,
} from '@/lib/r2'
```

### Upload a File

```typescript
const result = await uploadFile(
  'courses/123/materials/document.pdf',
  fileBuffer,
  'application/pdf',
  { 'uploaded-by': 'user-456' }
)
console.log(result.key) // The stored file key
```

### Generate Pre-signed Upload URL (Client-side uploads)

```typescript
const uploadUrl = await generateSignedUploadUrl(
  'submissions/user-123/assignment.pdf',
  'application/pdf',
  300 // expires in 5 minutes
)
// Client can PUT directly to this URL
```

### Generate Pre-signed Download URL (Private files)

```typescript
const downloadUrl = await generateSignedDownloadUrl(
  'submissions/user-123/assignment.pdf',
  3600 // expires in 1 hour
)
```

### Get Public URL (Public files)

```typescript
const publicUrl = getPublicUrl('courses/123/thumbnail.jpg')
// https://pub-xxx.r2.dev/courses/123/thumbnail.jpg
```

### Check File Exists

```typescript
const exists = await fileExists('courses/123/materials/document.pdf')
```

### Get File Metadata

```typescript
const metadata = await getFileMetadata('courses/123/materials/document.pdf')
// { size: 1024000, contentType: 'application/pdf', lastModified: Date, etag: '...' }
```

### List Files

```typescript
const files = await listFiles('courses/123/materials/')
// [{ key: '...', size: 1024, lastModified: Date }, ...]
```

### Delete a File

```typescript
await deleteFile('courses/123/materials/old-document.pdf')
```

### Generate Unique File Key

```typescript
const key = generateFileKey('submissions', 'homework.pdf', 'user-123')
// submissions/user-123/1732540800000-homework.pdf
```

### Validate File Type and Size

```typescript
const validation = validateFile('application/pdf', 5 * 1024 * 1024)
if (!validation.valid) {
  throw new Error(validation.error)
}
```

## Allowed File Types

| Category | Types | Max Size |
|----------|-------|----------|
| Documents | PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX | 50 MB |
| Images | JPEG, PNG, GIF, WebP | 10 MB |
| Video | MP4, WebM, MOV | 500 MB |
| Archives | ZIP | 100 MB |
| Text | TXT, CSV | 10 MB |

## Directory Structure

```
lmsystem/
├── courses/
│   └── {courseId}/
│       ├── thumbnail.{ext}
│       └── materials/
│           └── {filename}
├── submissions/
│   └── {userId}/
│       └── {timestamp}-{filename}
├── profiles/
│   └── {userId}/
│       └── avatar.{ext}
└── test/
    └── (test files, cleaned up automatically)
```

## Testing

Run the R2 integration test:

```bash
npm run r2:test
```

This tests:
1. Client initialization
2. File upload
3. File existence check
4. Metadata retrieval
5. Signed URL generation (upload and download)
6. File download with checksum verification
7. File listing
8. Public URL generation
9. File deletion

## Cost Monitoring

Set up billing alerts in Cloudflare Dashboard:
1. Go to **Cloudflare Dashboard > R2**
2. Click **Settings** or **Manage R2 API Tokens**
3. Review usage metrics and set up alerts

R2 Pricing (as of 2024):
- Storage: $0.015/GB/month
- Class A operations (write): $4.50/million
- Class B operations (read): $0.36/million
- Egress: **Free** (no egress fees)

## Troubleshooting

### Access Denied

Ensure your R2 API token has both **Object Read** and **Object Write** permissions.

### Missing Environment Variables

The client validates these variables at initialization:
- R2_ACCOUNT_ID
- R2_ACCESS_KEY_ID
- R2_SECRET_ACCESS_KEY
- R2_BUCKET_NAME

### Public URL Not Working

1. Ensure `R2_PUBLIC_URL` is set in `.env.local`
2. Verify the bucket has public access enabled (r2.dev subdomain)
3. Check the file was uploaded successfully

### Signed URL Expired

- Upload URLs expire in 5 minutes by default
- Download URLs expire in 1 hour by default
- Adjust `expiresIn` parameter if needed
