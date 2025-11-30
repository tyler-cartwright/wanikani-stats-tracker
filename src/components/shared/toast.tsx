import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose: () => void
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsAnimating(true)
      })
    })

    // Auto-dismiss timer
    const timer = setTimeout(() => {
      setIsAnimating(false)
      // Wait for animation before closing
      setTimeout(() => onClose(), 300)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const types = {
    success: {
      icon: CheckCircle,
      bg: 'bg-patina-500/10 dark:bg-patina-500/20',
      border: 'border-patina-500/20 dark:border-patina-500/30',
      iconColor: 'text-patina-500 dark:text-patina-400',
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-vermillion-500/10 dark:bg-vermillion-500/20',
      border: 'border-vermillion-500/20 dark:border-vermillion-500/30',
      iconColor: 'text-vermillion-500 dark:text-vermillion-400',
    },
    info: {
      icon: Info,
      bg: 'bg-paper-300 dark:bg-ink-300',
      border: 'border-paper-400 dark:border-ink-400',
      iconColor: 'text-ink-400 dark:text-paper-300',
    },
  }

  const config = types[type]
  const Icon = config.icon

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => onClose(), 300)
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-sm',
        'bg-paper-200 dark:bg-ink-200 rounded-lg border shadow-lg',
        'transform transition-all duration-300',
        isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        config.border
      )}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}
        >
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <p className="text-sm text-ink-100 dark:text-paper-100 flex-1 pt-2">{message}</p>
        <button
          onClick={handleClose}
          className="p-1 rounded-md hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth"
        >
          <X className="w-4 h-4 text-ink-400 dark:text-paper-300" />
        </button>
      </div>
    </div>
  )
}
