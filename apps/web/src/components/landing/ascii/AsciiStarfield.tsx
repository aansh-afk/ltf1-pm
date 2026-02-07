import { useEffect, useRef } from 'react'

/**
 * Animated ASCII starfield rendered on a <canvas>.
 *
 * Characters twinkle in/out at random positions using the project's
 * monospace font and muted color palette. Lightweight — uses a single
 * requestAnimationFrame loop throttled to ~12 fps.
 */

const CHARS = '.+*.:+*.:'
const COLORS = [
  'rgba(99,102,241,0.35)',   // indigo (accent)
  'rgba(99,102,241,0.18)',   // indigo faint
  'rgba(156,163,175,0.22)',  // gray-400
  'rgba(107,114,128,0.18)',  // gray-500
  'rgba(249,250,251,0.12)',  // near-white
  'rgba(139,92,246,0.20)',   // purple
]

interface Star {
  x: number
  y: number
  char: string
  color: string
  phase: number   // animation offset
  speed: number   // twinkle speed
}

function createStars(w: number, h: number, density: number): Star[] {
  const count = Math.floor((w * h) / density)
  const stars: Star[] = []
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      char: CHARS[Math.floor(Math.random() * CHARS.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.7,
    })
  }
  return stars
}

export default function AsciiStarfield({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const rafRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1

    function resize() {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      starsRef.current = createStars(rect.width, rect.height, 3500)
    }

    resize()
    window.addEventListener('resize', resize)

    let lastFrame = 0
    const INTERVAL = 1000 / 12 // ~12 fps

    function draw(now: number) {
      rafRef.current = requestAnimationFrame(draw)
      if (now - lastFrame < INTERVAL) return
      lastFrame = now

      if (!canvas || !ctx) return

      const w = canvas.width
      const h = canvas.height

      ctx.clearRect(0, 0, w, h)
      ctx.font = `${11 * dpr}px 'IBM Plex Mono', monospace`
      ctx.textBaseline = 'middle'

      const t = now / 1000

      for (const star of starsRef.current) {
        const alpha = 0.5 + 0.5 * Math.sin(t * star.speed + star.phase)
        if (alpha < 0.15) continue

        ctx.globalAlpha = alpha
        ctx.fillStyle = star.color
        ctx.fillText(star.char, star.x * dpr, star.y * dpr)
      }

      ctx.globalAlpha = 1
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
