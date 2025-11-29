'use client'

interface CourseProgressBarProps {
  progress: number
  label?: string
  showPercentage?: boolean
}

export default function CourseProgressBar({
  progress,
  label = 'Course Progress',
  showPercentage = true,
}: CourseProgressBarProps) {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(100, Math.max(0, progress))

  // Determine color based on progress
  const getProgressColor = () => {
    if (normalizedProgress === 100) return 'bg-green-500'
    if (normalizedProgress >= 50) return 'bg-blue-500'
    return 'bg-blue-400'
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {showPercentage && (
          <span className="text-sm font-medium text-gray-900">
            {normalizedProgress}%
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>
    </div>
  )
}
