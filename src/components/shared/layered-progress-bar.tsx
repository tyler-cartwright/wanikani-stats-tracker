import { cn } from '@/lib/utils/cn'

interface LayeredProgressBarProps {
  backgroundValue: number // 0-100 (lessons started %)
  foregroundValue: number // 0-100 (guru'd %)
  backgroundColorClass?: string
  foregroundColorClass?: string
  height?: 'sm' | 'md'
  animated?: boolean
  className?: string
}

export function LayeredProgressBar({
  backgroundValue,
  foregroundValue,
  backgroundColorClass = 'bg-patina-500/30',
  foregroundColorClass = 'bg-patina-500',
  height = 'md',
  animated = true,
  className,
}: LayeredProgressBarProps) {
  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
  }

  const clampedBackground = Math.min(100, Math.max(0, backgroundValue))
  const clampedForeground = Math.min(100, Math.max(0, foregroundValue))

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'w-full bg-paper-300 dark:bg-ink-300 rounded-full overflow-hidden relative',
          heightClasses[height]
        )}
      >
        {/* Background layer - lessons started */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full',
            backgroundColorClass,
            animated && 'transition-all duration-slow ease-out'
          )}
          style={{ width: `${clampedBackground}%` }}
        />
        {/* Foreground layer - guru'd */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full',
            foregroundColorClass,
            animated && 'transition-all duration-slow ease-out'
          )}
          style={{ width: `${clampedForeground}%` }}
        />
      </div>
    </div>
  )
}
