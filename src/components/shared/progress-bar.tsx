import { cn } from '@/lib/utils/cn'

interface ProgressBarProps {
  value: number // 0-100
  color?: string
  height?: 'sm' | 'md'
  showLabel?: boolean
  animated?: boolean
  className?: string
}

export function ProgressBar({
  value,
  color = 'bg-vermillion-500',
  height = 'sm',
  showLabel = false,
  animated = true,
  className,
}: ProgressBarProps) {
  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
  }

  const clampedValue = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full bg-paper-300 dark:bg-ink-300 rounded-full overflow-hidden',
          heightClasses[height]
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-smooth',
            color,
            animated && 'transition-all duration-slow ease-out'
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-xs text-ink-400 dark:text-paper-300 text-right">
          {Math.round(clampedValue)}%
        </div>
      )}
    </div>
  )
}
