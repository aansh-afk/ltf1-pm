import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineCode, HiOutlineLightningBolt, HiOutlineUsers } from 'react-icons/hi'
import BrutalFooterReveal from '../components/landing/BrutalFooterReveal'
import { useEffect, useState, useRef } from 'react'

export default function LandingPage() {
  const [isAFK, setIsAFK] = useState(false)
  const [afkTime, setAfkTime] = useState(0)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const lastActivityRef = useRef(Date.now())
  const afkTimerRef = useRef<NodeJS.Timeout | null>(null)
  const messageRotationRef = useRef<NodeJS.Timeout | null>(null)
  
  const AFK_THRESHOLD = 35000 // 35 seconds
  const MESSAGE_ROTATION_INTERVAL = 10000 // 10 seconds
  
  const regularMessages = [
    "PRODUCTIVITY DECREASING",
    "ARE YOU EVEN TRYING?",
    "LOCK BACK IN OR LOG OUT",
    "THIS IS NOT WHAT WINNERS DO",
    "YOUR COMPETITION IS CODING RIGHT NOW"
  ]
  
  const aggressiveMessages = [
    "SERIOUSLY?",
    "COFFEE BREAK ENDED 4 MINUTES AGO",
    "YOUR SPRINT IS SUFFERING",
    "STAND UP OR SHIP OUT"
  ]
  
  // Reset activity on any user interaction
  const resetActivity = () => {
    lastActivityRef.current = Date.now()
    
    if (isAFK) {
      // Hard cut back to normal
      setIsAFK(false)
      setAfkTime(0)
      setCurrentMessageIndex(0)
      
      // Clear message rotation
      if (messageRotationRef.current) {
        clearInterval(messageRotationRef.current)
        messageRotationRef.current = null
      }
    }
  }
  
  // Check for AFK status
  useEffect(() => {
    const checkAFK = () => {
      const now = Date.now()
      const timeSinceActivity = now - lastActivityRef.current
      
      if (timeSinceActivity >= AFK_THRESHOLD && !isAFK) {
        setIsAFK(true)
        setAfkTime(Math.floor(timeSinceActivity / 1000))
      }
      
      if (isAFK) {
        setAfkTime(Math.floor((now - lastActivityRef.current) / 1000))
      }
    }
    
    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, resetActivity)
    })
    
    // Check AFK status every second
    afkTimerRef.current = setInterval(checkAFK, 1000)
    
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetActivity)
      })
      
      if (afkTimerRef.current) {
        clearInterval(afkTimerRef.current)
      }
    }
  }, [isAFK])
  
  // Separate effect for message rotation
  useEffect(() => {
    if (isAFK && !messageRotationRef.current) {
      // Start message rotation when AFK
      messageRotationRef.current = setInterval(() => {
        setCurrentMessageIndex(prev => prev + 1)
      }, MESSAGE_ROTATION_INTERVAL)
    }
    
    return () => {
      if (messageRotationRef.current) {
        clearInterval(messageRotationRef.current)
        messageRotationRef.current = null
      }
    }
  }, [isAFK])
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className="min-h-screen bg-[var(--theme-background-secondary)] snap-y snap-mandatory overflow-y-auto h-screen">
      {/* BRUTAL NAV */}
      <nav className="bg-[var(--theme-background)] border-b-2 border-[var(--theme-border)] sticky top-0 z-50">
        <div className="container mx-auto px-24px py-16px">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">
              <span className="text-[var(--theme-foreground)] font-bold">LTF1</span>
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
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-bold mb-24px leading-tight">
              PROJECT MANAGEMENT FOR{' '}
              <span className="glitch-text">DEVELOPERS</span>
            </h1>
            <div className="brutal-divider max-w-xs mx-auto"></div>
            <p className="text-xl md:text-2xl mb-48px text-[var(--theme-foreground)]/80 uppercase tracking-wider">
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
              <div className="w-16px h-16px bg-[var(--theme-error)]"></div>
              <div className="w-16px h-16px bg-[var(--theme-warning)]"></div>
              <div className="w-16px h-16px bg-[var(--theme-success)]"></div>
              <span className="ml-16px text-brutal-sm">TERMINAL</span>
            </div>
            <pre className="text-brutal-sm font-mono">
              <span className="text-[var(--theme-info)]">$</span> git clone github.com/ltf1/platform<br />
              <span className="text-[var(--theme-info)]">$</span> cd platform && npm install<br />
              <span className="text-[var(--theme-info)]">$</span> npm run dev<br />
              <span className="text-[var(--theme-warning)]">&gt;</span> <span className="text-[var(--theme-success)] animate-brutal-pulse">PROJECT MANAGEMENT SYSTEM INITIALIZED_</span>
            </pre>
          </motion.div>
        </motion.div>
      </section>

      {/* BRUTAL FEATURES */}
      <section className="py-80px bg-[var(--theme-background)] border-t-2 border-b-2 border-[var(--theme-border)] snap-start min-h-screen flex items-center">
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
              <HiOutlineCode className="w-64px h-64px text-[var(--theme-info)] mb-24px" />
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
              <HiOutlineLightningBolt className="w-64px h-64px text-[var(--theme-accent)] mb-24px" />
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
              <HiOutlineUsers className="w-64px h-64px text-[var(--theme-warning)] mb-24px" />
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
              var(--theme-info) 40px,
              var(--theme-info) 41px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 40px,
              var(--theme-accent) 40px,
              var(--theme-accent) 41px
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
              <div className="brutal-card p-32px text-center relative overflow-hidden bg-[var(--theme-background)]/50 backdrop-blur-sm border-2 border-[var(--theme-info)]/30 group-hover:border-[var(--theme-info)] transition-all duration-300">
                {/* GLOW EFFECT */}
                <div className="absolute inset-0 bg-[var(--theme-info)]/5 group-hover:bg-[var(--theme-info)]/10 transition-all duration-300" />
                <motion.div
                  className="absolute -top-1 -left-1 -right-1 h-1 bg-[var(--theme-info)]"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  style={{ boxShadow: '0 0 20px 5px rgba(0, 255, 255, 0.5)' }}
                />
                <h3 className="text-6xl font-bold text-[var(--theme-info)] mb-8px relative z-10">10K+</h3>
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
              <div className="brutal-card p-32px text-center relative overflow-hidden bg-[var(--theme-background)]/50 backdrop-blur-sm border-2 border-[var(--theme-accent)]/30 group-hover:border-[var(--theme-accent)] transition-all duration-300">
                <div className="absolute inset-0 bg-[var(--theme-accent)]/5 group-hover:bg-[var(--theme-accent)]/10 transition-all duration-300" />
                <motion.div
                  className="absolute -top-1 -left-1 -right-1 h-1 bg-[var(--theme-accent)]"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  style={{ boxShadow: '0 0 20px 5px rgba(255, 0, 255, 0.5)' }}
                />
                <h3 className="text-6xl font-bold text-[var(--theme-accent)] mb-8px relative z-10">1M+</h3>
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
              <div className="brutal-card p-32px text-center relative overflow-hidden bg-[var(--theme-background)]/50 backdrop-blur-sm border-2 border-[var(--theme-warning)]/30 group-hover:border-[var(--theme-warning)] transition-all duration-300">
                <div className="absolute inset-0 bg-[var(--theme-warning)]/5 group-hover:bg-[var(--theme-warning)]/10 transition-all duration-300" />
                <motion.div
                  className="absolute -top-1 -left-1 -right-1 h-1 bg-[var(--theme-warning)]"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  style={{ boxShadow: '0 0 20px 5px rgba(255, 255, 0, 0.5)' }}
                />
                <h3 className="text-6xl font-bold text-[var(--theme-warning)] mb-8px relative z-10">99.9%</h3>
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
              <div className="brutal-card p-32px text-center relative overflow-hidden bg-[var(--theme-background)]/50 backdrop-blur-sm border-2 border-cathode-white/30 group-hover:border-cathode-white transition-all duration-300">
                <div className="absolute inset-0 bg-cathode-white/5 group-hover:bg-cathode-white/10 transition-all duration-300" />
                <motion.div
                  className="absolute -top-1 -left-1 -right-1 h-1 bg-cathode-white"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  style={{ boxShadow: '0 0 20px 5px rgba(255, 255, 255, 0.5)' }}
                />
                <h3 className="text-6xl font-bold text-[var(--theme-foreground)] mb-8px relative z-10">24/7</h3>
                <p className="text-brutal-sm relative z-10">DEVELOPER SUPPORT</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* BRUTAL FOOTER REVEAL - INCLUDES TRANSFORM SECTION */}
      <BrutalFooterReveal />
      
      {/* AFK SHAME SCREEN */}
      {isAFK && (
        <div className="fixed inset-0 bg-[var(--theme-background-secondary)] z-[9999] flex flex-col items-center justify-center">
          {/* LTF1 Logo with brutal shadow */}
          <h1 
            className="text-[120px] font-bold text-[var(--theme-foreground)] mb-24px select-none"
            style={{ textShadow: '5px 5px 0px #000000' }}
          >
            LTF1
          </h1>
          
          {/* Timer */}
          <div className="mb-32px">
            <div className="font-mono text-5xl font-bold text-brutal-error mb-8px" style={{ textShadow: '3px 3px 0px #000000' }}>
              {formatTime(afkTime)}
            </div>
            <div className="font-mono text-sm uppercase tracking-[0.3em] text-[var(--theme-foreground)]/60 border-t-2 border-brutal-error pt-8px">
              TIME WASTED
            </div>
          </div>
          
          {/* Rotating message */}
          <div className="font-mono text-xl text-[var(--theme-foreground)] uppercase tracking-wider">
            {afkTime >= 300 ? (
              <>
                <span className="text-brutal-error">{formatTime(afkTime)} - </span>
                {aggressiveMessages[currentMessageIndex % aggressiveMessages.length]}
              </>
            ) : (
              regularMessages[currentMessageIndex % regularMessages.length]
            )}
          </div>
        </div>
      )}
    </div>
  )
}