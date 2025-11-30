'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  ClipboardList,
  MessageSquare,
  FileText,
  Video,
  Link as LinkIcon,
  CheckCircle,
  Circle,
  Lock,
} from 'lucide-react'

interface ContentItem {
  id: string
  title: string
  type: 'TEXT' | 'VIDEO' | 'DOCUMENT' | 'LINK' | 'SCORM' | 'YOUTUBE'
  isViewed?: boolean
}

interface AssignmentItem {
  id: string
  title: string
  isSubmitted?: boolean
  isGraded?: boolean
}

interface DiscussionItem {
  id: string
  title: string
}

interface ModuleItem {
  id: string
  title: string
  orderIndex: number
  isLocked?: boolean
  progress?: number
  content?: ContentItem[]
  assignments?: AssignmentItem[]
  discussions?: DiscussionItem[]
}

interface ModuleSidebarProps {
  courseId: string
  modules: ModuleItem[]
  currentModuleId?: string
  currentItemId?: string
  currentItemType?: 'content' | 'assignment' | 'discussion'
  isInstructor?: boolean
  className?: string
}

const contentTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  TEXT: FileText,
  VIDEO: Video,
  DOCUMENT: FileText,
  LINK: LinkIcon,
  SCORM: BookOpen,
  YOUTUBE: Video,
}

export default function ModuleSidebar({
  courseId,
  modules,
  currentModuleId,
  currentItemId,
  currentItemType,
  isInstructor = false,
  className = '',
}: ModuleSidebarProps) {
  // Track expanded modules - auto-expand current module (AC-4: auto-expand current section)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    if (currentModuleId) {
      initial.add(currentModuleId)
    }
    return initial
  })

  const pathname = usePathname()
  const basePath = isInstructor ? `/instructor/courses/${courseId}` : `/courses/${courseId}`

  // Auto-expand current module when it changes
  useEffect(() => {
    if (currentModuleId) {
      setExpandedModules(prev => new Set(prev).add(currentModuleId))
    }
  }, [currentModuleId])

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }

  const isCurrentItem = (type: string, id: string) => {
    return currentItemType === type && currentItemId === id
  }

  return (
    <nav
      className={`bg-white rounded-lg shadow overflow-hidden ${className}`}
      aria-label="Module navigation"
    >
      {/* Header - responsive padding */}
      <div className="p-3 md:p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900 text-sm md:text-base">Modules</h2>
      </div>

      {/* Scrollable content area for mobile */}
      <div className="divide-y divide-gray-200 max-h-[calc(100vh-200px)] md:max-h-none overflow-y-auto">
        {modules.map((module) => {
          const isExpanded = expandedModules.has(module.id)
          const isCurrentModule = module.id === currentModuleId
          const hasContent = (module.content?.length || 0) > 0
          const hasAssignments = (module.assignments?.length || 0) > 0
          const hasDiscussions = (module.discussions?.length || 0) > 0
          // Check if we have real data (not placeholder with empty IDs)
          const hasRealContentData = hasContent && module.content?.[0]?.id !== ''
          const hasRealAssignmentData = hasAssignments && module.assignments?.[0]?.id !== ''
          const hasRealDiscussionData = hasDiscussions && module.discussions?.[0]?.id !== ''

          return (
            <div key={module.id}>
              {/* Module Header (AC-3: expandable sections, AC-4: highlight current) */}
              {/* Minimum 44px height for touch targets, increased padding for mobile */}
              <button
                onClick={() => !module.isLocked && toggleModule(module.id)}
                disabled={module.isLocked}
                className={`w-full flex items-center justify-between p-3 md:p-4 min-h-[44px] text-left transition-colors
                  ${isCurrentModule ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50'}
                  ${module.isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                `}
                aria-expanded={isExpanded}
                aria-controls={`module-${module.id}-content`}
              >
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  {module.isLocked ? (
                    <Lock className="h-4 w-4 md:h-5 md:w-5 text-gray-400 flex-shrink-0" />
                  ) : isExpanded ? (
                    <ChevronDown className="h-4 w-4 md:h-5 md:w-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-gray-500 flex-shrink-0" />
                  )}
                  <span className={`font-medium truncate text-sm md:text-base ${isCurrentModule ? 'text-blue-700' : 'text-gray-900'}`}>
                    {module.title}
                  </span>
                </div>
              </button>

              {/* Module Content (AC-3: show content/assignments/discussions under each module) */}
              {isExpanded && !module.isLocked && (
                <div
                  id={`module-${module.id}-content`}
                  className="bg-gray-50 py-2"
                >
                  {/* Content Section - only show if we have real data with IDs */}
                  {hasRealContentData && (
                    <div className="px-3 md:px-4 py-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase mb-2">
                        <BookOpen className="h-3 w-3 md:h-4 md:w-4" />
                        Content
                      </div>
                      <ul className="space-y-1">
                        {module.content?.map((item) => {
                          const Icon = contentTypeIcons[item.type] || FileText
                          const isActive = isCurrentItem('content', item.id)

                          return (
                            <li key={item.id}>
                              <Link
                                href={`${basePath}/modules/${module.id}/content/${item.id}`}
                                className={`flex items-center gap-2 px-3 py-2.5 md:py-2 min-h-[44px] md:min-h-0 rounded text-sm transition-colors
                                  ${isActive
                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-100'
                                  }
                                `}
                                aria-current={isActive ? 'page' : undefined}
                              >
                                <Icon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                                <span className="truncate flex-1">{item.title}</span>
                                {item.isViewed !== undefined && (
                                  item.isViewed ? (
                                    <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 flex-shrink-0" />
                                  ) : (
                                    <Circle className="h-4 w-4 md:h-5 md:w-5 text-gray-300 flex-shrink-0" />
                                  )
                                )}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Assignments Section - only show if we have real data with IDs */}
                  {hasRealAssignmentData && (
                    <div className="px-3 md:px-4 py-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase mb-2">
                        <ClipboardList className="h-3 w-3 md:h-4 md:w-4" />
                        Assignments
                      </div>
                      <ul className="space-y-1">
                        {module.assignments?.map((assignment) => {
                          const isActive = isCurrentItem('assignment', assignment.id)

                          return (
                            <li key={assignment.id}>
                              <Link
                                href={`${basePath.replace('/instructor', '')}/assignments/${assignment.id}`}
                                className={`flex items-center gap-2 px-3 py-2.5 md:py-2 min-h-[44px] md:min-h-0 rounded text-sm transition-colors
                                  ${isActive
                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-100'
                                  }
                                `}
                                aria-current={isActive ? 'page' : undefined}
                              >
                                <ClipboardList className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                                <span className="truncate flex-1">{assignment.title}</span>
                                {assignment.isGraded ? (
                                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 flex-shrink-0" />
                                ) : assignment.isSubmitted ? (
                                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-blue-500 flex-shrink-0" />
                                ) : null}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Discussions Section - only show if we have real data with IDs */}
                  {hasRealDiscussionData && (
                    <div className="px-3 md:px-4 py-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase mb-2">
                        <MessageSquare className="h-3 w-3 md:h-4 md:w-4" />
                        Discussions
                      </div>
                      <ul className="space-y-1">
                        {module.discussions?.map((discussion) => {
                          const isActive = isCurrentItem('discussion', discussion.id)

                          return (
                            <li key={discussion.id}>
                              <Link
                                href={`${basePath.replace('/instructor', '')}/discussions/${discussion.id}`}
                                className={`flex items-center gap-2 px-3 py-2.5 md:py-2 min-h-[44px] md:min-h-0 rounded text-sm transition-colors
                                  ${isActive
                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-100'
                                  }
                                `}
                                aria-current={isActive ? 'page' : undefined}
                              >
                                <MessageSquare className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                                <span className="truncate">{discussion.title}</span>
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}

                  {/* Empty state - only show if truly no content */}
                  {!hasContent && !hasAssignments && !hasDiscussions && (
                    <div className="px-3 md:px-4 py-2 text-sm text-gray-500 italic">
                      No content in this module
                    </div>
                  )}

                  {/* Show summary counts when content exists but we only have counts (placeholder data) */}
                  {(hasContent || hasAssignments || hasDiscussions) &&
                   !hasRealContentData && !hasRealAssignmentData && !hasRealDiscussionData && (
                    <div className="px-3 md:px-4 py-2 text-sm text-gray-600">
                      <div className="flex items-center gap-4">
                        {hasContent && (
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {module.content?.length} items
                          </span>
                        )}
                        {hasAssignments && (
                          <span className="flex items-center gap-1">
                            <ClipboardList className="h-4 w-4" />
                            {module.assignments?.length}
                          </span>
                        )}
                        {hasDiscussions && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {module.discussions?.length}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
