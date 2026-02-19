import { useRef, useReducer, useEffect } from 'react'

// Left panel: what the developer actually does
const DEV_COMMANDS = [
  { text: '$ git add .', speed: 45, pauseAfter: 350 },
  { text: '$ git commit -m "fix auth bug"', speed: 28, pauseAfter: 450 },
  { text: '$ git push origin main', speed: 32, pauseAfter: 700 },
]

// Right panel: everything LTF1 does automatically
const ENGINE_LINES: { tag: string; text: string }[] = [
  { tag: 'DETECT', text: 'push to main (3 commits)' },
  { tag: 'PARSE', text: 'commit: "fix auth bug"' },
  { tag: 'CREATE', text: 'task LTF1-142 generated' },
  { tag: 'SCAN', text: 'diff: +47 -12 across 3 files' },
  { tag: 'ESTIMATE', text: '2 story pts (auto-calculated)' },
  { tag: 'LINK', text: 'PR #87 → task LTF1-142' },
  { tag: 'STATUS', text: 'TODO → IN PROGRESS' },
  { tag: 'BOARD', text: 'sprint-23 kanban synced' },
  { tag: 'MERGE', text: 'PR #87 → main' },
  { tag: 'CLOSE', text: 'LTF1-142 → DONE' },
  { tag: 'VELOCITY', text: '+2 pts (sprint total: 34.7)' },
  { tag: 'NOTIFY', text: '#team: task LTF1-142 shipped' },
]

const ENGINE_SPEED = 110

type HeroTerminalState = {
  started: boolean
  completedLeft: string[]
  typingText: string
  showCursor: boolean
  engineLines: typeof ENGINE_LINES
  devDone: boolean
  engineActive: boolean
  engineDone: boolean
}

const heroTerminalInitialState: HeroTerminalState = {
  started: false,
  completedLeft: [],
  typingText: '',
  showCursor: false,
  engineLines: [],
  devDone: false,
  engineActive: false,
  engineDone: false,
}

type HeroTerminalAction =
  | { type: 'UPDATE'; field: keyof HeroTerminalState; value: HeroTerminalState[keyof HeroTerminalState] }
  | { type: 'ADD_COMPLETED_LEFT'; value: string }
  | { type: 'ADD_ENGINE_LINE'; value: typeof ENGINE_LINES[number] }
  | { type: 'RESET_ANIMATION' }
  | { type: 'SHOW_FINAL' }

function heroTerminalReducer(state: HeroTerminalState, action: HeroTerminalAction): HeroTerminalState {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, [action.field]: action.value }
    case 'ADD_COMPLETED_LEFT':
      return { ...state, completedLeft: [...state.completedLeft, action.value], typingText: '' }
    case 'ADD_ENGINE_LINE':
      return { ...state, engineLines: [...state.engineLines, action.value] }
    case 'RESET_ANIMATION':
      return { ...state, completedLeft: [], typingText: '', showCursor: false, engineLines: [], devDone: false, engineActive: false, engineDone: false }
    case 'SHOW_FINAL':
      return { ...state, completedLeft: DEV_COMMANDS.map((c) => c.text), engineLines: ENGINE_LINES, devDone: true, engineActive: true, engineDone: true }
    default:
      return state
  }
}

export default function HeroTerminal() {
  const containerRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)

  const [state, dispatch] = useReducer(heroTerminalReducer, heroTerminalInitialState)
  const { started, completedLeft, typingText, showCursor, engineLines, devDone, engineActive, engineDone } = state

  // Trigger via IntersectionObserver
  useEffect(() => {
    const el = containerRef.current
    if (!el || started) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          dispatch({ type: 'UPDATE', field: 'started', value: true })
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [started])

  // Auto-scroll engine panel
  useEffect(() => {
    if (rightPanelRef.current) {
      rightPanelRef.current.scrollTop = rightPanelRef.current.scrollHeight
    }
  }, [engineLines])

  // react-doctor false positive: multiple setState calls are for animation reset and sequential timers;
  // React 18 batches synchronous setState calls in useEffect automatically
  useEffect(() => {
    if (!started) return

    // Reset for clean start
    dispatch({ type: 'RESET_ANIMATION' })

    // Reduced motion: show final state immediately
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dispatch({ type: 'SHOW_FINAL' })
      return
    }

    const timers: ReturnType<typeof setTimeout>[] = []
    let t = 300

    timers.push(setTimeout(() => dispatch({ type: 'UPDATE', field: 'showCursor', value: true }), t))

    // Phase 1: developer types git commands
    for (const cmd of DEV_COMMANDS) {
      for (let i = 1; i <= cmd.text.length; i++) {
        const d = t
        timers.push(setTimeout(() => dispatch({ type: 'UPDATE', field: 'typingText', value: cmd.text.slice(0, i) }), d))
        t += cmd.speed
      }
      const lineEnd = t
      timers.push(
        setTimeout(() => {
          dispatch({ type: 'ADD_COMPLETED_LEFT', value: cmd.text })
        }, lineEnd)
      )
      t += cmd.pauseAfter
    }

    // Dev done
    const devEnd = t
    timers.push(
      setTimeout(() => {
        dispatch({ type: 'UPDATE', field: 'showCursor', value: false })
        dispatch({ type: 'UPDATE', field: 'devDone', value: true })
      }, devEnd)
    )
    t += 350

    // Phase 2: engine fires up
    timers.push(setTimeout(() => dispatch({ type: 'UPDATE', field: 'engineActive', value: true }), t))

    for (let i = 0; i < ENGINE_LINES.length; i++) {
      const d = t
      timers.push(
        setTimeout(
          () => dispatch({ type: 'ADD_ENGINE_LINE', value: ENGINE_LINES[i] }),
          d
        )
      )
      t += ENGINE_SPEED
    }

    timers.push(setTimeout(() => dispatch({ type: 'UPDATE', field: 'engineDone', value: true }), t))

    return () => timers.forEach(clearTimeout)
  }, [started])

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto mb-8 text-left">
      <div className="flex flex-col md:flex-row gap-4">
        {/* LEFT CARD: Developer */}
        <div className="flex-1 bg-[#111111] border-2 border-[#2E2E35] rounded-xl overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
          {/* Header */}
          <div className="bg-[#0A0A0A] px-4 py-2 border-b border-[#2E2E35] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="font-['IBM_Plex_Mono',monospace] text-[11px] uppercase tracking-wider text-[#9CA3AF]">
              Developer
            </span>
          </div>

          {/* Content */}
          <div className="p-4 font-['IBM_Plex_Mono',monospace] text-sm min-h-[160px] md:min-h-[260px] flex flex-col">
            <div className="flex-1">
              {completedLeft.map((line) => (
                <div key={line} className="text-[#F9FAFB] leading-7">
                  {line}
                </div>
              ))}
              {showCursor && (
                <div className="text-[#F9FAFB] leading-7">
                  {typingText}
                  <span className="inline-block w-[7px] h-[14px] bg-[#F9FAFB]/80 ml-px align-middle animate-pulse" />
                </div>
              )}
            </div>
            {devDone && (
              <div className="text-[#6B7280] text-xs pt-2 border-t border-[#2E2E35]/50 mt-auto font-['IBM_Plex_Mono',monospace]">
                {'>'} done. 3 commands.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CARD: LTF1 Engine */}
        <div className="flex-1 bg-[#111111] border-2 border-[#2E2E35] rounded-xl overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">
          {/* Header */}
          <div className="bg-[#0A0A0A] px-4 py-2 border-b border-[#2E2E35] flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                engineActive ? 'bg-[#6366F1]' : 'bg-[#6B7280]/40'
              }`}
            />
            <span
              className={`font-['IBM_Plex_Mono',monospace] text-[11px] uppercase tracking-wider transition-colors duration-300 ${
                engineActive ? 'text-[#6366F1]' : 'text-[#9CA3AF]'
              }`}
            >
              LTF1 Engine
            </span>
            {engineActive && !engineDone && (
              <span className="w-1.5 h-1.5 bg-[#6366F1] rounded-full animate-pulse ml-auto" />
            )}
            {engineDone && (
              <span className="text-[#10B981] text-xs ml-auto font-['IBM_Plex_Mono',monospace]">
                Done
              </span>
            )}
          </div>

          {/* Content */}
          <div
            ref={rightPanelRef}
            className="p-4 font-['IBM_Plex_Mono',monospace] text-sm overflow-y-auto min-h-[160px] md:min-h-[260px] flex flex-col"
          >
            {!engineActive ? (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-[#6B7280]/30 text-xs uppercase tracking-widest select-none">
                  Waiting for push...
                </span>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  {engineLines.map((line) => (
                    <div key={line.tag} className="leading-6 flex">
                      <span className="text-[#6366F1] shrink-0 w-[80px]">
                        [{line.tag}]
                      </span>
                      <span className="text-[#9CA3AF]">{line.text}</span>
                    </div>
                  ))}
                </div>
                {engineDone && (
                  <div className="text-[#6B7280] text-xs pt-2 border-t border-[#2E2E35]/50 mt-auto font-['IBM_Plex_Mono',monospace]">
                    {'>'} {ENGINE_LINES.length} operations &middot; 0 manual
                    effort
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
