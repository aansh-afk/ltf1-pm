import { useState, useRef, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'

const WITHOUT_STEPS = [
  { cmd: 'git commit -m "fix auth bug"', type: 'dev' as const },
  { cmd: 'open browser → navigate to jira', type: 'manual' as const },
  { cmd: 'search for the correct ticket', type: 'manual' as const },
  { cmd: 'update status: TODO → IN REVIEW', type: 'manual' as const },
  { cmd: 'paste PR link in comment', type: 'manual' as const },
  { cmd: 'estimate remaining hours', type: 'manual' as const },
  { cmd: 'update sprint board', type: 'manual' as const },
  { cmd: 'notify team in slack', type: 'manual' as const },
]

const WITH_STEPS = [
  { cmd: 'git commit -m "fix auth bug"', type: 'dev' as const },
  { cmd: 'git push origin main', type: 'dev' as const },
]

const AUTO_LOG = [
  '[DETECT]  push to main (1 commit)',
  '[PARSE]   commit: "fix auth bug"',
  '[LINK]    PR #87 → LTF1-142',
  '[STATUS]  TODO → IN REVIEW',
  '[EST]     2 pts (auto-calculated)',
  '[BOARD]   sprint-23 updated',
  '[NOTIFY]  #team: LTF1-142 in review',
]

export default function ProblemSection() {
  const [withLtf1, setWithLtf1] = useState(false)
  const [visibleLog, setVisibleLog] = useState<string[]>([])
  const logTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  // react-doctor false positive: setVisibleLog reset is synchronous, subsequent calls are in async timers
  useEffect(() => {
    logTimers.current.forEach(clearTimeout)
    logTimers.current = []
    setVisibleLog([])

    if (withLtf1) {
      AUTO_LOG.forEach((line, i) => {
        const timer = setTimeout(() => {
          setVisibleLog((prev) => [...prev, line])
        }, 400 + i * 120)
        logTimers.current.push(timer)
      })
    }

    return () => logTimers.current.forEach(clearTimeout)
  }, [withLtf1])

  const steps = withLtf1 ? WITH_STEPS : WITHOUT_STEPS
  const manualCount = steps.filter((s) => s.type === 'manual').length

  return (
    <section id="problem" className="py-24 md:py-32 relative overflow-hidden">
      {/* Grid bg */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="text-[#6B7280] text-xs font-mono uppercase tracking-wider inline-block mb-4">
            The Problem
          </span>
          <h2 className="font-['Inter',sans-serif] font-bold text-3xl md:text-5xl tracking-tight text-[#F9FAFB] mb-4">
            Stop updating tickets manually
          </h2>
          <p className="text-lg text-[#6B7280] max-w-xl mx-auto font-['Inter',sans-serif]">
            Your git workflow is your project management workflow
          </p>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setWithLtf1(false)}
              className={`font-['IBM_Plex_Mono',monospace] text-xs uppercase tracking-wider px-3 py-1.5 rounded border transition-all duration-300 ${
                !withLtf1
                  ? 'border-[#F9FAFB]/20 text-[#F9FAFB] bg-[#F9FAFB]/5'
                  : 'border-[#2E2E35] text-[#6B7280] hover:text-[#9CA3AF]'
              }`}
            >
              Without LTF1
            </button>
            <button
              onClick={() => setWithLtf1(true)}
              className={`font-['IBM_Plex_Mono',monospace] text-xs uppercase tracking-wider px-3 py-1.5 rounded border transition-all duration-300 ${
                withLtf1
                  ? 'border-[#F9FAFB]/20 text-[#F9FAFB] bg-[#F9FAFB]/5'
                  : 'border-[#2E2E35] text-[#6B7280] hover:text-[#9CA3AF]'
              }`}
            >
              With LTF1
            </button>
          </div>

          {/* Main card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-[#2E2E35] rounded-xl bg-[#111111] overflow-hidden min-h-[360px]">
            {/* Left: steps */}
            <div className="p-8 md:p-10 flex flex-col">
              <div className="flex items-baseline gap-3 mb-6">
                <span className="font-['IBM_Plex_Mono',monospace] text-xs text-[#6B7280]">
                  {withLtf1 ? 'your workflow' : 'current workflow'}
                </span>
                <span className="font-['IBM_Plex_Mono',monospace] text-xs text-[#2E2E35]">&middot;</span>
                <span className="font-['IBM_Plex_Mono',monospace] text-xs text-[#6B7280]">
                  {steps.length} steps
                  {manualCount > 0 && ` (${manualCount} manual)`}
                </span>
              </div>

              <AnimatePresence mode="wait">
                <m.div
                  key={withLtf1 ? 'with' : 'without'}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="flex-1"
                >
                  {steps.map((step, i) => (
                    <div
                      key={step.cmd}
                      className="flex items-start gap-3 py-1.5 font-['IBM_Plex_Mono',monospace] text-sm"
                    >
                      <span className="text-[#6B7280]/50 w-5 text-right text-xs shrink-0 pt-0.5">
                        {i + 1}
                      </span>
                      <span className={step.type === 'manual' ? 'text-[#6B7280]/60 line-through decoration-[#6B7280]/20' : 'text-[#F9FAFB]'}>
                        {step.cmd}
                      </span>
                      {step.type === 'manual' && (
                        <span className="text-[10px] text-[#6B7280]/40 uppercase shrink-0 pt-0.5">manual</span>
                      )}
                    </div>
                  ))}
                </m.div>
              </AnimatePresence>

              <div className="mt-auto pt-4 border-t border-[#2E2E35]/50">
                <AnimatePresence mode="wait">
                  <m.span
                    key={withLtf1 ? 'w' : 'wo'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-['IBM_Plex_Mono',monospace] text-xs text-[#6B7280]"
                  >
                    {withLtf1
                      ? '> done. ltf1 handles the rest.'
                      : '> ~10 minutes of context switching. every time.'}
                  </m.span>
                </AnimatePresence>
              </div>
            </div>

            {/* Right: engine log (only visible in "with" mode) */}
            <div className="border-t md:border-t-0 md:border-l border-[#2E2E35] bg-[#0A0A0A] p-8 md:p-10 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${withLtf1 ? 'bg-[#F9FAFB]' : 'bg-[#6B7280]/30'}`} />
                <span className="font-['IBM_Plex_Mono',monospace] text-xs text-[#6B7280]">
                  ltf1 engine
                </span>
              </div>

              <AnimatePresence mode="wait">
                {withLtf1 ? (
                  <m.div
                    key="engine-on"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1"
                  >
                    {visibleLog.map((line, i) => (
                      <m.div
                        key={`log-${line}`}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.15 }}
                        className="font-['IBM_Plex_Mono',monospace] text-xs text-[#9CA3AF] leading-6"
                      >
                        {line}
                      </m.div>
                    ))}
                    {visibleLog.length === AUTO_LOG.length && (
                      <m.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-4 pt-3 border-t border-[#2E2E35]/50"
                      >
                        <span className="font-['IBM_Plex_Mono',monospace] text-xs text-[#6B7280]">
                          {'>'} 7 operations &middot; 0 manual effort
                        </span>
                      </m.div>
                    )}
                  </m.div>
                ) : (
                  <m.div
                    key="engine-off"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex items-center justify-center"
                  >
                    <div className="text-center">
                      <pre className="font-['IBM_Plex_Mono',monospace] text-xs text-[#6B7280]/20 leading-relaxed select-none">
{`  ┌───────────────────┐
  │                   │
  │   click "with"    │
  │   to see the      │
  │   difference      │
  │                   │
  └───────────────────┘`}
                      </pre>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </m.div>
      </div>
    </section>
  )
}
