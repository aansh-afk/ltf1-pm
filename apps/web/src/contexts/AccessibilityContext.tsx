/**
 * ACCESSIBILITY CONTEXT - WCAG COMPLIANCE SYSTEM
 * Manages accessibility features across the entire application
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  initializeAccessibilityMode,
  initializeMotionPreferences,
  initializeKeyboardNavigation,
  toggleHighContrastMode,
  enhanceFocusVisibility,
  restoreFocusVisibility,
  announceToScreenReader
} from '@/utils/accessibility'

interface AccessibilitySettings {
  highContrastMode: boolean
  reducedMotion: boolean
  enhancedFocus: boolean
  keyboardNavigation: boolean
  screenReaderAnnouncements: boolean
  fontSize: 'normal' | 'large' | 'extra-large'
  focusVisibility: 'normal' | 'enhanced'
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  toggleHighContrast: () => void
  toggleEnhancedFocus: () => void
  toggleScreenReaderMode: () => void
  setFontSize: (size: AccessibilitySettings['fontSize']) => void
  announce: (message: string) => void
  isAccessibilityMode: boolean
}

const defaultSettings: AccessibilitySettings = {
  highContrastMode: false,
  reducedMotion: false,
  enhancedFocus: false,
  keyboardNavigation: true,
  screenReaderAnnouncements: true,
  fontSize: 'normal',
  focusVisibility: 'normal'
}

type SetSettingsFn = React.Dispatch<React.SetStateAction<AccessibilitySettings>>

function attachMotionListener(setSettings: SetSettingsFn, mq: MediaQueryList): () => void {
  const handler = (e: MediaQueryListEvent) => { setSettings(prev => ({ ...prev, reducedMotion: e.matches })) }
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}

function attachContrastListener(setSettings: SetSettingsFn, mq: MediaQueryList): () => void {
  const handler = (e: MediaQueryListEvent) => { setSettings(prev => ({ ...prev, highContrastMode: e.matches })) }
  mq.addEventListener('change', handler)
  return () => mq.removeEventListener('change', handler)
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null)

interface AccessibilityProviderProps {
  children: ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Load saved settings from localStorage
    const saved = localStorage.getItem('accessibility-settings')
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
  })

  const isAccessibilityMode = settings.highContrastMode ||
                              settings.enhancedFocus ||
                              settings.fontSize !== 'normal'

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings))
  }, [settings])

  // One-time initialization: detect system preferences and subscribe to media query changes
  useEffect(() => {
    initializeAccessibilityMode()
    initializeMotionPreferences()
    initializeKeyboardNavigation()

    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const contrastMediaQuery = window.matchMedia('(prefers-contrast: high)')

    setSettings(prev => {
      const updated = {
        ...prev,
        reducedMotion: motionMediaQuery.matches || prev.reducedMotion,
        highContrastMode: contrastMediaQuery.matches || prev.highContrastMode
      }
      if (updated.highContrastMode) {
        document.documentElement.setAttribute('data-accessibility', 'high-contrast')
      }
      if (updated.enhancedFocus) {
        enhanceFocusVisibility()
      }
      if (updated.fontSize !== 'normal') {
        document.documentElement.setAttribute('data-font-size', updated.fontSize)
      }
      return updated
    })

    const cleanupMotion = attachMotionListener(setSettings, motionMediaQuery)
    const cleanupContrast = attachContrastListener(setSettings, contrastMediaQuery)

    return () => {
      cleanupMotion()
      cleanupContrast()
    }
  }, [])

  // Apply settings to DOM
  useEffect(() => {
    // High contrast mode
    if (settings.highContrastMode) {
      document.documentElement.setAttribute('data-accessibility', 'high-contrast')
    } else {
      document.documentElement.removeAttribute('data-accessibility')
    }

    // Enhanced focus
    if (settings.enhancedFocus) {
      enhanceFocusVisibility()
    } else {
      restoreFocusVisibility()
    }

    // Font size
    document.documentElement.setAttribute('data-font-size', settings.fontSize)

    // Reduced motion
    if (settings.reducedMotion) {
      document.documentElement.classList.add('reduce-motion')
    } else {
      document.documentElement.classList.remove('reduce-motion')
    }
  }, [settings])

  const toggleHighContrast = () => {
    setSettings(prev => {
      const newMode = !prev.highContrastMode
      if (newMode) {
        announce('High contrast mode enabled')
      } else {
        announce('High contrast mode disabled')
      }
      return { ...prev, highContrastMode: newMode }
    })
  }

  const toggleEnhancedFocus = () => {
    setSettings(prev => {
      const newMode = !prev.enhancedFocus
      if (newMode) {
        announce('Enhanced focus indicators enabled')
      } else {
        announce('Enhanced focus indicators disabled')
      }
      return { ...prev, enhancedFocus: newMode }
    })
  }

  const toggleScreenReaderMode = () => {
    setSettings(prev => {
      const newMode = !prev.screenReaderAnnouncements
      if (newMode) {
        announce('Screen reader announcements enabled')
      } else {
        announce('Screen reader announcements disabled')
      }
      return { ...prev, screenReaderAnnouncements: newMode }
    })
  }

  const setFontSize = (size: AccessibilitySettings['fontSize']) => {
    setSettings(prev => ({ ...prev, fontSize: size }))
    announce(`Font size changed to ${size}`)
  }

  const announce = (message: string) => {
    if (settings.screenReaderAnnouncements) {
      announceToScreenReader(message)
    }
  }

  const value: AccessibilityContextType = {
    settings,
    toggleHighContrast,
    toggleEnhancedFocus,
    toggleScreenReaderMode,
    setFontSize,
    announce,
    isAccessibilityMode
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      
      {/* Skip Links for Keyboard Navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      {/* Accessibility Announcements Region */}
      <div 
        id="accessibility-announcements" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      />
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}

// HOC for accessible components
export function withAccessibility<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AccessibleComponent(props: P) {
    const { announce } = useAccessibility()
    
    return (
      <Component 
        {...props} 
        announce={announce}
      />
    )
  }
}

// Custom hook for focus management
export function useFocusManagement() {
  const { settings } = useAccessibility()
  
  const focusElement = (element: HTMLElement | null) => {
    if (element) {
      element.focus()
      if (settings.enhancedFocus) {
        element.scrollIntoView({ behavior: 'instant', block: 'center' })
      }
    }
  }

  const focusFirstElement = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    focusElement(firstElement)
  }

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }

  return {
    focusElement,
    focusFirstElement,
    trapFocus
  }
}

// Accessibility testing utilities
export function useAccessibilityTesting() {
  return {
    checkContrast: (foreground: string, background: string) => {
      // Implementation would check color contrast
      console.log(`Checking contrast: ${foreground} on ${background}`)
    },
    
    validateAria: (element: HTMLElement) => {
      // Implementation would validate ARIA attributes
      console.log('Validating ARIA attributes:', element)
    },
    
    testKeyboardNavigation: (container: HTMLElement) => {
      // Implementation would test keyboard navigation
      console.log('Testing keyboard navigation in:', container)
    }
  }
}