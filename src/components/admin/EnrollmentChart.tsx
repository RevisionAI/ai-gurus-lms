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
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length || !label) return null

  const date = parseISO(label)
  const formattedDate = format(date, 'MMMM d, yyyy')

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-gray-900">{formattedDate}</p>
      <p className="text-sm text-blue-600">
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
        className="bg-white rounded-lg shadow p-6"
        aria-labelledby="enrollment-chart-heading"
      >
        <h3
          id="enrollment-chart-heading"
          className="text-lg font-semibold text-gray-900 mb-4"
        >
          Enrollments Over Time (30 Days)
        </h3>
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          No enrollment data available for the last 30 days
        </div>
      </section>
    )
  }

  return (
    <section
      className="bg-white rounded-lg shadow p-6"
      aria-labelledby="enrollment-chart-heading"
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          id="enrollment-chart-heading"
          className="text-lg font-semibold text-gray-900"
        >
          Enrollments Over Time (30 Days)
        </h3>
        <span className="text-sm text-gray-500">
          Total: <span className="font-semibold text-gray-900">{totalEnrollments}</span>
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
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={{ stroke: '#e5e7eb' }}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickLine={{ stroke: '#e5e7eb' }}
              axisLine={{ stroke: '#e5e7eb' }}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3, fill: '#3b82f6' }}
              activeDot={{ r: 5, fill: '#3b82f6' }}
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
