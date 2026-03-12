import { m } from 'framer-motion'
import { Link } from 'react-router-dom'
import HeroTerminal from '@/components/landing/ascii/HeroTerminal'

export default function HeroSection() {
  // Removed — now links to /features page

  return (
    <section className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(to right, #F9FAFB 1px, transparent 1px), linear-gradient(to bottom, #F9FAFB 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {/* Radial fade */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(255,255,255,0.03) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center pt-32 pb-16">
        <m.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {/* Version badge */}
          <div className="inline-flex items-center gap-2 mb-8">
            <span className="font-['IBM_Plex_Mono',monospace] text-[11px] uppercase tracking-wider text-[#6B7280] border border-[#2E2E35] rounded px-2 py-0.5">
              v0.1.0-beta
            </span>
            <span className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#6B7280]">
              &middot;
            </span>
            <span className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#6B7280]">
              developer-first project management
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-['Inter',sans-serif] font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-[80px] tracking-tight text-[#F9FAFB] leading-[0.95] mb-6">
            Your repo is the
            <br />
            source of truth
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-[#6B7280] max-w-2xl mx-auto mb-10 leading-relaxed font-['Inter',sans-serif]">
            Tasks update themselves when you push code. Story points estimated
            from your diff. Velocity measured from actual shipping data.
          </p>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-4 mb-20">
            <Link
              to="/sign-up"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#F9FAFB] text-[#050505] font-['Inter',sans-serif] font-semibold text-sm rounded-lg hover:bg-white hover:-translate-y-0.5 transition-all duration-300 ease-out"
            >
              Get Started Free
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              to="/features"
              className="inline-flex items-center px-7 py-3.5 text-[#9CA3AF] font-['Inter',sans-serif] font-semibold text-sm rounded-lg border border-[#2E2E35] bg-transparent hover:border-[#F9FAFB]/20 hover:text-[#F9FAFB] hover:-translate-y-0.5 transition-all duration-300 ease-out"
            >
              See Features
            </Link>
          </div>
        </m.div>

        {/* Terminal demo */}
        <m.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
        >
          <HeroTerminal />
        </m.div>

        {/* Social proof line */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-16 flex flex-col items-center gap-4"
        >
          <span className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#6B7280]/60 uppercase tracking-widest">
            Built for teams that ship
          </span>
          <div className="flex items-center gap-6">
            {['git', 'typescript', 'react', 'node'].map((tech) => (
              <span
                key={tech}
                className="font-['IBM_Plex_Mono',monospace] text-xs text-[#6B7280]/40 uppercase tracking-wider"
              >
                {tech}
              </span>
            ))}
          </div>
        </m.div>
      </div>

      {/* Scroll indicator */}
      <m.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        <m.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-1"
        >
          <span className="w-px h-6 bg-gradient-to-b from-transparent to-[#6B7280]/40" />
          <span className="w-1 h-1 rounded-full bg-[#6B7280]/40" />
        </m.div>
      </m.div>
    </section>
  )
}
