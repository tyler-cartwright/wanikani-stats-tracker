import { cn } from '@/lib/utils/cn'

type SRSStage = 'apprentice' | 'guru' | 'master' | 'enlightened' | 'burned'

interface SRSBadgeProps {
  stage: SRSStage
  size?: 'sm' | 'md'
  className?: string
}

const stageColors: Record<SRSStage, string> = {
  apprentice: 'bg-srs-apprentice',
  guru: 'bg-srs-guru',
  master: 'bg-srs-master',
  enlightened: 'bg-srs-enlightened',
  burned: 'bg-srs-burned',
}

const stageLabels: Record<SRSStage, string> = {
  apprentice: 'Apprentice',
  guru: 'Guru',
  master: 'Master',
  enlightened: 'Enlightened',
  burned: 'Burned',
}

export function SRSBadge({ stage, size = 'md', className }: SRSBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium text-ink-100',
        stageColors[stage],
        sizeClasses[size],
        className
      )}
    >
      {stageLabels[stage]}
    </span>
  )
}
