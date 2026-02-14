import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState, useRef, useCallback } from 'react'

// ── Fake memory dump hex ──
function generateHexDump(): string[] {
  const lines: Array<string> = []
  for (let i = 0; i < 6; i++) {
    const addr = (0xdead0000 + i * 16).toString(16).padStart(8, '0')
    const bytes = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(' ')
    lines.push(`0x${addr}  ${bytes}`)
  }
  return lines
}

// ── Fake stack trace ──
const STACK_TRACE = [
  'KERNEL PANIC — not syncing: page_fault at 0x00000404',
  '',
  'Call Trace:',
  '  router::resolve_path+0x1a4/0x2f0',
  '  http::dispatch_request+0x88/0x150',
  '  net::handle_connection+0x3c/0xa0',
  '  core::navigation::lookup+0x404/0x404  <-- FAULT',
  '  sys::process_request+0x22/0x60',
  '',
]

// ── Typewriter hook ──
function useTypewriter(lines: string[], speed = 25, startDelay = 800) {
  const [displayed, setDisplayed] = useState<string[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    let lineIdx = 0
    let charIdx = 0
    let timeout: NodeJS.Timeout

    const startTimeout = setTimeout(() => {
      const tick = () => {
        if (lineIdx >= lines.length) {
          setDone(true)
          return
        }

        const currentLine = lines[lineIdx]
        if (charIdx <= currentLine.length) {
          setDisplayed((prev) => {
            const next = [...prev]
            next[lineIdx] = currentLine.slice(0, charIdx)
            return next
          })
          charIdx++
          timeout = setTimeout(tick, currentLine === '' ? 100 : speed)
        } else {
          lineIdx++
          charIdx = 0
          timeout = setTimeout(tick, 60)
        }
      }
      tick()
    }, startDelay)

    return () => {
      clearTimeout(startTimeout)
      clearTimeout(timeout)
    }
  }, [lines, speed, startDelay])

  return { displayed, done }
}

// ── Static noise canvas ──
function NoiseCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      const imageData = ctx.createImageData(w, h)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 20
        data[i] = v
        data[i + 1] = v
        data[i + 2] = v + Math.random() * 8
        data[i + 3] = 25
      }

      ctx.putImageData(imageData, 0, 0)
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={200}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}

// ── Floating glitch fragments ──
function GlitchFragments() {
  const [fragments, setFragments] = useState<Array<{
    id: number; x: number; y: number; text: string; opacity: number
  }>>([])

  useEffect(() => {
    const chars = ['404', 'ERR', 'nil', '0x0', '???', 'NaN', 'void', '---']
    const interval = setInterval(() => {
      setFragments((prev) => {
        const next = prev
          .map((f) => ({ ...f, y: f.y - 0.3, opacity: f.opacity - 0.008 }))
          .filter((f) => f.opacity > 0)

        if (Math.random() > 0.6 && next.length < 12) {
          next.push({
            id: Date.now(),
            x: Math.random() * 100,
            y: 90 + Math.random() * 20,
            text: chars[Math.floor(Math.random() * chars.length)],
            opacity: 0.15 + Math.random() * 0.1,
          })
        }
        return next
      })
    }, 120)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {fragments.map((f) => (
        <span
          key={f.id}
          className="absolute font-['IBM_Plex_Mono',monospace] text-[10px] text-[#6366F1] select-none"
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            opacity: f.opacity,
            transform: `rotate(${(f.id % 30) - 15}deg)`,
          }}
        >
          {f.text}
        </span>
      ))}
    </div>
  )
}

// ── Main page ──
export default function NotFoundPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [phase, setPhase] = useState<'boot' | 'crash' | 'terminal'>('boot')
  const [hexDump] = useState(generateHexDump)
  const [cmdInput, setCmdInput] = useState('')
  const [termLines, setTermLines] = useState<Array<{ text: string; color: string }>>([])
  const [showCursor, setShowCursor] = useState(true)
  const [bootFlicker, setBootFlicker] = useState(true)
  const termRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { displayed: traceLines, done: traceDone } = useTypewriter(
    STACK_TRACE,
    18,
    1200
  )

  // Boot flicker
  useEffect(() => {
    const t1 = setTimeout(() => setBootFlicker(false), 150)
    const t2 = setTimeout(() => setBootFlicker(true), 200)
    const t3 = setTimeout(() => setBootFlicker(false), 250)
    const t4 = setTimeout(() => setPhase('crash'), 400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [])

  // Transition to terminal after trace
  useEffect(() => {
    if (traceDone && phase === 'crash') {
      const t = setTimeout(() => setPhase('terminal'), 600)
      return () => clearTimeout(t)
    }
  }, [traceDone, phase])

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => setShowCursor((p) => !p), 530)
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll terminal
  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight
    }
  }, [termLines, phase])

  // Focus input when terminal appears
  useEffect(() => {
    if (phase === 'terminal') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [phase])

  const addTermLine = useCallback((text: string, color = '#9CA3AF') => {
    setTermLines((prev) => [...prev, { text, color }])
  }, [])

  const handleCmd = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter' || !cmdInput.trim()) return

      const raw = cmdInput.trim()
      const cmd = raw.toLowerCase()
      addTermLine(`> ${raw}`, '#F9FAFB')
      setCmdInput('')

      if (cmd === 'help') {
        addTermLine('', '#6B7280')
        addTermLine('AVAILABLE COMMANDS:', '#6366F1')
        addTermLine('  home        Return to homepage', '#9CA3AF')
        addTermLine('  back        Go to previous page', '#9CA3AF')
        addTermLine('  dashboard   Open dashboard', '#9CA3AF')
        addTermLine('  pricing     View pricing', '#9CA3AF')
        addTermLine('  whereami    Show current path', '#9CA3AF')
        addTermLine('  ls          List available routes', '#9CA3AF')
        addTermLine('  clear       Clear terminal', '#9CA3AF')
        addTermLine('  reboot      Restart system', '#9CA3AF')
        addTermLine('', '#6B7280')
      } else if (cmd === 'home' || cmd === 'cd /') {
        addTermLine('Redirecting to /...', '#22C55E')
        setTimeout(() => navigate('/'), 400)
      } else if (cmd === 'back' || cmd === 'cd ..') {
        addTermLine('Going back...', '#22C55E')
        setTimeout(() => navigate(-1), 400)
      } else if (cmd === 'dashboard') {
        addTermLine('Loading dashboard...', '#22C55E')
        setTimeout(() => navigate('/dashboard'), 400)
      } else if (cmd === 'pricing') {
        addTermLine('Loading pricing...', '#22C55E')
        setTimeout(() => navigate('/pricing'), 400)
      } else if (cmd === 'whereami') {
        addTermLine(`  ${location.pathname}`, '#EF4444')
        addTermLine('  (this page does not exist)', '#6B7280')
      } else if (cmd === 'ls') {
        addTermLine('', '#6B7280')
        addTermLine('  /              Landing page', '#9CA3AF')
        addTermLine('  /dashboard     Main dashboard', '#9CA3AF')
        addTermLine('  /projects      Projects view', '#9CA3AF')
        addTermLine('  /tasks         Task manager', '#9CA3AF')
        addTermLine('  /pricing       Pricing plans', '#9CA3AF')
        addTermLine('  /contact       Contact us', '#9CA3AF')
        addTermLine('', '#6B7280')
      } else if (cmd === 'clear') {
        setTermLines([])
      } else if (cmd === 'reboot') {
        addTermLine('Rebooting system...', '#F59E0B')
        addTermLine('', '#6B7280')
        setTimeout(() => {
          addTermLine('[  OK  ] Unmounting filesystems', '#22C55E')
        }, 300)
        setTimeout(() => {
          addTermLine('[  OK  ] Stopping all services', '#22C55E')
        }, 600)
        setTimeout(() => {
          addTermLine('[  OK  ] System reboot', '#22C55E')
          setTimeout(() => navigate('/'), 500)
        }, 900)
      } else if (cmd === 'sudo rm -rf /') {
        addTermLine('Nice try.', '#EF4444')
      } else if (cmd === 'exit') {
        addTermLine('There is no escape.', '#6366F1')
      } else {
        addTermLine(`command not found: ${raw}`, '#EF4444')
        addTermLine('type "help" for available commands', '#6B7280')
      }
    },
    [cmdInput, navigate, location.pathname, addTermLine]
  )

  return (
    <div
      className="min-h-screen bg-[#020204] flex flex-col relative overflow-hidden cursor-text select-none"
      onClick={() => inputRef.current?.focus()}
    >
      <NoiseCanvas />
      <GlitchFragments />

      {/* CRT vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-[2]"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* Scanlines */}
      <div
        className="fixed inset-0 pointer-events-none z-[3] opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />

      {/* Main content */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 relative z-10 py-12"
        style={{
          opacity: bootFlicker ? 0 : 1,
          transition: 'opacity 50ms',
        }}
      >
        {/* ── CRASH PHASE: skull + stack trace ── */}
        {(phase === 'crash' || phase === 'boot') && (
          <div className="w-full max-w-2xl">
            {/* Error code */}
            <div className="text-center mb-6">
              <span
                className="font-['IBM_Plex_Mono',monospace] text-[80px] sm:text-[100px] font-black leading-none tracking-tighter"
                style={{
                  color: 'transparent',
                  WebkitTextStroke: '2px #EF4444',
                  filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.15))',
                }}
              >
                404
              </span>
            </div>

            {/* Stack trace typewriter */}
            <div className="bg-[#0A0A0A]/80 border border-[#1F1F23] p-4 font-['IBM_Plex_Mono',monospace] text-[11px] sm:text-[12px] leading-relaxed max-w-xl mx-auto">
              {traceLines.map((line, i) => (
                <div
                  key={i}
                  className={
                    i === 0
                      ? 'text-[#EF4444] font-bold'
                      : line?.includes('<-- FAULT')
                        ? 'text-[#F59E0B]'
                        : line?.startsWith('  ')
                          ? 'text-[#6B7280]'
                          : 'text-[#9CA3AF]'
                  }
                >
                  {line}
                  {i === traceLines.length - 1 && !traceDone && (
                    <span className="text-[#6366F1]">{showCursor ? '█' : ' '}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TERMINAL PHASE ── */}
        {phase === 'terminal' && (
          <div
            className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animation: 'fadeSlideIn 0.5s ease-out' }}
          >
            {/* Header bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span
                  className="font-['IBM_Plex_Mono',monospace] text-[48px] sm:text-[64px] font-black leading-none tracking-tighter"
                  style={{
                    color: 'transparent',
                    WebkitTextStroke: '2px #EF4444',
                  }}
                >
                  404
                </span>
                <div>
                  <div className="font-['IBM_Plex_Mono',monospace] text-[13px] text-[#F9FAFB] font-semibold uppercase tracking-wider">
                    Page not found
                  </div>
                  <div className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#6B7280]">
                    {location.pathname}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#EF4444] animate-pulse" />
                <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#EF4444] uppercase tracking-widest">
                  fault
                </span>
              </div>
            </div>

            {/* Terminal window */}
            <div className="bg-[#0A0A0A] border-2 border-[#2E2E35] shadow-[4px_4px_0px_rgba(0,0,0,0.8)]">
              {/* Title bar */}
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#1F1F23] bg-[#111111]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-[#EF4444]" />
                  <div className="w-2 h-2 bg-[#F59E0B]" />
                  <div className="w-2 h-2 bg-[#22C55E]" />
                </div>
                <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#6B7280] tracking-wider uppercase">
                  recovery_shell
                </span>
                <div className="w-12" />
              </div>

              {/* Terminal content */}
              <div
                ref={termRef}
                className="p-3 sm:p-4 h-[280px] sm:h-[320px] overflow-y-auto"
                style={{ scrollbarWidth: 'thin', scrollbarColor: '#2E2E35 transparent' }}
              >
                {/* Welcome message */}
                <div className="font-['IBM_Plex_Mono',monospace] text-[11px] sm:text-[12px] leading-relaxed mb-3">
                  <div className="text-[#EF4444] font-bold">SYSTEM CRASH RECOVERY</div>
                  <div className="text-[#6B7280] mt-1">
                    The page at <span className="text-[#6366F1]">{location.pathname}</span> caused a fault.
                  </div>
                  <div className="text-[#6B7280]">
                    Use this terminal to navigate. Type <span className="text-[#22C55E]">help</span> for commands.
                  </div>

                  {/* Mini hex dump */}
                  <div className="mt-3 mb-1 text-[#6B7280]/50 text-[10px]">
                    {hexDump.slice(0, 3).map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>

                  <div className="border-t border-[#1F1F23] mt-3 mb-2" />
                </div>

                {/* Command history */}
                <div className="font-['IBM_Plex_Mono',monospace] text-[11px] sm:text-[12px] leading-relaxed space-y-0.5">
                  {termLines.map((line, i) => (
                    <div key={i} style={{ color: line.color }}>
                      {line.text || '\u00A0'}
                    </div>
                  ))}
                </div>

                {/* Input line */}
                <div className="flex items-center gap-1.5 font-['IBM_Plex_Mono',monospace] text-[11px] sm:text-[12px] mt-1">
                  <span className="text-[#22C55E] select-none">{'>'}</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={cmdInput}
                    onChange={(e) => setCmdInput(e.target.value)}
                    onKeyDown={handleCmd}
                    className="bg-transparent border-none outline-none text-[#F9FAFB] flex-1 caret-[#6366F1] font-['IBM_Plex_Mono',monospace] text-[11px] sm:text-[12px]"
                    spellCheck={false}
                    autoComplete="off"
                    autoFocus
                  />
                  <span className="text-[#6366F1] select-none">{showCursor ? '█' : ' '}</span>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button
                onClick={() => navigate('/')}
                className="flex-1 px-3 py-2.5 bg-[#F9FAFB] text-[#050505] font-['IBM_Plex_Mono',monospace] text-[11px] font-bold uppercase tracking-wider border-2 border-[#F9FAFB] shadow-[3px_3px_0px_rgba(0,0,0,0.6)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.6)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_rgba(0,0,0,0.6)] transition-all duration-100"
              >
                HOME
              </button>
              <button
                onClick={() => navigate(-1)}
                className="flex-1 px-3 py-2.5 bg-transparent text-[#9CA3AF] font-['IBM_Plex_Mono',monospace] text-[11px] font-bold uppercase tracking-wider border-2 border-[#2E2E35] hover:border-[#9CA3AF] hover:text-[#F9FAFB] active:bg-[#111111] transition-all duration-100"
              >
                BACK
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 px-3 py-2.5 bg-[#6366F1] text-[#F9FAFB] font-['IBM_Plex_Mono',monospace] text-[11px] font-bold uppercase tracking-wider border-2 border-[#6366F1] shadow-[3px_3px_0px_rgba(0,0,0,0.6)] hover:bg-[#4F46E5] hover:border-[#4F46E5] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.6)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_rgba(0,0,0,0.6)] transition-all duration-100"
              >
                DASHBOARD
              </button>
            </div>

            {/* Hint */}
            <p className="text-center font-['IBM_Plex_Mono',monospace] text-[10px] text-[#6B7280]/60 mt-4 tracking-wide">
              try typing <span className="text-[#6366F1]/60">sudo rm -rf /</span>
            </p>
          </div>
        )}
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
