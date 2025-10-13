import { motion } from 'framer-motion'
import { HiOutlineMail, HiOutlineGlobeAlt, HiOutlineTerminal } from 'react-icons/hi'
import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa'
import { useEffect, useState } from 'react'

export default function BrutalFooterReveal() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      requestAnimationFrame(() => {
        setScrollY(window.scrollY)
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="snap-y snap-proximity">
      {/* TRIGGER SECTION - Enhanced with underglow */}
      <section
        className="snap-start relative overflow-hidden"
        style={{
          transform: `translateY(${scrollY * 0.08}px)`
        }}
      >
        <motion.div
          className="min-h-screen flex items-center justify-center bg-carbon-plate border-t-2 border-basalt-border relative"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* BOTTOM UNDERGLOW EFFECT */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-2 bg-glitch-flare z-10"
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            style={{
              boxShadow: '0 0 60px 20px rgba(0, 255, 255, 0.8), 0 0 120px 40px rgba(255, 0, 255, 0.6), 0 0 180px 60px rgba(255, 255, 0, 0.4)',
              transformOrigin: 'center'
            }}
          />
          
          {/* ANIMATED GLOW PULSES */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-[#00FFFF] z-20"
            animate={{
              opacity: [0.4, 1, 0.4],
              scaleY: [1, 1.5, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              filter: 'blur(4px)',
              mixBlendMode: 'screen'
            }}
          />
          
          <div
            className="container mx-auto px-24px text-center relative z-30"
            style={{
              transform: `translateY(${scrollY * -0.05}px)`
            }}
          >
            <motion.h2
              className="text-6xl md:text-8xl font-bold mb-24px"
              animate={{
                textShadow: [
                  '0 0 20px rgba(0, 255, 255, 0.5)',
                  '0 0 40px rgba(255, 0, 255, 0.5)',
                  '0 0 20px rgba(255, 255, 0, 0.5)',
                  '0 0 20px rgba(0, 255, 255, 0.5)'
                ]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              READY TO <span className="glitch-text">TRANSFORM</span>
            </motion.h2>
            <div className="brutal-divider max-w-xs mx-auto"></div>
            <p className="text-xl uppercase tracking-wider text-cathode-white/80">
              YOUR WORKFLOW AWAITS BELOW
            </p>
          </div>
        </motion.div>
      </section>

      {/* BRUTAL FOOTER - Simplified container */}
      <section
        className="snap-start relative bg-event-horizon overflow-hidden"
        style={{
          transform: `translateY(${scrollY * 0.05}px)`
        }}
      >
        {/* ENHANCED GLOWING BORDER EFFECT */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-2 bg-glitch-flare z-10"
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          style={{
            boxShadow: '0 0 60px 20px rgba(0, 255, 255, 0.9), 0 0 120px 40px rgba(255, 0, 255, 0.7), 0 0 180px 60px rgba(255, 255, 0, 0.5)',
            transformOrigin: 'left'
          }}
        />
        
        {/* ANIMATED TOP GLOW WAVE */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-1 bg-[#FF00FF] z-20"
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scaleX: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            filter: 'blur(6px)',
            mixBlendMode: 'screen'
          }}
        />

        {/* FOOTER CONTENT */}
        <footer className="min-h-screen flex items-center justify-center py-80px">
          <div className="container mx-auto px-24px">
            {/* GLITCH HEADER */}
            <motion.div 
              className="text-center mb-80px"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <h2 className="text-8xl md:text-9xl font-bold mb-32px">
                <span className="glitch-text">LTF1</span>
              </h2>
              <p className="text-2xl uppercase tracking-wider">
                THE FUTURE OF DEVELOPMENT IS HERE
              </p>
            </motion.div>

            {/* BRUTAL GRID */}
            <div className="grid md:grid-cols-3 gap-48px mb-80px">
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <div className="text-6xl font-bold text-[#00FFFF] mb-16px">01</div>
                <h3 className="text-2xl font-bold mb-16px">BUILD</h3>
                <p className="text-brutal-sm">ARCHITECT YOUR PROJECTS WITH PRECISION</p>
              </motion.div>

              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="text-6xl font-bold text-[#FF00FF] mb-16px">02</div>
                <h3 className="text-2xl font-bold mb-16px">COLLABORATE</h3>
                <p className="text-brutal-sm">SYNC WITH YOUR TEAM IN REAL-TIME</p>
              </motion.div>

              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="text-6xl font-bold text-[#FFFF00] mb-16px">03</div>
                <h3 className="text-2xl font-bold mb-16px">SHIP</h3>
                <p className="text-brutal-sm">DEPLOY WITH CONFIDENCE AND SPEED</p>
              </motion.div>
            </div>

            {/* FINAL CTA */}
            <motion.div 
              className="text-center mb-80px"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              viewport={{ once: true }}
            >
              <a 
                href="/sign-up" 
                className="brutal-btn text-2xl md:text-3xl px-48px md:px-80px py-24px md:py-40px bg-glitch-flare text-event-horizon hover:shadow-brutal-lg inline-block"
              >
                ENTER THE VOID
              </a>
            </motion.div>

            {/* CONTACT SECTION */}
            <motion.div 
              className="pt-48px border-t-2 border-basalt-border"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="flex flex-wrap justify-center gap-16px md:gap-32px mb-48px">
                <a href="https://github.com" className="brutal-icon-btn">
                  <FaGithub className="w-32px h-32px" />
                </a>
                <a href="https://twitter.com" className="brutal-icon-btn">
                  <FaTwitter className="w-32px h-32px" />
                </a>
                <a href="https://linkedin.com" className="brutal-icon-btn">
                  <FaLinkedin className="w-32px h-32px" />
                </a>
                <a href="mailto:contact@ltf1.dev" className="brutal-icon-btn">
                  <HiOutlineMail className="w-32px h-32px" />
                </a>
                <a href="https://ltf1.dev" className="brutal-icon-btn">
                  <HiOutlineGlobeAlt className="w-32px h-32px" />
                </a>
                <a href="/terminal" className="brutal-icon-btn">
                  <HiOutlineTerminal className="w-32px h-32px" />
                </a>
              </div>

              {/* BOTTOM INFO */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-16px md:gap-32px text-center">
                <div>
                  <div className="text-brutal-xs text-[#00FFFF] mb-8px">STATUS</div>
                  <div className="text-brutal-sm">OPERATIONAL</div>
                </div>
                <div>
                  <div className="text-brutal-xs text-[#FF00FF] mb-8px">VERSION</div>
                  <div className="text-brutal-sm">1.0.0</div>
                </div>
                <div>
                  <div className="text-brutal-xs text-[#FFFF00] mb-8px">UPTIME</div>
                  <div className="text-brutal-sm">99.9%</div>
                </div>
                <div>
                  <div className="text-brutal-xs text-cathode-white mb-8px">LAUNCHED</div>
                  <div className="text-brutal-sm">2024</div>
                </div>
              </div>
            </motion.div>
          </div>
        </footer>
      </section>
    </div>
  )
}