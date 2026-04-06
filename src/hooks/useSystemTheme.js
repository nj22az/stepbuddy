import { useState, useEffect, useCallback } from 'react'

/**
 * #94 — Auto-detects system dark mode preference on first load.
 * Returns [isDarkMode, toggleTheme]
 */
export function useSystemTheme() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', isDarkMode)
  }, [isDarkMode])

  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev)
  }, [])

  return [isDarkMode, toggleTheme]
}
