/**
 * FeedbackTemplateManager Component
 *
 * Main interface for managing instructor feedback templates:
 * - List all templates with search/filter by category
 * - Create, edit, delete templates
 * - View usage statistics
 *
 * Story: 2.7 - Feedback Templates for Instructors
 * AC: 2.7.1, 2.7.2, 2.7.7
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Plus, Pencil, Trash2, Search, Loader2, FileText, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  TEMPLATE_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type TemplateCategory,
} from '@/validators/feedbackTemplate'
import { generatePreview, SUPPORTED_PLACEHOLDERS } from '@/lib/feedbackTemplate'

/**
 * FeedbackTemplate type matching Prisma model
 */
interface FeedbackTemplate {
  id: string
  name: string
  category: string
  template: string
  isShared: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

/**
 * Form data for create/edit template
 */
interface TemplateFormData {
  name: string
  category: TemplateCategory
  template: string
  isShared: boolean
}

const initialFormData: TemplateFormData = {
  name: '',
  category: 'excellent',
  template: '',
  isShared: false,
}

/**
 * FeedbackTemplateManager component
 */
export function FeedbackTemplateManager() {
  const [templates, setTemplates] = useState<FeedbackTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'usageCount' | 'createdAt'>('createdAt')

  // Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<FeedbackTemplate | null>(null)
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState<FeedbackTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<FeedbackTemplate | null>(null)

  // Form state
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  /**
   * Fetch templates from API
   */
  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory)
      }
      params.set('sortBy', sortBy)
      params.set('order', 'desc')

      const response = await fetch(`/api/instructor/templates?${params}`)
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
  }, [selectedCategory, sortBy])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  /**
   * Filter templates by search query
   */
  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.template.toLowerCase().includes(searchQuery.toLowerCase())
  )

  /**
   * Handle form input change
   */
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value

    setFormData((prev) => ({ ...prev, [name]: newValue }))

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    } else if (formData.name.length > 100) {
      errors.name = 'Name must be 100 characters or less'
    }

    if (!formData.template.trim()) {
      errors.template = 'Template text is required'
    } else if (formData.template.length < 10) {
      errors.template = 'Template must be at least 10 characters'
    } else if (formData.template.length > 2000) {
      errors.template = 'Template must be 2000 characters or less'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  /**
   * Handle create template
   */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/instructor/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create template')
      }

      toast.success('Template created successfully')
      setIsCreateOpen(false)
      setFormData(initialFormData)
      fetchTemplates()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create template')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle update template
   */
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTemplate || !validateForm()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/instructor/templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update template')
      }

      toast.success('Template updated successfully')
      setEditingTemplate(null)
      setFormData(initialFormData)
      fetchTemplates()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update template')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle delete template
   */
  const handleDelete = async () => {
    if (!deleteConfirmTemplate) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/instructor/templates/${deleteConfirmTemplate.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to delete template')
      }

      toast.success('Template deleted successfully')
      setDeleteConfirmTemplate(null)
      fetchTemplates()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete template')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Open edit modal
   */
  const openEditModal = (template: FeedbackTemplate) => {
    setFormData({
      name: template.name,
      category: template.category as TemplateCategory,
      template: template.template,
      isShared: template.isShared,
    })
    setFormErrors({})
    setEditingTemplate(template)
  }

  /**
   * Open create modal
   */
  const openCreateModal = () => {
    setFormData(initialFormData)
    setFormErrors({})
    setIsCreateOpen(true)
  }

  /**
   * Template form component (reused for create/edit)
   */
  const TemplateForm = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Template Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleFormChange}
          placeholder="e.g., Great Work Standard"
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
            formErrors.name ? 'border-red-300' : 'border-gray-300'
          }`}
          disabled={isSubmitting}
        />
        {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleFormChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
          disabled={isSubmitting}
        >
          {TEMPLATE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* Template Text */}
      <div>
        <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">
          Template Text <span className="text-red-500">*</span>
        </label>
        <textarea
          id="template"
          name="template"
          value={formData.template}
          onChange={handleFormChange}
          rows={6}
          placeholder={`Hi {student_name},\n\nExcellent work on {assignment_title}! You scored {score}/100.\n\n{custom_note}`}
          className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
            formErrors.template ? 'border-red-300' : 'border-gray-300'
          }`}
          disabled={isSubmitting}
        />
        {formErrors.template && <p className="mt-1 text-sm text-red-600">{formErrors.template}</p>}
        <p className="mt-1 text-xs text-gray-500">
          {formData.template.length}/2000 characters
        </p>
      </div>

      {/* Placeholder Help */}
      <div className="p-3 bg-gray-50 rounded-md">
        <p className="text-sm font-medium text-gray-700 mb-2">Available Placeholders:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(SUPPORTED_PLACEHOLDERS).map(([placeholder, desc]) => (
            <div key={placeholder} className="flex items-center gap-2">
              <code className="bg-gray-200 px-1 py-0.5 rounded">{placeholder}</code>
              <span className="text-gray-600">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <button
          type="button"
          onClick={() => {
            setIsCreateOpen(false)
            setEditingTemplate(null)
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700 disabled:opacity-50 flex items-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  )

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Feedback Templates</h2>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-md hover:bg-pink-700"
          >
            <Plus className="h-4 w-4" />
            Create Template
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
          >
            <option value="all">All Categories</option>
            {TEMPLATE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'usageCount' | 'createdAt')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
          >
            <option value="createdAt">Newest First</option>
            <option value="name">Name</option>
            <option value="usageCount">Most Used</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchTemplates}
              className="mt-4 text-pink-600 hover:text-pink-700"
            >
              Try again
            </button>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery || selectedCategory !== 'all'
                ? 'No templates match your filters'
                : 'No templates yet. Create your first template!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="border rounded-lg p-4 hover:border-pink-200 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          CATEGORY_COLORS[template.category as TemplateCategory] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {CATEGORY_LABELS[template.category as TemplateCategory] || template.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{template.template}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Used {template.usageCount} times
                      </span>
                      <span>Created {new Date(template.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setPreviewTemplate(template)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                      title="Preview"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(template)}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmTemplate(template)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Dialog.Root open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] bg-white p-6 shadow-lg rounded-lg max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Create Feedback Template
            </Dialog.Title>
            <TemplateForm onSubmit={handleCreate} submitLabel="Create Template" />
            <Dialog.Close asChild>
              <button className="absolute right-4 top-4 text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Modal */}
      <Dialog.Root open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] bg-white p-6 shadow-lg rounded-lg max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Edit Feedback Template
            </Dialog.Title>
            <TemplateForm onSubmit={handleUpdate} submitLabel="Save Changes" />
            <Dialog.Close asChild>
              <button className="absolute right-4 top-4 text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation */}
      <Dialog.Root open={!!deleteConfirmTemplate} onOpenChange={(open) => !open && setDeleteConfirmTemplate(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%] bg-white p-6 shadow-lg rounded-lg">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-2">
              Delete Template
            </Dialog.Title>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete &quot;{deleteConfirmTemplate?.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmTemplate(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Preview Modal */}
      <Dialog.Root open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] bg-white p-6 shadow-lg rounded-lg">
            <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
              Template Preview
            </Dialog.Title>
            {previewTemplate && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      CATEGORY_COLORS[previewTemplate.category as TemplateCategory] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {CATEGORY_LABELS[previewTemplate.category as TemplateCategory] || previewTemplate.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    Used {previewTemplate.usageCount} times
                  </span>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {generatePreview(previewTemplate.template)}
                  </p>
                </div>
                <p className="mt-4 text-xs text-gray-500">
                  * Sample data shown for preview purposes
                </p>
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
            <Dialog.Close asChild>
              <button className="absolute right-4 top-4 text-gray-400 hover:text-gray-600" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

export default FeedbackTemplateManager
