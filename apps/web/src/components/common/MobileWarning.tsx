import React, { useState, useEffect } from 'react'
import { HiOutlineDeviceMobile, HiOutlineDesktopComputer, HiOutlineClock } from 'react-icons/hi'

export default function MobileWarning() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      // Check multiple conditions for mobile detection
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
      const isSmallScreen = window.innerWidth < 768
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // Set as mobile if any condition is met
      setIsMobile(isMobileDevice || (isSmallScreen && isTouchDevice))
    }

    // Check on mount
    checkMobile()

    // Check on resize
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  if (!isMobile) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100000] bg-event-horizon overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-16px">
        <div className="w-full max-w-480px">
          {/* Logo/Brand Section */}
          <div className="text-center mb-32px">
            <div className="w-80px h-80px bg-primary-brutalist border-4 border-basalt-border mx-auto mb-16px flex items-center justify-center">
              <HiOutlineDeviceMobile className="w-40px h-40px text-event-horizon" />
            </div>
            <h1 className="text-brutal-2xl font-bold text-primary-brutalist uppercase mb-8px">
              MOBILE APP
            </h1>
            <h2 className="text-brutal-xl font-bold text-cathode-white uppercase">
              COMING SOON
            </h2>
          </div>

          {/* Main Message Card */}
          <div className="bg-carbon-plate border-4 border-primary-brutalist shadow-brutal-lg mb-24px">
            <div className="p-32px space-y-24px">
              {/* Status Message */}
              <div className="text-center space-y-12px">
                <div className="inline-flex items-center gap-8px px-16px py-8px bg-primary-brutalist/20 border-2 border-primary-brutalist">
                  <HiOutlineClock className="w-16px h-16px text-primary-brutalist animate-pulse" />
                  <span className="font-mono text-brutal-sm text-primary-brutalist font-bold">
                    IN DEVELOPMENT
                  </span>
                </div>
                
                <p className="text-brutal-sm text-cathode-white/80">
                  Our mobile app is currently under development and will be available soon. 
                  For now, please access the platform from a desktop computer.
                </p>
              </div>

              {/* Coming Features */}
              <div className="bg-basalt-border/20 border-2 border-basalt-border p-20px">
                <h3 className="text-brutal-sm font-bold uppercase text-cathode-white mb-12px">
                  MOBILE APP WILL INCLUDE:
                </h3>
                <div className="grid grid-cols-1 gap-8px">
                  {[
                    'Native mobile task management',
                    'Push notifications for updates',
                    'Offline mode support',
                    'Quick task creation',
                    'Team collaboration on-the-go',
                    'Time tracking',
                    'Project overview dashboard',
                    'Meeting scheduler'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-8px">
                      <div className="w-4px h-4px bg-primary-brutalist"></div>
                      <span className="text-brutal-xs text-cathode-white/60 font-mono">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop Access Info */}
              <div className="border-2 border-primary-brutalist/30 p-16px">
                <div className="flex items-center gap-12px mb-8px">
                  <HiOutlineDesktopComputer className="w-20px h-20px text-primary-brutalist" />
                  <span className="font-mono text-brutal-sm font-bold text-cathode-white">
                    ACCESS FROM DESKTOP
                  </span>
                </div>
                <p className="text-brutal-xs text-cathode-white/60 font-mono">
                  Visit this URL from your desktop computer to access the full platform with all features.
                </p>
              </div>

              {/* Notification Signup */}
              <div className="space-y-12px">
                <input
                  type="email"
                  placeholder="ENTER EMAIL FOR LAUNCH NOTIFICATION"
                  className="w-full px-16px py-12px bg-event-horizon border-2 border-basalt-border text-cathode-white font-mono text-brutal-sm placeholder-cathode-white/40 focus:border-primary-brutalist focus:outline-none"
                />
                <button className="w-full brutal-btn text-brutal-sm py-12px">
                  NOTIFY ME WHEN READY
                </button>
              </div>

              {/* Expected Timeline */}
              <div className="text-center pt-16px border-t-2 border-basalt-border">
                <p className="text-brutal-xs text-cathode-white/40 font-mono">
                  EXPECTED LAUNCH: Q2 2025
                </p>
                <p className="text-brutal-xs text-cathode-white/40 font-mono mt-4px">
                  iOS AND ANDROID
                </p>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex justify-center gap-24px">
            <a
              href="https://twitter.com"
              className="text-brutal-xs text-primary-brutalist/60 hover:text-primary-brutalist font-mono uppercase transition-colors"
            >
              FOLLOW UPDATES
            </a>
            <span className="text-brutal-xs text-cathode-white/20">|</span>
            <a
              href="mailto:support@example.com"
              className="text-brutal-xs text-primary-brutalist/60 hover:text-primary-brutalist font-mono uppercase transition-colors"
            >
              CONTACT SUPPORT
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}