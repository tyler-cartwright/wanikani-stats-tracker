import { cn } from '@/lib/utils/cn'
import { JapaneseLabel } from './japanese-label'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  japaneseLabel?: string
  variant?: 'default' | 'highlight' | 'success' | 'warning'
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  className?: string
}

const variantStyles = {
  default: 'bg-paper-200 border-paper-300',
  highlight: 'bg-paper-200 border-vermillion-500',
  success: 'bg-paper-200 border-patina-500',
  warning: 'bg-paper-200 border-ochre',
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
}

const trendColors = {
  up: 'text-patina-500',
  down: 'text-vermillion-500',
  neutral: 'text-ink-400',
}

export function StatCard({
  label,
  value,
  sublabel,
  japaneseLabel,
  variant = 'default',
  trend,
  trendValue,
  className,
}: StatCardProps) {
  const TrendIcon = trend ? trendIcons[trend] : null

  return (
    <div
      className={cn(
        'rounded-lg border p-6 shadow-sm transition-smooth',
        variantStyles[variant],
        className
      )}
    >
      <div className="space-y-2">
        {/* Label with optional Japanese */}
        <div>
          <p className="text-sm font-medium text-ink-400">{label}</p>
          {japaneseLabel && <JapaneseLabel text={japaneseLabel} />}
        </div>

        {/* Value */}
        <p className="text-3xl font-semibold text-ink-100 leading-tight">
          {value}
        </p>

        {/* Sublabel and/or Trend */}
        {(sublabel || trend) && (
          <div className="flex items-center gap-2 text-sm">
            {sublabel && <span className="text-ink-400">{sublabel}</span>}
            {trend && TrendIcon && (
              <div className={cn('flex items-center gap-1', trendColors[trend])}>
                <TrendIcon className="w-4 h-4" />
                {trendValue && <span>{trendValue}</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
