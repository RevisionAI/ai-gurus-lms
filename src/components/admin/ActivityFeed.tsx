/**
 * ActivityFeed Component
 *
 * Displays 24-hour activity metrics in a timeline/list view including:
 * - Recent logins count
 * - Recent enrollments count
 * - Recent submissions count
 * - Last updated timestamp
 *
 * @component
 */

'use client'

import { LogIn, UserPlus, FileText, Clock } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

// ============================================
// Types
// ============================================

interface RecentActivity {
  logins: number
  enrollments: number
  submissions: number
  timestamp: string
}

interface ActivityFeedProps {
  activity: RecentActivity
}

// ============================================
// Activity Item Component
// ============================================

interface ActivityItemProps {
  icon: React.ReactNode
  label: string
  count: number
  color: string
}

function ActivityItem({ icon, label, count, color }: ActivityItemProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center space-x-3">
        <div
          className={`flex-shrink-0 h-8 w-8 rounded-full ${color} flex items-center justify-center`}
          aria-hidden="true"
        >
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <span className="text-lg font-semibold text-gray-900">
        {count.toLocaleString()}
      </span>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export function ActivityFeed({ activity }: ActivityFeedProps) {
  const timestamp = new Date(activity.timestamp)
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true })
  const formattedTime = format(timestamp, 'HH:mm:ss')

  return (
    <section
      className="bg-white rounded-lg shadow p-6"
      aria-labelledby="activity-feed-heading"
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          id="activity-feed-heading"
          className="text-lg font-semibold text-gray-900"
        >
          Activity (Last 24 Hours)
        </h3>
        <div
          className="flex items-center text-xs text-gray-500"
          title={`Last updated at ${formattedTime}`}
        >
          <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
          <span>Updated {timeAgo}</span>
        </div>
      </div>

      <div className="space-y-1" role="list" aria-label="Recent activity metrics">
        <ActivityItem
          icon={<LogIn className="h-4 w-4 text-white" />}
          label="Recent Logins"
          count={activity.logins}
          color="bg-blue-500"
        />
        <ActivityItem
          icon={<UserPlus className="h-4 w-4 text-white" />}
          label="New Enrollments"
          count={activity.enrollments}
          color="bg-green-500"
        />
        <ActivityItem
          icon={<FileText className="h-4 w-4 text-white" />}
          label="New Submissions"
          count={activity.submissions}
          color="bg-purple-500"
        />
      </div>

      <p className="mt-4 text-xs text-gray-400 text-center">
        Metrics calculated from the last 24 hours
      </p>
    </section>
  )
}

export default ActivityFeed
