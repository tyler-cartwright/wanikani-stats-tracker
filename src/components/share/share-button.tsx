import { Share2 } from 'lucide-react'

interface ShareButtonProps {
  onClick: () => void
  label?: string
}

export function ShareButton({ onClick, label = 'Create share card' }: ShareButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-2 rounded-md hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth focus-ring"
      aria-label={label}
      title={label}
    >
      <Share2 className="w-4 h-4 text-ink-400 dark:text-paper-300" />
    </button>
  )
}
