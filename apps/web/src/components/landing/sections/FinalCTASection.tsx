import { m } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function FinalCTASection() {
  return (
    <section className="py-24 md:py-32 bg-[#0A0A0A] relative overflow-hidden">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #F9FAFB 0.5px, transparent 0.5px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div className="border-2 border-[#2E2E35] rounded-xl bg-[#111111] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Left: CTA content */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <m.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <span className="font-['IBM_Plex_Mono',monospace] text-xs text-[#6B7280] uppercase tracking-wider inline-block mb-6">
                  Get Started
                </span>

                <h2 className="text-3xl md:text-4xl font-['Inter',sans-serif] font-bold tracking-tight text-[#F9FAFB] mb-4">
                  Ready to ship faster?
                </h2>

                <p className="text-base text-[#9CA3AF] leading-relaxed font-['Inter',sans-serif] mb-8">
                  Your repo becomes your project manager. Stop updating tickets and start shipping.
                </p>

                <div className="flex items-center gap-4">
                  <Link
                    to="/sign-up"
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-['Inter',sans-serif] font-semibold text-sm rounded-lg border-2 border-[#4F46E5] shadow-[3px_3px_0px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Get Started Free
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <Link
                    to="/features"
                    className="inline-flex items-center px-7 py-3.5 text-[#9CA3AF] font-['Inter',sans-serif] font-semibold text-sm rounded-lg border border-[#2E2E35] bg-transparent hover:border-[#F9FAFB]/20 hover:text-[#F9FAFB] hover:-translate-y-0.5 transition-all duration-300"
                  >
                    See Features
                  </Link>
                </div>

                <div className="flex items-center gap-4 mt-6">
                  <span className="font-['IBM_Plex_Mono',monospace] text-[10px] text-[#6B7280]/60 uppercase tracking-wider">
                    Free &middot; Open Source &middot; Self-hostable
                  </span>
                </div>
              </m.div>
            </div>

            {/* Right: ASCII art */}
            <div className="border-t md:border-t-0 md:border-l border-[#2E2E35] bg-[#0A0A0A] p-8 md:p-12 flex items-center justify-center">
              <m.pre
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="font-['IBM_Plex_Mono',monospace] text-xs text-[#6B7280] leading-relaxed whitespace-pre select-none"
              >
{`  $ ltf1 init

  initializing project...

  ┌─ ltf1 ──────────────────┐
  │                          │
  │  project:  my-app        │
  │  repo:     connected ✓   │
  │  team:     3 members     │
  │  sprint:   sprint-1      │
  │                          │
  │  status:   ready ✓       │
  │                          │
  └──────────────────────────┘

  > happy shipping.`}
              </m.pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
