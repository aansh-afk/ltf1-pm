import { m, useTransform, useMotionValue, MotionValue } from 'framer-motion'
import { HiOutlineTerminal, HiOutlineCode, HiOutlineLightningBolt } from 'react-icons/hi'
import { Link } from 'react-router-dom'

interface BrutalFooterContentProps {
  revealProgress?: MotionValue<number>
}

export function BrutalFooterContent({ revealProgress }: BrutalFooterContentProps) {
  // Fallback motion value for when revealProgress is not provided (always 1 = fully visible)
  const staticProgress = useMotionValue(1)
  const progress = revealProgress ?? staticProgress

  // Create staggered reveal animations
  const contentOpacity = useTransform(progress, [0.3, 0.6], [0, 1])
  const glitchOpacity = useTransform(progress, [0.6, 0.8], [0, 1])
  const finalOpacity = useTransform(progress, [0.8, 1], [0, 1])

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
      <div className="relative z-10 flex-1 flex items-center justify-center p-[24px]">
        <m.div 
          className="max-w-6xl w-full"
          style={{ opacity: contentOpacity }}
        >
          {/* Glitch Title */}
          <m.div 
            className="text-center mb-[32px]"
            style={{ opacity: glitchOpacity }}
          >
            <h2 className="text-6xl md:text-8xl font-bold mb-[12px]">
              <span className="inline-block animate-glitch glitch-text">END OF LINE</span>
            </h2>
            <div className="brutal-divider max-w-xs mx-auto bg-glitch-flare h-4px"></div>
          </m.div>

          {/* Terminal Interface */}
          <m.div 
            className="brutal-card p-[20px] mb-[24px] max-w-4xl mx-auto"
            style={{ 
              opacity: finalOpacity,
              boxShadow: '10px 10px 0px #000000'
            }}
          >
            <div className="flex items-center gap-8px mb-[12px]">
              <HiOutlineTerminal className="w-4 h-4 text-[#00FFFF]" />
              <span className="text-brutal-sm">SYSTEM.TERMINAL</span>
            </div>
            
            <pre className="text-sm md:text-base overflow-x-auto">
              <span className="text-[#00FFFF]">$</span> ltf1 --status<br />
              <span className="text-[#FFFF00]">&gt;</span> DEVELOPMENT ENVIRONMENT: ACTIVE<br />
              <span className="text-[#FFFF00]">&gt;</span> BRUTALIST PROTOCOL: ENFORCED<br />
              <span className="text-[#FFFF00]">&gt;</span> PRODUCTIVITY LEVEL: <span className="text-[#00FF00]">MAXIMUM</span><br />
              <span className="text-[#FF00FF]">_</span> <span className="animate-pulse">READY FOR TRANSFORMATION...</span>
            </pre>
          </m.div>

          {/* CTA Grid */}
          <m.div 
            className="grid md:grid-cols-3 gap-[16px] mb-[32px]"
            style={{ opacity: finalOpacity }}
          >
            <m.div 
              className="brutal-card p-[20px] text-center brutal-hover group"
              whileHover={{ scale: 1.02 }}
            >
              <HiOutlineCode className="w-8 h-8 mx-auto mb-[12px] text-[#00FFFF] group-hover:animate-pulse" />
              <h3 className="text-[16px] font-bold mb-[8px]">START BUILDING</h3>
              <Link to="/sign-up" className="brutal-btn w-full bg-glitch-flare text-event-horizon">
                INITIALIZE PROJECT
              </Link>
            </m.div>

            <m.div 
              className="brutal-card p-[20px] text-center brutal-hover group"
              whileHover={{ scale: 1.02 }}
            >
              <HiOutlineLightningBolt className="w-8 h-8 mx-auto mb-[12px] text-[#FF00FF] group-hover:animate-pulse" />
              <h3 className="text-[16px] font-bold mb-[8px]">VIEW DEMO</h3>
              <Link to="/demo" className="brutal-btn w-full">
                EXECUTE DEMO
              </Link>
            </m.div>

            <m.div 
              className="brutal-card p-[20px] text-center brutal-hover group"
              whileHover={{ scale: 1.02 }}
            >
              <HiOutlineTerminal className="w-8 h-8 mx-auto mb-[12px] text-[#FFFF00] group-hover:animate-pulse" />
              <h3 className="text-[16px] font-bold mb-[8px]">READ DOCS</h3>
              <a href="/docs" className="brutal-btn w-full">
                ACCESS DOCUMENTATION
              </a>
            </m.div>
          </m.div>

          {/* Final Message */}
          <m.div 
            className="text-center"
            style={{ opacity: finalOpacity }}
          >
            <p className="text-2xl md:text-4xl font-bold mb-[8px]">
              YOUR JOURNEY INTO THE <span className="glitch-text">VOID</span> BEGINS NOW
            </p>
            <p className="text-brutal-sm text-cathode-white/60">
              DEVELOPED WITH BRUTALIST PRINCIPLES. NO COMPROMISES.
            </p>
          </m.div>
        </m.div>
      </div>

      {/* Bottom Bar */}
      <m.div 
        className="bg-carbon-plate border-t-4 border-basalt-border p-[20px]"
        style={{ opacity: finalOpacity }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-[16px] mb-[16px]">
            <div>
              <h3 className="text-3xl font-bold mb-[8px]">
                <span className="glitch-text">LTF1</span>
              </h3>
              <p className="text-brutal-sm">THE FUTURE OF DEV-FOCUSED PROJECT MANAGEMENT</p>
            </div>
            
            <div>
              <h4 className="text-[14px] font-semibold mb-[8px] text-[#00FFFF]">PRODUCT</h4>
              <div className="space-y-8px">
                <Link to="/features" className="block text-brutal-sm hover:text-[#00FFFF] transition-colors">FEATURES</Link>
                <Link to="/pricing" className="block text-brutal-sm hover:text-[#00FFFF] transition-colors">PRICING</Link>
                <Link to="/integrations" className="block text-brutal-sm hover:text-[#00FFFF] transition-colors">INTEGRATIONS</Link>
                <Link to="/changelog" className="block text-brutal-sm hover:text-[#00FFFF] transition-colors">CHANGELOG</Link>
              </div>
            </div>

            <div>
              <h4 className="text-[14px] font-semibold mb-[8px] text-[#FF00FF]">RESOURCES</h4>
              <div className="space-y-8px">
                <Link to="/docs" className="block text-brutal-sm hover:text-[#FF00FF] transition-colors">DOCUMENTATION</Link>
                <Link to="/docs/api" className="block text-brutal-sm hover:text-[#FF00FF] transition-colors">API REFERENCE</Link>
                <Link to="/community" className="block text-brutal-sm hover:text-[#FF00FF] transition-colors">COMMUNITY</Link>
                <Link to="/status" className="block text-brutal-sm hover:text-[#FF00FF] transition-colors">STATUS</Link>
              </div>
            </div>

            <div>
              <h4 className="text-[14px] font-semibold mb-[8px] text-[#FFFF00]">COMPANY</h4>
              <div className="space-y-8px">
                <Link to="/about" className="block text-brutal-sm hover:text-[#FFFF00] transition-colors">ABOUT</Link>
                <Link to="/blog" className="block text-brutal-sm hover:text-[#FFFF00] transition-colors">BLOG</Link>
                <Link to="/careers" className="block text-brutal-sm hover:text-[#FFFF00] transition-colors">CAREERS</Link>
                <Link to="/contact" className="block text-brutal-sm hover:text-[#FFFF00] transition-colors">CONTACT</Link>
              </div>
            </div>
          </div>

          <div className="brutal-divider bg-glitch-flare h-2px"></div>

          <div className="flex flex-col md:flex-row justify-between items-center mt-[12px]">
            <p className="text-brutal-xs mb-[8px] md:mb-0">
              &copy; 2024 LTF1. ALL RIGHTS RESERVED. BUILT WITH PURE BRUTALISM.
            </p>
            <div className="flex gap-[12px]">
              <Link to="/terms" className="text-brutal-xs hover:text-[#00FFFF] transition-colors">TERMS</Link>
              <Link to="/privacy" className="text-brutal-xs hover:text-[#FF00FF] transition-colors">PRIVACY</Link>
              <Link to="/security" className="text-brutal-xs hover:text-[#FFFF00] transition-colors">SECURITY</Link>
            </div>
          </div>
        </div>
      </m.div>

      {/* Glitch Effects Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <m.div 
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