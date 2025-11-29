import { cn } from '@/lib/utils/cn'

interface JapaneseLabelProps {
  text: string
  className?: string
}

export function JapaneseLabel({ text, className }: JapaneseLabelProps) {
  return (
    <span className={cn('japanese-label', className)}>
      {text}
    </span>
  )
}
