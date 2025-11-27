# Content Security Policy (CSP) Headers Configuration

**Configuration Date:** 2025-11-25
**Application:** AI Gurus LMS
**File Modified:** `next.config.js`

---

## 1. Overview

This document describes the Content Security Policy and security headers configured for AI Gurus LMS. CSP helps prevent XSS attacks, clickjacking, and other code injection vulnerabilities.

---

## 2. Security Headers Summary

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | See below | XSS protection |
| X-Frame-Options | SAMEORIGIN | Clickjacking protection |
| X-Content-Type-Options | nosniff | MIME sniffing protection |
| X-XSS-Protection | 1; mode=block | Legacy XSS filter |
| Referrer-Policy | strict-origin-when-cross-origin | Referrer control |
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload | HTTPS enforcement |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | Feature restrictions |

---

## 3. Content Security Policy Directives

### 3.1 Full CSP Value

```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.tiny.cloud;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https: blob:;
font-src 'self' data:;
connect-src 'self' https://*.neon.tech https://*.r2.cloudflarestorage.com https://*.upstash.io wss://*.neon.tech;
frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com;
media-src 'self' https://*.r2.dev https://*.r2.cloudflarestorage.com blob:;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'self';
upgrade-insecure-requests
```

### 3.2 Directive Breakdown

| Directive | Value | Rationale |
|-----------|-------|-----------|
| `default-src` | `'self'` | Fallback - only allow same-origin resources |
| `script-src` | `'self' 'unsafe-eval' 'unsafe-inline' https://cdn.tiny.cloud` | Next.js requires unsafe-eval/inline; TinyMCE from CDN |
| `style-src` | `'self' 'unsafe-inline'` | Tailwind and styled-jsx use inline styles |
| `img-src` | `'self' data: https: blob:` | Images from any HTTPS, data URIs, blob URLs |
| `font-src` | `'self' data:` | Self-hosted fonts and data URI embedded fonts |
| `connect-src` | `'self' https://*.neon.tech https://*.r2.cloudflarestorage.com https://*.upstash.io wss://*.neon.tech` | API calls to database, storage, rate limiting |
| `frame-src` | `'self' https://www.youtube.com https://www.youtube-nocookie.com` | YouTube video embeds |
| `media-src` | `'self' https://*.r2.dev https://*.r2.cloudflarestorage.com blob:` | Video/audio from R2 storage |
| `object-src` | `'none'` | Disable plugins (Flash, Java, etc.) |
| `base-uri` | `'self'` | Prevent base tag hijacking |
| `form-action` | `'self'` | Forms only submit to same origin |
| `frame-ancestors` | `'self'` | Prevent embedding in external iframes |
| `upgrade-insecure-requests` | (directive) | Auto-upgrade HTTP to HTTPS |

---

## 4. Third-Party Services

### 4.1 TinyMCE Rich Text Editor

**CDN:** `https://cdn.tiny.cloud`

Requires:
- `script-src https://cdn.tiny.cloud` - JavaScript loading
- `'unsafe-eval'` - Editor functionality
- `'unsafe-inline'` - Editor styling

### 4.2 YouTube Video Embeds

**Domains:**
- `https://www.youtube.com`
- `https://www.youtube-nocookie.com` (privacy-enhanced)

Requires:
- `frame-src https://www.youtube.com https://www.youtube-nocookie.com`

### 4.3 Cloudflare R2 Storage

**Patterns:**
- `https://*.r2.dev` - Public CDN URLs
- `https://*.r2.cloudflarestorage.com` - Direct S3-compatible URLs

Requires:
- `connect-src` - API calls for signed URLs
- `media-src` - Video/audio streaming
- `img-src` - Image loading

### 4.4 Neon PostgreSQL

**Patterns:**
- `https://*.neon.tech` - API connections
- `wss://*.neon.tech` - WebSocket connections (Prisma)

Requires:
- `connect-src` - Database queries

### 4.5 Upstash Redis

**Pattern:** `https://*.upstash.io`

Requires:
- `connect-src` - Rate limiting API calls

---

## 5. Known Limitations

### 5.1 unsafe-eval Requirement

Next.js requires `'unsafe-eval'` for:
- React development mode
- Dynamic code execution in production

**Mitigation:** This is a known Next.js requirement. The risk is acceptable because:
- User input is validated with Zod
- No direct eval() of user input

### 5.2 unsafe-inline Requirement

Required for:
- Next.js inline scripts
- Tailwind CSS inline styles
- TinyMCE editor styling

**Mitigation:** Consider implementing nonces in future for stricter CSP.

---

## 6. Testing

### 6.1 Browser Console Test

1. Open application in browser
2. Open DevTools > Console
3. Look for CSP violation errors

**Expected:** No CSP violations during normal use

### 6.2 Header Verification

```bash
curl -I https://your-app.vercel.app
```

**Expected Headers:**
```
Content-Security-Policy: default-src 'self'; ...
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### 6.3 Feature Testing Checklist

| Feature | Test | Expected |
|---------|------|----------|
| Rich Text Editor | Create/edit course content | TinyMCE loads and works |
| YouTube Embed | Add YouTube video to content | Video plays in iframe |
| File Upload | Upload image/video | Files upload to R2 |
| File Display | View uploaded content | Images/videos display |
| Database | Any authenticated action | Queries succeed |
| Rate Limiting | Trigger rate limit | 429 response |

---

## 7. CSP Reporting (Future Enhancement)

### 7.1 Report-Only Mode

For testing new CSP changes without breaking functionality:

```javascript
{
  key: 'Content-Security-Policy-Report-Only',
  value: '...; report-uri /api/csp-report'
}
```

### 7.2 Report Endpoint

Future implementation could include a CSP violation reporting endpoint:

```typescript
// /api/csp-report/route.ts
export async function POST(request: Request) {
  const report = await request.json()
  console.log('CSP Violation:', report)
  // Log to monitoring service
  return new Response(null, { status: 204 })
}
```

---

## 8. Security Scanner Results

### 8.1 Mozilla Observatory

Test URL: [observatory.mozilla.org](https://observatory.mozilla.org/)

**Expected Score:** B+ or higher

### 8.2 Security Headers

Test URL: [securityheaders.com](https://securityheaders.com/)

**Expected Score:** A or higher

---

## 9. Troubleshooting

### 9.1 TinyMCE Not Loading

**Symptom:** Rich text editor shows blank or error

**Check:**
- Console for CSP violations mentioning `cdn.tiny.cloud`
- Verify `script-src` includes `https://cdn.tiny.cloud`

### 9.2 YouTube Embeds Not Working

**Symptom:** YouTube iframe blocked or blank

**Check:**
- Console for CSP violations mentioning `youtube.com`
- Verify `frame-src` includes YouTube domains

### 9.3 Files Not Loading from R2

**Symptom:** Images/videos not displaying

**Check:**
- Console for CSP violations mentioning `r2.dev` or `r2.cloudflarestorage.com`
- Verify `img-src`, `media-src`, `connect-src` include R2 domains

### 9.4 Database Connection Errors

**Symptom:** API requests failing

**Check:**
- Console for CSP violations mentioning `neon.tech`
- Verify `connect-src` includes Neon domains

---

## 10. Implementation Details

### 10.1 File Location

`/next.config.js`

### 10.2 Configuration Structure

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: '...' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // ... other headers
        ],
      },
    ];
  },
}
```

### 10.3 Applies To

- All routes (`/:path*`)
- Both pages and API routes
- Static assets

---

## 11. References

- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

---

**Configuration Complete:** 2025-11-25
**Testing Required:** Before production deployment
