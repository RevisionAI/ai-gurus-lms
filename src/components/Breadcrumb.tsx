'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  href?: string
  isLoading?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  if (!items || items.length === 0) {
    return null
  }

  return (
    <nav className={`flex items-center space-x-2 text-sm text-gray-500 mb-6 ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={index} className="flex items-center space-x-2">
            {item.isLoading ? (
              <span className="animate-pulse bg-gray-200 h-4 w-16 rounded"></span>
            ) : isLast || !item.href ? (
              <span className="text-gray-900">{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-gray-700 transition-colors">
                {item.label}
              </Link>
            )}
            
            {!isLast && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
          </div>
        )
      })}
    </nav>
  )
}

// Utility function to generate common breadcrumb patterns
export const generateBreadcrumbs = {
  // Student course breadcrumbs
  studentCourse: (courseId: string, courseTitle?: string | null): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard' },
    { 
      label: courseTitle || 'Course', 
      href: `/courses/${courseId}`,
      isLoading: !courseTitle 
    }
  ],

  studentCourseSection: (
    courseId: string, 
    courseTitle: string | null | undefined, 
    sectionName: string,
    sectionHref?: string
  ): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard' },
    { 
      label: courseTitle || 'Course', 
      href: `/courses/${courseId}`,
      isLoading: !courseTitle 
    },
    { label: sectionName, href: sectionHref }
  ],

  // Instructor course breadcrumbs
  instructorCourse: (courseId: string, courseTitle?: string | null): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard' },
    { 
      label: courseTitle || 'Course', 
      href: `/instructor/courses/${courseId}`,
      isLoading: !courseTitle 
    }
  ],

  instructorCourseSection: (
    courseId: string, 
    courseTitle: string | null | undefined, 
    sectionName: string,
    sectionHref?: string
  ): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard' },
    { 
      label: courseTitle || 'Course', 
      href: `/instructor/courses/${courseId}`,
      isLoading: !courseTitle 
    },
    { label: sectionName, href: sectionHref }
  ],

  // Assignment breadcrumbs
  studentAssignment: (
    courseId: string, 
    courseTitle: string | null | undefined,
    assignmentId: string,
    assignmentTitle?: string | null
  ): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard' },
    { 
      label: courseTitle || 'Course', 
      href: `/courses/${courseId}`,
      isLoading: !courseTitle 
    },
    { label: 'Assignments', href: `/courses/${courseId}` },
    { 
      label: assignmentTitle || 'Assignment',
      isLoading: !assignmentTitle
    }
  ],

  instructorAssignment: (
    courseId: string, 
    courseTitle: string | null | undefined,
    assignmentId: string,
    assignmentTitle?: string | null
  ): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard' },
    { 
      label: courseTitle || 'Course', 
      href: `/instructor/courses/${courseId}`,
      isLoading: !courseTitle 
    },
    { label: 'Assignments', href: `/instructor/courses/${courseId}/assignments` },
    { 
      label: assignmentTitle || 'Assignment',
      href: `/instructor/assignments/${assignmentId}`,
      isLoading: !assignmentTitle
    }
  ],

  instructorAssignmentEdit: (
    courseId: string, 
    courseTitle: string | null | undefined,
    assignmentId: string,
    assignmentTitle?: string | null
  ): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/dashboard' },
    { 
      label: courseTitle || 'Course', 
      href: `/instructor/courses/${courseId}`,
      isLoading: !courseTitle 
    },
    { label: 'Assignments', href: `/instructor/courses/${courseId}/assignments` },
    { 
      label: assignmentTitle || 'Assignment',
      href: `/instructor/assignments/${assignmentId}`,
      isLoading: !assignmentTitle
    },
    { label: 'Edit' }
  ],

  // Discussion breadcrumbs
  studentDiscussion: (
    courseId: string, 
    courseTitle: string | null | undefined,
    discussionId?: string,
    discussionTitle?: string | null
  ): BreadcrumbItem[] => {
    const base = [
      { label: 'Dashboard', href: '/dashboard' },
      { 
        label: courseTitle || 'Course', 
        href: `/courses/${courseId}`,
        isLoading: !courseTitle 
      },
      { label: 'Discussions', href: discussionId ? `/courses/${courseId}/discussions` : undefined }
    ]

    if (discussionId) {
      base.push({ 
        label: discussionTitle || 'Discussion',
        href: '#',
        isLoading: !discussionTitle
      })
    }

    return base
  },

  instructorDiscussion: (
    courseId: string, 
    courseTitle: string | null | undefined,
    discussionId?: string,
    discussionTitle?: string | null
  ): BreadcrumbItem[] => {
    const base = [
      { label: 'Dashboard', href: '/dashboard' },
      { 
        label: courseTitle || 'Course', 
        href: `/instructor/courses/${courseId}`,
        isLoading: !courseTitle 
      },
      { label: 'Discussions', href: discussionId ? `/instructor/courses/${courseId}/discussions` : undefined }
    ]

    if (discussionId) {
      base.push({ 
        label: discussionTitle || 'Discussion',
        href: '#',
        isLoading: !discussionTitle
      })
    }

    return base
  },

  // General purpose breadcrumb builder
  custom: (items: BreadcrumbItem[]): BreadcrumbItem[] => items
}