import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineCode, HiOutlineLightningBolt, HiOutlineUsers } from 'react-icons/hi'
import BrutalFooterReveal from '../components/landing/BrutalFooterReveal'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-event-horizon snap-y snap-mandatory overflow-y-auto h-screen">
      {/* BRUTAL NAV */}
      <nav className="bg-carbon-plate border-b-2 border-basalt-border sticky top-0 z-50">
        <div className="container mx-auto px-24px py-16px">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">
              <span className="text-cathode-white font-bold">LTF1</span>
            </h1>
            <div className="flex gap-16px">
              <Link to="/sign-in" className="brutal-btn">
                SIGN IN
              </Link>
              <Link to="/sign-up" className="brutal-btn bg-glitch-flare text-event-horizon hover:shadow-brutal-lg">
                GET STARTED
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* BRUTAL HERO */}
      <section className="min-h-[calc(100vh-80px)] flex items-center justify-center px-24px snap-start">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="max-w-5xl w-full"
        >
          <div className="text-center mb-48px">
            <h1 className="text-6xl md:text-8xl font-bold mb-24px leading-none">
              PROJECT MANAGEMENT
              <br />
              FOR{' '}
              <span className="glitch-text">DEVELOPERS</span>
            </h1>
            <div className="brutal-divider max-w-xs mx-auto"></div>
            <p className="text-xl md:text-2xl mb-48px text-cathode-white/80 uppercase tracking-wider">
              THE FIRST PLATFORM BUILT BY DEVELOPERS.<br />
              FOR DEVELOPERS. NO COMPROMISES.
            </p>
            <div className="flex flex-col sm:flex-row gap-24px justify-center">
              <Link to="/sign-up" className="brutal-btn text-xl px-48px py-24px bg-glitch-flare text-event-horizon hover:shadow-brutal-lg">
                START FREE TRIAL
              </Link>
              <Link to="/demo" className="brutal-btn text-xl px-48px py-24px">
                VIEW DEMO
              </Link>
            </div>
          </div>

          {/* BRUTAL TERMINAL */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.2 }}
            className="brutal-card p-24px max-w-3xl mx-auto"
          >
            <div className="flex items-center gap-8px mb-16px">
              <div className="w-16px h-16px bg-[#FF0000]"></div>
              <div className="w-16px h-16px bg-[#FFFF00]"></div>
              <div className="w-16px h-16px bg-[#00FF00]"></div>
              <span className="ml-16px text-brutal-sm">TERMINAL</span>
            </div>
            <pre className="text-brutal-sm font-mono">
              <span className="text-[#00FFFF]">$</span> git clone github.com/ltf1/platform<br />
              <span className="text-[#00FFFF]">$</span> cd platform && npm install<br />
              <span className="text-[#00FFFF]">$</span> npm run dev<br />
              <span className="text-[#FFFF00]">&gt;</span> <span className="text-[#00FF00] animate-brutal-pulse">PROJECT MANAGEMENT SYSTEM INITIALIZED_</span>
            </pre>
          </motion.div>
        </motion.div>
      </section>

      {/* BRUTAL FEATURES */}
      <section className="py-80px bg-carbon-plate border-t-2 border-b-2 border-basalt-border snap-start min-h-screen flex items-center">
        <div className="container mx-auto px-24px">
          <h2 className="text-5xl font-bold text-center mb-64px">
            BUILT FOR THE <span className="glitch-text">MODERN WORKFLOW</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-32px">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="brutal-card p-32px brutal-hover"
            >
              <HiOutlineCode className="w-64px h-64px text-[#00FFFF] mb-24px" />
              <h3 className="text-brutal-xl mb-16px">GIT-FIRST APPROACH</h3>
              <div className="brutal-divider"></div>
              <p className="text-brutal-sm">
                AUTOMATICALLY SYNC TASKS WITH COMMITS, PRS, AND BRANCHES. 
                YOUR CODE IS YOUR PROJECT MANAGEMENT.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="brutal-card p-32px brutal-hover"
            >
              <HiOutlineLightningBolt className="w-64px h-64px text-[#FF00FF] mb-24px" />
              <h3 className="text-brutal-xl mb-16px">AI-POWERED INTELLIGENCE</h3>
              <div className="brutal-divider"></div>
              <p className="text-brutal-sm">
                SMART TASK GENERATION FROM CODE CHANGES. 
                INTELLIGENT SPRINT PLANNING. AUTOMATED TIME ESTIMATES.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.2 }}
              className="brutal-card p-32px brutal-hover"
            >
              <HiOutlineUsers className="w-64px h-64px text-[#FFFF00] mb-24px" />
              <h3 className="text-brutal-xl mb-16px">TEAM COLLABORATION</h3>
              <div className="brutal-divider"></div>
              <p className="text-brutal-sm">
                REAL-TIME UPDATES. CODE REVIEW INTEGRATION. 
                BUILT-IN MEETING SCHEDULER WITH GOOGLE MEET.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* BRUTAL STATS - Enhanced with dynamic animations */}
      <section className="py-80px snap-start min-h-screen flex items-center relative overflow-hidden">
        {/* BACKGROUND GRID PATTERN */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 40px,
              #00FFFF 40px,
              #00FFFF 41px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 40px,
              #FF00FF 40px,
              #FF00FF 41px
            )`
          }} />
        </div>
        
        <div className="container mx-auto px-24px relative z-10">
          <motion.h2 
            className="text-5xl font-bold text-center mb-64px"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            PROVEN <span className="glitch-text">PERFORMANCE</span>
          </motion.h2>
          
          <div className="grid md:grid-cols-4 gap-32px">
            <motion.div 
              className="relative group"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="brutal-card p-32px text-center relative overflow-hidden bg-carbon-plate/50 backdrop-blur-sm border-2 border-[#00FFFF]/30 group-hover:border-[#00FFFF] transition-all duration-300">
                {/* GLOW EFFECT */}
                <div className="absolute inset-0 bg-[#00FFFF]/5 group-hover:bg-[#00FFFF]/10 transition-all duration-300" />
                <motion.div
                  className="absolute -top-1 -left-1 -right-1 h-1 bg-[#00FFFF]"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  style={{ boxShadow: '0 0 20px 5px rgba(0, 255, 255, 0.5)' }}
                />
                <h3 className="text-6xl font-bold text-[#00FFFF] mb-8px relative z-10">10K+</h3>
                <p className="text-brutal-sm relative z-10">ACTIVE DEVELOPERS</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="relative group"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="brutal-card p-32px text-center relative overflow-hidden bg-carbon-plate/50 backdrop-blur-sm border-2 border-[#FF00FF]/30 group-hover:border-[#FF00FF] transition-all duration-300">
                <div className="absolute inset-0 bg-[#FF00FF]/5 group-hover:bg-[#FF00FF]/10 transition-all duration-300" />
                <motion.div
                  className="absolute -top-1 -left-1 -right-1 h-1 bg-[#FF00FF]"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  style={{ boxShadow: '0 0 20px 5px rgba(255, 0, 255, 0.5)' }}
                />
                <h3 className="text-6xl font-bold text-[#FF00FF] mb-8px relative z-10">1M+</h3>
                <p className="text-brutal-sm relative z-10">TASKS COMPLETED</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="relative group"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="brutal-card p-32px text-center relative overflow-hidden bg-carbon-plate/50 backdrop-blur-sm border-2 border-[#FFFF00]/30 group-hover:border-[#FFFF00] transition-all duration-300">
                <div className="absolute inset-0 bg-[#FFFF00]/5 group-hover:bg-[#FFFF00]/10 transition-all duration-300" />
                <motion.div
                  className="absolute -top-1 -left-1 -right-1 h-1 bg-[#FFFF00]"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  style={{ boxShadow: '0 0 20px 5px rgba(255, 255, 0, 0.5)' }}
                />
                <h3 className="text-6xl font-bold text-[#FFFF00] mb-8px relative z-10">99.9%</h3>
                <p className="text-brutal-sm relative z-10">UPTIME SLA</p>
              </div>
            </motion.div>
            
            <motion.div 
              className="relative group"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <div className="brutal-card p-32px text-center relative overflow-hidden bg-carbon-plate/50 backdrop-blur-sm border-2 border-cathode-white/30 group-hover:border-cathode-white transition-all duration-300">
                <div className="absolute inset-0 bg-cathode-white/5 group-hover:bg-cathode-white/10 transition-all duration-300" />
                <motion.div
                  className="absolute -top-1 -left-1 -right-1 h-1 bg-cathode-white"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  style={{ boxShadow: '0 0 20px 5px rgba(255, 255, 255, 0.5)' }}
                />
                <h3 className="text-6xl font-bold text-cathode-white mb-8px relative z-10">24/7</h3>
                <p className="text-brutal-sm relative z-10">DEVELOPER SUPPORT</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* BRUTAL FOOTER REVEAL - INCLUDES TRANSFORM SECTION */}
      <BrutalFooterReveal />
    </div>
  )
}