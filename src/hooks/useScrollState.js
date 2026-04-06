import { useState, useEffect } from 'react'

/**
 * #26,27 — Tracks scroll position for collapsing nav bar behavior.
 * Returns { isScrolled, scrollY }
 */
export function useScrollState(threshold = 10) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    let ticking = false

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > threshold)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return isScrolled
}
