import { useState, useEffect } from 'react'

export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      // Check viewport width
      const width = window.innerWidth
      const isMobileWidth = width < 768 // md breakpoint
      const isTabletWidth = width >= 768 && width < 1024 // md to lg

      // Check user agent for mobile devices
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileUA = /iphone|ipad|ipod|android|blackberry|windows phone|webos/.test(userAgent)

      setIsMobile(isMobileWidth || isMobileUA)
      setIsTablet(isTabletWidth)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return { isMobile, isTablet, isSmallScreen: isMobile || isTablet }
}
