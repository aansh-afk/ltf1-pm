import { useRef, useState, useEffect } from 'react'
import { m, AnimatePresence } from 'framer-motion'

const steps = [
  {
    number: '01',
    trigger: 'Commit',
    result: 'Task Created',
    description: 'Push code and a task is automatically generated from your commit message and diff analysis.',
    ascii: `  $ git commit -m "fix auth"

  [main 3a1f2c8] fix auth
   3 files changed, 47(+), 12(-)

  ┌─ ltf1 ──────────────────┐
  │ task LTF1-142 created   │
  │ assigned: @you          │
  │ sprint:   sprint-23     │
  └─────────────────────────┘`,
  },
  {
    number: '02',
    trigger: 'Pull Request',
    result: 'Task Linked',
    description: 'Open a PR and LTF1 links it to the task, auto-generates a description, and moves status.',
    ascii: `  PR #87: fix auth bug
  ────────────────────────
  linked:  LTF1-142
  status:  TODO → IN REVIEW
  desc:    auto-generated ✓

  reviewers:
    @ada ···· requested
    @bob ···· requested`,
  },
  {
    number: '03',
    trigger: 'Merge',
    result: 'Task Closed',
    description: 'Merge to main. The task resolves itself. Sprint board, velocity, and notifications all update.',
    ascii: `  ✓ PR #87 merged → main

  LTF1-142:
    status:   DONE ✓
    points:   2 (shipped)
    sprint:   sprint-23 updated
    velocity: +2 pts

  > notified #team`,
  },
  {
    number: '04',
    trigger: 'Git Log',
    result: 'Velocity',
    description: 'Your git history becomes your velocity tracker. Real shipping data, not guesses.',
    ascii: `  velocity ─── sprint-23 ───

  week 1:  ████████░░  41 pts
  week 2:  ██████████  52 pts

  trend:     ↑ 27% vs prev
  shipped:   18 tasks
  avg cycle: 1.4 days

  > on track for release`,
  },
]

export default function HowItWorksSection() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const onScroll = () => {
      const rect = wrapper.getBoundingClientRect()
      const wrapperHeight = rect.height
      const viewportHeight = window.innerHeight

      const scrolled = -rect.top
      const scrollableDistance = wrapperHeight - viewportHeight
      if (scrollableDistance <= 0) return

      const progress = Math.max(0, Math.min(1, scrolled / scrollableDistance))
      const index = Math.min(
        steps.length - 1,
        Math.floor(progress * steps.length)
      )
      setActiveIndex(index)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const current = steps[activeIndex]

  return (
    <div ref={wrapperRef} style={{ height: `${steps.length * 100}vh` }}>
      <section
        id="how-it-works"
        className="sticky top-0 h-screen bg-[#0A0A0A] relative overflow-hidden flex flex-col justify-center"
      >
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #F9FAFB 0.5px, transparent 0.5px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="max-w-5xl mx-auto px-6 relative z-10 w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="text-[#6B7280] text-xs font-mono uppercase tracking-wider inline-block mb-4">
              How It Works
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-['Inter',sans-serif] font-bold tracking-tight text-[#F9FAFB]">
              Four steps. Zero manual effort.
            </h2>
          </div>

          {/* Progress steps */}
          <div className="flex items-center justify-center gap-1 mb-10">
            {steps.map((s, i) => (
              <button
                key={s.number}
                onClick={() => setActiveIndex(i)}
                aria-label={`Step ${s.number}: ${s.trigger}`}
                className="flex items-center gap-1"
              >
                <span className={`font-['IBM_Plex_Mono',monospace] text-[10px] uppercase tracking-wider transition-colors duration-300 px-2 py-1 rounded ${
                  i === activeIndex
                    ? 'text-[#F9FAFB] bg-[#F9FAFB]/5'
                    : i < activeIndex
                    ? 'text-[#6B7280]'
                    : 'text-[#6B7280]/40'
                }`}>
                  {s.trigger}
                </span>
                {i < steps.length - 1 && (
                  <span className={`text-xs transition-colors duration-300 ${
                    i < activeIndex ? 'text-[#6B7280]' : 'text-[#2E2E35]'
                  }`}>
                    &rarr;
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Main card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-2 border-[#2E2E35] rounded-xl bg-[#111111] overflow-hidden min-h-[380px]">
            {/* Left: content */}
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <m.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <span className="font-['IBM_Plex_Mono',monospace] text-xs text-[#6B7280]">
                      step {current.number}
                    </span>
                    <span className="text-[#2E2E35]">/</span>
                    <span className="font-['IBM_Plex_Mono',monospace] text-xs text-[#6B7280]">
                      {String(steps.length).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-lg font-['Inter',sans-serif] font-semibold text-[#9CA3AF]">
                      {current.trigger}
                    </span>
                    <span className="text-[#6B7280]">&rarr;</span>
                    <span className="text-lg font-['Inter',sans-serif] font-semibold text-[#F9FAFB]">
                      {current.result}
                    </span>
                  </div>

                  <p className="text-sm md:text-base text-[#6B7280] leading-relaxed mb-6 font-['Inter',sans-serif]">
                    {current.description}
                  </p>

                  <span className="inline-block text-xs font-mono text-[#6B7280] border border-[#2E2E35] rounded px-2 py-1">
                    automated &middot; real-time
                  </span>
                </m.div>
              </AnimatePresence>
            </div>

            {/* Right: ASCII */}
            <div className="border-t md:border-t-0 md:border-l border-[#2E2E35] bg-[#0A0A0A] p-8 md:p-10 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <m.pre
                  key={activeIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="font-['IBM_Plex_Mono',monospace] text-xs md:text-sm text-[#9CA3AF] leading-relaxed whitespace-pre select-none"
                >
                  {current.ascii}
                </m.pre>
              </AnimatePresence>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="text-center mt-6">
            <span className="text-[10px] font-mono text-[#6B7280]/50 uppercase tracking-widest">
              Scroll to explore
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
