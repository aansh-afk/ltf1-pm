import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  HiMail,
  HiPhone,
  HiChat,
  HiLightningBolt,
  HiClock,
  HiShieldCheck,
  HiSupport,
  HiCash
} from 'react-icons/hi'
import { FaGithub, FaTwitter, FaDiscord, FaSlack } from 'react-icons/fa'
import PublicNavigation from '../components/common/PublicNavigation'
import Footer from '../components/common/Footer'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: 'sales',
    message: '',
    users: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitStatus('success')
      setTimeout(() => setSubmitStatus('idle'), 5000)
    }, 2000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-carbon-plate">
      <PublicNavigation />

      {/* HERO SECTION */}
      <section className="py-80px px-16px md:px-24px border-b-2 border-basalt-border">
        <div className="max-w-full md:max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-bold mb-24px"
          >
            <span className="text-cathode-white">GET IN</span>{' '}
            <span className="text-brutal-info">TOUCH</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-cathode-white/80 uppercase tracking-wider"
          >
            REAL DEVELOPERS. REAL SUPPORT. REAL SOLUTIONS.
          </motion.p>
        </div>
      </section>

      <div className="max-w-full md:max-w-7xl mx-auto px-16px md:px-24px py-80px">
        <div className="grid lg:grid-cols-2 gap-24px md:gap-48px">
          {/* CONTACT FORM */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold mb-32px text-cathode-white">
              START THE <span className="text-brutal-info">CONVERSATION</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-24px">
              <div>
                <label className="block text-sm font-bold text-cathode-white mb-8px uppercase">
                  I NEED HELP WITH
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-16px py-12px bg-event-horizon border-2 border-basalt-border text-cathode-white focus:border-brutal-info outline-none"
                  required
                >
                  <option value="demo">REQUEST A DEMO</option>
                  <option value="git-integration">GIT INTEGRATION HELP</option>
                  <option value="pricing">PRICING QUESTIONS</option>
                  <option value="support">TECHNICAL SUPPORT</option>
                  <option value="partnership">PARTNERSHIP</option>
                  <option value="other">OTHER</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-16px md:gap-24px">
                <div>
                  <label className="block text-xs md:text-sm font-bold text-cathode-white mb-8px uppercase">
                    NAME
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-16px py-12px bg-event-horizon border-2 border-basalt-border text-cathode-white focus:border-brutal-info outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-cathode-white mb-8px uppercase">
                    EMAIL
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-16px py-12px bg-event-horizon border-2 border-basalt-border text-cathode-white focus:border-brutal-info outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-16px md:gap-24px">
                <div>
                  <label className="block text-xs md:text-sm font-bold text-cathode-white mb-8px uppercase">
                    COMPANY
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-16px py-12px bg-event-horizon border-2 border-basalt-border text-cathode-white focus:border-brutal-info outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-cathode-white mb-8px uppercase">
                    TEAM SIZE
                  </label>
                  <select
                    name="users"
                    value={formData.users}
                    onChange={handleChange}
                    className="w-full px-16px py-12px bg-event-horizon border-2 border-basalt-border text-cathode-white focus:border-brutal-info outline-none"
                    required
                  >
                    <option value="">SELECT SIZE</option>
                    <option value="1-10">1-10 DEVELOPERS</option>
                    <option value="11-50">11-50 DEVELOPERS</option>
                    <option value="51-200">51-200 DEVELOPERS</option>
                    <option value="201-500">201-500 DEVELOPERS</option>
                    <option value="500+">500+ DEVELOPERS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-cathode-white mb-8px uppercase">
                  MESSAGE
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-16px py-12px bg-event-horizon border-2 border-basalt-border text-cathode-white focus:border-brutal-info outline-none resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`
                  marketing-cta w-full text-xl py-16px
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                  ${submitStatus === 'success' ? 'bg-brutal-success border-brutal-success' : ''}
                `}
              >
                {isSubmitting ? 'TRANSMITTING...' : submitStatus === 'success' ? 'MESSAGE SENT!' : 'SEND MESSAGE'}
              </button>
            </form>
          </motion.div>

          {/* CONTACT INFO */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-32px"
          >
            {/* RESPONSE TIMES */}
            <div className="brutal-card p-32px">
              <h3 className="text-2xl font-bold mb-24px flex items-center gap-12px">
                <HiClock className="text-brutal-info" />
                RESPONSE TIMES
              </h3>
              <div className="space-y-16px text-cathode-white/80">
                <div className="flex justify-between">
                  <span>ENTERPRISE</span>
                  <span className="text-brutal-success">2 HOURS</span>
                </div>
                <div className="flex justify-between">
                  <span>SCALE</span>
                  <span className="text-brutal-success">4 HOURS</span>
                </div>
                <div className="flex justify-between">
                  <span>STARTUP</span>
                  <span className="text-brutal-info">24 HOURS</span>
                </div>
                <div className="flex justify-between">
                  <span>LOCALHOST</span>
                  <span className="text-cathode-white/50">COMMUNITY</span>
                </div>
              </div>
            </div>

            {/* DIRECT CHANNELS */}
            <div className="brutal-card p-32px">
              <h3 className="text-2xl font-bold mb-24px flex items-center gap-12px">
                <HiLightningBolt className="text-brutal-info" />
                DIRECT CHANNELS
              </h3>
              <div className="space-y-16px">
                <a href="mailto:sales@ltf1.dev" className="flex items-center gap-12px text-cathode-white hover:text-brutal-info">
                  <HiMail className="text-xl" />
                  <span>SALES@LTF1.DEV</span>
                </a>
                <a href="mailto:support@ltf1.dev" className="flex items-center gap-12px text-cathode-white hover:text-brutal-info">
                  <HiSupport className="text-xl" />
                  <span>SUPPORT@LTF1.DEV</span>
                </a>
                <a href="mailto:enterprise@ltf1.dev" className="flex items-center gap-12px text-cathode-white hover:text-brutal-info">
                  <HiCash className="text-xl" />
                  <span>ENTERPRISE@LTF1.DEV</span>
                </a>
                <a href="tel:+1-888-LTF1-DEV" className="flex items-center gap-12px text-cathode-white hover:text-brutal-info">
                  <HiPhone className="text-xl" />
                  <span>+1-888-LTF1-DEV</span>
                </a>
              </div>
            </div>

            {/* COMMUNITY */}
            <div className="brutal-card p-32px">
              <h3 className="text-2xl font-bold mb-24px flex items-center gap-12px">
                <HiChat className="text-brutal-info" />
                COMMUNITY
              </h3>
              <div className="flex md:grid md:grid-cols-2 gap-16px overflow-x-auto md:overflow-x-visible pb-12px md:pb-0 snap-x snap-mandatory md:snap-none"
                   style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
                <a href="https://github.com/ltf1" className="snap-start flex-shrink-0 md:flex-shrink-auto w-[160px] md:w-auto brutal-btn text-center flex items-center justify-center gap-8px">
                  <FaGithub /> GITHUB
                </a>
                <a href="https://discord.gg/ltf1" className="snap-start flex-shrink-0 md:flex-shrink-auto w-[160px] md:w-auto brutal-btn text-center flex items-center justify-center gap-8px">
                  <FaDiscord /> DISCORD
                </a>
                <a href="https://ltf1.slack.com" className="snap-start flex-shrink-0 md:flex-shrink-auto w-[160px] md:w-auto brutal-btn text-center flex items-center justify-center gap-8px">
                  <FaSlack /> SLACK
                </a>
                <a href="https://twitter.com/ltf1dev" className="snap-start flex-shrink-0 md:flex-shrink-auto w-[160px] md:w-auto brutal-btn text-center flex items-center justify-center gap-8px">
                  <FaTwitter /> TWITTER
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ENTERPRISE SECTION */}
      <section className="py-80px border-t-2 border-basalt-border bg-event-horizon">
        <div className="max-w-full md:max-w-5xl mx-auto px-16px md:px-24px text-center">
          <h2 className="text-5xl font-bold mb-24px text-cathode-white">
            <span className="text-brutal-info">ENTERPRISE</span> SOLUTIONS
          </h2>

          <p className="text-xl text-cathode-white/80 mb-48px uppercase">
            ON-PREMISE DEPLOYMENT. CUSTOM INTEGRATIONS. DEDICATED SUPPORT.
          </p>

          <div className="flex md:grid md:grid-cols-4 gap-24px mb-48px overflow-x-auto md:overflow-x-visible pb-16px md:pb-0 snap-x snap-mandatory md:snap-none"
               style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
            <div className="snap-start flex-shrink-0 md:flex-shrink-auto w-[280px] md:w-auto brutal-card p-24px">
              <HiShieldCheck className="w-48px h-48px text-brutal-info mx-auto mb-16px" />
              <h3 className="text-lg font-bold mb-8px text-cathode-white">99.99% SLA</h3>
              <p className="text-sm text-cathode-white/60">Guaranteed uptime</p>
            </div>

            <div className="snap-start flex-shrink-0 md:flex-shrink-auto w-[280px] md:w-auto brutal-card p-24px">
              <HiShieldCheck className="w-48px h-48px text-brutal-info mx-auto mb-16px" />
              <h3 className="text-lg font-bold mb-8px text-cathode-white">ON-PREMISE</h3>
              <p className="text-sm text-cathode-white/60">Your infrastructure</p>
            </div>

            <div className="snap-start flex-shrink-0 md:flex-shrink-auto w-[280px] md:w-auto brutal-card p-24px">
              <HiPhone className="w-48px h-48px text-brutal-info mx-auto mb-16px" />
              <h3 className="text-lg font-bold mb-8px text-cathode-white">24/7 PHONE</h3>
              <p className="text-sm text-cathode-white/60">Direct support line</p>
            </div>

            <div className="snap-start flex-shrink-0 md:flex-shrink-auto w-[280px] md:w-auto brutal-card p-24px">
              <HiLightningBolt className="w-48px h-48px text-brutal-info mx-auto mb-16px" />
              <h3 className="text-lg font-bold mb-8px text-cathode-white">INSTANT</h3>
              <p className="text-sm text-cathode-white/60">15-min response</p>
            </div>
          </div>

          <a
            href="mailto:enterprise@ltf1.dev"
            className="marketing-cta text-xl px-48px py-24px inline-block"
          >
            CONTACT ENTERPRISE SALES
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}
