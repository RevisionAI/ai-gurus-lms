/**
 * SystemHealth Component
 *
 * Displays system health indicators with color-coded status badges:
 * - Database connection status
 * - Storage (R2) connection status
 * - Last health check timestamp
 *
 * Uses accessible text labels alongside colors for screen readers.
 *
 * @component
 */

'use client'

import { Database, HardDrive, CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

// ============================================
// Types
// ============================================

type HealthStatus = 'healthy' | 'degraded' | 'down'

interface SystemHealthData {
  database: HealthStatus
  storage: HealthStatus
  lastChecked: string
}

interface SystemHealthProps {
  health: SystemHealthData
}

// ============================================
// Status Configuration
// ============================================

const statusConfig: Record<
  HealthStatus,
  {
    icon: React.ReactNode
    bgColor: string
    textColor: string
    label: string
  }
> = {
  healthy: {
    icon: <CheckCircle className="h-4 w-4" />,
    bgColor: 'bg-green-500/20',
    textColor: 'text-green-400',
    label: 'Healthy',
  },
  degraded: {
    icon: <AlertCircle className="h-4 w-4" />,
    bgColor: 'bg-yellow-500/20',
    textColor: 'text-yellow-400',
    label: 'Degraded',
  },
  down: {
    icon: <XCircle className="h-4 w-4" />,
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400',
    label: 'Down',
  },
}

// ============================================
// Health Indicator Component
// ============================================

interface HealthIndicatorProps {
  service: string
  status: HealthStatus
  icon: React.ReactNode
}

function HealthIndicator({ service, status, icon }: HealthIndicatorProps) {
  const config = statusConfig[status]

  return (
    <div className="flex items-center justify-between py-3 border-b border-border-color last:border-0">
      <div className="flex items-center space-x-3">
        <div
          className="flex-shrink-0 h-8 w-8 rounded-lg bg-bg-content flex items-center justify-center text-text-secondary"
          aria-hidden="true"
        >
          {icon}
        </div>
        <span className="text-sm font-medium text-text-secondary">{service}</span>
      </div>
      <span
        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
        role="status"
        aria-label={`${service} status: ${config.label}`}
      >
        <span aria-hidden="true">{config.icon}</span>
        <span>{config.label}</span>
      </span>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export function SystemHealth({ health }: SystemHealthProps) {
  const timestamp = new Date(health.lastChecked)
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true })
  const formattedTime = format(timestamp, 'HH:mm:ss')

  // Overall system status
  const overallStatus: HealthStatus =
    health.database === 'down' || health.storage === 'down'
      ? 'down'
      : health.database === 'degraded' || health.storage === 'degraded'
        ? 'degraded'
        : 'healthy'

  const overallConfig = statusConfig[overallStatus]

  return (
    <section
      className="bg-card-bg rounded-lg shadow p-6"
      aria-labelledby="system-health-heading"
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          id="system-health-heading"
          className="text-lg font-semibold text-text-primary"
        >
          System Health
        </h3>
        <span
          className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${overallConfig.bgColor} ${overallConfig.textColor}`}
          role="status"
          aria-label={`Overall system health: ${overallConfig.label}`}
        >
          <span aria-hidden="true">{overallConfig.icon}</span>
          <span>{overallConfig.label}</span>
        </span>
      </div>

      <div className="space-y-1" role="list" aria-label="System health indicators">
        <HealthIndicator
          service="Database"
          status={health.database}
          icon={<Database className="h-4 w-4" />}
        />
        <HealthIndicator
          service="Storage (R2)"
          status={health.storage}
          icon={<HardDrive className="h-4 w-4" />}
        />
      </div>

      <div
        className="mt-4 flex items-center justify-center text-xs text-text-secondary"
        title={`Last checked at ${formattedTime}`}
      >
        <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
        <span>Last checked {timeAgo}</span>
      </div>
    </section>
  )
}

export default SystemHealth
