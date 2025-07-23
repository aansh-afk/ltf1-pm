import { ReactNode, useState, useRef, useEffect } from 'react'
import clsx from 'clsx'

interface BrutalTooltipProps {
  children: ReactNode
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export default function BrutalTooltip({ 
  children, 
  content, 
  position = 'top',
  delay = 200 
}: BrutalTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const tooltipRect = tooltipRef.current.getBoundingClientRect()
    
    let top = 0
    let left = 0

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - 8
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
        break
      case 'bottom':
        top = triggerRect.bottom + 8
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
        break
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.left - tooltipRect.width - 8
        break
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.right + 8
        break
    }

    // Ensure tooltip stays within viewport
    const padding = 8
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipRect.height - padding))
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipRect.width - padding))

    setCoords({ top, left })
  }

  useEffect(() => {
    if (isVisible) {
      calculatePosition()
    }
  }, [isVisible])

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const positionClasses = {
    top: 'bottom-full mb-8px',
    bottom: 'top-full mt-8px',
    left: 'right-full mr-8px',
    right: 'left-full ml-8px',
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={clsx(
            'brutal-tooltip fixed z-50 pointer-events-none',
            'animate-brutal-fade'
          )}
          style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </>
  )
}