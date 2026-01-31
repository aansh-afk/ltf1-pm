import { Link } from 'react-router-dom'
import { FaGithub, FaTwitter, FaLinkedin, FaDiscord } from 'react-icons/fa'
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
  CHARS: ['.', '\u00B7', '\u2022', '\u25CF'],       // . · • ●
  COLORS: ['#333333', '#555555', '#888888', '#cccccc'],
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

  // Measure container to get char-grid dimensions
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

    // Character cell size
    const fontSize = 13
    ctx.font = `${fontSize}px "IBM Plex Mono", monospace`
    const charW = ctx.measureText('M').width
    const lineH = fontSize * 1.6
    const cols = Math.floor(W / charW)
    const rows = PARTICLE_CFG.BAND_HEIGHT

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Init particles
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

    // Flyby state
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
        // Update flyby
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

        // Update particles
        for (const p of particles) {
          p.x -= p.speed * 0.16 // ~60fps scaling
          if (p.x < 0) {
            p.x = cols + Math.random() * 4
            p.y = Math.random() * rows
            p.speed = PARTICLE_CFG.SPEED_MIN + Math.random() * (PARTICLE_CFG.SPEED_MAX - PARTICLE_CFG.SPEED_MIN)
            p.size = Math.floor(Math.random() * PARTICLE_CFG.CHARS.length)
            p.brightness = Math.floor(Math.random() * PARTICLE_CFG.COLORS.length)
          }
        }
      }

      // Build grid
      const grid: string[][] = []
      const bright: number[][] = []
      for (let r = 0; r < rows; r++) {
        grid.push(new Array<string>(cols).fill(' '))
        bright.push(new Array<number>(cols).fill(0))
      }

      // Place particles
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

      // Stamp X-wing
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

      // Render
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
    <footer className="bg-event-horizon border-t-2 border-basalt-border">
      <div className="marketing-container px-24px">
        {/* Newsletter row */}
        <div className="py-48px border-b-2 border-basalt-border">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-24px">
            <div>
              <h3 className="text-lg font-bold text-cathode-white uppercase mb-4px">
                STAY IN THE LOOP
              </h3>
              <p className="text-sm text-cathode-white/50 uppercase">
                PRODUCT UPDATES. ENGINEERING INSIGHTS. ZERO SPAM.
              </p>
            </div>
            <WaitlistForm source="landing" compact />
          </div>
        </div>

        {/* Links grid */}
        <div className="py-48px grid grid-cols-2 md:grid-cols-4 gap-32px">
          {/* Product */}
          <div>
            <h4 className="text-xs font-bold text-cathode-white uppercase tracking-wider mb-16px">
              PRODUCT
            </h4>
            <ul className="space-y-8px">
              <li><Link to="/pricing" className="text-sm text-cathode-white/50 hover:text-brutal-info uppercase">PRICING</Link></li>
              <li><Link to="/#features" className="text-sm text-cathode-white/50 hover:text-brutal-info uppercase">FEATURES</Link></li>
              <li><Link to="/#how-it-works" className="text-sm text-cathode-white/50 hover:text-brutal-info uppercase">HOW IT WORKS</Link></li>
              <li><span className="text-sm text-cathode-white/30 uppercase">CHANGELOG (SOON)</span></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-bold text-cathode-white uppercase tracking-wider mb-16px">
              COMPANY
            </h4>
            <ul className="space-y-8px">
              <li><Link to="/blog" className="text-sm text-cathode-white/50 hover:text-brutal-info uppercase">BLOG</Link></li>
              <li><Link to="/contact" className="text-sm text-cathode-white/50 hover:text-brutal-info uppercase">CONTACT</Link></li>
              <li><span className="text-sm text-cathode-white/30 uppercase">CAREERS (SOON)</span></li>
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h4 className="text-xs font-bold text-cathode-white uppercase tracking-wider mb-16px">
              DEVELOPERS
            </h4>
            <ul className="space-y-8px">
              <li><span className="text-sm text-cathode-white/30 uppercase">DOCS (SOON)</span></li>
              <li><span className="text-sm text-cathode-white/30 uppercase">API (SOON)</span></li>
              <li><span className="text-sm text-cathode-white/30 uppercase">STATUS (SOON)</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-bold text-cathode-white uppercase tracking-wider mb-16px">
              LEGAL
            </h4>
            <ul className="space-y-8px">
              <li><span className="text-sm text-cathode-white/30 uppercase">PRIVACY (SOON)</span></li>
              <li><span className="text-sm text-cathode-white/30 uppercase">TERMS (SOON)</span></li>
              <li><span className="text-sm text-cathode-white/30 uppercase">SECURITY (SOON)</span></li>
            </ul>
          </div>
        </div>

        {/* Particle field band */}
        <div className="py-32px md:py-48px">
          <ParticleField />
        </div>

        {/* Bottom bar */}
        <div className="py-24px border-t-2 border-basalt-border flex flex-col sm:flex-row justify-between items-center gap-16px">
          <div className="flex items-center gap-16px">
            <Link to="/" className="text-cathode-white/60 hover:text-brutal-info font-mono text-sm font-bold uppercase">
              LTF1
            </Link>
            <span className="text-xs text-cathode-white/30 uppercase">
              &copy; {new Date().getFullYear()} LTF1. ALL RIGHTS RESERVED.
            </span>
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-16px">
            <a href="https://github.com/ltf1" target="_blank" rel="noopener noreferrer" className="text-cathode-white/50 hover:text-brutal-info" aria-label="GitHub">
              <FaGithub className="w-20px h-20px" />
            </a>
            <a href="https://twitter.com/ltf1dev" target="_blank" rel="noopener noreferrer" className="text-cathode-white/50 hover:text-brutal-info" aria-label="Twitter">
              <FaTwitter className="w-20px h-20px" />
            </a>
            <a href="https://linkedin.com/company/ltf1" target="_blank" rel="noopener noreferrer" className="text-cathode-white/50 hover:text-brutal-info" aria-label="LinkedIn">
              <FaLinkedin className="w-20px h-20px" />
            </a>
            <a href="https://discord.gg/ltf1" target="_blank" rel="noopener noreferrer" className="text-cathode-white/50 hover:text-brutal-info" aria-label="Discord">
              <FaDiscord className="w-20px h-20px" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
