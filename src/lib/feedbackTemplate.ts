/**
 * Feedback Template Utility Functions
 *
 * Functions for handling feedback template placeholders and transformations.
 */

// ============================================
// Types
// ============================================

export interface PlaceholderData {
  studentName: string
  assignmentTitle: string
  score?: number
  customNote?: string
}

/**
 * Supported placeholders and their descriptions
 */
export const SUPPORTED_PLACEHOLDERS = {
  '{student_name}': 'Student full name',
  '{assignment_title}': 'Assignment title',
  '{score}': 'Numeric score',
  '{custom_note}': 'Instructor custom note',
} as const

export type SupportedPlaceholder = keyof typeof SUPPORTED_PLACEHOLDERS

// ============================================
// Placeholder Functions
// ============================================

/**
 * Replace placeholders in a template with actual values
 *
 * @param template - Template string with placeholders
 * @param data - Data to replace placeholders with
 * @returns Template with placeholders replaced
 *
 * @example
 * ```typescript
 * const result = replacePlaceholders(
 *   "Hi {student_name}, your score on {assignment_title} is {score}/100.",
 *   { studentName: "John Doe", assignmentTitle: "Assignment 1", score: 95 }
 * )
 * // Result: "Hi John Doe, your score on Assignment 1 is 95/100."
 * ```
 */
export function replacePlaceholders(template: string, data: PlaceholderData): string {
  if (!template) {
    return ''
  }

  return template
    .replace(/{student_name}/g, data.studentName || '')
    .replace(/{assignment_title}/g, data.assignmentTitle || '')
    .replace(/{score}/g, data.score !== undefined ? data.score.toString() : '')
    .replace(/{custom_note}/g, data.customNote || '')
}

/**
 * Extract all placeholders from a template string
 *
 * @param template - Template string to extract placeholders from
 * @returns Array of unique placeholder names (without curly braces)
 *
 * @example
 * ```typescript
 * const placeholders = extractPlaceholders("Hi {student_name}, your {score} on {assignment_title}")
 * // Result: ["student_name", "score", "assignment_title"]
 * ```
 */
export function extractPlaceholders(template: string): string[] {
  if (!template) {
    return []
  }

  const regex = /\{([^}]+)\}/g
  const matches: string[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(template)) !== null) {
    if (!matches.includes(match[1])) {
      matches.push(match[1])
    }
  }

  return matches
}

/**
 * Check if a placeholder is supported
 *
 * @param placeholder - Placeholder name to check (with or without curly braces)
 * @returns True if the placeholder is supported
 */
export function isSupportedPlaceholder(placeholder: string): boolean {
  const normalizedPlaceholder = placeholder.startsWith('{')
    ? placeholder
    : `{${placeholder}}`

  return normalizedPlaceholder in SUPPORTED_PLACEHOLDERS
}

/**
 * Get list of unsupported placeholders in a template
 *
 * @param template - Template string to check
 * @returns Array of unsupported placeholder names
 */
export function getUnsupportedPlaceholders(template: string): string[] {
  const placeholders = extractPlaceholders(template)
  return placeholders.filter((p) => !isSupportedPlaceholder(p))
}

/**
 * Validate that all placeholders in a template are supported
 *
 * @param template - Template string to validate
 * @returns Object with isValid flag and any unsupported placeholders
 */
export function validatePlaceholders(template: string): {
  isValid: boolean
  unsupported: string[]
} {
  const unsupported = getUnsupportedPlaceholders(template)
  return {
    isValid: unsupported.length === 0,
    unsupported,
  }
}

/**
 * Generate a preview of a template with sample data
 *
 * @param template - Template string to preview
 * @returns Template with sample data inserted
 */
export function generatePreview(template: string): string {
  return replacePlaceholders(template, {
    studentName: 'Jane Smith',
    assignmentTitle: 'Sample Assignment',
    score: 85,
    customNote: '[Your note here]',
  })
}

/**
 * Count placeholder occurrences in a template
 *
 * @param template - Template string to analyze
 * @returns Object mapping placeholder names to their occurrence count
 */
export function countPlaceholders(template: string): Record<string, number> {
  if (!template) {
    return {}
  }

  const counts: Record<string, number> = {}
  const regex = /\{([^}]+)\}/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(template)) !== null) {
    const placeholder = match[1]
    counts[placeholder] = (counts[placeholder] || 0) + 1
  }

  return counts
}

/**
 * Check if a template contains any placeholders
 *
 * @param template - Template string to check
 * @returns True if template contains at least one placeholder
 */
export function hasPlaceholders(template: string): boolean {
  if (!template) {
    return false
  }
  return /\{[^}]+\}/.test(template)
}

/**
 * Escape special regex characters in replacement string
 * This prevents issues if the replacement data contains special characters
 *
 * @param str - String to escape
 * @returns Escaped string safe for regex replacement
 */
export function escapeReplacementString(str: string): string {
  return str.replace(/\$/g, '$$$$')
}
