import pino from 'pino'

const logger = pino({
  // Log level: debug in development, info in production
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

  // Format log level as uppercase string
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() }
    },
  },

  // ISO 8601 timestamps
  timestamp: pino.stdTimeFunctions.isoTime,

  // Base context included in all logs
  base: {
    env: process.env.NODE_ENV,
    service: 'ai-gurus-lms',
  },

  // Redact sensitive fields (never log passwords, tokens, PII)
  redact: {
    paths: [
      'password',
      'token',
      'apiKey',
      'authorization',
      'cookie',
      'session',
      'req.headers.authorization',
      'req.headers.cookie',
      'secret',
      'creditCard',
      'ssn',
    ],
    censor: '[REDACTED]',
  },

  // Pretty-print in development (human-readable), JSON in production (machine-parseable)
  ...(process.env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  }),
})

export default logger

// Helper for creating child loggers with request context
export function createRequestLogger(requestId: string, userId?: string) {
  return logger.child({
    requestId,
    ...(userId && { userId }),
  })
}

// Severity level helpers for consistent error classification
export const ErrorSeverity = {
  P0_CRITICAL: 'P0',  // Site down, auth failures, data loss risk
  P1_HIGH: 'P1',      // Major feature broken (enrollment, grading, submissions)
  P2_MEDIUM: 'P2',    // Minor feature broken (search, notifications)
  P3_LOW: 'P3',       // Cosmetic issues, non-critical warnings
} as const

export type ErrorSeverityLevel = typeof ErrorSeverity[keyof typeof ErrorSeverity]
