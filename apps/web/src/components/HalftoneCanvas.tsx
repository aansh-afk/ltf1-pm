import { useEffect, useRef } from 'react'
import { MotionValue, useTransform } from 'framer-motion'

interface HalftoneCanvasProps {
  revealProgress: MotionValue<number>
  isActive: boolean
}

export function HalftoneCanvas({ revealProgress, isActive }: HalftoneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const dotsRef = useRef<Array<{
    x: number
    y: number
    baseSize: number
    delay: number
    color: string
  }>>([])

  // Initialize dots pattern
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      
      // Regenerate dots on resize
      generateDots()
    }

    const generateDots = () => {
      const dots: typeof dotsRef.current = []
      const spacing = window.innerWidth > 768 ? 16 : 24 // Adjust for mobile
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY)

      for (let x = 0; x < canvas.width; x += spacing) {
        for (let y = 0; y < canvas.height; y += spacing) {
          const dx = x - centerX
          const dy = y - centerY
          const distance = Math.sqrt(dx * dx + dy * dy)
          const normalizedDistance = distance / maxDistance
          
          // Create different dot patterns
          const isAccent = Math.random() < 0.02 // 2% accent dots
          const isGlitch = Math.random() < 0.05 // 5% glitch dots
          
          dots.push({
            x: x + (Math.random() - 0.5) * 4,
            y: y + (Math.random() - 0.5) * 4,
            baseSize: isAccent ? 16 : (4 + Math.random() * 8),
            delay: normalizedDistance * 0.3,
            color: isGlitch ? (
              ['#00FFFF', '#FF00FF', '#FFFF00'][Math.floor(Math.random() * 3)]
            ) : '#F5F5F5'
          })
        }
      }

      dotsRef.current = dots
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current || !isActive) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const progress = revealProgress.get()
      
      // Draw dots
      dotsRef.current.forEach((dot) => {
        const dotProgress = Math.max(0, Math.min(1, (progress - dot.delay) / (1 - dot.delay)))
        const size = dot.baseSize * (1 - dotProgress)
        const opacity = 1 - dotProgress * 0.8
        
        if (size > 0.5) {
          ctx.globalAlpha = opacity
          ctx.fillStyle = dot.color
          
          // Draw different shapes for variety
          if (dot.color !== '#F5F5F5') {
            // Draw squares for accent dots
            ctx.fillRect(dot.x - size / 2, dot.y - size / 2, size, size)
          } else {
            // Draw circles for regular dots
            ctx.beginPath()
            ctx.arc(dot.x, dot.y, size / 2, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      })
      
      // Add scan lines effect
      if (progress > 0.5) {
        ctx.globalAlpha = 0.05
        ctx.fillStyle = '#00FFFF'
        const scanY = (Date.now() % 4000) / 4000 * canvas.height
        ctx.fillRect(0, scanY - 2, canvas.width, 4)
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }

    // Subscribe to progress changes
    const unsubscribe = revealProgress.onChange(() => {
      if (!animationRef.current) {
        animate()
      }
    })

    return () => {
      unsubscribe()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [revealProgress, isActive])

  if (!isActive) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ 
        mixBlendMode: 'normal',
        transform: 'translateZ(0)' // Force GPU acceleration
      }}
    />
  )
}