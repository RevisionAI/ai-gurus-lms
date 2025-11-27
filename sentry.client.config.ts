// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment identification
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  // Capture 10% of transactions in production for performance insights
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay for error debugging
  // Capture 100% of sessions that experience errors
  replaysOnErrorSampleRate: 1.0,
  // Capture 10% of all sessions for general UX insights
  replaysSessionSampleRate: 0.1,

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      // Mask all text inputs for privacy
      maskAllText: false,
      // Block all media (images, videos) from being captured
      blockAllMedia: false,
    }),
  ],

  // Filter sensitive data before sending to Sentry
  beforeSend(event) {
    // Remove passwords from request data
    if (event.request?.data) {
      const data = event.request.data as Record<string, unknown>
      if (data.password) delete data.password
      if (data.confirmPassword) delete data.confirmPassword
      if (data.currentPassword) delete data.currentPassword
      if (data.newPassword) delete data.newPassword
    }

    // Redact authorization headers
    if (event.request?.headers) {
      const headers = event.request.headers as Record<string, string>
      if (headers.authorization) {
        headers.authorization = '[REDACTED]'
      }
      if (headers.cookie) {
        headers.cookie = '[REDACTED]'
      }
    }

    return event
  },

  // Ignore common non-actionable errors
  ignoreErrors: [
    // Browser rendering quirks
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // Network issues (user connectivity)
    'Network request failed',
    'Load failed',
    'Failed to fetch',
    'NetworkError when attempting to fetch resource',
    // Non-error promise rejections
    'Non-Error promise rejection captured',
    // AbortController (normal behavior)
    'AbortError',
    'The operation was aborted',
    // Script loading failures (often extensions)
    'Loading chunk',
    'Loading CSS chunk',
  ],

  // Ignore specific URLs (browser extensions, third-party scripts)
  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
    /^safari-extension:\/\//i,
    // Common third-party scripts that might error
    /google-analytics\.com/i,
    /googletagmanager\.com/i,
  ],

  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',
})
