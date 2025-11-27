/**
 * StatsOverview Component
 *
 * Displays system-wide statistics in a card grid layout including:
 * - User counts by role (students, instructors, admins)
 * - Course counts (active, inactive)
 * - Enrollment, assignment, and discussion totals
 *
 * Features drill-down navigation links to detailed management views.
 *
 * @component
 */

'use client'

import Link from 'next/link'
import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  MessageSquare,
  UserCog,
} from 'lucide-react'

// ============================================
// Types
// ============================================

interface UserStats {
  total: number
  students: number
  instructors: number
  admins: number
}

interface CourseStats {
  total: number
  active: number
  inactive: number
}

interface AssignmentStats {
  total: number
  submissions: number
}

interface DiscussionStats {
  total: number
  posts: number
}

interface StatsOverviewProps {
  users: UserStats
  courses: CourseStats
  enrollments: number
  assignments: AssignmentStats
  discussions: DiscussionStats
}

// ============================================
// Stat Card Component
// ============================================

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: React.ReactNode
  gradient: string
  href?: string
  ariaLabel?: string
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
  href,
  ariaLabel,
}: StatCardProps) {
  const content = (
    <div className={`${gradient} text-white overflow-hidden shadow rounded-lg transition-transform hover:scale-[1.02]`}>
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0" aria-hidden="true">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-white/80 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <span className="text-2xl font-semibold text-white">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
                {subtitle && (
                  <span className="ml-2 text-sm text-white/70">{subtitle}</span>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 rounded-lg"
        aria-label={ariaLabel || `View ${title} details`}
      >
        {content}
      </Link>
    )
  }

  return content
}

// ============================================
// Main Component
// ============================================

export function StatsOverview({
  users,
  courses,
  enrollments,
  assignments,
  discussions,
}: StatsOverviewProps) {
  return (
    <section aria-labelledby="stats-overview-heading">
      <h2 id="stats-overview-heading" className="sr-only">
        System Statistics Overview
      </h2>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Total Users */}
        <StatCard
          title="Total Users"
          value={users.total}
          icon={<Users className="h-6 w-6" />}
          gradient="bg-gradient-to-r from-pink-500 to-rose-500"
          href="/admin/users"
          ariaLabel={`View all ${users.total} users`}
        />

        {/* Students */}
        <StatCard
          title="Students"
          value={users.students}
          icon={<GraduationCap className="h-6 w-6" />}
          gradient="bg-gradient-to-r from-blue-500 to-purple-500"
          href="/admin/users?role=STUDENT"
          ariaLabel={`View ${users.students} students`}
        />

        {/* Instructors */}
        <StatCard
          title="Instructors"
          value={users.instructors}
          icon={<UserCog className="h-6 w-6" />}
          gradient="bg-gradient-to-r from-orange-500 to-yellow-500"
          href="/admin/users?role=INSTRUCTOR"
          ariaLabel={`View ${users.instructors} instructors`}
        />

        {/* Admins */}
        <StatCard
          title="Admins"
          value={users.admins}
          icon={<Users className="h-6 w-6" />}
          gradient="bg-gradient-to-r from-purple-500 to-indigo-500"
          href="/admin/users?role=ADMIN"
          ariaLabel={`View ${users.admins} administrators`}
        />

        {/* Active Courses */}
        <StatCard
          title="Active Courses"
          value={courses.active}
          subtitle={`${courses.inactive} inactive`}
          icon={<BookOpen className="h-6 w-6" />}
          gradient="bg-gradient-to-r from-emerald-500 to-teal-500"
          href="/instructor/courses"
          ariaLabel={`View ${courses.active} active courses and ${courses.inactive} inactive courses`}
        />

        {/* Total Enrollments */}
        <StatCard
          title="Enrollments"
          value={enrollments}
          icon={<ClipboardList className="h-6 w-6" />}
          gradient="bg-gradient-to-r from-pink-500 to-rose-500"
        />

        {/* Assignments */}
        <StatCard
          title="Assignments"
          value={assignments.total}
          subtitle={`${assignments.submissions} submitted`}
          icon={<ClipboardList className="h-6 w-6" />}
          gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
        />

        {/* Discussions */}
        <StatCard
          title="Discussions"
          value={discussions.total}
          subtitle={`${discussions.posts} posts`}
          icon={<MessageSquare className="h-6 w-6" />}
          gradient="bg-gradient-to-r from-violet-500 to-purple-500"
        />
      </div>
    </section>
  )
}

export default StatsOverview
