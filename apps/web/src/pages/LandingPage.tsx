import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import {
  HiOutlineTerminal,
  HiOutlineChip,
  HiOutlineCode,
  HiOutlineLightningBolt,
  HiOutlineMail,
  HiOutlineGlobeAlt
} from 'react-icons/hi'
import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa'
import PublicNavigation from '../components/common/PublicNavigation'
import FaultyTerminal from '../components/landing/FaultyTerminal'
import Dither from '../components/landing/Dither'

export default function LandingPage() {
  // AFK DETECTION - DO NOT MODIFY
  const [isAFK, setIsAFK] = useState(false)
  const [afkTime, setAfkTime] = useState(0)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const lastActivityRef = useRef(Date.now())
  const afkTimerRef = useRef<NodeJS.Timeout | null>(null)
  const messageRotationRef = useRef<NodeJS.Timeout | null>(null)

  const AFK_THRESHOLD = 35000
  const MESSAGE_ROTATION_INTERVAL = 10000

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

  const resetActivity = () => {
    lastActivityRef.current = Date.now()
    if (isAFK) {
      setIsAFK(false)
      setAfkTime(0)
      setCurrentMessageIndex(0)
      if (messageRotationRef.current) {
        clearInterval(messageRotationRef.current)
        messageRotationRef.current = null
      }
    }
  }

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

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => document.addEventListener(event, resetActivity))
    afkTimerRef.current = setInterval(checkAFK, 1000)

    return () => {
      events.forEach(event => document.removeEventListener(event, resetActivity))
      if (afkTimerRef.current) clearInterval(afkTimerRef.current)
    }
  }, [isAFK])

  useEffect(() => {
    if (isAFK && !messageRotationRef.current) {
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

  // Get current message
  const getCurrentMessage = () => {
    const messages = afkTime > 60 ? aggressiveMessages : regularMessages
    return messages[currentMessageIndex % messages.length]
  }

  return (
    <div className="h-screen overflow-y-auto snap-y snap-mandatory bg-event-horizon">
      <PublicNavigation />

      {/* AFK Overlay - ORIGINAL DESIGN RESTORED */}
      {isAFK && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brutal-error/10 backdrop-blur-sm pointer-events-none"
        >
          <div className="border-4 border-brutal-error bg-event-horizon p-16px sm:p-32px md:p-48px max-w-2xl mx-auto shadow-brutal-lg">
            <motion.h1
              key={currentMessageIndex}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-brutal-error mb-16px md:mb-24px text-center uppercase"
            >
              {getCurrentMessage()}
            </motion.h1>
            <div className="text-center">
              <p className="text-lg sm:text-2xl md:text-3xl text-cathode-white mb-12px md:mb-16px">
                {afkTime} SECONDS WASTED
              </p>
              <div className="border-t-2 border-brutal-error pt-16px">
                <p className="text-lg text-brutal-error uppercase tracking-wider">
                  {afkTime > 60 ? "UNACCEPTABLE" : "GET BACK TO WORK"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* SECTION 1: HERO WITH FAULTY TERMINAL */}
      <section className="relative h-screen snap-start flex items-center justify-center overflow-hidden">
        {/* FaultyTerminal Background */}
        <div className="absolute inset-0 z-0">
          <FaultyTerminal
            scale={1.5}
            gridMul={[2, 1]}
            digitSize={1.2}
            timeScale={0.5}
            pause={false}
            scanlineIntensity={0.3}
            glitchAmount={0.6}
            flickerAmount={0.4}
            noiseAmp={0.9}
            chromaticAberration={0}
            dither={0.2}
            curvature={0.31}
            tint="#333333"
            mouseReact={true}
            mouseStrength={0.5}
            pageLoadAnimation={true}
            brightness={0.4}
          />
        </div>

        {/* Hero Content Overlay */}
        <div className="relative z-10 container mx-auto px-24px text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* Dark backdrop for text readability */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 bg-event-horizon/95 backdrop-blur-md w-[90%] md:w-[70%] h-[80%] md:h-[70%]"
                 style={{
                   borderRadius: '50%',
                   boxShadow: '0 0 28px 5px rgba(0,0,0,0.95), 0 0 56px 10px rgba(0,0,0,0.8)'
                 }}>
            </div>

            <div className="relative p-24px sm:p-32px md:p-48px lg:p-64px">
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-9xl font-bold mb-16px sm:mb-24px md:mb-32px uppercase">
                <span className="bg-glitch-flare bg-clip-text text-transparent">
                  LTF1
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-2xl lg:text-3xl text-cathode-white mb-12px md:mb-16px">
                PROJECT MANAGEMENT THAT UNDERSTANDS YOUR CODE
              </p>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-cathode-white mb-24px md:mb-48px">
                GIT-NATIVE • REAL-TIME • DEVELOPER-FIRST
              </p>
              <Link
                to="/sign-up"
                className="brutal-btn bg-glitch-flare text-event-horizon font-bold text-base sm:text-lg md:text-xl px-32px sm:px-48px md:px-64px py-12px sm:py-16px md:py-24px shadow-brutal-lg uppercase inline-block"
              >
                ENTER THE VOID
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2: FEATURES */}
      <section className="h-screen snap-start flex items-center justify-center bg-event-horizon">
        <div className="container mx-auto px-16px sm:px-20px md:px-24px">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-32px md:mb-48px lg:mb-64px"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-12px md:mb-16px uppercase text-cathode-white">
              BUILT DIFFERENT
            </h2>
            <div className="w-256px h-2px bg-glitch-flare mx-auto"></div>
          </motion.div>

          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-16px md:gap-24px lg:gap-32px max-w-6xl mx-auto overflow-x-auto md:overflow-x-visible pb-16px md:pb-0 snap-x snap-mandatory md:snap-none"
               style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="snap-start flex-shrink-0 md:flex-shrink-auto w-[85vw] md:w-auto bg-carbon-plate border-2 border-basalt-border p-16px sm:p-24px md:p-32px text-center"
            >
              <HiOutlineTerminal className="w-40px h-40px sm:w-48px sm:h-48px md:w-64px md:h-64px mx-auto mb-16px md:mb-24px text-brutal-info" />
              <h3 className="text-xl font-bold mb-16px uppercase text-cathode-white">GIT SYNC</h3>
              <p className="text-sm text-cathode-white/70">AUTO-TRACKS COMMITS</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="snap-start flex-shrink-0 md:flex-shrink-auto w-[85vw] md:w-auto bg-carbon-plate border-2 border-basalt-border p-16px sm:p-24px md:p-32px text-center"
            >
              <HiOutlineLightningBolt className="w-40px h-40px sm:w-48px sm:h-48px md:w-64px md:h-64px mx-auto mb-16px md:mb-24px text-brutal-warning" />
              <h3 className="text-xl font-bold mb-16px uppercase text-cathode-white">WHITEBOARD</h3>
              <p className="text-sm text-cathode-white/70">REAL-TIME COLLAB</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="snap-start flex-shrink-0 md:flex-shrink-auto w-[85vw] md:w-auto bg-carbon-plate border-2 border-basalt-border p-16px sm:p-24px md:p-32px text-center"
            >
              <HiOutlineChip className="w-40px h-40px sm:w-48px sm:h-48px md:w-64px md:h-64px mx-auto mb-16px md:mb-24px text-primary-brutalist" />
              <h3 className="text-xl font-bold mb-16px uppercase text-cathode-white">AI POWERED</h3>
              <p className="text-sm text-cathode-white/70">SMART AUTOMATION</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="snap-start flex-shrink-0 md:flex-shrink-auto w-[85vw] md:w-auto bg-carbon-plate border-2 border-basalt-border p-16px sm:p-24px md:p-32px text-center"
            >
              <HiOutlineCode className="w-40px h-40px sm:w-48px sm:h-48px md:w-64px md:h-64px mx-auto mb-16px md:mb-24px text-brutal-success" />
              <h3 className="text-xl font-bold mb-16px uppercase text-cathode-white">DEV FIRST</h3>
              <p className="text-sm text-cathode-white/70">ZERO FRICTION</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 3: PRICING */}
      <section className="relative h-screen snap-start flex items-center justify-center bg-event-horizon overflow-hidden">
        <div className="container mx-auto px-16px md:px-24px">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-full md:max-w-6xl mx-auto"
          >
            {/* Title */}
            <div className="text-center mb-32px md:mb-48px">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-12px md:mb-16px uppercase">
                <span className="bg-glitch-flare bg-clip-text text-transparent">
                  SIMPLE PRICING
                </span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-cathode-white/80 uppercase">
                No hidden fees • No seat minimums
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="relative mb-32px md:mb-48px">
              <div className="flex lg:grid lg:grid-cols-4 gap-16px md:gap-20px lg:gap-24px overflow-x-auto lg:overflow-x-visible pb-16px lg:pb-0 snap-x snap-mandatory lg:snap-none"
                   style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
                {/* LOCALHOST - FREE */}
                <div className="snap-start flex-shrink-0 lg:flex-shrink-auto w-[85vw] lg:w-auto border-2 border-basalt-border bg-event-horizon p-16px md:p-24px text-center">
                <h3 className="text-lg font-bold text-cathode-white mb-16px">LOCALHOST</h3>
                <p className="text-3xl font-bold text-brutal-info mb-8px">FREE</p>
                <p className="text-sm text-cathode-white/60 mb-16px">1-5 users</p>
                <ul className="text-sm text-cathode-white/70 space-y-8px text-left">
                  <li>• 3 projects max</li>
                  <li>• 100 AI credits/mo</li>
                  <li>• Basic Git sync</li>
                </ul>
              </div>

              {/* STARTUP - MOST POPULAR */}
              <div className="snap-start flex-shrink-0 lg:flex-shrink-auto w-[85vw] lg:w-auto border-4 border-brutal-success bg-event-horizon p-16px md:p-24px text-center relative">
                <div className="absolute -top-12px left-1/2 -translate-x-1/2 bg-brutal-success text-event-horizon px-16px py-2px text-xs font-bold">
                  MOST POPULAR
                </div>
                <h3 className="text-lg font-bold text-cathode-white mb-16px">STARTUP</h3>
                <p className="text-3xl font-bold text-cathode-white mb-8px">$19<span className="text-lg">/user</span></p>
                <p className="text-sm text-primary-brutalist mb-16px">3-50 users</p>
                <ul className="text-sm text-cathode-white/70 space-y-8px text-left">
                  <li>• Unlimited projects</li>
                  <li>• 1,000 AI credits</li>
                  <li>• Sprint planning</li>
                </ul>
              </div>

              {/* SCALE */}
              <div className="snap-start flex-shrink-0 lg:flex-shrink-auto w-[85vw] lg:w-auto border-2 border-basalt-border bg-event-horizon p-16px md:p-24px text-center">
                <h3 className="text-lg font-bold text-cathode-white mb-16px">SCALE</h3>
                <p className="text-3xl font-bold text-cathode-white mb-8px">$49<span className="text-lg">/user</span></p>
                <p className="text-sm text-brutal-warning mb-16px">10-500 users</p>
                <ul className="text-sm text-cathode-white/70 space-y-8px text-left">
                  <li>• 10K AI credits</li>
                  <li>• API access</li>
                  <li>• SSO/SAML</li>
                </ul>
              </div>

              {/* ENTERPRISE */}
              <div className="snap-start flex-shrink-0 lg:flex-shrink-auto w-[85vw] lg:w-auto border-2 border-basalt-border bg-event-horizon p-16px md:p-24px text-center">
                <h3 className="text-lg font-bold text-cathode-white mb-16px">ENTERPRISE</h3>
                <p className="text-3xl font-bold bg-glitch-flare bg-clip-text text-transparent mb-8px">$99<span className="text-lg text-cathode-white">/user</span></p>
                <p className="text-sm text-cathode-white/60 mb-16px">50+ users</p>
                <ul className="text-sm text-cathode-white/70 space-y-8px text-left">
                  <li>• Unlimited AI</li>
                  <li>• On-premise</li>
                  <li>• 24/7 support</li>
                </ul>
              </div>
            </div>

              {/* Scroll Indicator for Simple Pricing */}
              <div className="absolute right-0 top-0 bottom-0 w-24px bg-gradient-to-l from-[#0A0A0A] to-transparent lg:hidden flex items-center justify-end pr-8px pointer-events-none">
                <div className="text-[#00FFFF] text-xs animate-pulse">→</div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <Link
                to="/pricing"
                className="brutal-btn bg-glitch-flare text-event-horizon text-base sm:text-lg md:text-xl px-32px sm:px-48px md:px-64px py-12px sm:py-16px md:py-24px shadow-brutal-lg font-bold uppercase"
              >
                VIEW ALL FEATURES →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 4: FOOTER */}
      <footer className="h-screen snap-start flex items-center justify-center bg-event-horizon border-t-2 border-basalt-border relative overflow-hidden">
        {/* Dither Background Effect */}
        <div className="absolute inset-0 z-0">
          <Dither
            waveColor={[0.5, 0.5, 0.5]}
            disableAnimation={false}
            enableMouseInteraction={true}
            mouseRadius={0.3}
            colorNum={4}
            pixelSize={2}
            waveAmplitude={0.3}
            waveFrequency={3}
            waveSpeed={0.05}
          />
        </div>

        {/* Shadow backdrop for readability */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-5 w-[60%] md:w-[45%] h-[50%] md:h-[40%] border-2 border-basalt-border"
             style={{
               borderRadius: '50%',
               background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.85) 30%, rgba(0, 0, 0, 0.65) 60%, rgba(0, 0, 0, 0.3) 100%)',
               backdropFilter: 'blur(12px)',
               WebkitBackdropFilter: 'blur(12px)'
             }}>
        </div>

        {/* Animated gradient line */}
        <div className="absolute top-0 left-0 right-0 h-2px bg-glitch-flare animate-pulse z-10"></div>

        <div className="relative z-10 container mx-auto px-24px text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {/* Logo */}
            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-bold mb-24px sm:mb-32px md:mb-48px">
              <span className="bg-glitch-flare bg-clip-text text-transparent">
                LTF1
              </span>
            </h2>

            {/* Social Links */}
            <div className="flex justify-center gap-16px md:gap-24px mb-32px md:mb-48px lg:mb-64px">
              <a href="https://github.com" className="brutal-icon-btn">
                <FaGithub className="w-40px h-40px md:w-48px md:h-48px" />
              </a>
              <a href="https://twitter.com" className="brutal-icon-btn">
                <FaTwitter className="w-40px h-40px md:w-48px md:h-48px" />
              </a>
              <a href="https://linkedin.com" className="brutal-icon-btn">
                <FaLinkedin className="w-40px h-40px md:w-48px md:h-48px" />
              </a>
              <a href="mailto:contact@ltf1.dev" className="brutal-icon-btn">
                <HiOutlineMail className="w-40px h-40px md:w-48px md:h-48px" />
              </a>
              <a href="https://ltf1.dev" className="brutal-icon-btn">
                <HiOutlineGlobeAlt className="w-40px h-40px md:w-48px md:h-48px" />
              </a>
            </div>

            {/* Bottom Info */}
            <div className="flex md:grid md:grid-cols-4 gap-16px md:gap-24px lg:gap-32px max-w-4xl mx-auto overflow-x-auto md:overflow-x-visible pb-16px md:pb-0 snap-x snap-mandatory md:snap-none"
                 style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
              <div className="snap-start flex-shrink-0 md:flex-shrink-auto w-[280px] md:w-auto">
                <p className="text-brutal-info text-sm mb-8px">STATUS</p>
                <p className="text-cathode-white font-bold">OPERATIONAL</p>
              </div>
              <div className="snap-start flex-shrink-0 md:flex-shrink-auto w-[280px] md:w-auto">
                <p className="text-brutal-warning text-sm mb-8px">VERSION</p>
                <p className="text-cathode-white font-bold">1.0.0</p>
              </div>
              <div className="snap-start flex-shrink-0 md:flex-shrink-auto w-[280px] md:w-auto">
                <p className="text-primary-brutalist text-sm mb-8px">UPTIME</p>
                <p className="text-cathode-white font-bold">99.9%</p>
              </div>
              <div className="snap-start flex-shrink-0 md:flex-shrink-auto w-[280px] md:w-auto">
                <p className="text-brutal-success text-sm mb-8px">LAUNCHED</p>
                <p className="text-cathode-white font-bold">2024</p>
              </div>
            </div>

            {/* Copyright */}
            <p className="text-cathode-white/50 text-sm mt-64px uppercase">
              © 2024 LTF1 • ALL RIGHTS RESERVED
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}
