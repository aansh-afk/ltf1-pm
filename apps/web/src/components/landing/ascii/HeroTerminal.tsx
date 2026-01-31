import { useRef, useState, useEffect } from 'react'

// ── Left panel: what the developer actually does ──────────────────
const DEV_COMMANDS = [
  { text: '$ git add .', speed: 45, pauseAfter: 350 },
  { text: '$ git commit -m "fix auth bug"', speed: 28, pauseAfter: 450 },
  { text: '$ git push origin main', speed: 32, pauseAfter: 700 },
]

// ── Right panel: everything LTF1 does automatically ───────────────
const ENGINE_LINES: { tag: string; text: string }[] = [
  { tag: 'DETECT', text: 'push to main (3 commits)' },
  { tag: 'PARSE', text: 'commit: "fix auth bug"' },
  { tag: 'CREATE', text: 'task LTF1-142 generated' },
  { tag: 'SCAN', text: 'diff: +47 −12 across 3 files' },
  { tag: 'ESTIMATE', text: '2 story pts (auto-calculated)' },
  { tag: 'LINK', text: 'PR #87 → task LTF1-142' },
  { tag: 'STATUS', text: 'TODO → IN PROGRESS' },
  { tag: 'BOARD', text: 'sprint-23 kanban synced' },
  { tag: 'MERGE', text: 'PR #87 → main ✓' },
  { tag: 'CLOSE', text: 'LTF1-142 → DONE' },
  { tag: 'VELOCITY', text: '+2 pts (sprint total: 34.7)' },
  { tag: 'NOTIFY', text: '#team: task LTF1-142 shipped' },
]

const ENGINE_SPEED = 110

export default function HeroTerminal() {
  const containerRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)

  const [started, setStarted] = useState(false)
  const [completedLeft, setCompletedLeft] = useState<string[]>([])
  const [typingText, setTypingText] = useState('')
  const [showCursor, setShowCursor] = useState(false)
  const [engineLines, setEngineLines] = useState<typeof ENGINE_LINES>([])
  const [devDone, setDevDone] = useState(false)
  const [engineActive, setEngineActive] = useState(false)
  const [engineDone, setEngineDone] = useState(false)

  // ── Trigger: IntersectionObserver (no framer-motion dep) ──
  useEffect(() => {
    const el = containerRef.current
    if (!el || started) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [started])

  // ── Auto-scroll engine panel ──
  useEffect(() => {
    if (rightPanelRef.current) {
      rightPanelRef.current.scrollTop = rightPanelRef.current.scrollHeight
    }
  }, [engineLines])

  // ── Animation: pre-computed setTimeout array ──
  useEffect(() => {
    if (!started) return

    // Reset for clean start (handles strict-mode remounts)
    setCompletedLeft([])
    setTypingText('')
    setShowCursor(false)
    setEngineLines([])
    setDevDone(false)
    setEngineActive(false)
    setEngineDone(false)

    // Reduced motion: show final state immediately
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCompletedLeft(DEV_COMMANDS.map(c => c.text))
      setEngineLines(ENGINE_LINES)
      setDevDone(true)
      setEngineActive(true)
      setEngineDone(true)
      return
    }

    // Pre-compute every setTimeout up front
    const timers: ReturnType<typeof setTimeout>[] = []
    let t = 300 // small initial delay to let paint settle

    // Show blinking cursor
    timers.push(setTimeout(() => setShowCursor(true), t))

    // Phase 1: developer types git commands
    for (const cmd of DEV_COMMANDS) {
      for (let i = 1; i <= cmd.text.length; i++) {
        const d = t
        timers.push(setTimeout(() => setTypingText(cmd.text.slice(0, i)), d))
        t += cmd.speed
      }
      const lineEnd = t
      timers.push(
        setTimeout(() => {
          setCompletedLeft(prev => [...prev, cmd.text])
          setTypingText('')
        }, lineEnd)
      )
      t += cmd.pauseAfter
    }

    // Dev done
    const devEnd = t
    timers.push(
      setTimeout(() => {
        setShowCursor(false)
        setDevDone(true)
      }, devEnd)
    )
    t += 350

    // Phase 2: engine fires up
    timers.push(setTimeout(() => setEngineActive(true), t))

    for (let i = 0; i < ENGINE_LINES.length; i++) {
      const d = t
      timers.push(
        setTimeout(
          () => setEngineLines(prev => [...prev, ENGINE_LINES[i]]),
          d
        )
      )
      t += ENGINE_SPEED
    }

    timers.push(setTimeout(() => setEngineDone(true), t))

    return () => timers.forEach(clearTimeout)
  }, [started])

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto mb-32px text-left">
      <div className="border-2 border-basalt-border bg-carbon-plate">
        {/* ── HEADER BAR ── */}
        <div className="flex border-b-2 border-basalt-border text-[10px] font-mono uppercase tracking-wider">
          <div className="w-full md:w-[38%] px-12px py-8px border-b md:border-b-0 md:border-r-2 border-basalt-border flex items-center gap-8px">
            <span className="text-cathode-white/20">//</span>
            <span className="text-cathode-white/40">YOUR TERMINAL</span>
          </div>
          <div className="hidden md:flex w-[62%] px-12px py-8px items-center gap-8px">
            <span className="text-brutal-info/30">&gt;&gt;</span>
            <span
              className={`transition-colors duration-300 ${
                engineActive ? 'text-brutal-info' : 'text-cathode-white/20'
              }`}
            >
              LTF1 ENGINE
            </span>
            {engineActive && !engineDone && (
              <span className="w-[5px] h-[5px] bg-brutal-info animate-pulse ml-auto" />
            )}
            {engineDone && (
              <span className="text-terminal-green/50 ml-auto">✓ DONE</span>
            )}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="flex flex-col md:flex-row">
          {/* LEFT PANEL */}
          <div className="md:w-[38%] border-b-2 md:border-b-0 md:border-r-2 border-basalt-border p-16px font-mono text-[11px] md:text-xs flex flex-col min-h-[130px] md:min-h-[280px]">
            <div className="flex-1">
              {completedLeft.map((line, i) => (
                <div key={i} className="text-cathode-white/90 leading-[2]">
                  {line}
                </div>
              ))}
              {showCursor && (
                <div className="text-cathode-white/90 leading-[2]">
                  {typingText}
                  <span className="inline-block w-[7px] h-[14px] bg-cathode-white/80 ml-px align-middle animate-cursor-blink" />
                </div>
              )}
            </div>
            {devDone && (
              <div className="text-cathode-white/20 text-[10px] pt-8px border-t border-basalt-border/30 mt-auto font-mono">
                {'>'} done. 3 commands.
              </div>
            )}
          </div>

          {/* MOBILE ENGINE HEADER */}
          <div className="md:hidden flex px-12px py-8px border-b border-basalt-border items-center gap-8px text-[10px] font-mono uppercase tracking-wider">
            <span className="text-brutal-info/30">&gt;&gt;</span>
            <span
              className={`transition-colors duration-300 ${
                engineActive ? 'text-brutal-info' : 'text-cathode-white/20'
              }`}
            >
              LTF1 ENGINE
            </span>
            {engineActive && !engineDone && (
              <span className="w-[5px] h-[5px] bg-brutal-info animate-pulse ml-auto" />
            )}
            {engineDone && (
              <span className="text-terminal-green/50 ml-auto">✓ DONE</span>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div
            ref={rightPanelRef}
            className="md:w-[62%] p-16px font-mono text-[10px] md:text-[11px] overflow-y-auto flex flex-col min-h-[220px] md:min-h-[280px]"
          >
            {!engineActive ? (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-cathode-white/[0.06] text-[10px] uppercase tracking-[0.25em] font-mono select-none">
                  WAITING FOR PUSH...
                </span>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  {engineLines.map((line, i) => (
                    <div key={i} className="leading-[1.7] flex">
                      <span className="text-brutal-info/70 shrink-0 w-[76px] md:w-[84px]">
                        [{line.tag}]
                      </span>
                      <span className="text-cathode-white/45">
                        {line.text}
                      </span>
                    </div>
                  ))}
                </div>
                {engineDone && (
                  <div className="text-cathode-white/20 text-[10px] pt-8px border-t border-basalt-border/30 mt-auto font-mono">
                    {'>'} ✓ {ENGINE_LINES.length} operations &middot; 0 manual
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
