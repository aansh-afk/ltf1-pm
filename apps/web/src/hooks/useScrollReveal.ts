import { useEffect, useRef, useState } from 'react'
import { useMotionValue, useTransform } from 'framer-motion'

interface UseScrollRevealOptions {
  triggerRef: React.RefObject<HTMLElement>
  offset?: number
  smoothing?: number
}

export function useScrollReveal({ 
  triggerRef, 
  offset = 0.5,
  smoothing = 0.1 
}: UseScrollRevealOptions) {
  const [isActive, setIsActive] = useState(false)
  const scrollY = useMotionValue(0)
  const rafRef = useRef<number>()
  const lastScrollY = useRef(0)
  
  // Calculate reveal progress based on scroll position
  const revealProgress = useTransform(scrollY, (value) => {
    if (!triggerRef.current || !isActive) return 0
    
    const element = triggerRef.current
    const rect = element.getBoundingClientRect()
    const elementTop = rect.top + window.scrollY
    const elementHeight = rect.height
    const windowHeight = window.innerHeight
    
    // Start reveal when element reaches offset point
    const startPoint = elementTop - windowHeight * (1 - offset)
    const endPoint = elementTop + elementHeight
    
    const progress = (value - startPoint) / (endPoint - startPoint)
    return Math.max(0, Math.min(1, progress))
  })
  
  useEffect(() => {
    const updateScrollValue = () => {
      const currentScrollY = window.scrollY
      const delta = currentScrollY - lastScrollY.current
      
      // Smooth the scroll value
      scrollY.set(scrollY.get() + delta * smoothing)
      lastScrollY.current = currentScrollY
      
      // Check if we should activate the reveal
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        const shouldActivate = rect.top <= window.innerHeight * offset
        setIsActive(shouldActivate)
      }
      
      rafRef.current = requestAnimationFrame(updateScrollValue)
    }
    
    rafRef.current = requestAnimationFrame(updateScrollValue)
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [triggerRef, offset, smoothing, scrollY])
  
  return {
    isActive,
    revealProgress,
    scrollY
  }
}