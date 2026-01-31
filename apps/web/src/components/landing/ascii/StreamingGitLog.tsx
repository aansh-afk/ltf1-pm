import { useRef, useEffect, useCallback } from 'react'
import { useInView } from 'framer-motion'

const LINES = [
  { text: '$ git commit -m "fix auth bug"', color: '#F5F5F5' },
  { text: '> task #142 created', color: '#FF2D78' },
  { text: '$ git push origin main', color: '#F5F5F5' },
  { text: '> PR #42 linked → task #142', color: '#FF2D78' },
  { text: '> status: IN REVIEW', color: '#00FF88' },
  { text: '$ merge PR #42', color: '#F5F5F5' },
  { text: '> task #142 closed', color: '#FF2D78' },
  { text: '> sprint velocity: +3 pts', color: '#00FF88' },
  { text: '$ git commit -m "add rate limiter"', color: '#F5F5F5' },
  { text: '> task #143 created', color: '#FF2D78' },
  { text: '> complexity: LOW (2 files changed)', color: '#00FF88' },
  { text: '$ git push origin feat/rate-limit', color: '#F5F5F5' },
  { text: '> PR #43 opened → task #143', color: '#FF2D78' },
  { text: '> status: IN REVIEW', color: '#00FF88' },
  { text: '$ merge PR #43', color: '#F5F5F5' },
  { text: '> task #143 closed', color: '#FF2D78' },
  { text: '> sprint velocity: +5 pts', color: '#00FF88' },
]

const MAX_VISIBLE = 12
const CHAR_DELAY = 28 // ms per character
const LINE_PAUSE = 800 // ms between lines
const CURSOR_BLINK_MS = 530

export default function StreamingGitLog() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isInView = useInView(containerRef, { once: false, amount: 0.3 })
  const rafRef = useRef<number>(0)
  const stateRef = useRef({
    lineIndex: 0,
    charIndex: 0,
    visibleLines: [] as { text: string; color: string }[],
    lastCharTime: 0,
    lastBlinkTime: 0,
    cursorVisible: true,
    pausing: false,
    pauseUntil: 0,
  })

  const getFont = useCallback((ctx: CanvasRenderingContext2D) => {
    const w = ctx.canvas.width / (window.devicePixelRatio || 1)
    const size = w < 480 ? 11 : 13
    return `${size}px "IBM Plex Mono", "Fira Code", "Cascadia Code", monospace`
  }, [])

  const prefersReducedMotion = useRef(false)

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
  }, [])

  // Resize canvas to container
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
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.scale(dpr, dpr)
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // Static render for reduced-motion
  useEffect(() => {
    if (!prefersReducedMotion.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.width / dpr
    const h = canvas.height / dpr

    ctx.clearRect(0, 0, w, h)
    ctx.font = getFont(ctx)
    ctx.textBaseline = 'top'

    const lineHeight = w < 480 ? 16 : 20
    const padding = 12
    const maxLines = Math.floor((h - padding * 2) / lineHeight)
    const linesToShow = LINES.slice(0, Math.min(maxLines, MAX_VISIBLE))

    linesToShow.forEach((line, i) => {
      ctx.fillStyle = line.color
      ctx.fillText(line.text, padding, padding + i * lineHeight)
    })
  }, [getFont])

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

    const s = stateRef.current

    const draw = (now: number) => {
      const dpr = window.devicePixelRatio || 1
      const w = canvas.width / dpr
      const h = canvas.height / dpr

      ctx.clearRect(0, 0, w, h)
      ctx.font = getFont(ctx)
      ctx.textBaseline = 'top'

      const lineHeight = w < 480 ? 16 : 20
      const padding = 12

      // Handle pause between lines
      if (s.pausing) {
        if (now < s.pauseUntil) {
          // Draw existing lines while pausing
          drawLines(ctx, s, w, lineHeight, padding, now)
          rafRef.current = requestAnimationFrame(draw)
          return
        }
        s.pausing = false
      }

      // Type next character
      if (now - s.lastCharTime >= CHAR_DELAY) {
        const currentLine = LINES[s.lineIndex]
        if (s.charIndex < currentLine.text.length) {
          s.charIndex++
          s.lastCharTime = now
        } else {
          // Line finished — push it, advance
          s.visibleLines.push({
            text: currentLine.text,
            color: currentLine.color,
          })
          if (s.visibleLines.length > MAX_VISIBLE) {
            s.visibleLines.shift()
          }
          s.lineIndex = (s.lineIndex + 1) % LINES.length
          s.charIndex = 0
          s.pausing = true
          s.pauseUntil = now + LINE_PAUSE
          s.lastCharTime = now
        }
      }

      drawLines(ctx, s, w, lineHeight, padding, now)
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isInView, getFont])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  )
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  s: {
    visibleLines: { text: string; color: string }[]
    lineIndex: number
    charIndex: number
    pausing: boolean
    lastBlinkTime: number
    cursorVisible: boolean
  },
  _w: number,
  lineHeight: number,
  padding: number,
  now: number
) {
  // Draw completed visible lines
  s.visibleLines.forEach((line, i) => {
    ctx.fillStyle = line.color
    ctx.fillText(line.text, padding, padding + i * lineHeight)
  })

  // Draw current line being typed
  if (!s.pausing) {
    const currentLine = LINES[s.lineIndex]
    const partial = currentLine.text.slice(0, s.charIndex)
    const y = padding + s.visibleLines.length * lineHeight

    ctx.fillStyle = currentLine.color
    ctx.fillText(partial, padding, y)

    // Blinking block cursor
    if (now - s.lastBlinkTime > CURSOR_BLINK_MS) {
      s.cursorVisible = !s.cursorVisible
      s.lastBlinkTime = now
    }
    if (s.cursorVisible) {
      const cursorX = padding + ctx.measureText(partial).width
      ctx.fillStyle = '#F5F5F5'
      ctx.fillRect(cursorX + 1, y, 8, lineHeight - 4)
    }
  }
}
