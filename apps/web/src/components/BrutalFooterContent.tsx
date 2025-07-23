import { motion, useTransform, MotionValue } from 'framer-motion'
import { HiOutlineTerminal, HiOutlineCode, HiOutlineLightningBolt } from 'react-icons/hi'
import { Link } from 'react-router-dom'

interface BrutalFooterContentProps {
  revealProgress?: MotionValue<number>
}

export function BrutalFooterContent({ revealProgress }: BrutalFooterContentProps) {
  // Create staggered reveal animations
  const contentOpacity = revealProgress ? useTransform(revealProgress, [0.3, 0.6], [0, 1]) : 1
  const glitchOpacity = revealProgress ? useTransform(revealProgress, [0.6, 0.8], [0, 1]) : 1
  const finalOpacity = revealProgress ? useTransform(revealProgress, [0.8, 1], [0, 1]) : 1

  return (
    <footer className="relative h-full flex flex-col justify-between bg-event-horizon overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            #333333 2px,
            #333333 4px
          ), repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            #333333 2px,
            #333333 4px
          )`
        }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-48px">
        <motion.div 
          className="max-w-6xl w-full"
          style={{ opacity: contentOpacity }}
        >
          {/* Glitch Title */}
          <motion.div 
            className="text-center mb-64px"
            style={{ opacity: glitchOpacity }}
          >
            <h2 className="text-6xl md:text-8xl font-bold mb-24px">
              <span className="inline-block animate-glitch glitch-text">END OF LINE</span>
            </h2>
            <div className="brutal-divider max-w-xs mx-auto bg-glitch-flare h-4px"></div>
          </motion.div>

          {/* Terminal Interface */}
          <motion.div 
            className="brutal-card p-32px mb-48px max-w-4xl mx-auto"
            style={{ 
              opacity: finalOpacity,
              boxShadow: '10px 10px 0px #000000'
            }}
          >
            <div className="flex items-center gap-8px mb-24px">
              <HiOutlineTerminal className="w-24px h-24px text-[#00FFFF]" />
              <span className="text-brutal-sm">SYSTEM.TERMINAL</span>
            </div>
            
            <pre className="text-sm md:text-base overflow-x-auto">
              <span className="text-[#00FFFF]">$</span> ltf1 --status<br />
              <span className="text-[#FFFF00]">&gt;</span> DEVELOPMENT ENVIRONMENT: ACTIVE<br />
              <span className="text-[#FFFF00]">&gt;</span> BRUTALIST PROTOCOL: ENFORCED<br />
              <span className="text-[#FFFF00]">&gt;</span> PRODUCTIVITY LEVEL: <span className="text-[#00FF00]">MAXIMUM</span><br />
              <span className="text-[#FF00FF]">_</span> <span className="animate-pulse">READY FOR TRANSFORMATION...</span>
            </pre>
          </motion.div>

          {/* CTA Grid */}
          <motion.div 
            className="grid md:grid-cols-3 gap-32px mb-64px"
            style={{ opacity: finalOpacity }}
          >
            <motion.div 
              className="brutal-card p-32px text-center brutal-hover group"
              whileHover={{ scale: 1.02 }}
            >
              <HiOutlineCode className="w-64px h-64px mx-auto mb-24px text-[#00FFFF] group-hover:animate-pulse" />
              <h3 className="text-brutal-xl mb-16px">START BUILDING</h3>
              <Link to="/sign-up" className="brutal-btn w-full bg-glitch-flare text-event-horizon">
                INITIALIZE PROJECT
              </Link>
            </motion.div>

            <motion.div 
              className="brutal-card p-32px text-center brutal-hover group"
              whileHover={{ scale: 1.02 }}
            >
              <HiOutlineLightningBolt className="w-64px h-64px mx-auto mb-24px text-[#FF00FF] group-hover:animate-pulse" />
              <h3 className="text-brutal-xl mb-16px">VIEW DEMO</h3>
              <Link to="/demo" className="brutal-btn w-full">
                EXECUTE DEMO
              </Link>
            </motion.div>

            <motion.div 
              className="brutal-card p-32px text-center brutal-hover group"
              whileHover={{ scale: 1.02 }}
            >
              <HiOutlineTerminal className="w-64px h-64px mx-auto mb-24px text-[#FFFF00] group-hover:animate-pulse" />
              <h3 className="text-brutal-xl mb-16px">READ DOCS</h3>
              <a href="/docs" className="brutal-btn w-full">
                ACCESS DOCUMENTATION
              </a>
            </motion.div>
          </motion.div>

          {/* Final Message */}
          <motion.div 
            className="text-center"
            style={{ opacity: finalOpacity }}
          >
            <p className="text-2xl md:text-4xl font-bold mb-16px">
              YOUR JOURNEY INTO THE <span className="glitch-text">VOID</span> BEGINS NOW
            </p>
            <p className="text-brutal-sm text-cathode-white/60">
              DEVELOPED WITH BRUTALIST PRINCIPLES. NO COMPROMISES.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <motion.div 
        className="bg-carbon-plate border-t-4 border-basalt-border p-32px"
        style={{ opacity: finalOpacity }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-32px mb-32px">
            <div>
              <h3 className="text-3xl font-bold mb-16px">
                <span className="glitch-text">LTF1</span>
              </h3>
              <p className="text-brutal-sm">THE FUTURE OF DEV-FOCUSED PROJECT MANAGEMENT</p>
            </div>
            
            <div>
              <h4 className="text-brutal-lg mb-16px text-[#00FFFF]">PRODUCT</h4>
              <div className="space-y-8px">
                <a className="block text-brutal-sm hover:text-[#00FFFF] transition-colors cursor-pointer">FEATURES</a>
                <a className="block text-brutal-sm hover:text-[#00FFFF] transition-colors cursor-pointer">PRICING</a>
                <a className="block text-brutal-sm hover:text-[#00FFFF] transition-colors cursor-pointer">INTEGRATIONS</a>
                <a className="block text-brutal-sm hover:text-[#00FFFF] transition-colors cursor-pointer">CHANGELOG</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-brutal-lg mb-16px text-[#FF00FF]">RESOURCES</h4>
              <div className="space-y-8px">
                <a className="block text-brutal-sm hover:text-[#FF00FF] transition-colors cursor-pointer">DOCUMENTATION</a>
                <a className="block text-brutal-sm hover:text-[#FF00FF] transition-colors cursor-pointer">API REFERENCE</a>
                <a className="block text-brutal-sm hover:text-[#FF00FF] transition-colors cursor-pointer">COMMUNITY</a>
                <a className="block text-brutal-sm hover:text-[#FF00FF] transition-colors cursor-pointer">STATUS</a>
              </div>
            </div>
            
            <div>
              <h4 className="text-brutal-lg mb-16px text-[#FFFF00]">COMPANY</h4>
              <div className="space-y-8px">
                <a className="block text-brutal-sm hover:text-[#FFFF00] transition-colors cursor-pointer">ABOUT</a>
                <a className="block text-brutal-sm hover:text-[#FFFF00] transition-colors cursor-pointer">BLOG</a>
                <a className="block text-brutal-sm hover:text-[#FFFF00] transition-colors cursor-pointer">CAREERS</a>
                <a className="block text-brutal-sm hover:text-[#FFFF00] transition-colors cursor-pointer">CONTACT</a>
              </div>
            </div>
          </div>
          
          <div className="brutal-divider bg-glitch-flare h-2px"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-center mt-24px">
            <p className="text-brutal-xs mb-16px md:mb-0">
              &copy; 2024 LTF1. ALL RIGHTS RESERVED. BUILT WITH PURE BRUTALISM.
            </p>
            <div className="flex gap-24px">
              <a className="text-brutal-xs hover:text-[#00FFFF] transition-colors cursor-pointer">TERMS</a>
              <a className="text-brutal-xs hover:text-[#FF00FF] transition-colors cursor-pointer">PRIVACY</a>
              <a className="text-brutal-xs hover:text-[#FFFF00] transition-colors cursor-pointer">SECURITY</a>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Glitch Effects Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute inset-0"
          style={{ 
            opacity: glitchOpacity,
            background: 'linear-gradient(0deg, transparent 0%, rgba(0,255,255,0.03) 50%, transparent 100%)',
            animation: 'glitchScan 8s linear infinite'
          }}
        />
      </div>
    </footer>
  )
}