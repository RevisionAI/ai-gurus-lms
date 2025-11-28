import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure webpack to handle CSS files from node_modules
  webpack: (config) => {
    return config
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
              // Scripts - allow self, TinyMCE CDN, Sentry, and inline (required for Next.js)
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.tiny.cloud https://*.sentry.io https://*.sentry-cdn.com",
              // Styles - allow self, inline (required for styled-jsx and Tailwind), and TinyMCE CDN
              "style-src 'self' 'unsafe-inline' https://cdn.tiny.cloud",
              // Images - allow self, data URIs, HTTPS, and blob URLs
              "img-src 'self' data: https: blob:",
              // Fonts - allow self, data URIs, and TinyMCE CDN
              "font-src 'self' data: https://cdn.tiny.cloud",
              // Connections - allow self, database, storage, rate limiting services, Sentry, and TinyMCE
              "connect-src 'self' https://*.neon.tech https://*.r2.cloudflarestorage.com https://*.upstash.io wss://*.neon.tech https://*.sentry.io https://*.ingest.sentry.io https://cdn.tiny.cloud",
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
              // Workers - allow self and blob for Sentry
              "worker-src 'self' blob:",
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
    ]
  },
}

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
}

// Make sure adding Sentry options is the last code to run before exporting
export default withSentryConfig(nextConfig, sentryWebpackPluginOptions)
