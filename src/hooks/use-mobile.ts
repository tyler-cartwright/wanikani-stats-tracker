import { useState, useEffect } from 'react'

function getIsMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 1280 // xl breakpoint
}

export function useMobile() {
  const [isMobile, setIsMobile] = useState(getIsMobile)

  useEffect(() => {
    // Use matchMedia for more reliable breakpoint detection
    // This fires on Chrome DevTools device changes, orientation changes, etc.
    const mediaQuery = window.matchMedia('(max-width: 1279px)')

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches)
    }

    // Set initial value from media query
    handleChange(mediaQuery)

    // Listen for changes - works better than resize events
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isMobile
}
