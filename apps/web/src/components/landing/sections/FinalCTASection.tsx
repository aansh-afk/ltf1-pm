import { motion } from 'framer-motion'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import WaitlistForm from '../WaitlistForm'
import ParticleConstellation from '../ascii/ParticleConstellation'

export default function FinalCTASection() {
  const stats = useQuery(api.waitlist.getWaitlistStats)

  return (
    <section className="marketing-section bg-event-horizon relative overflow-hidden">
      <ParticleConstellation />
      {/* Corner ornaments */}
      <span aria-hidden="true" className="absolute top-24px left-24px text-brutal-info/10 font-mono text-xs select-none">+--</span>
      <span aria-hidden="true" className="absolute top-24px right-24px text-brutal-info/10 font-mono text-xs select-none">--+</span>
      <span aria-hidden="true" className="absolute bottom-24px left-24px text-brutal-info/10 font-mono text-xs select-none">+--</span>
      <span aria-hidden="true" className="absolute bottom-24px right-24px text-brutal-info/10 font-mono text-xs select-none">--+</span>

      <div className="marketing-container text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="marketing-label">
            <span className="text-brutal-info/40 mr-4px">&gt;&gt;</span>
            READY?
          </p>
          <h2 className="text-section-title md:text-hero-sm lg:text-hero-md font-bold uppercase text-cathode-white mb-16px md:mb-24px">
            STOP UPDATING BOARDS.
            <br />
            <span className="text-brutal-info">START SHIPPING CODE.</span>
          </h2>

          <p className="text-sm md:text-base text-cathode-white/40 uppercase tracking-wider mb-48px max-w-xl mx-auto">
            JOIN THE WAITLIST. BE FIRST TO EXPERIENCE PROJECT MANAGEMENT THAT ACTUALLY UNDERSTANDS YOUR CODE.
          </p>

          {/* Waitlist Form */}
          <div className="max-w-lg mx-auto mb-32px">
            <WaitlistForm source="landing" />
          </div>

          {/* Social proof - waitlist count */}
          {stats && stats.totalCount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-8px border border-basalt-border px-16px py-8px"
            >
              <span className="w-8px h-8px bg-brutal-info animate-pulse" />
              <span className="text-xs text-cathode-white/50 uppercase tracking-wider">
                {stats.totalCount.toLocaleString()} PEOPLE WAITING
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
