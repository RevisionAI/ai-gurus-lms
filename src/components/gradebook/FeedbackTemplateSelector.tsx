/**
 * FeedbackTemplateSelector Component
 *
 * Dropdown selector for applying feedback templates in grading workflow:
 * - Load instructor's templates grouped by category
 * - Preview template on hover/click
 * - Apply template with placeholder replacement
 *
 * Story: 2.7 - Feedback Templates for Instructors
 * AC: 2.7.5, 2.7.6
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Dialog from '@radix-ui/react-dialog'
import { FileText, ChevronDown, Loader2, X, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  TEMPLATE_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type TemplateCategory,
} from '@/validators/feedbackTemplate'

/**
 * FeedbackTemplate type matching Prisma model
 */
interface FeedbackTemplate {
  id: string
  name: string
  category: string
  template: string
  usageCount: number
}

/**
 * Props for FeedbackTemplateSelector component
 */
export interface FeedbackTemplateSelectorProps {
  /** Student's full name for placeholder replacement */
  studentName: string
  /** Assignment title for placeholder replacement */
  assignmentTitle: string
  /** Optional score for placeholder replacement */
  score?: number
  /** Callback when template is applied */
  onTemplateApplied: (feedbackText: string) => void
  /** Whether the selector is disabled */
  disabled?: boolean
}

/**
 * FeedbackTemplateSelector component
 */
export function FeedbackTemplateSelector({
  studentName,
  assignmentTitle,
  score,
  onTemplateApplied,
  disabled = false,
}: FeedbackTemplateSelectorProps) {
  const [templates, setTemplates] = useState<FeedbackTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isApplying, setIsApplying] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<FeedbackTemplate | null>(null)
  const [customNote, setCustomNote] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  /**
   * Fetch templates from API
   */
  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/instructor/templates?sortBy=usageCount&order=desc')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch templates')
      }

      setTemplates(data.templates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  /**
   * Group templates by category
   */
  const templatesByCategory = templates.reduce(
    (acc, template) => {
      const category = template.category as TemplateCategory
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(template)
      return acc
    },
    {} as Record<TemplateCategory, FeedbackTemplate[]>
  )

  /**
   * Apply template with placeholder replacement
   */
  const applyTemplate = async (template: FeedbackTemplate, note?: string) => {
    setIsApplying(true)
    try {
      const response = await fetch(`/api/instructor/templates/${template.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          assignmentTitle,
          score,
          customNote: note || '',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to apply template')
      }

      onTemplateApplied(data.feedbackText)
      toast.success(`Applied template: ${template.name}`)
      setPreviewTemplate(null)
      setCustomNote('')
      setIsDropdownOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to apply template')
    } finally {
      setIsApplying(false)
    }
  }

  /**
   * Generate preview text with sample custom note
   */
  const getPreviewText = (template: FeedbackTemplate) => {
    return template.template
      .replace(/{student_name}/g, studentName || 'Student Name')
      .replace(/{assignment_title}/g, assignmentTitle || 'Assignment')
      .replace(/{score}/g, score?.toString() || '0')
      .replace(/{custom_note}/g, customNote || '[Your note here]')
  }

  if (error) {
    return (
      <div className="text-sm text-gray-500">
        <button onClick={fetchTemplates} className="text-pink-600 hover:text-pink-700">
          Retry loading templates
        </button>
      </div>
    )
  }

  return (
    <>
      <DropdownMenu.Root open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            disabled={disabled || isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            <span>Use Template</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 min-w-[280px] max-h-[400px] overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200"
            sideOffset={5}
            align="start"
          >
            {templates.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p>No templates yet</p>
                <a
                  href="/instructor/templates"
                  className="text-pink-600 hover:text-pink-700"
                >
                  Create your first template
                </a>
              </div>
            ) : (
              TEMPLATE_CATEGORIES.map((category) => {
                const categoryTemplates = templatesByCategory[category]
                if (!categoryTemplates?.length) return null

                return (
                  <DropdownMenu.Group key={category}>
                    <DropdownMenu.Label className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b">
                      {CATEGORY_LABELS[category]}
                    </DropdownMenu.Label>
                    {categoryTemplates.map((template) => (
                      <DropdownMenu.Item
                        key={template.id}
                        className="relative flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-pink-50 focus:bg-pink-50 outline-none"
                        onSelect={(e) => {
                          e.preventDefault()
                          setPreviewTemplate(template)
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {template.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Used {template.usageCount} times
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewTemplate(template)
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.Group>
                )
              })
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Preview and Apply Dialog */}
      <Dialog.Root open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] bg-white p-6 shadow-lg rounded-lg max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
              {previewTemplate?.name}
            </Dialog.Title>

            {previewTemplate && (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      CATEGORY_COLORS[previewTemplate.category as TemplateCategory] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {CATEGORY_LABELS[previewTemplate.category as TemplateCategory]}
                  </span>
                  <span className="text-xs text-gray-500">
                    Used {previewTemplate.usageCount} times
                  </span>
                </div>

                {/* Custom Note Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Note (optional)
                  </label>
                  <textarea
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    rows={2}
                    placeholder="Add a personalized note..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm"
                  />
                </div>

                {/* Preview */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {getPreviewText(previewTemplate)}
                    </p>
                  </div>
                </div>

                {/* Placeholder Info */}
                <div className="p-3 bg-blue-50 rounded-md mb-4">
                  <p className="text-xs text-blue-700">
                    <strong>Replacing:</strong>{' '}
                    {'{student_name}'} → {studentName || 'N/A'},{' '}
                    {'{assignment_title}'} → {assignmentTitle || 'N/A'},{' '}
                    {'{score}'} → {score !== undefined ? score : 'N/A'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setPreviewTemplate(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={isApplying}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => applyTemplate(previewTemplate, customNote)}
                    className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 disabled:opacity-50 flex items-center gap-2"
                    disabled={isApplying}
                  >
                    {isApplying && <Loader2 className="h-4 w-4 animate-spin" />}
                    Apply Template
                  </button>
                </div>
              </>
            )}

            <Dialog.Close asChild>
              <button className="absolute right-4 top-4 text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}

export default FeedbackTemplateSelector
