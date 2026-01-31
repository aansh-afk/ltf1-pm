import { useRef, useEffect, useCallback } from 'react'
import { useInView } from 'framer-motion'

const CHARS = ['>', '|', '/', '*', '+', '-']
const PARTICLE_COLOR = '#FF2D78'
const LINE_COLOR = '#FF2D78'
const CONNECT_DISTANCE = 120
const MOUSE_RADIUS = 150
const MOUSE_FORCE = 2
const CELL_SIZE = CONNECT_DISTANCE // spatial hash grid cell size

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  char: string
}

export default function ParticleConstellation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isInView = useInView(containerRef, { once: false, amount: 0.1 })
  const rafRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const sizeRef = useRef({ w: 0, h: 0 })
  const prefersReducedMotion = useRef(false)

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
  }, [])

  const initParticles = useCallback((w: number, h: number) => {
    const count = w < 640 ? 24 : 60
    const particles: Particle[] = []
    for (let i = 0; i < count; i++) {
      const speed = 0.1 + Math.random() * 0.3
      const angle = Math.random() * Math.PI * 2
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
      })
    }
    return particles
  }, [])

  // Resize + init
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      sizeRef.current = { w: rect.width, h: rect.height }

      const ctx = canvas.getContext('2d')
      if (ctx) ctx.scale(dpr, dpr)

      // Reinit particles on resize
      particlesRef.current = initParticles(rect.width, rect.height)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    return () => ro.disconnect()
  }, [initParticles])

  // Mouse tracking
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 }
    }

    container.addEventListener('mousemove', onMove)
    container.addEventListener('mouseleave', onLeave)
    return () => {
      container.removeEventListener('mousemove', onMove)
      container.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  // Static render for reduced-motion
  useEffect(() => {
    if (!prefersReducedMotion.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { w, h } = sizeRef.current
    ctx.clearRect(0, 0, w, h)

    const particles = particlesRef.current
    ctx.font = '12px "IBM Plex Mono", monospace'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < CONNECT_DISTANCE) {
          const opacity = (1 - dist / CONNECT_DISTANCE) * 0.06
          ctx.strokeStyle = `rgba(255, 45, 120, ${opacity})`
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.stroke()
        }
      }
    }

    // Draw particles
    particles.forEach((p) => {
      ctx.fillStyle = `rgba(255, 45, 120, 0.08)`
      ctx.fillText(p.char, p.x, p.y)
    })
  }, [])

  // Animation loop
  useEffect(() => {
    if (prefersReducedMotion.current) return
    if (!isInView) {
      cancelAnimationFrame(rafRef.current)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = () => {
      const { w, h } = sizeRef.current
      const particles = particlesRef.current
      const mouse = mouseRef.current

      ctx.clearRect(0, 0, w, h)

      // Update positions
      for (const p of particles) {
        // Mouse repulsion
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (1 - dist / MOUSE_RADIUS) * MOUSE_FORCE
          p.vx += (dx / dist) * force * 0.05
          p.vy += (dy / dist) * force * 0.05
        }

        // Dampen velocity back toward base speed
        p.vx *= 0.99
        p.vy *= 0.99

        p.x += p.vx
        p.y += p.vy

        // Wrap edges
        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0
      }

      // Spatial hash grid for neighbor lookups
      const grid = new Map<string, number[]>()
      for (let i = 0; i < particles.length; i++) {
        const cx = Math.floor(particles[i].x / CELL_SIZE)
        const cy = Math.floor(particles[i].y / CELL_SIZE)
        const key = `${cx},${cy}`
        const cell = grid.get(key)
        if (cell) cell.push(i)
        else grid.set(key, [i])
      }

      // Draw connections using spatial hash
      ctx.lineWidth = 0.5
      for (let i = 0; i < particles.length; i++) {
        const cx = Math.floor(particles[i].x / CELL_SIZE)
        const cy = Math.floor(particles[i].y / CELL_SIZE)

        // Check neighboring cells
        for (let nx = cx - 1; nx <= cx + 1; nx++) {
          for (let ny = cy - 1; ny <= cy + 1; ny++) {
            const neighbors = grid.get(`${nx},${ny}`)
            if (!neighbors) continue
            for (const j of neighbors) {
              if (j <= i) continue
              const dx = particles[i].x - particles[j].x
              const dy = particles[i].y - particles[j].y
              const dist = Math.sqrt(dx * dx + dy * dy)
              if (dist < CONNECT_DISTANCE) {
                const opacity = (1 - dist / CONNECT_DISTANCE) * 0.06
                ctx.strokeStyle = `rgba(255, 45, 120, ${opacity})`
                ctx.beginPath()
                ctx.moveTo(particles[i].x, particles[i].y)
                ctx.lineTo(particles[j].x, particles[j].y)
                ctx.stroke()
              }
            }
          }
        }
      }

      // Draw particles
      ctx.font = '12px "IBM Plex Mono", monospace'
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      ctx.fillStyle = `rgba(255, 45, 120, 0.08)`
      for (const p of particles) {
        ctx.fillText(p.char, p.x, p.y)
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isInView])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'auto' }}
      />
    </div>
  )
}
