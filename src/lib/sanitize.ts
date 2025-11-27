/**
 * XSS Sanitization Utilities
 *
 * Provides HTML sanitization for rich text content using DOMPurify.
 * Prevents XSS attacks while preserving safe HTML formatting.
 */

import DOMPurify from 'isomorphic-dompurify'

// ============================================
// Configuration
// ============================================

/**
 * Allowed HTML tags for rich text content
 * These tags are safe and commonly used in course descriptions,
 * assignment instructions, and discussion posts.
 */
const ALLOWED_TAGS = [
  // Block elements
  'p',
  'div',
  'br',
  'hr',
  // Headings
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  // Lists
  'ul',
  'ol',
  'li',
  // Text formatting
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'sub',
  'sup',
  // Links
  'a',
  // Tables
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  // Quotes
  'blockquote',
  'pre',
  'code',
  // Images (for embedded content)
  'img',
]

/**
 * Allowed HTML attributes
 */
const ALLOWED_ATTR = [
  // Links
  'href',
  'target',
  'rel',
  // Images
  'src',
  'alt',
  'width',
  'height',
  // Tables
  'colspan',
  'rowspan',
  // Styling (limited)
  'class',
]

/**
 * DOMPurify configuration for rich text content
 */
const SANITIZE_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS,
  ALLOWED_ATTR,
  ALLOW_DATA_ATTR: false, // Disable data-* attributes
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'style'],
  ADD_ATTR: ['target'], // Allow target attribute for links
  ADD_TAGS: [], // No additional tags
}

/**
 * Strict configuration that only allows basic text formatting
 */
const STRICT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u'],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
}

/**
 * Configuration for plain text (strips all HTML)
 */
const PLAIN_TEXT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
}

// ============================================
// Sanitization Functions
// ============================================

/**
 * Sanitize HTML content for rich text fields
 *
 * Use this for course descriptions, assignment instructions,
 * and discussion posts that support HTML formatting.
 *
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML with dangerous content removed
 *
 * @example
 * ```typescript
 * const safe = sanitizeHtml('<p>Hello <script>alert("xss")</script></p>')
 * // Result: '<p>Hello </p>'
 * ```
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  // Sanitize and return
  return DOMPurify.sanitize(html, SANITIZE_CONFIG)
}

/**
 * Sanitize with strict rules (basic formatting only)
 *
 * Use this for user names, titles, and short text fields
 * that should only have minimal formatting.
 *
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML with only basic formatting
 */
export function sanitizeStrict(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  return DOMPurify.sanitize(html, STRICT_CONFIG)
}

/**
 * Strip all HTML and return plain text
 *
 * Use this for search indexing, notifications, and
 * contexts where HTML is not needed.
 *
 * @param html - HTML content to strip
 * @returns Plain text with all HTML removed
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  return DOMPurify.sanitize(html, PLAIN_TEXT_CONFIG)
}

/**
 * Sanitize HTML and ensure links open in new tab
 *
 * Adds target="_blank" and rel="noopener noreferrer" to all links
 * for security.
 *
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML with safe link attributes
 */
export function sanitizeHtmlWithSafeLinks(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  // First sanitize the HTML
  let sanitized = DOMPurify.sanitize(html, SANITIZE_CONFIG)

  // Add safe attributes to all links
  sanitized = sanitized.replace(
    /<a([^>]*)href=/gi,
    '<a$1target="_blank" rel="noopener noreferrer" href='
  )

  return sanitized
}

// ============================================
// Zod Transform Helpers
// ============================================

/**
 * Create a Zod transform that sanitizes HTML content
 *
 * @example
 * ```typescript
 * const descriptionSchema = z
 *   .string()
 *   .min(10)
 *   .max(5000)
 *   .transform(createSanitizeTransform())
 * ```
 */
export function createSanitizeTransform(): (value: string) => string {
  return sanitizeHtml
}

/**
 * Create a Zod transform that strips all HTML
 */
export function createStripHtmlTransform(): (value: string) => string {
  return stripHtml
}

// ============================================
// Validation Helpers
// ============================================

/**
 * Check if HTML content contains any potentially dangerous elements
 * (for logging/monitoring purposes)
 *
 * @param html - HTML content to check
 * @returns true if content contains dangerous elements
 */
export function containsDangerousContent(html: string): boolean {
  if (!html || typeof html !== 'string') {
    return false
  }

  // Check for common XSS patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /onclick=/i,
    /onmouseover=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /data:/i,
    /vbscript:/i,
  ]

  return dangerousPatterns.some((pattern) => pattern.test(html))
}

/**
 * Log potentially malicious content for security monitoring
 */
export function logSuspiciousContent(
  content: string,
  context: { field: string; userId?: string; endpoint?: string }
): void {
  if (containsDangerousContent(content)) {
    console.warn(
      JSON.stringify({
        level: 'warn',
        message: 'Suspicious content detected',
        timestamp: new Date().toISOString(),
        context: {
          ...context,
          contentPreview: content.substring(0, 100),
          hasDangerousPatterns: true,
        },
      })
    )
  }
}
