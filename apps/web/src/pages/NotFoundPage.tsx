import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useRef, useCallback, useReducer } from 'react'

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
type TypewriterState = {
  displayed: string[]
  done: boolean
}

type TypewriterAction =
  | { type: 'UPDATE_LINE'; lineIdx: number; text: string }
  | { type: 'DONE' }
  | { type: 'RESET' }

function typewriterReducer(state: TypewriterState, action: TypewriterAction): TypewriterState {
  switch (action.type) {
    case 'UPDATE_LINE': {
      const next = [...state.displayed]
      next[action.lineIdx] = action.text
      return { ...state, displayed: next }
    }
    case 'DONE':
      return { ...state, done: true }
    case 'RESET':
      return { displayed: [], done: false }
    default:
      return state
  }
}

function useTypewriter(lines: string[], speed = 25, startDelay = 800) {
  const [state, dispatch] = useReducer(typewriterReducer, { displayed: [], done: false })

  useEffect(() => {
    dispatch({ type: 'RESET' })
    let lineIdx = 0
    let charIdx = 0
    let timeout: NodeJS.Timeout

    const startTimeout = setTimeout(() => {
      const tick = () => {
        if (lineIdx >= lines.length) {
          dispatch({ type: 'DONE' })
          return
        }

        const currentLine = lines[lineIdx]
        if (charIdx <= currentLine.length) {
          dispatch({ type: 'UPDATE_LINE', lineIdx, text: currentLine.slice(0, charIdx) })
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

  return { displayed: state.displayed, done: state.done }
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
          className="absolute font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-primary)] select-none"
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

// ── Sub-components ──

interface CrashPhaseProps {
  traceLines: string[]
  traceDone: boolean
  showCursor: boolean
}

function CrashPhase({ traceLines, traceDone, showCursor }: CrashPhaseProps) {
  return (
    <div className="w-full max-w-2xl">
      {/* Error code */}
      <div className="text-center mb-6">
        <span
          className="font-['IBM_Plex_Mono',monospace] text-[80px] sm:text-[100px] font-black leading-none tracking-tighter"
          style={{
            color: 'transparent',
            WebkitTextStroke: '2px var(--theme-error)',
            filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.15))',
          }}
        >
          404
        </span>
      </div>

      {/* Stack trace typewriter */}
      <div className="bg-[var(--theme-background-secondary)]/80 border border-[var(--theme-border)] p-4 font-['IBM_Plex_Mono',monospace] text-[11px] sm:text-[12px] leading-relaxed max-w-xl mx-auto">
        {traceLines.map((line, i) => (
          <div
            key={`trace-${line || 'empty'}`}
            className={
              i === 0
                ? 'text-[var(--theme-error)] font-bold'
                : line?.includes('<-- FAULT')
                  ? 'text-[var(--theme-warning)]'
                  : line?.startsWith('  ')
                    ? 'text-[var(--theme-foreground-tertiary)]'
                    : 'text-[var(--theme-foreground-secondary)]'
            }
          >
            {line}
            {i === traceLines.length - 1 && !traceDone && (
              <span className="text-[var(--theme-primary)]">{showCursor ? '█' : ' '}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface TerminalPhaseProps {
  location: { pathname: string }
  hexDump: string[]
  termLines: Array<{ text: string; color: string }>
  cmdInput: string
  showCursor: boolean
  dispatch: React.Dispatch<NotFoundAction>
  handleCmd: (e: React.KeyboardEvent<HTMLInputElement>) => void
  navigate: (to: string | number) => void
  termRef: React.RefObject<HTMLDivElement | null>
  inputRef: React.RefObject<HTMLInputElement | null>
}

function TerminalPhase({ location, hexDump, termLines, cmdInput, showCursor, dispatch, handleCmd, navigate, termRef, inputRef }: TerminalPhaseProps) {
  return (
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
              WebkitTextStroke: '2px var(--theme-error)',
            }}
          >
            404
          </span>
          <div>
            <div className="font-['IBM_Plex_Mono',monospace] text-[13px] text-[var(--theme-foreground)] font-semibold uppercase tracking-wider">
              Page not found
            </div>
            <div className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[var(--theme-foreground-tertiary)]">
              {location.pathname}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[var(--theme-error)] animate-pulse" />
          <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-error)] uppercase tracking-widest">
            fault
          </span>
        </div>
      </div>

      {/* Terminal window */}
      <div className="bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] shadow-[4px_4px_0px_rgba(0,0,0,0.8)]">
        {/* Title bar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--theme-border)] bg-[var(--theme-background-tertiary)]">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-[var(--theme-error)]" />
            <div className="w-2 h-2 bg-[var(--theme-warning)]" />
            <div className="w-2 h-2 bg-[var(--theme-success)]" />
          </div>
          <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-tertiary)] tracking-wider uppercase">
            recovery_shell
          </span>
          <div className="w-12" />
        </div>

        {/* Terminal content */}
        <div
          ref={termRef}
          className="p-3 sm:p-4 h-[280px] sm:h-[320px] overflow-y-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--theme-border) transparent' }}
        >
          {/* Welcome message */}
          <div className="font-['IBM_Plex_Mono',monospace] text-[11px] sm:text-[12px] leading-relaxed mb-3">
            <div className="text-[var(--theme-error)] font-bold">SYSTEM CRASH RECOVERY</div>
            <div className="text-[var(--theme-foreground-tertiary)] mt-1">
              The page at <span className="text-[var(--theme-primary)]">{location.pathname}</span> caused a fault.
            </div>
            <div className="text-[var(--theme-foreground-tertiary)]">
              Use this terminal to navigate. Type <span className="text-[var(--theme-success)]">help</span> for commands.
            </div>

            {/* Mini hex dump */}
            <div className="mt-3 mb-1 text-[var(--theme-foreground-tertiary)]/50 text-[10px]">
              {hexDump.slice(0, 3).map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>

            <div className="border-t border-[var(--theme-border)] mt-3 mb-2" />
          </div>

          {/* Command history */}
          <div className="font-['IBM_Plex_Mono',monospace] text-[11px] sm:text-[12px] leading-relaxed space-y-0.5">
            {termLines.map((line) => (
              <div key={`term-${line.text || 'empty'}-${line.color}`} style={{ color: line.color }}>
                {line.text || '\u00A0'}
              </div>
            ))}
          </div>

          {/* Input line */}
          <div className="flex items-center gap-1.5 font-['IBM_Plex_Mono',monospace] text-[11px] sm:text-[12px] mt-1">
            <span className="text-[var(--theme-success)] select-none">{'>'}</span>
            <input
              ref={inputRef}
              type="text"
              value={cmdInput}
              onChange={(e) => dispatch({ type: 'UPDATE', field: 'cmdInput', value: e.target.value })}
              onKeyDown={handleCmd}
              aria-label="Terminal command input"
              className="bg-transparent border-none outline-none text-[var(--theme-foreground)] flex-1 caret-[var(--theme-primary)] font-['IBM_Plex_Mono',monospace] text-[11px] sm:text-[12px]"
              spellCheck={false}
              autoComplete="off"
            />
            <span className="text-[var(--theme-primary)] select-none">{showCursor ? '█' : ' '}</span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <button
          onClick={() => navigate('/')}
          className="flex-1 px-3 py-2.5 bg-[var(--theme-foreground)] text-[var(--theme-background)] font-['IBM_Plex_Mono',monospace] text-[11px] font-bold uppercase tracking-wider border-2 border-[var(--theme-foreground)] shadow-[3px_3px_0px_rgba(0,0,0,0.6)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.6)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_rgba(0,0,0,0.6)] transition-all duration-100"
        >
          HOME
        </button>
        <button
          onClick={() => navigate(-1)}
          className="flex-1 px-3 py-2.5 bg-transparent text-[var(--theme-foreground-secondary)] font-['IBM_Plex_Mono',monospace] text-[11px] font-bold uppercase tracking-wider border-2 border-[var(--theme-border)] hover:border-[var(--theme-foreground-secondary)] hover:text-[var(--theme-foreground)] active:bg-[var(--theme-background-tertiary)] transition-all duration-100"
        >
          BACK
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex-1 px-3 py-2.5 bg-[var(--theme-primary)] text-[var(--theme-foreground)] font-['IBM_Plex_Mono',monospace] text-[11px] font-bold uppercase tracking-wider border-2 border-[var(--theme-primary)] shadow-[3px_3px_0px_rgba(0,0,0,0.6)] hover:bg-[var(--theme-primary-active)] hover:border-[var(--theme-primary-active)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.6)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_rgba(0,0,0,0.6)] transition-all duration-100"
        >
          DASHBOARD
        </button>
      </div>

      {/* Hint */}
      <p className="text-center font-['IBM_Plex_Mono',monospace] text-[10px] text-[var(--theme-foreground-tertiary)]/60 mt-4 tracking-wide">
        try typing <span className="text-[var(--theme-primary)]/60">sudo rm -rf /</span>
      </p>
    </div>
  )
}

// ── Main page state ──
type NotFoundState = {
  phase: 'boot' | 'crash' | 'terminal'
  hexDump: string[]
  cmdInput: string
  termLines: Array<{ text: string; color: string }>
  showCursor: boolean
  bootFlicker: boolean
}

const notFoundInitialState: NotFoundState = {
  phase: 'boot',
  hexDump: generateHexDump(),
  cmdInput: '',
  termLines: [],
  showCursor: true,
  bootFlicker: true,
}

type NotFoundAction =
  | { type: 'UPDATE'; field: keyof NotFoundState; value: unknown }
  | { type: 'CLEAR_TERM' }
  | { type: 'ADD_TERM_LINE'; text: string; color: string }
  | { type: 'TOGGLE_CURSOR' }

function notFoundReducer(state: NotFoundState, action: NotFoundAction): NotFoundState {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, [action.field]: action.value }
    case 'CLEAR_TERM':
      return { ...state, termLines: [] }
    case 'ADD_TERM_LINE':
      return { ...state, termLines: [...state.termLines, { text: action.text, color: action.color }] }
    case 'TOGGLE_CURSOR':
      return { ...state, showCursor: !state.showCursor }
    default:
      return state
  }
}

export default function NotFoundPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [state, dispatch] = useReducer(notFoundReducer, notFoundInitialState)
  const { phase, hexDump, cmdInput, termLines, showCursor, bootFlicker } = state
  const termRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { displayed: traceLines, done: traceDone } = useTypewriter(
    STACK_TRACE,
    18,
    1200
  )

  // React 18 auto-batches: dispatches are in separate setTimeout callbacks for boot animation sequence
  useEffect(() => {
    const t1 = setTimeout(() => dispatch({ type: 'UPDATE', field: 'bootFlicker', value: false }), 150)
    const t2 = setTimeout(() => dispatch({ type: 'UPDATE', field: 'bootFlicker', value: true }), 200)
    const t3 = setTimeout(() => dispatch({ type: 'UPDATE', field: 'bootFlicker', value: false }), 250)
    const t4 = setTimeout(() => dispatch({ type: 'UPDATE', field: 'phase', value: 'crash' }), 400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [])

  // Transition to terminal after trace
  useEffect(() => {
    if (traceDone && phase === 'crash') {
      const t = setTimeout(() => dispatch({ type: 'UPDATE', field: 'phase', value: 'terminal' }), 600)
      return () => clearTimeout(t)
    }
  }, [traceDone, phase])

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => dispatch({ type: 'TOGGLE_CURSOR' }), 530)
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

  const addTermLine = useCallback((text: string, color = 'var(--theme-foreground-secondary)') => {
    dispatch({ type: 'ADD_TERM_LINE', text, color })
  }, [])

  const handleCmd = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter' || !cmdInput.trim()) return

      const raw = cmdInput.trim()
      const cmd = raw.toLowerCase()
      addTermLine(`> ${raw}`, 'var(--theme-foreground)')
      dispatch({ type: 'UPDATE', field: 'cmdInput', value: '' })

      if (cmd === 'help') {
        addTermLine('', 'var(--theme-foreground-tertiary)')
        addTermLine('AVAILABLE COMMANDS:', 'var(--theme-primary)')
        addTermLine('  home        Return to homepage', 'var(--theme-foreground-secondary)')
        addTermLine('  back        Go to previous page', 'var(--theme-foreground-secondary)')
        addTermLine('  dashboard   Open dashboard', 'var(--theme-foreground-secondary)')
        addTermLine('  pricing     View pricing', 'var(--theme-foreground-secondary)')
        addTermLine('  whereami    Show current path', 'var(--theme-foreground-secondary)')
        addTermLine('  ls          List available routes', 'var(--theme-foreground-secondary)')
        addTermLine('  clear       Clear terminal', 'var(--theme-foreground-secondary)')
        addTermLine('  reboot      Restart system', 'var(--theme-foreground-secondary)')
        addTermLine('', 'var(--theme-foreground-tertiary)')
      } else if (cmd === 'home' || cmd === 'cd /') {
        addTermLine('Redirecting to /...', 'var(--theme-success)')
        setTimeout(() => navigate('/'), 400)
      } else if (cmd === 'back' || cmd === 'cd ..') {
        addTermLine('Going back...', 'var(--theme-success)')
        setTimeout(() => navigate(-1), 400)
      } else if (cmd === 'dashboard') {
        addTermLine('Loading dashboard...', 'var(--theme-success)')
        setTimeout(() => navigate('/dashboard'), 400)
      } else if (cmd === 'pricing') {
        addTermLine('Loading pricing...', 'var(--theme-success)')
        setTimeout(() => navigate('/pricing'), 400)
      } else if (cmd === 'whereami') {
        addTermLine(`  ${location.pathname}`, 'var(--theme-error)')
        addTermLine('  (this page does not exist)', 'var(--theme-foreground-tertiary)')
      } else if (cmd === 'ls') {
        addTermLine('', 'var(--theme-foreground-tertiary)')
        addTermLine('  /              Landing page', 'var(--theme-foreground-secondary)')
        addTermLine('  /dashboard     Main dashboard', 'var(--theme-foreground-secondary)')
        addTermLine('  /projects      Projects view', 'var(--theme-foreground-secondary)')
        addTermLine('  /tasks         Task manager', 'var(--theme-foreground-secondary)')
        addTermLine('  /pricing       Pricing plans', 'var(--theme-foreground-secondary)')
        addTermLine('  /contact       Contact us', 'var(--theme-foreground-secondary)')
        addTermLine('', 'var(--theme-foreground-tertiary)')
      } else if (cmd === 'clear') {
        dispatch({ type: 'CLEAR_TERM' })
      } else if (cmd === 'reboot') {
        addTermLine('Rebooting system...', 'var(--theme-warning)')
        addTermLine('', 'var(--theme-foreground-tertiary)')
        setTimeout(() => {
          addTermLine('[  OK  ] Unmounting filesystems', 'var(--theme-success)')
        }, 300)
        setTimeout(() => {
          addTermLine('[  OK  ] Stopping all services', 'var(--theme-success)')
        }, 600)
        setTimeout(() => {
          addTermLine('[  OK  ] System reboot', 'var(--theme-success)')
          setTimeout(() => navigate('/'), 500)
        }, 900)
      } else if (cmd === 'sudo rm -rf /') {
        addTermLine('Nice try.', 'var(--theme-error)')
      } else if (cmd === 'exit') {
        addTermLine('There is no escape.', 'var(--theme-primary)')
      } else {
        addTermLine(`command not found: ${raw}`, 'var(--theme-error)')
        addTermLine('type "help" for available commands', 'var(--theme-foreground-tertiary)')
      }
    },
    [cmdInput, navigate, location.pathname, addTermLine]
  )

  return (
    <div
      className="min-h-screen bg-[var(--theme-background)] flex flex-col relative overflow-hidden cursor-text select-none"
      role="button"
      tabIndex={0}
      aria-label="Focus terminal input"
      onClick={() => inputRef.current?.focus()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.focus() }}
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
          <CrashPhase traceLines={traceLines} traceDone={traceDone} showCursor={showCursor} />
        )}

        {/* ── TERMINAL PHASE ── */}
        {phase === 'terminal' && (
          <TerminalPhase
            location={location}
            hexDump={hexDump}
            termLines={termLines}
            cmdInput={cmdInput}
            showCursor={showCursor}
            dispatch={dispatch}
            handleCmd={handleCmd}
            navigate={navigate}
            termRef={termRef}
            inputRef={inputRef}
          />
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
