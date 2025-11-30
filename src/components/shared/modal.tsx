import { ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Modal({ isOpen, onClose, children, size = 'md', className }: ModalProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  // Handle escape key and prevent scrollbar shift
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)

      // Calculate scrollbar width and add padding to prevent shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
      document.body.style.paddingRight = '0px'
    }
  }, [isOpen, onClose])

  // Handle animations
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      // Small delay to trigger animation after mounting
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true)
        })
      })
    } else {
      setIsAnimating(false)
      // Wait for animation to finish before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 300) // Match animation duration
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!shouldRender) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
  }

  const modalContent = (
    <>
      {/* Backdrop - warm charcoal tint matching mobile nav */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-ink-100/50 dark:bg-paper-100/20 transition-opacity duration-300',
          isAnimating ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal - centered, warm paper */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'pointer-events-auto w-full bg-paper-200 dark:bg-ink-200 rounded-lg border border-paper-300 dark:border-ink-300 shadow-xl',
            'transform transition-all duration-300',
            isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
            sizeClasses[size],
            className
          )}
          style={{
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>
    </>
  )

  return createPortal(modalContent, document.body)
}

// Close button component for consistency
export function ModalClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="absolute top-4 right-4 p-2 rounded-md hover:bg-paper-300 dark:hover:bg-ink-300 transition-smooth focus-ring"
      aria-label="Close"
    >
      <X className="w-5 h-5 text-ink-400 dark:text-paper-300" />
    </button>
  )
}
