import { useState, useEffect } from 'react'

/**
 * Detects if the user is using a touch-primary device
 * Uses the pointer media query which is more reliable than touch events
 * @returns true if the primary input mechanism is touch (coarse pointer)
 */
export function useTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    // Check if pointer: coarse media query matches (touch devices)
    const mediaQuery = window.matchMedia('(pointer: coarse)')

    setIsTouchDevice(mediaQuery.matches)

    // Listen for changes (e.g., when connecting/disconnecting external mouse)
    const handleChange = (e: MediaQueryListEvent) => {
      setIsTouchDevice(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isTouchDevice
}
