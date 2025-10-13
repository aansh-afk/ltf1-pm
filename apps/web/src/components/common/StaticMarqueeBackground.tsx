import { useEffect, useRef, useState } from 'react'

interface StaticMarqueeBackgroundProps {
  text?: string;
  className?: string;
}

export default function StaticMarqueeBackground({
  text = "YOUR REPO IS THE SOURCE OF TRUTH",
  className = ''
}: StaticMarqueeBackgroundProps) {
  const [scrollY, setScrollY] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      // Cancel any pending RAF callback to prevent queueing
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }

      // Only update if scroll changed significantly (throttle updates)
      const currentScrollY = window.scrollY
      if (Math.abs(currentScrollY - lastScrollY.current) > 1) {
        rafRef.current = requestAnimationFrame(() => {
          setScrollY(currentScrollY)
          lastScrollY.current = currentScrollY
          rafRef.current = null
        })
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden transform -skew-y-12 ${className}`}>
      {/* First row - moves slowest (0.1x speed) */}
      <div
        className="flex whitespace-nowrap"
        style={{ transform: `translateY(${scrollY * 0.1}px)` }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="text-[#3A3A3A] text-4xl md:text-6xl font-bold uppercase tracking-wider mx-32px select-none"
            style={{ opacity: 0.25 }}
          >
            {text}
          </span>
        ))}
      </div>

      {/* Second row - moves at 0.2x speed with offset */}
      <div
        className="flex whitespace-nowrap mt-56px"
        style={{
          transform: `translateX(-200px) translateY(${scrollY * 0.2}px)`
        }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="text-[#333333] text-4xl md:text-6xl font-bold uppercase tracking-wider mx-32px select-none"
            style={{ opacity: 0.20 }}
          >
            {text}
          </span>
        ))}
      </div>

      {/* Third row - moves at 0.3x speed */}
      <div
        className="flex whitespace-nowrap mt-56px"
        style={{
          transform: `translateX(-100px) translateY(${scrollY * 0.3}px)`
        }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="text-[#2F2F2F] text-4xl md:text-6xl font-bold uppercase tracking-wider mx-32px select-none"
            style={{ opacity: 0.15 }}
          >
            {text}
          </span>
        ))}
      </div>

      {/* Fourth row - moves at 0.15x speed */}
      <div
        className="flex whitespace-nowrap mt-56px"
        style={{
          transform: `translateX(-300px) translateY(${scrollY * 0.15}px)`
        }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="text-[#2A2A2A] text-4xl md:text-6xl font-bold uppercase tracking-wider mx-32px select-none"
            style={{ opacity: 0.10 }}
          >
            {text}
          </span>
        ))}
      </div>

      {/* Fifth row - moves at 0.25x speed */}
      <div
        className="flex whitespace-nowrap mt-56px"
        style={{
          transform: `translateX(-50px) translateY(${scrollY * 0.25}px)`
        }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="text-[#252525] text-4xl md:text-6xl font-bold uppercase tracking-wider mx-32px select-none"
            style={{ opacity: 0.08 }}
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}