import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineCode, HiOutlineLightningBolt, HiOutlineUsers } from 'react-icons/hi'
import BrutalFooterReveal from '../components/landing/BrutalFooterReveal'
import PublicNavigation from '../components/common/PublicNavigation'
import StaticMarqueeBackground from '../components/common/StaticMarqueeBackground'
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
    <div className="min-h-screen bg-[#0A0A0A] snap-y snap-mandatory overflow-y-auto h-screen">
      {/* NAVIGATION */}
      <PublicNavigation currentPage="landing" />

      {/* BRUTAL HERO */}
      <section className="min-h-[calc(100vh-60px)] md:min-h-[calc(100vh-80px)] flex items-center justify-center px-16px md:px-24px snap-start relative overflow-hidden">
        {/* STATIC MARQUEE BACKGROUND */}
        <StaticMarqueeBackground />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="max-w-5xl w-full relative z-10"
        >
          <div className="text-center mb-32px md:mb-48px">
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-16px md:mb-24px leading-[1.1] tracking-tight">
              <span className="block">PROJECT MANAGEMENT</span>
              <span className="block">THAT SPEAKS{' '}
                <span className="glitch-text inline-block">GIT</span>
              </span>
            </h1>
            <div className="brutal-divider max-w-xs mx-auto"></div>
            <p className="text-lg sm:text-xl md:text-2xl mb-32px md:mb-48px text-[#FFFFFF]/80 uppercase tracking-wider px-16px md:px-0">
              PUSH CODE. TASKS UPDATE AUTOMATICALLY.<br className="hidden sm:block" />
              <span className="sm:hidden"> </span>YOUR REPO IS THE SOURCE OF TRUTH.
            </p>
            <div className="flex flex-col sm:flex-row gap-16px md:gap-24px justify-center px-16px sm:px-0">
              <Link to="/sign-up" className="brutal-btn text-lg md:text-xl px-24px md:px-48px py-16px md:py-24px bg-gradient-to-r from-[#00FFFF] via-[#FF00FF] to-[#FFFF00] text-[#000000] hover:shadow-brutal-lg">
                START FREE TRIAL
              </Link>
              <Link to="/pricing" className="brutal-btn text-lg md:text-xl px-24px md:px-48px py-16px md:py-24px">
                VIEW PRICING
              </Link>
            </div>
          </div>

          {/* BRUTAL TERMINAL */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.2 }}
            className="brutal-card p-16px md:p-24px max-w-3xl mx-auto"
          >
            <div className="flex items-center gap-6px md:gap-8px mb-12px md:mb-16px">
              <div className="w-12px md:w-16px h-12px md:h-16px bg-[#FF0000]"></div>
              <div className="w-12px md:w-16px h-12px md:h-16px bg-[#FFFF00]"></div>
              <div className="w-12px md:w-16px h-12px md:h-16px bg-[#00FF00]"></div>
              <span className="ml-8px md:ml-16px text-xs md:text-brutal-sm font-bold">TERMINAL</span>
            </div>
            <pre className="text-xs sm:text-brutal-sm font-mono overflow-x-auto">
              <span className="text-[#00FFFF]">$</span> git commit -m "fix: auth token expiration"<br />
              <span className="text-[#00FFFF]">$</span> git push origin main<br />
              <span className="text-[#FFFF00]">[LTF1]</span> Task created: FIX-234<br />
              <span className="text-[#FFFF00]">[LTF1]</span> Story points: 3<br />
              <span className="text-[#FFFF00]">[LTF1]</span> Sprint updated<br />
              <span className="text-[#00FF00] animate-brutal-pulse">&gt; NO MORE DOUBLE ENTRY_</span>
            </pre>
          </motion.div>
        </motion.div>
      </section>

      {/* BRUTAL FEATURES */}
      <section className="py-48px md:py-80px bg-[#000000] border-t-2 border-b-2 border-[#333333] snap-start min-h-screen flex items-center">
        <div className="container mx-auto px-16px md:px-24px">
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
              <h3 className="text-brutal-xl mb-16px">COMMIT → TASK</h3>
              <div className="brutal-divider"></div>
              <p className="text-brutal-sm">
                EVERY COMMIT BECOMES A TASK. EVERY PR UPDATES THE BOARD. 
                NO MORE "DID YOU UPDATE JIRA?"
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="brutal-card p-32px brutal-hover"
            >
              <HiOutlineLightningBolt className="w-64px h-64px text-[#FFFF00] mb-24px" />
              <h3 className="text-brutal-xl mb-16px">AUTOMATIC ESTIMATION</h3>
              <div className="brutal-divider"></div>
              <p className="text-brutal-sm">
                AI ESTIMATES STORY POINTS FROM YOUR CODE. 
                NO MORE 2-HOUR PLANNING POKER SESSIONS.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.2 }}
              className="brutal-card p-32px brutal-hover"
            >
              <HiOutlineUsers className="w-64px h-64px text-[#FF00FF] mb-24px" />
              <h3 className="text-brutal-xl mb-16px">PR DESCRIPTIONS</h3>
              <div className="brutal-divider"></div>
              <p className="text-brutal-sm">
                GENERATE DETAILED PR DESCRIPTIONS FROM DIFFS. 
                STOP WRITING "FIXED STUFF" IN YOUR PRS.
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
        
        <div className="container mx-auto px-16px md:px-24px relative z-10">
          <motion.h2 
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-32px md:mb-64px"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            PROVEN <span className="glitch-text">PERFORMANCE</span>
          </motion.h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-16px md:gap-32px">
            <motion.div 
              className="relative group"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="brutal-card p-16px md:p-32px text-center relative overflow-hidden bg-[#000000]/50 backdrop-blur-sm border-2 border-[#00FFFF]/30 group-hover:border-[#00FFFF] transition-all duration-300">
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
              <div className="brutal-card p-32px text-center relative overflow-hidden bg-[#000000]/50 backdrop-blur-sm border-2 border-[#FF00FF]/30 group-hover:border-[#FF00FF] transition-all duration-300">
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
              <div className="brutal-card p-32px text-center relative overflow-hidden bg-[#000000]/50 backdrop-blur-sm border-2 border-[#FFFF00]/30 group-hover:border-[#FFFF00] transition-all duration-300">
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
              <div className="brutal-card p-32px text-center relative overflow-hidden bg-[#000000]/50 backdrop-blur-sm border-2 border-[#FFFFFF]/30 group-hover:border-[#FFFFFF] transition-all duration-300">
                <div className="absolute inset-0 bg-cathode-white/5 group-hover:bg-cathode-white/10 transition-all duration-300" />
                <motion.div
                  className="absolute -top-1 -left-1 -right-1 h-1 bg-cathode-white"
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  style={{ boxShadow: '0 0 20px 5px rgba(255, 255, 255, 0.5)' }}
                />
                <h3 className="text-6xl font-bold text-[#FFFFFF] mb-8px relative z-10">24/7</h3>
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
        <div className="fixed inset-0 bg-[#0A0A0A] z-[9999] flex flex-col items-center justify-center">
          {/* LTF1 Logo with brutal shadow */}
          <h1 
            className="text-[120px] font-bold text-[#FFFFFF] mb-24px select-none"
            style={{ textShadow: '5px 5px 0px #000000' }}
          >
            LTF1
          </h1>
          
          {/* Timer */}
          <div className="mb-32px">
            <div className="font-mono text-5xl font-bold text-brutal-error mb-8px" style={{ textShadow: '3px 3px 0px #000000' }}>
              {formatTime(afkTime)}
            </div>
            <div className="font-mono text-sm uppercase tracking-[0.3em] text-[#FFFFFF]/60 border-t-2 border-[#FF0000] pt-8px">
              TIME WASTED
            </div>
          </div>
          
          {/* Rotating message */}
          <div className="font-mono text-xl text-[#FFFFFF] uppercase tracking-wider">
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