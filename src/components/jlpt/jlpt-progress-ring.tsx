import { cn } from '@/lib/utils/cn'

interface JLPTProgressRingProps {
  percentage: number
  size?: number
  strokeWidth?: number
  label?: string
  count?: string
  className?: string
}

export function JLPTProgressRing({
  percentage,
  size = 120,
  strokeWidth = 10,
  label,
  count,
  className,
}: JLPTProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  // Color based on percentage
  const getColor = () => {
    if (percentage >= 80) return 'text-patina-500' // Green
    if (percentage >= 60) return 'text-ochre-500' // Yellow/Orange
    if (percentage >= 40) return 'text-vermillion-300' // Light red
    return 'text-vermillion-500' // Red
  }

  const color = getColor()

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-paper-300 dark:text-ink-300"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(color, 'transition-all duration-500 ease-out')}
        />

        {/* Center text */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-2xl font-bold fill-current text-ink-100 dark:text-paper-100 transform rotate-90"
          style={{ transformOrigin: 'center' }}
        >
          {percentage}%
        </text>
      </svg>

      {label && (
        <div className="text-center">
          <div className="text-sm font-medium text-ink-100 dark:text-paper-100">{label}</div>
          {count && <div className="text-xs text-ink-400 dark:text-paper-300">{count}</div>}
        </div>
      )}
    </div>
  )
}
