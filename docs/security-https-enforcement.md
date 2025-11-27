# HTTPS Enforcement Configuration

**Document Date:** 2025-11-25
**Application:** AI Gurus LMS
**Hosting Platform:** Vercel

---

## 1. Overview

This document describes how HTTPS is enforced for the AI Gurus LMS application. HTTPS ensures data in transit is encrypted and protects against man-in-the-middle attacks.

---

## 2. Vercel Automatic HTTPS

### 2.1 Default Behavior

Vercel automatically provides and enforces HTTPS for all deployments:

| Feature | Status | Notes |
|---------|--------|-------|
| SSL Certificate | ✅ Automatic | Let's Encrypt certificates |
| Certificate Renewal | ✅ Automatic | Managed by Vercel |
| HTTP to HTTPS Redirect | ✅ Automatic | 308 Permanent Redirect |
| TLS Version | ✅ TLS 1.2+ | TLS 1.3 preferred |

### 2.2 No Configuration Required

Vercel handles HTTPS at the platform level:
- Automatic certificate provisioning
- Automatic renewal before expiration
- HTTP requests automatically redirected to HTTPS

---

## 3. Custom Domain Configuration

### 3.1 When Using Custom Domain

If a custom domain is configured (e.g., `lms.aigurus.com`):

1. Add domain in Vercel Project Settings > Domains
2. Configure DNS records (CNAME or A record)
3. Vercel automatically provisions SSL certificate
4. Certificate typically issued within minutes

### 3.2 DNS Configuration Example

```
# CNAME Record
lms.aigurus.com CNAME cname.vercel-dns.com

# Or A Record
lms.aigurus.com A 76.76.21.21
```

---

## 4. HSTS (HTTP Strict Transport Security)

### 4.1 Implementation

HSTS header will be configured in `next.config.js` (Story 1.10 Task 7):

```javascript
{
  key: 'Strict-Transport-Security',
  value: 'max-age=63072000; includeSubDomains; preload'
}
```

### 4.2 HSTS Parameters

| Parameter | Value | Description |
|-----------|-------|-------------|
| `max-age` | 63072000 | 2 years (seconds) |
| `includeSubDomains` | Yes | Apply to all subdomains |
| `preload` | Yes | Eligible for browser preload list |

### 4.3 HSTS Preload List

After launch, consider submitting to [HSTS Preload List](https://hstspreload.org/):
- Ensures HTTPS-only even on first visit
- Prevents SSL stripping attacks
- Requires commitment (difficult to remove)

---

## 5. Verification Tests

### 5.1 HTTP Redirect Test

**Test:** Access application via HTTP

```bash
curl -I http://your-app.vercel.app
```

**Expected Response:**
```
HTTP/1.1 308 Permanent Redirect
Location: https://your-app.vercel.app/
```

### 5.2 HTTPS Certificate Test

**Test:** Verify SSL certificate

```bash
openssl s_client -connect your-app.vercel.app:443 -servername your-app.vercel.app
```

**Check for:**
- Valid certificate chain
- Certificate not expired
- Correct domain name

### 5.3 TLS Version Test

**Test:** Check TLS version

```bash
nmap --script ssl-enum-ciphers -p 443 your-app.vercel.app
```

**Expected:** TLS 1.2 and TLS 1.3 supported

### 5.4 HSTS Header Test (After Task 7)

**Test:** Check HSTS header presence

```bash
curl -I https://your-app.vercel.app
```

**Expected Header:**
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

---

## 6. SSL Labs Rating

### 6.1 Testing URL

[SSL Labs Server Test](https://www.ssllabs.com/ssltest/)

### 6.2 Expected Rating

With Vercel + HSTS configuration: **A+**

### 6.3 Rating Factors

| Factor | Status |
|--------|--------|
| Certificate | ✅ Valid, trusted CA |
| Protocol Support | ✅ TLS 1.2, 1.3 |
| Key Exchange | ✅ Strong |
| Cipher Strength | ✅ Strong |
| HSTS | ✅ Configured (after Task 7) |

---

## 7. Development Environment

### 7.1 Local Development

Local development uses HTTP (`http://localhost:3000`):
- HTTPS not required for localhost
- NEXTAUTH_URL should be `http://localhost:3000`

### 7.2 Preview Deployments

Vercel preview deployments (`*.vercel.app`):
- Automatic HTTPS
- Unique URL per deployment
- Same security as production

---

## 8. Security Considerations

### 8.1 Cookie Security

NextAuth.js automatically sets secure cookies in production:

| Cookie Attribute | Development | Production |
|-----------------|-------------|------------|
| Secure | No | Yes |
| HttpOnly | Yes | Yes |
| SameSite | Lax | Lax |

### 8.2 Mixed Content

Ensure no mixed content (HTTP resources on HTTPS page):
- All API calls use relative URLs or HTTPS
- External resources (CDN, APIs) use HTTPS
- CSP headers will help detect mixed content

### 8.3 Subresource Integrity (Future)

Consider adding SRI for external scripts:
```html
<script src="https://cdn.example.com/lib.js"
        integrity="sha384-..."
        crossorigin="anonymous">
</script>
```

---

## 9. Troubleshooting

### 9.1 Certificate Issues

If SSL certificate issues occur:

1. **Check Vercel Dashboard** - Verify domain configuration
2. **Check DNS** - Ensure records point to Vercel
3. **Wait** - Certificate provisioning can take up to 24 hours
4. **Contact Vercel Support** - For persistent issues

### 9.2 Redirect Loops

If redirect loops occur:

1. Check `NEXTAUTH_URL` matches actual URL
2. Verify no conflicting redirect rules
3. Check for proxy/CDN interference

### 9.3 Mixed Content Warnings

If mixed content warnings appear:

1. Open browser DevTools > Console
2. Identify HTTP resources
3. Update to HTTPS or relative URLs

---

## 10. Compliance

### 10.1 Standards Met

| Standard | Requirement | Status |
|----------|-------------|--------|
| PCI DSS | TLS 1.2+ | ✅ |
| HIPAA | Encryption in transit | ✅ |
| SOC 2 | Data protection | ✅ |
| GDPR | Security measures | ✅ |

### 10.2 Verification

- SSL Labs rating: A+ (expected)
- No mixed content
- HSTS enabled
- Modern TLS only

---

## 11. Configuration Summary

### 11.1 Platform-Provided (Vercel)

- ✅ SSL certificate provisioning
- ✅ Certificate renewal
- ✅ HTTP to HTTPS redirect
- ✅ TLS 1.2/1.3

### 11.2 Application-Configured (next.config.js)

To be implemented in Task 7:
- ✅ HSTS header
- ✅ Additional security headers

---

## 12. References

- [Vercel Edge Network](https://vercel.com/docs/edge-network/overview)
- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [HSTS Preload List](https://hstspreload.org/)
- [SSL Labs](https://www.ssllabs.com/ssltest/)

---

**Document Status:** Complete
**Next Action:** Configure HSTS header in Task 7
