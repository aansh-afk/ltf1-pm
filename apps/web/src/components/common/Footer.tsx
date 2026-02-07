import { Link } from 'react-router-dom'
import { FaGithub, FaTwitter, FaDiscord } from 'react-icons/fa'
import { useRef, useEffect, useState } from 'react'
import WaitlistForm from '../landing/WaitlistForm'

// ── Particle field — direct port of apps/cli/src/tui/hooks/useParticles.ts ──

const XWING: string[] = [
  '          .                            .                      .',
  '  .                  .             -)------+====+       .',
  "                           -)----====    ,'   ,'   .                 .",
  "              .                  `.  `.,;___,'                .",
  "                                   `, |____l_\\",
  '                    _,.....------c==]""______ |,,,,,,.....____ _',
  "    .      .       \"-:______________  |____l_|]'''''''''''       .     .",
  "                                  ,'\"\".' .   `.",
  "         .                 -)-----====   `.   `.",
  '                     .            -)-------+====+       .            .',
  '             .                               .',
]
const XWING_WIDTH = Math.max(...XWING.map(l => l.length))

const FLYBY = {
  INTERVAL_MIN: 30000,
  INTERVAL_MAX: 40000,
  SPEED: 0.7,
}

const PARTICLE_CFG = {
  COUNT: 60,
  BAND_HEIGHT: 12,
  SPEED_MIN: 0.3,
  SPEED_MAX: 1.2,
  CHARS: ['.', '\u00B7', '\u2022', '\u25CF'],
  COLORS: ['#1F1F23', '#6366F1', '#9CA3AF', '#6366F1'],
  EDGE_FADE_PCT: 0.15,
}

interface Particle {
  x: number
  y: number
  speed: number
  size: number
  brightness: number
}

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)
  const [dims, setDims] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const measure = () => {
      const rect = el.getBoundingClientRect()
      setDims({ w: rect.width, h: rect.height })
    }
    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || dims.w === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const W = dims.w
    const H = dims.h

    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`
    ctx.scale(dpr, dpr)

    const fontSize = 13
    ctx.font = `${fontSize}px "IBM Plex Mono", monospace`
    const charW = ctx.measureText('M').width
    const lineH = fontSize * 1.6
    const cols = Math.floor(W / charW)
    const rows = PARTICLE_CFG.BAND_HEIGHT

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const particles: Particle[] = []
    for (let i = 0; i < PARTICLE_CFG.COUNT; i++) {
      particles.push({
        x: Math.random() * cols,
        y: Math.random() * rows,
        speed: PARTICLE_CFG.SPEED_MIN + Math.random() * (PARTICLE_CFG.SPEED_MAX - PARTICLE_CFG.SPEED_MIN),
        size: Math.floor(Math.random() * PARTICLE_CFG.CHARS.length),
        brightness: Math.floor(Math.random() * PARTICLE_CFG.COLORS.length),
      })
    }

    const flyby = {
      nextStart: Date.now() + FLYBY.INTERVAL_MIN + Math.random() * (FLYBY.INTERVAL_MAX - FLYBY.INTERVAL_MIN),
      shipX: cols + XWING_WIDTH,
      active: false,
    }

    const fadeZone = Math.max(1, Math.floor(cols * PARTICLE_CFG.EDGE_FADE_PCT))

    function tick() {
      ctx.clearRect(0, 0, W, H)

      const now = Date.now()

      if (!reducedMotion) {
        if (!flyby.active && now >= flyby.nextStart) {
          flyby.active = true
          flyby.shipX = cols + 2
        }
        if (flyby.active) {
          flyby.shipX -= FLYBY.SPEED
          if (flyby.shipX + XWING_WIDTH < -2) {
            flyby.active = false
            flyby.nextStart = now + FLYBY.INTERVAL_MIN + Math.random() * (FLYBY.INTERVAL_MAX - FLYBY.INTERVAL_MIN)
            flyby.shipX = cols + XWING_WIDTH
          }
        }

        for (const p of particles) {
          p.x -= p.speed * 0.16
          if (p.x < 0) {
            p.x = cols + Math.random() * 4
            p.y = Math.random() * rows
            p.speed = PARTICLE_CFG.SPEED_MIN + Math.random() * (PARTICLE_CFG.SPEED_MAX - PARTICLE_CFG.SPEED_MIN)
            p.size = Math.floor(Math.random() * PARTICLE_CFG.CHARS.length)
            p.brightness = Math.floor(Math.random() * PARTICLE_CFG.COLORS.length)
          }
        }
      }

      const grid: string[][] = []
      const bright: number[][] = []
      for (let r = 0; r < rows; r++) {
        grid.push(new Array<string>(cols).fill(' '))
        bright.push(new Array<number>(cols).fill(0))
      }

      for (const p of particles) {
        const col = Math.round(p.x)
        const r = Math.round(p.y)
        if (col < 0 || col >= cols || r < 0 || r >= rows) continue

        let edgeFactor = 1.0
        if (col < fadeZone) edgeFactor = col / fadeZone
        else if (col > cols - fadeZone) edgeFactor = (cols - col) / fadeZone

        const eb = Math.max(0, Math.round(p.brightness * edgeFactor))
        grid[r][col] = PARTICLE_CFG.CHARS[p.size]
        bright[r][col] = eb
      }

      if (flyby.active) {
        const artLeft = Math.round(flyby.shipX)
        const artTop = Math.max(0, Math.floor((rows - XWING.length) / 2))
        for (let r = 0; r < XWING.length; r++) {
          const gridRow = artTop + r
          if (gridRow >= rows) break
          const line = XWING[r]
          for (let c = 0; c < line.length; c++) {
            const gridCol = artLeft + c
            if (gridCol < 0 || gridCol >= cols) continue
            if (line[c] !== ' ') {
              grid[gridRow][gridCol] = line[c]
              bright[gridRow][gridCol] = 2
            }
          }
        }
      }

      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          if (grid[r][col] === ' ') continue
          ctx.fillStyle = PARTICLE_CFG.COLORS[bright[r][col]]
          ctx.fillText(grid[r][col], col * charW, r * lineH + fontSize)
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [dims])

  const lineH = 13 * 1.6
  const bandPx = PARTICLE_CFG.BAND_HEIGHT * lineH

  return (
    <div
      ref={containerRef}
      className="w-full"
      style={{ height: `${bandPx}px` }}
    >
      <canvas
        ref={canvasRef}
        className="block w-full"
        style={{ height: `${bandPx}px` }}
      />
    </div>
  )
}

export default function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-[#1F1F23]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Newsletter row */}
        <div className="py-12 border-b border-[#1F1F23]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h3 className="text-lg font-['Inter',sans-serif] font-bold text-[#F9FAFB] tracking-tight mb-1">
                Stay in the loop
              </h3>
              <p className="text-sm font-['Inter',sans-serif] text-[#6B7280]">
                Product updates. Engineering insights. Zero spam.
              </p>
            </div>
            <WaitlistForm source="landing" compact />
          </div>
        </div>

        {/* Links grid */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Product */}
          <div>
            <h4 className="text-xs font-['IBM_Plex_Mono',monospace] font-semibold text-[#6366F1] uppercase tracking-wider mb-4">
              Product
            </h4>
            <ul className="space-y-2">
              <li><Link to="/dashboard" className="text-sm font-['Inter',sans-serif] text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors duration-200">Dashboard</Link></li>
              <li><Link to="/tasks" className="text-sm font-['Inter',sans-serif] text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors duration-200">Tasks</Link></li>
              <li><Link to="/projects" className="text-sm font-['Inter',sans-serif] text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors duration-200">Projects</Link></li>
              <li><Link to="/sprints" className="text-sm font-['Inter',sans-serif] text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors duration-200">Sprints</Link></li>
              <li><Link to="/team" className="text-sm font-['Inter',sans-serif] text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors duration-200">Teams</Link></li>
              <li><Link to="/whiteboard" className="text-sm font-['Inter',sans-serif] text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors duration-200">Whiteboard</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-['IBM_Plex_Mono',monospace] font-semibold text-[#6366F1] uppercase tracking-wider mb-4">
              Company
            </h4>
            <ul className="space-y-2">
              <li><Link to="/pricing" className="text-sm font-['Inter',sans-serif] text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors duration-200">Pricing</Link></li>
              <li><Link to="/contact" className="text-sm font-['Inter',sans-serif] text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors duration-200">Contact</Link></li>
              <li><Link to="/" className="text-sm font-['Inter',sans-serif] text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors duration-200">About</Link></li>
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h4 className="text-xs font-['IBM_Plex_Mono',monospace] font-semibold text-[#6366F1] uppercase tracking-wider mb-4">
              Developers
            </h4>
            <ul className="space-y-2">
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm font-['Inter',sans-serif] text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors duration-200">GitHub</a></li>
              <li><Link to="/" className="text-sm font-['Inter',sans-serif] text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors duration-200">Documentation</Link></li>
              <li><Link to="/" className="text-sm font-['Inter',sans-serif] text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors duration-200">CLI</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-['IBM_Plex_Mono',monospace] font-semibold text-[#6366F1] uppercase tracking-wider mb-4">
              Legal
            </h4>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-sm font-['Inter',sans-serif] text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors duration-200">Privacy</Link></li>
              <li><Link to="/terms" className="text-sm font-['Inter',sans-serif] text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors duration-200">Terms</Link></li>
              <li><Link to="/" className="text-sm font-['Inter',sans-serif] text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors duration-200">AGPL License</Link></li>
            </ul>
          </div>
        </div>

        {/* Particle field band */}
        <div className="py-8 md:py-12">
          <ParticleField />
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-[#1F1F23] flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-[#9CA3AF] hover:text-[#6366F1] font-['Inter',sans-serif] text-sm font-bold transition-colors duration-200">
              LTF1
            </Link>
            <span className="text-xs font-['Inter',sans-serif] text-[#6B7280]">
              &copy; 2026 LTF1
            </span>
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-[#6B7280] hover:text-[#6366F1] transition-colors duration-200" aria-label="GitHub">
              <FaGithub className="w-5 h-5" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-[#6B7280] hover:text-[#6366F1] transition-colors duration-200" aria-label="Twitter">
              <FaTwitter className="w-5 h-5" />
            </a>
            <a href="https://discord.gg" target="_blank" rel="noopener noreferrer" className="text-[#6B7280] hover:text-[#6366F1] transition-colors duration-200" aria-label="Discord">
              <FaDiscord className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
