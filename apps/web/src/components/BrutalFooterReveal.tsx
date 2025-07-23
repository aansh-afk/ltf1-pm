import { useEffect, useRef, useState, cloneElement, isValidElement } from 'react'
import { motion } from 'framer-motion'
import { HalftoneCanvas } from './HalftoneCanvas'
import { useScrollReveal } from '../hooks/useScrollReveal'

interface BrutalFooterRevealProps {
  children: React.ReactNode
  triggerRef: React.RefObject<HTMLElement>
}

export function BrutalFooterReveal({ children, triggerRef }: BrutalFooterRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isSticky, setIsSticky] = useState(false)
  
  // Use custom scroll reveal hook for better performance
  const { isActive, revealProgress } = useScrollReveal({
    triggerRef,
    offset: 0.5,
    smoothing: 0.15
  })

  // Handle sticky positioning with better performance
  useEffect(() => {
    let rafId: number
    
    const handleScroll = () => {
      if (rafId) return
      
      rafId = requestAnimationFrame(() => {
        if (!triggerRef.current || !containerRef.current) {
          rafId = 0
          return
        }
        
        const triggerRect = triggerRef.current.getBoundingClientRect()
        const shouldStick = triggerRect.top <= window.innerHeight * 0.5
        
        setIsSticky(shouldStick)
        rafId = 0
      })
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [triggerRef])

  return (
    <div 
      ref={containerRef}
      className={`${isSticky ? 'fixed inset-0' : 'relative'} z-40`}
      style={{ pointerEvents: isSticky ? 'auto' : 'none' }}
    >
      {/* Footer Content Layer */}
      <div className="absolute inset-0 bg-event-horizon overflow-hidden">
        <motion.div 
          className="h-full"
          style={{ 
            opacity: revealProgress,
            transform: 'translateZ(0)' // Force GPU acceleration
          }}
        >
          {/* Pass revealProgress to children */}
          {isValidElement(children) 
            ? cloneElement(children as React.ReactElement<any>, { revealProgress })
            : children
          }
        </motion.div>
      </div>
      
      {/* Halftone Canvas Overlay for better performance */}
      <HalftoneCanvas 
        revealProgress={revealProgress} 
        isActive={isSticky || isActive}
      />
    </div>
  )
}