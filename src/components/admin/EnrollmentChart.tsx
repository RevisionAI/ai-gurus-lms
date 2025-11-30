/**
 * EnrollmentChart Component
 *
 * Displays a line chart showing enrollment trends over the last 30 days.
 * Uses Recharts for visualization with responsive container.
 *
 * @component
 */

'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'

// ============================================
// Types
// ============================================

interface EnrollmentDataPoint {
  date: string
  count: number
}

interface EnrollmentChartProps {
  data: EnrollmentDataPoint[]
}

// ============================================
// Custom Tooltip Component
// ============================================

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: { date: string } }>
  label?: string
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  // Access the original ISO date from the data point, not the formatted label
  const isoDate = payload[0].payload.date
  if (!isoDate) return null

  const date = parseISO(isoDate)
  const formattedDate = format(date, 'MMMM d, yyyy')

  return (
    <div className="bg-card-bg border border-border-color rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-text-primary">{formattedDate}</p>
      <p className="text-sm text-blue-400">
        <span className="font-semibold">{payload[0].value}</span> enrollments
      </p>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export function EnrollmentChart({ data }: EnrollmentChartProps) {
  // Format data for display
  const formattedData = data.map((item) => ({
    ...item,
    displayDate: format(parseISO(item.date), 'MMM dd'),
  }))

  // Calculate total for summary
  const totalEnrollments = data.reduce((sum, item) => sum + item.count, 0)

  // Handle empty data
  if (data.length === 0) {
    return (
      <section
        className="bg-card-bg rounded-lg shadow p-6"
        aria-labelledby="enrollment-chart-heading"
      >
        <h3
          id="enrollment-chart-heading"
          className="text-lg font-semibold text-text-primary mb-4"
        >
          Enrollments Over Time (30 Days)
        </h3>
        <div className="h-[300px] flex items-center justify-center text-text-secondary">
          No enrollment data available for the last 30 days
        </div>
      </section>
    )
  }

  return (
    <section
      className="bg-card-bg rounded-lg shadow p-6"
      aria-labelledby="enrollment-chart-heading"
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          id="enrollment-chart-heading"
          className="text-lg font-semibold text-text-primary"
        >
          Enrollments Over Time (30 Days)
        </h3>
        <span className="text-sm text-text-secondary">
          Total: <span className="font-semibold text-text-primary">{totalEnrollments}</span>
        </span>
      </div>

      <div
        className="h-[300px]"
        role="img"
        aria-label={`Line chart showing ${totalEnrollments} enrollments over the last 30 days`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formattedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 12, fill: '#e5e7eb' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.3)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#e5e7eb' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.3)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={{ r: 4, fill: '#60a5fa' }}
              activeDot={{ r: 6, fill: '#60a5fa' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Accessible data table for screen readers */}
      <table className="sr-only">
        <caption>Enrollment data for the last 30 days</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Enrollments</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.date}>
              <td>{format(parseISO(item.date), 'MMMM d, yyyy')}</td>
              <td>{item.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default EnrollmentChart
