# File Upload Migration to Cloudflare R2

This document describes the file upload system for AI Gurus LMS, which uses Cloudflare R2 (S3-compatible object storage) for reliable, globally-distributed file storage with zero egress fees.

## Overview

Files are uploaded using a three-step signed URL workflow:
1. **Client requests signed URL** - API validates request and generates pre-signed upload URL
2. **Client uploads directly to R2** - File bytes go directly to storage, bypassing the server
3. **Client notifies completion** - API stores file metadata in PostgreSQL

This approach reduces server load, improves upload performance, and provides progress tracking.

## Architecture

```
┌─────────┐     ┌─────────┐     ┌───────────────────┐
│ Browser │     │ Next.js │     │ Cloudflare R2     │
│         │     │   API   │     │                   │
└────┬────┘     └────┬────┘     └────────┬──────────┘
     │               │                   │
     │ 1. POST /api/upload/signed-url    │
     │──────────────>│                   │
     │               │ Generate signed URL
     │<──────────────│                   │
     │ { uploadUrl, key }                │
     │               │                   │
     │ 2. PUT uploadUrl (file bytes)     │
     │───────────────────────────────────>
     │               │                   │
     │<───────────────────────────────────
     │    200 OK                         │
     │               │                   │
     │ 3. POST /api/upload/complete      │
     │──────────────>│                   │
     │               │ Store metadata    │
     │<──────────────│                   │
     │ { cdnUrl, s3Key }                 │
     │               │                   │
```

## Environment Configuration

Add the following environment variables to your `.env.local` file:

```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="ai-gurus-lms-uploads"
R2_PUBLIC_CDN_URL="https://pub-xxxxx.r2.dev"

# File Upload Limits (optional - defaults shown)
MAX_FILE_SIZE="52428800"  # 50MB in bytes
MAX_VIDEO_SIZE="524288000"  # 500MB for videos
```

### R2 Bucket Setup

1. Log into Cloudflare Dashboard
2. Navigate to R2 Object Storage
3. Create a new bucket (e.g., `ai-gurus-lms-uploads`)
4. Enable public access for the bucket (for CDN delivery)
5. Create R2 API tokens with Object Read & Write permissions
6. Configure CORS for your domain

#### CORS Configuration

```json
[
  {
    "AllowedOrigins": ["https://your-domain.com", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

## Allowed File Types

The system validates MIME types to prevent malicious file uploads:

| Category | MIME Types | Max Size |
|----------|------------|----------|
| Images | `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/bmp` | 10MB |
| Videos | `video/mp4`, `video/quicktime`, `video/x-msvideo`, `video/x-ms-wmv`, `video/x-flv`, `video/webm` | 500MB |
| Audio | `audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/aac` | 50MB |
| Documents | `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | 50MB |
| Spreadsheets | `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | 50MB |
| Presentations | `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation` | 50MB |
| Text | `text/plain`, `text/rtf` | 10MB |
| Archives | `application/zip`, `application/x-rar-compressed`, `application/x-7z-compressed` | 100MB |

## API Endpoints

### POST /api/upload/signed-url

Request a pre-signed URL for direct upload to R2.

**Request:**
```typescript
POST /api/upload/signed-url
Content-Type: application/json

{
  "filename": "lecture-video.mp4",
  "mimeType": "video/mp4",
  "size": 52428800,
  "directory": "courses"  // "courses" | "submissions" | "profiles" | "thumbnails"
}
```

**Response (Success):**
```typescript
{
  "data": {
    "uploadUrl": "https://...",  // Pre-signed PUT URL (expires in 5 minutes)
    "key": "courses/abc123/1732537200000-lecture-video.mp4",
    "expiresIn": 300
  }
}
```

**Response (Error):**
```typescript
{
  "error": {
    "code": "FILE_TOO_LARGE",  // Error code
    "message": "File size exceeds maximum allowed (500MB)",
    "details": { "maxSize": 524288000 }
  }
}
```

### POST /api/upload/complete

Called after successful R2 upload to store file metadata.

**Request:**
```typescript
POST /api/upload/complete
Content-Type: application/json

{
  "key": "courses/abc123/1732537200000-lecture-video.mp4",
  "filename": "lecture-video.mp4",
  "size": 52428800,
  "mimeType": "video/mp4",
  "contentId": "content-id-123",  // Optional: for course content
  "assignmentId": "assign-id-456",  // Optional: for submissions
  "isPublic": true
}
```

**Response (Success):**
```typescript
{
  "data": {
    "id": "content-id-123",
    "s3Key": "courses/abc123/1732537200000-lecture-video.mp4",
    "cdnUrl": "https://pub-xxxxx.r2.dev/courses/abc123/1732537200000-lecture-video.mp4",
    "filename": "lecture-video.mp4",
    "size": 52428800,
    "mimeType": "video/mp4"
  }
}
```

## Client-Side Implementation

### Using the useS3Upload Hook

For components that need upload state management:

```typescript
import { useS3Upload } from '@/hooks/useS3Upload'

function FileUploader() {
  const {
    upload,
    retry,
    uploading,
    progress,
    error,
    canRetry,
    reset
  } = useS3Upload({
    directory: 'courses',
    contentId: 'content-123',  // Optional
    isPublic: true,
    onProgress: (p) => console.log(`${p.percentage}% uploaded`),
    onSuccess: (result) => console.log('Upload complete:', result.cdnUrl),
    onError: (err) => console.error('Upload failed:', err.message)
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const result = await upload(file)
    if (result) {
      console.log('File uploaded to:', result.cdnUrl)
    }
  }

  return (
    <div>
      <input type="file" onChange={handleFileChange} disabled={uploading} />

      {uploading && progress && (
        <div>Uploading... {progress.percentage}%</div>
      )}

      {error && (
        <div>
          <p>Error: {error.message}</p>
          {canRetry && <button onClick={retry}>Retry</button>}
        </div>
      )}
    </div>
  )
}
```

### Using the Simple Upload Function

For one-off uploads without state management:

```typescript
import { uploadToS3 } from '@/hooks/useS3Upload'

async function handleUpload(file: File) {
  try {
    const result = await uploadToS3(file, {
      directory: 'submissions',
      assignmentId: 'assign-123',
      isPublic: false
    })
    console.log('File uploaded:', result.cdnUrl)
  } catch (error) {
    console.error('Upload failed:', error.message)
  }
}
```

## Database Schema

File metadata is stored in the relevant database tables:

### CourseContent Model

```prisma
model CourseContent {
  id           String      @id @default(cuid())
  title        String
  type         ContentType
  content      String?
  fileUrl      String?     // CDN URL for file access
  s3Key        String?     // S3/R2 object key for file storage
  thumbnailUrl String?
  thumbnailS3Key String?   // S3/R2 object key for thumbnail
  orderIndex   Int
  isPublished  Boolean     @default(false)
  createdAt    DateTime    @default(now())
  courseId     String
  course       Course      @relation(fields: [courseId], references: [id])
}
```

### Submission Model

```prisma
model Submission {
  id          String   @id @default(cuid())
  content     String?
  fileUrl     String?     // CDN URL for submitted file
  s3Key       String?     // S3/R2 object key for file storage
  submittedAt DateTime @default(now())
  assignmentId String
  studentId    String
  assignment   Assignment @relation(fields: [assignmentId], references: [id])
  student      User       @relation(fields: [studentId], references: [id])
}
```

## Error Codes

| Code | Description | Retryable |
|------|-------------|-----------|
| `FILE_TOO_LARGE` | File exceeds size limit | No |
| `INVALID_FILE_TYPE` | MIME type not allowed | No |
| `UPLOAD_TIMEOUT` | Upload exceeded 5-minute timeout | Yes |
| `NETWORK_ERROR` | Network connectivity issue | Yes |
| `S3_ERROR` | R2 storage service error | Yes |
| `UNAUTHORIZED` | User not authenticated | No |
| `VALIDATION_ERROR` | Invalid request parameters | No |

## Troubleshooting

### "CORS error" during upload

**Symptoms:** Browser console shows CORS-related errors when uploading directly to R2.

**Solution:**
1. Verify CORS configuration in R2 bucket settings
2. Ensure your domain is in the `AllowedOrigins` list
3. Check that `Content-Type` header is in `AllowedHeaders`

### "Upload timed out" for large files

**Symptoms:** Large video uploads fail with timeout error.

**Solution:**
1. Check network connection stability
2. Consider breaking large files into smaller segments
3. Verify `MAX_VIDEO_SIZE` environment variable if videos are under 500MB

### "File type not allowed" for valid files

**Symptoms:** Upload rejected despite being a valid file type.

**Solution:**
1. Check that the file's MIME type matches the extension
2. Some files (especially from Mac) may have incorrect MIME types
3. Use a tool like `file --mime-type filename` to verify actual MIME type

### "Failed to complete upload" after successful R2 upload

**Symptoms:** File uploads to R2 successfully but metadata storage fails.

**Solution:**
1. Check database connectivity
2. Verify `contentId` or `assignmentId` exists in database
3. Check user has permission to modify the target resource
4. Retry the completion request - the file is already in R2

### Files not appearing in course content

**Symptoms:** Upload shows success but file doesn't appear.

**Solution:**
1. Verify the `contentId` was provided in the upload request
2. Check that `CourseContent.fileUrl` was updated in database
3. Ensure the CDN URL is accessible (check R2 bucket public access)

## Security Considerations

1. **Authentication Required** - All upload endpoints require an active NextAuth session
2. **File Size Limits** - Prevents DoS via large file uploads
3. **MIME Type Validation** - Blocks potentially dangerous file types (.exe, .sh, etc.)
4. **Filename Sanitization** - Removes path traversal attempts and special characters
5. **Signed URL Expiration** - Upload URLs expire in 5 minutes
6. **CORS Restrictions** - Uploads only allowed from configured domains

## Future Enhancements

- **Multipart Upload** - For files larger than 5GB (currently unsupported)
- **Malware Scanning** - ClamAV integration for uploaded files
- **Automatic Cleanup** - Background job to delete orphaned R2 files
- **Image Optimization** - Automatic resizing and WebP conversion for images
- **Video Transcoding** - HLS streaming support for videos
