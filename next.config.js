/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure webpack to handle CSS files from node_modules
  webpack: (config) => {
    return config;
  },

  // Security Headers Configuration
  // Story 1.10: Security Audit Preparation
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          // Content Security Policy
          // Protects against XSS, clickjacking, and other code injection attacks
          {
            key: 'Content-Security-Policy',
            value: [
              // Default fallback - restrict to same origin
              "default-src 'self'",
              // Scripts - allow self, TinyMCE CDN, and inline (required for Next.js)
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.tiny.cloud",
              // Styles - allow self and inline (required for styled-jsx and Tailwind)
              "style-src 'self' 'unsafe-inline'",
              // Images - allow self, data URIs, HTTPS, and blob URLs
              "img-src 'self' data: https: blob:",
              // Fonts - allow self and data URIs
              "font-src 'self' data:",
              // Connections - allow self, database, storage, rate limiting services
              "connect-src 'self' https://*.neon.tech https://*.r2.cloudflarestorage.com https://*.upstash.io wss://*.neon.tech",
              // Frames - allow self and YouTube for video embeds
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
              // Media - allow self and R2 CDN for video/audio content
              "media-src 'self' https://*.r2.dev https://*.r2.cloudflarestorage.com blob:",
              // Object/embed - disable plugins
              "object-src 'none'",
              // Base URI - restrict to self
              "base-uri 'self'",
              // Form actions - restrict to self
              "form-action 'self'",
              // Frame ancestors - prevent clickjacking
              "frame-ancestors 'self'",
              // Upgrade HTTP requests to HTTPS
              "upgrade-insecure-requests",
            ].join('; '),
          },
          // Prevent clickjacking by restricting framing
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Legacy XSS protection (for older browsers)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Control referrer information sent with requests
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // HTTP Strict Transport Security
          // Forces HTTPS for 2 years, includes subdomains, allows preload
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Permissions Policy (formerly Feature Policy)
          // Restrict access to browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
