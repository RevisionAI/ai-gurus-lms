// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment identification
  environment: process.env.NODE_ENV,

  // Performance Monitoring
  // Capture 10% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

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

    // Redact database connection strings from errors
    if (event.exception?.values) {
      event.exception.values.forEach((exception) => {
        if (exception.value) {
          // Redact PostgreSQL connection strings
          exception.value = exception.value.replace(
            /postgresql:\/\/[^@]+@[^/]+\/[^\s]+/gi,
            'postgresql://[REDACTED]'
          )
          // Redact generic connection strings
          exception.value = exception.value.replace(
            /(?:password|secret|token|key)[:=]\s*["']?[^\s"',]+["']?/gi,
            '$1=[REDACTED]'
          )
        }
      })
    }

    return event
  },

  // Ignore common non-actionable errors
  ignoreErrors: [
    // Network issues
    'Network request failed',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    // AbortController
    'AbortError',
    'The operation was aborted',
  ],

  // Debug mode in development
  debug: process.env.NODE_ENV === 'development',
})
