'use client'

/**
 * Feedback Templates Management Page
 *
 * Instructor page for managing feedback templates.
 * Provides CRUD operations for creating, editing, and deleting templates.
 *
 * Story: 2.7 - Feedback Templates for Instructors
 * AC: 2.7.1
 */

import Navbar from '@/components/Navbar'
import ProtectedRoute from '@/components/ProtectedRoute'
import { FeedbackTemplateManager } from '@/components/instructor/FeedbackTemplateManager'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

export default function TemplatesPage() {
  return (
    <ProtectedRoute allowedRoles={['INSTRUCTOR', 'ADMIN']}>
      <div className="min-h-screen bg-bg-primary">
        <Navbar />
        <main className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          </div>

          {/* Page Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-pink-100 rounded-lg">
              <FileText className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">
                Feedback Templates
              </h1>
              <p className="text-sm text-text-secondary">
                Create and manage reusable feedback templates for grading
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Using Placeholders
                </h3>
                <div className="mt-1 text-sm text-blue-700">
                  <p>
                    Templates support placeholders that are automatically replaced when applied:
                  </p>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>
                      <code className="bg-blue-100 px-1 rounded">{'{student_name}'}</code> - Student&apos;s full name
                    </li>
                    <li>
                      <code className="bg-blue-100 px-1 rounded">{'{assignment_title}'}</code> - Assignment title
                    </li>
                    <li>
                      <code className="bg-blue-100 px-1 rounded">{'{score}'}</code> - Numeric score
                    </li>
                    <li>
                      <code className="bg-blue-100 px-1 rounded">{'{custom_note}'}</code> - Your custom note
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Template Manager Component */}
          <FeedbackTemplateManager />
        </main>
      </div>
    </ProtectedRoute>
  )
}
