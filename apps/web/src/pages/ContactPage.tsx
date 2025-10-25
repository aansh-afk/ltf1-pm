import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { 
  HiMail, 
  HiPhone, 
  HiChat,
  HiLightningBolt,
  HiOfficeBuilding,
  HiGlobe,
  HiClock,
  HiShieldCheck,
  HiSupport,
  HiCash
} from 'react-icons/hi'
import { FaGithub, FaTwitter, FaLinkedin, FaDiscord, FaSlack } from 'react-icons/fa'
import PublicNavigation from '../components/common/PublicNavigation'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    tier: 'production',
    subject: 'sales',
    message: '',
    budget: '',
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
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* NAVIGATION */}
      <PublicNavigation currentPage="contact" />

      {/* HERO SECTION */}
      <section className="py-80px px-16px md:px-24px border-b-2 border-[#333333]">
        <div className="max-w-full md:max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-bold mb-24px"
          >
            <span className="text-[#FFFFFF]">GET IN</span>{' '}
            <span className="glitch-text">TOUCH</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-[#FFFFFF]/80 uppercase tracking-wider"
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
            <h2 className="text-3xl font-bold mb-32px text-[#FFFFFF]">
              START THE <span className="text-[#00FFFF]">CONVERSATION</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-24px">
              {/* CONTACT TYPE */}
              <div>
                <label className="block text-sm font-bold text-[#FFFFFF] mb-8px uppercase">
                  I NEED HELP WITH
                </label>
                <select 
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-16px py-12px bg-[#000000] border-2 border-[#333333] text-[#FFFFFF] focus:border-[#00FFFF] outline-none"
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
                {/* NAME */}
                <div>
                  <label className="block text-xs md:text-sm font-bold text-[#FFFFFF] mb-8px uppercase">
                    NAME
                  </label>
                  <input 
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-16px py-12px bg-[#000000] border-2 border-[#333333] text-[#FFFFFF] focus:border-[#00FFFF] outline-none"
                    required
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label className="block text-sm font-bold text-[#FFFFFF] mb-8px uppercase">
                    EMAIL
                  </label>
                  <input 
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-16px py-12px bg-[#000000] border-2 border-[#333333] text-[#FFFFFF] focus:border-[#00FFFF] outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-16px md:gap-24px">
                {/* COMPANY */}
                <div>
                  <label className="block text-xs md:text-sm font-bold text-[#FFFFFF] mb-8px uppercase">
                    COMPANY
                  </label>
                  <input 
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-16px py-12px bg-[#000000] border-2 border-[#333333] text-[#FFFFFF] focus:border-[#00FFFF] outline-none"
                    required
                  />
                </div>

                {/* TEAM SIZE */}
                <div>
                  <label className="block text-sm font-bold text-[#FFFFFF] mb-8px uppercase">
                    TEAM SIZE
                  </label>
                  <select 
                    name="users"
                    value={formData.users}
                    onChange={handleChange}
                    className="w-full px-16px py-12px bg-[#000000] border-2 border-[#333333] text-[#FFFFFF] focus:border-[#00FFFF] outline-none"
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

              {/* MESSAGE */}
              <div>
                <label className="block text-sm font-bold text-[#FFFFFF] mb-8px uppercase">
                  MESSAGE
                </label>
                <textarea 
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-16px py-12px bg-[#000000] border-2 border-[#333333] text-[#FFFFFF] focus:border-[#00FFFF] outline-none resize-none"
                  required
                />
              </div>

              {/* SUBMIT */}
              <button 
                type="submit"
                disabled={isSubmitting}
                className={`
                  brutal-btn w-full text-xl py-16px
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                  ${submitStatus === 'success' ? 'bg-[#00FF00] text-[#000000]' : 'bg-gradient-to-r from-[#00FFFF] via-[#FF00FF] to-[#FFFF00] text-[#000000]'}
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
                <HiClock className="text-[#00FFFF]" />
                RESPONSE TIMES
              </h3>
              <div className="space-y-16px text-[#FFFFFF]/80">
                <div className="flex justify-between">
                  <span>ENTERPRISE</span>
                  <span className="text-[#00FF00]">2 HOURS</span>
                </div>
                <div className="flex justify-between">
                  <span>SCALE</span>
                  <span className="text-[#00FF00]">4 HOURS</span>
                </div>
                <div className="flex justify-between">
                  <span>STARTUP</span>
                  <span className="text-[#FFFF00]">24 HOURS</span>
                </div>
                <div className="flex justify-between">
                  <span>LOCALHOST</span>
                  <span className="text-[#FFFFFF]/50">COMMUNITY</span>
                </div>
              </div>
            </div>

            {/* DIRECT CHANNELS */}
            <div className="brutal-card p-32px">
              <h3 className="text-2xl font-bold mb-24px flex items-center gap-12px">
                <HiLightningBolt className="text-[#FFFF00]" />
                DIRECT CHANNELS
              </h3>
              <div className="space-y-16px">
                <a href="mailto:sales@ltf1.dev" className="flex items-center gap-12px text-[#FFFFFF] hover:text-[#00FFFF]">
                  <HiMail className="text-xl" />
                  <span>SALES@LTF1.DEV</span>
                </a>
                <a href="mailto:support@ltf1.dev" className="flex items-center gap-12px text-[#FFFFFF] hover:text-[#00FFFF]">
                  <HiSupport className="text-xl" />
                  <span>SUPPORT@LTF1.DEV</span>
                </a>
                <a href="mailto:enterprise@ltf1.dev" className="flex items-center gap-12px text-[#FFFFFF] hover:text-[#00FFFF]">
                  <HiCash className="text-xl" />
                  <span>ENTERPRISE@LTF1.DEV</span>
                </a>
                <a href="tel:+1-888-LTF1-DEV" className="flex items-center gap-12px text-[#FFFFFF] hover:text-[#00FFFF]">
                  <HiPhone className="text-xl" />
                  <span>+1-888-LTF1-DEV</span>
                </a>
              </div>
            </div>

            {/* COMMUNITY */}
            <div className="brutal-card p-32px">
              <h3 className="text-2xl font-bold mb-24px flex items-center gap-12px">
                <HiChat className="text-[#FF00FF]" />
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

            {/* OFFICES */}
            <div className="brutal-card p-32px">
              <h3 className="text-2xl font-bold mb-24px flex items-center gap-12px">
                <HiOfficeBuilding className="text-[#00FF00]" />
                GLOBAL PRESENCE
              </h3>
              <div className="space-y-16px text-[#FFFFFF]/80">
                <div>
                  <div className="font-bold text-[#FFFFFF]">SAN FRANCISCO</div>
                  <div className="text-sm">1337 MISSION ST, CA 94103</div>
                  <div className="text-sm text-[#00FFFF]">PST (UTC-8)</div>
                </div>
                <div>
                  <div className="font-bold text-[#FFFFFF]">LONDON</div>
                  <div className="text-sm">42 SILICON ROUNDABOUT, EC1Y</div>
                  <div className="text-sm text-[#00FFFF]">GMT (UTC+0)</div>
                </div>
                <div>
                  <div className="font-bold text-[#FFFFFF]">SINGAPORE</div>
                  <div className="text-sm">8 MARINA VIEW, 018960</div>
                  <div className="text-sm text-[#00FFFF]">SGT (UTC+8)</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ENTERPRISE SECTION */}
      <section className="py-80px border-t-2 border-[#333333] bg-[#000000]">
        <div className="max-w-full md:max-w-5xl mx-auto px-16px md:px-24px text-center">
          <h2 className="text-5xl font-bold mb-24px">
            <span className="glitch-text">ENTERPRISE</span> SOLUTIONS
          </h2>
          
          <p className="text-xl text-[#FFFFFF]/80 mb-48px uppercase">
            ON-PREMISE DEPLOYMENT. CUSTOM INTEGRATIONS. DEDICATED SUPPORT.
          </p>

          <div className="flex md:grid md:grid-cols-4 gap-24px mb-48px overflow-x-auto md:overflow-x-visible pb-16px md:pb-0 snap-x snap-mandatory md:snap-none"
               style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
            <div className="snap-start flex-shrink-0 md:flex-shrink-auto w-[280px] md:w-auto brutal-card p-24px">
              <HiShieldCheck className="w-48px h-48px text-[#00FFFF] mx-auto mb-16px" />
              <h3 className="text-lg font-bold mb-8px">99.99% SLA</h3>
              <p className="text-sm text-[#FFFFFF]/60">Guaranteed uptime</p>
            </div>

            <div className="snap-start flex-shrink-0 md:flex-shrink-auto w-[280px] md:w-auto brutal-card p-24px">
              <HiGlobe className="w-48px h-48px text-[#FF00FF] mx-auto mb-16px" />
              <h3 className="text-lg font-bold mb-8px">ON-PREMISE</h3>
              <p className="text-sm text-[#FFFFFF]/60">Your infrastructure</p>
            </div>

            <div className="snap-start flex-shrink-0 md:flex-shrink-auto w-[280px] md:w-auto brutal-card p-24px">
              <HiPhone className="w-48px h-48px text-[#FFFF00] mx-auto mb-16px" />
              <h3 className="text-lg font-bold mb-8px">24/7 PHONE</h3>
              <p className="text-sm text-[#FFFFFF]/60">Direct support line</p>
            </div>

            <div className="snap-start flex-shrink-0 md:flex-shrink-auto w-[280px] md:w-auto brutal-card p-24px">
              <HiLightningBolt className="w-48px h-48px text-[#00FF00] mx-auto mb-16px" />
              <h3 className="text-lg font-bold mb-8px">INSTANT</h3>
              <p className="text-sm text-[#FFFFFF]/60">15-min response</p>
            </div>
          </div>

          <a 
            href="mailto:enterprise@ltf1.dev"
            className="brutal-btn text-xl px-48px py-24px bg-gradient-to-r from-[#00FFFF] via-[#FF00FF] to-[#FFFF00] text-[#000000] hover:shadow-brutal-lg inline-block"
          >
            CONTACT ENTERPRISE SALES
          </a>
        </div>
      </section>
    </div>
  )
}