import { useState, useRef, useEffect } from 'react'
import { HelpCircle } from 'lucide-react'

interface InfoTooltipProps {
  content: string
  className?: string
}

interface Position {
  x: number
  y: number
  direction: 'up' | 'down'
}

export function InfoTooltip({ content, className = '' }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState<Position>({ x: 0, y: 0, direction: 'up' })
  const [isPositioned, setIsPositioned] = useState(false)

  // Calculate position to keep tooltip within viewport
  useEffect(() => {
    if (!isVisible || !tooltipRef.current || !buttonRef.current) {
      setIsPositioned(false)
      return
    }

    const tooltip = tooltipRef.current
    const button = buttonRef.current
    const buttonRect = button.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const padding = 16

    // Calculate centered X position
    let x = buttonRect.left + buttonRect.width / 2 - tooltipRect.width / 2

    // Clamp to viewport bounds
    if (x + tooltipRect.width > viewportWidth - padding) {
      x = viewportWidth - tooltipRect.width - padding
    }
    if (x < padding) {
      x = padding
    }

    // Determine vertical position (prefer above, flip to below if no room)
    let direction: 'up' | 'down' = 'up'
    let y = buttonRect.top - tooltipRect.height - 8

    if (y < padding) {
      direction = 'down'
      y = buttonRect.bottom + 8
    }

    setPosition({ x, y, direction })
    setIsPositioned(true)
  }, [isVisible])

  // Close tooltip when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tooltipRef.current &&
        buttonRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false)
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isVisible])

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsVisible(!isVisible)}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-flex items-center justify-center w-4 h-4 text-ink-400 dark:text-paper-300 hover:text-ink-100 dark:hover:text-paper-100 transition-smooth focus:outline-none focus:ring-2 focus:ring-vermillion-500/20 rounded-full"
        aria-label="More information"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 w-64 p-3 bg-ink-100 dark:bg-paper-100 text-paper-100 dark:text-ink-100 text-xs rounded-lg shadow-lg border border-ink-200 dark:border-paper-200 transition-opacity duration-200 ${isPositioned ? 'opacity-100' : 'opacity-0'}`}
          style={{ left: `${position.x}px`, top: `${position.y}px` }}
          role="tooltip"
        >
          {content}
          {/* Arrow pointing to trigger button */}
          {position.direction === 'up' ? (
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-ink-100 dark:border-t-paper-100" />
          ) : (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-ink-100 dark:border-b-paper-100" />
          )}
        </div>
      )}
    </div>
  )
}
