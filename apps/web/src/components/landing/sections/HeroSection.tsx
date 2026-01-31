import { motion } from 'framer-motion'
import WaitlistForm from '../WaitlistForm'
import AsciiNoise from '../ascii/AsciiNoise'
import HeroTerminal from '../ascii/HeroTerminal'

export default function HeroSection() {
  return (
    <section className="min-h-[90vh] flex items-center justify-center bg-event-horizon relative overflow-hidden">
      {/* Ambient ASCII noise background */}
      <AsciiNoise density={2} opacity={0.03} color="text-brutal-info" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `
            linear-gradient(to right, #F5F5F5 1px, transparent 1px),
            linear-gradient(to bottom, #F5F5F5 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Corner ornaments */}
      <span aria-hidden="true" className="absolute top-24px left-24px text-brutal-info/10 font-mono text-xs select-none">+--</span>
      <span aria-hidden="true" className="absolute top-24px right-24px text-brutal-info/10 font-mono text-xs select-none">--+</span>
      <span aria-hidden="true" className="absolute bottom-24px left-24px text-brutal-info/10 font-mono text-xs select-none">+--</span>
      <span aria-hidden="true" className="absolute bottom-24px right-24px text-brutal-info/10 font-mono text-xs select-none">--+</span>

      <div className="relative z-10 marketing-container px-24px text-center py-96px">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Label */}
          <p className="marketing-label">
            <span className="text-brutal-info/40 mr-4px">&gt;&gt;</span>
            CODE-AWARE PROJECT MANAGEMENT
          </p>

          {/* Headline */}
          <h1 className="text-hero-sm sm:text-hero-md md:text-hero-lg lg:text-hero-xl xl:text-hero-2xl font-bold uppercase text-cathode-white mb-24px md:mb-32px leading-none">
            YOUR REPO IS THE
            <br />
            <span className="text-brutal-info">SOURCE OF TRUTH.</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-base sm:text-lg md:text-xl text-cathode-white/60 uppercase tracking-wider mb-32px md:mb-40px max-w-2xl mx-auto">
            STOP UPDATING JIRA. LTF1 WATCHES YOUR GIT REPO AND MANAGES YOUR PROJECTS AUTOMATICALLY.
          </p>

          {/* Side-by-side: developer vs LTF1 engine */}
          <HeroTerminal />

          {/* Waitlist CTA */}
          <div className="max-w-lg mx-auto">
            <WaitlistForm source="landing" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
