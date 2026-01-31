import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ParticleConstellation from '../ascii/ParticleConstellation'

const features = [
  {
    number: '01',
    title: 'PR-DRIVEN UPDATES',
    description:
      'TASKS UPDATE THEMSELVES WHEN YOU OPEN, REVIEW, OR MERGE PULL REQUESTS. NO MANUAL STATUS CHANGES.',
    detail: 'GITHUB + GITLAB + BITBUCKET',
  },
  {
    number: '02',
    title: 'CODE COMPLEXITY ESTIMATES',
    description:
      'AI ANALYZES YOUR DIFF TO ESTIMATE STORY POINTS. NO MORE 2-HOUR PLANNING POKER SESSIONS.',
    detail: 'POWERED BY CODE ANALYSIS',
  },
  {
    number: '03',
    title: 'TECH DEBT SURFACING',
    description:
      'AUTOMATICALLY FLAGS GROWING COMPLEXITY, MISSING TESTS, AND ARCHITECTURAL DRIFT IN YOUR CODEBASE.',
    detail: 'REAL-TIME MONITORING',
  },
  {
    number: '04',
    title: 'GIT-BASED VELOCITY',
    description:
      'VELOCITY METRICS FROM ACTUAL SHIPPING DATA. COMMITS, PRS, AND DEPLOYS. NOT STORY POINT THEATER.',
    detail: 'EVIDENCE-BASED METRICS',
  },
  {
    number: '05',
    title: 'CROSS PLATFORM',
    description:
      'WORKS WITH YOUR EXISTING STACK. GITHUB, GITLAB, BITBUCKET. SLACK, DISCORD, TEAMS. ONE INTEGRATION, EVERY PLATFORM.',
    detail: 'ZERO MIGRATION COST',
  },
  {
    number: '06',
    title: 'TERMINAL-FIRST',
    description:
      'A FULL TUI APP FOR MANAGING PROJECTS WITHOUT LEAVING YOUR TERMINAL. KEYBOARD-DRIVEN. NO BROWSER REQUIRED.',
    detail: 'CLI + TUI INCLUDED',
  },
  {
    number: '07',
    title: 'OPEN SOURCE',
    description:
      'FULLY OPEN SOURCE. SELF-HOST IT, AUDIT IT, FORK IT. BUT WE\'D LOVE YOUR PR. BUILD THE FEATURES YOU WANT AND WE\'LL SHIP THEM.',
    detail: 'MODIFIED MIT LICENSE',
  },
]

export default function CoreFeaturesSection() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const onScroll = () => {
      const rect = wrapper.getBoundingClientRect()
      const wrapperHeight = rect.height
      const viewportHeight = window.innerHeight

      // How far we've scrolled into the wrapper:
      // 0 = wrapper top is at viewport top, 1 = wrapper bottom is at viewport bottom
      const scrolled = -rect.top
      const scrollableDistance = wrapperHeight - viewportHeight
      if (scrollableDistance <= 0) return

      const progress = Math.max(0, Math.min(1, scrolled / scrollableDistance))

      const index = Math.min(
        features.length - 1,
        Math.floor(progress * features.length)
      )
      setActiveIndex(index)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const current = features[activeIndex]

  return (
    // Tall outer wrapper: each feature gets 100vh of scroll distance
    <div
      ref={wrapperRef}
      style={{ height: `${features.length * 100}vh` }}
    >
      {/* Sticky inner section: pins to viewport while wrapper scrolls */}
      <section
        id="features"
        className="sticky top-0 h-screen bg-carbon-plate relative overflow-hidden flex flex-col justify-center"
      >
        <ParticleConstellation />
        <div className="marketing-container relative z-10 px-24px">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-48px md:mb-64px"
          >
            <p className="marketing-label">
              <span className="text-brutal-info/40 mr-4px">::</span>
              CORE DIFFERENTIATORS
            </p>
            <h2 className="text-section-title md:text-hero-sm font-bold uppercase text-cathode-white">
              WHAT MAKES LTF1 DIFFERENT
            </h2>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {/* Progress dots */}
            <div className="flex items-center justify-center gap-8px mb-32px">
              {features.map((f, i) => (
                <button
                  key={f.number}
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Feature ${f.number}: ${f.title}`}
                  className={`h-[3px] transition-all duration-300 ${
                    i === activeIndex
                      ? 'w-[32px] bg-brutal-info'
                      : 'w-[12px] bg-basalt-border hover:bg-cathode-white/20'
                  }`}
                />
              ))}
            </div>

            {/* Featured card */}
            <div className="border-2 border-basalt-border bg-event-horizon relative min-h-[220px] md:min-h-[200px]">
              <span
                aria-hidden="true"
                className="absolute top-8px right-12px text-brutal-info/15 font-mono text-[10px] select-none"
              >
                //
              </span>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="p-24px md:p-40px"
                >
                  {/* Title + number row */}
                  <div className="flex items-baseline gap-12px mb-16px">
                    <h3 className="text-xl md:text-2xl font-bold text-brutal-info uppercase">
                      {current.title}
                    </h3>
                    <span className="text-xs text-cathode-white/20 font-mono">
                      {current.number}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm md:text-base text-cathode-white/50 uppercase leading-relaxed mb-20px max-w-2xl">
                    {current.description}
                  </p>

                  {/* Detail tag */}
                  <div className="text-xs text-brutal-info/50 uppercase tracking-wider font-mono">
                    {'>'} {current.detail}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Feature count */}
            <div className="text-center mt-16px text-[10px] text-cathode-white/15 font-mono uppercase tracking-wider">
              {String(activeIndex + 1).padStart(2, '0')} / {String(features.length).padStart(2, '0')}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
