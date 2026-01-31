import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ParticleConstellation from '../ascii/ParticleConstellation'

const WITHOUT_STEPS = [
  'git commit -m "fix auth bug"',
  'open browser',
  'navigate to jira board',
  'find the right ticket',
  'update status to "in review"',
  'add comment with PR link',
  'estimate remaining hours',
  'update sprint board',
]

const WITH_STEPS = [
  'git commit -m "fix auth bug"',
  'git push',
]

export default function ProblemSection() {
  const [withLtf1, setWithLtf1] = useState(false)

  return (
    <section className="marketing-section bg-carbon-plate relative overflow-hidden">
      <ParticleConstellation />
      <div className="marketing-container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-48px md:mb-64px"
        >
          <p className="marketing-label">
            <span className="text-brutal-info/40 mr-4px">::</span>
            THE PROBLEM
          </p>
          <h2 className="text-section-title md:text-hero-sm font-bold uppercase text-cathode-white">
            &ldquo;DID YOU UPDATE JIRA?&rdquo;
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          {/* Toggle switch */}
          <div className="flex items-center justify-center gap-16px mb-32px">
            <span
              className={`text-xs uppercase tracking-wider font-mono transition-colors ${
                !withLtf1 ? 'text-cathode-white/80' : 'text-cathode-white/25'
              }`}
            >
              WITHOUT LTF1
            </span>
            <button
              onClick={() => setWithLtf1(v => !v)}
              className={`relative w-[52px] h-[28px] border-2 transition-colors duration-200 ${
                withLtf1
                  ? 'border-brutal-info bg-brutal-info/10'
                  : 'border-basalt-border bg-event-horizon'
              }`}
              aria-label={withLtf1 ? 'Switch to without LTF1' : 'Switch to with LTF1'}
            >
              <span
                className={`absolute top-[3px] w-[18px] h-[18px] transition-all duration-200 ${
                  withLtf1
                    ? 'left-[27px] bg-brutal-info'
                    : 'left-[3px] bg-cathode-white/40'
                }`}
              />
            </button>
            <span
              className={`text-xs uppercase tracking-wider font-mono transition-colors ${
                withLtf1 ? 'text-brutal-info' : 'text-cathode-white/25'
              }`}
            >
              WITH LTF1
            </span>
          </div>

          {/* Comparison board */}
          <div
            className={`border-2 transition-colors duration-200 ${
              withLtf1 ? 'border-brutal-info' : 'border-basalt-border'
            }`}
          >
            {/* Header */}
            <div
              className={`bg-event-horizon px-16px py-8px border-b-2 flex items-center gap-8px transition-colors duration-200 ${
                withLtf1 ? 'border-brutal-info' : 'border-basalt-border'
              }`}
            >
              <span
                className={`text-xs font-mono mr-4px transition-colors duration-200 ${
                  withLtf1 ? 'text-brutal-info/60' : 'text-brutal-info/30'
                }`}
              >
                {withLtf1 ? '>>' : '//'}
              </span>
              <span
                className={`text-xs uppercase tracking-wider transition-colors duration-200 ${
                  withLtf1 ? 'text-brutal-info' : 'text-cathode-white/40'
                }`}
              >
                {withLtf1 ? 'YOUR WORKFLOW WITH LTF1' : 'YOUR CURRENT WORKFLOW'}
              </span>
            </div>

            {/* Steps */}
            <div className="bg-event-horizon">
              <AnimatePresence mode="wait">
                <motion.div
                  key={withLtf1 ? 'with' : 'without'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {(withLtf1 ? WITH_STEPS : WITHOUT_STEPS).map((step, i) => (
                    <div
                      key={i}
                      className={
                        withLtf1
                          ? 'code-diff-line-add'
                          : 'code-diff-line-remove'
                      }
                    >
                      {withLtf1 ? '+ ' : '- '}
                      {step}
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>

            </div>
          </div>

          {/* Tagline below terminal */}
          <AnimatePresence mode="wait">
            {withLtf1 ? (
              <motion.p
                key="with-tagline"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="text-center mt-24px text-lg md:text-xl lg:text-2xl font-bold uppercase tracking-wider font-mono"
              >
                <span className="text-cathode-white">THAT&apos;S IT. </span>
                <span className="text-brutal-info">LTF1</span>
                <span className="text-cathode-white"> HANDLES THE REST.</span>
              </motion.p>
            ) : (
              <motion.p
                key="without-tagline"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="text-center mt-24px text-lg md:text-xl lg:text-2xl font-bold uppercase tracking-wider font-mono"
              >
                <span className="text-cathode-white">10 MINUTES. </span>
                <span className="text-brutal-info">EVERY. SINGLE. TIME.</span>
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
