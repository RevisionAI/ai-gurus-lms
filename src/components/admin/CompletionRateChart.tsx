/**
 * CompletionRateChart Component
 *
 * Displays a horizontal bar chart showing assignment completion rates
 * for the top 10 courses. Uses Recharts for visualization.
 *
 * @component
 */

'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

// ============================================
// Types
// ============================================

interface CompletionRateData {
  courseId: string
  courseTitle: string
  rate: number
}

interface CompletionRateChartProps {
  data: CompletionRateData[]
}

// ============================================
// Color Scale Function
// ============================================

function getColorByRate(rate: number): string {
  if (rate >= 80) return '#22c55e' // green-500
  if (rate >= 60) return '#84cc16' // lime-500
  if (rate >= 40) return '#eab308' // yellow-500
  if (rate >= 20) return '#f97316' // orange-500
  return '#ef4444' // red-500
}

// ============================================
// Custom Tooltip Component
// ============================================

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: CompletionRateData }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <div className="bg-card-bg border border-border-color rounded-lg shadow-lg p-3 max-w-xs">
      <p className="text-sm font-medium text-text-primary truncate">{data.courseTitle}</p>
      <p className="text-sm text-text-secondary">
        Completion Rate:{' '}
        <span className="font-semibold" style={{ color: getColorByRate(data.rate) }}>
          {data.rate}%
        </span>
      </p>
    </div>
  )
}

// ============================================
// Main Component
// ============================================

export function CompletionRateChart({ data }: CompletionRateChartProps) {
  // Truncate course titles for display
  const formattedData = data.map((item) => ({
    ...item,
    displayTitle:
      item.courseTitle.length > 25
        ? `${item.courseTitle.substring(0, 25)}...`
        : item.courseTitle,
  }))

  // Handle empty data
  if (data.length === 0) {
    return (
      <section
        className="bg-card-bg rounded-lg shadow p-6"
        aria-labelledby="completion-chart-heading"
      >
        <h3
          id="completion-chart-heading"
          className="text-lg font-semibold text-text-primary mb-4"
        >
          Top 10 Courses by Completion Rate
        </h3>
        <div className="h-[400px] flex items-center justify-center text-text-secondary">
          No course completion data available
        </div>
      </section>
    )
  }

  return (
    <section
      className="bg-card-bg rounded-lg shadow p-6"
      aria-labelledby="completion-chart-heading"
    >
      <h3
        id="completion-chart-heading"
        className="text-lg font-semibold text-text-primary mb-4"
      >
        Top 10 Courses by Completion Rate
      </h3>

      <div
        className="h-[400px]"
        role="img"
        aria-label={`Bar chart showing completion rates for top ${data.length} courses`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={formattedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: '#e5e7eb' }}
              tickFormatter={(value) => `${value}%`}
              tickLine={{ stroke: 'rgba(255,255,255,0.3)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
            />
            <YAxis
              type="category"
              dataKey="displayTitle"
              width={150}
              tick={{ fontSize: 11, fill: '#e5e7eb' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.3)' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColorByRate(entry.rate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Color legend */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded mr-1.5" style={{ backgroundColor: '#22c55e' }} />
          <span className="text-text-secondary">80%+</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded mr-1.5" style={{ backgroundColor: '#84cc16' }} />
          <span className="text-text-secondary">60-79%</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded mr-1.5" style={{ backgroundColor: '#eab308' }} />
          <span className="text-text-secondary">40-59%</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded mr-1.5" style={{ backgroundColor: '#f97316' }} />
          <span className="text-text-secondary">20-39%</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded mr-1.5" style={{ backgroundColor: '#ef4444' }} />
          <span className="text-text-secondary">&lt;20%</span>
        </div>
      </div>

      {/* Accessible data table for screen readers */}
      <table className="sr-only">
        <caption>Course completion rates</caption>
        <thead>
          <tr>
            <th>Course</th>
            <th>Completion Rate</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.courseId}>
              <td>{item.courseTitle}</td>
              <td>{item.rate}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

export default CompletionRateChart
