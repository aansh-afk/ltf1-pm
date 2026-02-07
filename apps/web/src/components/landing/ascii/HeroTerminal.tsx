import { useRef, useState, useEffect } from 'react'

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

  // Trigger via IntersectionObserver
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

  // Auto-scroll engine panel
  useEffect(() => {
    if (rightPanelRef.current) {
      rightPanelRef.current.scrollTop = rightPanelRef.current.scrollHeight
    }
  }, [engineLines])

  // Animation: pre-computed setTimeout array
  useEffect(() => {
    if (!started) return

    // Reset for clean start
    setCompletedLeft([])
    setTypingText('')
    setShowCursor(false)
    setEngineLines([])
    setDevDone(false)
    setEngineActive(false)
    setEngineDone(false)

    // Reduced motion: show final state immediately
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCompletedLeft(DEV_COMMANDS.map((c) => c.text))
      setEngineLines(ENGINE_LINES)
      setDevDone(true)
      setEngineActive(true)
      setEngineDone(true)
      return
    }

    const timers: ReturnType<typeof setTimeout>[] = []
    let t = 300

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
          setCompletedLeft((prev) => [...prev, cmd.text])
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
          () => setEngineLines((prev) => [...prev, ENGINE_LINES[i]]),
          d
        )
      )
      t += ENGINE_SPEED
    }

    timers.push(setTimeout(() => setEngineDone(true), t))

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
              {completedLeft.map((line, i) => (
                <div key={i} className="text-[#F9FAFB] leading-7">
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
                  {engineLines.map((line, i) => (
                    <div key={i} className="leading-6 flex">
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
