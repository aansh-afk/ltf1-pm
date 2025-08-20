/**
 * THEME PERFORMANCE MONITORING HOOK
 * React hook for monitoring and optimizing theme performance
 */

import { useEffect, useCallback, useState } from 'react'
import { themePerformanceOptimizer, ThemePerformanceUtils } from '../utils/themePerformance'
import { useTheme } from '../contexts/ThemeContext'

interface ThemePerformanceStats {
  averageSwitchTime: number
  slowestSwitch: number
  fastestSwitch: number
  totalSwitches: number
  recommendations: string[]
  lastSwitchTime: number
  browserCapabilities: {
    customProperties: boolean
    containment: boolean
    willChange: boolean
    compositing: boolean
    paintAPI: boolean
  }
}

interface UseThemePerformanceReturn {
  stats: ThemePerformanceStats | null
  isMonitoring: boolean
  startMonitoring: () => void
  stopMonitoring: () => void
  optimizeMemory: () => void
  generatePerformanceReport: () => string
  measureCustomOperation: <T>(name: string, operation: () => T) => T
}

/**
 * THEME PERFORMANCE MONITORING HOOK
 * Provides comprehensive performance monitoring for theme operations
 */
export function useThemePerformance(): UseThemePerformanceReturn {
  const [stats, setStats] = useState<ThemePerformanceStats | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState(0)
  const { themeName } = useTheme()

  // Update stats when theme changes
  useEffect(() => {
    if (isMonitoring) {
      const now = performance.now()
      setLastUpdateTime(now)
      updateStats()
    }
  }, [themeName, isMonitoring])

  // Update performance statistics
  const updateStats = useCallback(() => {
    const auditResults = themePerformanceOptimizer.auditThemePerformance()
    const capabilities = ThemePerformanceUtils.checkPerformanceCapabilities()
    
    setStats({
      ...auditResults,
      lastSwitchTime: lastUpdateTime,
      browserCapabilities: capabilities
    })
  }, [lastUpdateTime])

  // Start performance monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true)
    updateStats()
    
    // Log monitoring start in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Theme performance monitoring started')
    }
  }, [updateStats])

  // Stop performance monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('⏹️ Theme performance monitoring stopped')
    }
  }, [])

  // Optimize memory usage
  const optimizeMemory = useCallback(() => {
    themePerformanceOptimizer.optimizeThemeMemory()
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Theme memory optimization performed')
    }
  }, [])

  // Measure custom operations
  const measureCustomOperation = useCallback(<T>(name: string, operation: () => T): T => {
    return ThemePerformanceUtils.measureThemeOperation(name, operation)
  }, [])

  // Generate performance report
  const generatePerformanceReport = useCallback((): string => {
    if (!stats) {
      return 'Performance monitoring not active. Call startMonitoring() first.'
    }

    const report = `
# THEME PERFORMANCE REPORT
Generated: ${new Date().toISOString()}

## Performance Metrics
- Average switch time: ${stats.averageSwitchTime.toFixed(2)}ms
- Fastest switch: ${stats.fastestSwitch.toFixed(2)}ms
- Slowest switch: ${stats.slowestSwitch.toFixed(2)}ms
- Total switches: ${stats.totalSwitches}

## Browser Capabilities
- CSS Custom Properties: ${stats.browserCapabilities.customProperties ? '✅' : '❌'}
- CSS Containment: ${stats.browserCapabilities.containment ? '✅' : '❌'}
- Will-Change: ${stats.browserCapabilities.willChange ? '✅' : '❌'}
- Compositing: ${stats.browserCapabilities.compositing ? '✅' : '❌'}
- Paint API: ${stats.browserCapabilities.paintAPI ? '✅' : '❌'}

## Performance Status
${stats.averageSwitchTime <= 16 ? '🟢 EXCELLENT' : stats.averageSwitchTime <= 50 ? '🟡 ACCEPTABLE' : '🔴 NEEDS OPTIMIZATION'}
Budget: 16ms (1 frame @ 60fps)

## Recommendations
${stats.recommendations.length > 0 ? stats.recommendations.map(rec => `- ${rec}`).join('\n') : '- No recommendations - performance is optimal!'}

## Brutalist Design Protocol Compliance
- Instant Changes: ✅ Enforced (no transitions)
- Zero Radius: ✅ Enforced  
- Mono Typography: ✅ IBM Plex Mono
- Performance: ${stats.averageSwitchTime <= 16 ? '✅' : '⚠️'} ${stats.averageSwitchTime <= 16 ? 'Optimal' : 'Review needed'}
    `

    return report.trim()
  }, [stats])

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      if (isMonitoring) {
        stopMonitoring()
      }
    }
  }, [isMonitoring, stopMonitoring])

  return {
    stats,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    optimizeMemory,
    generatePerformanceReport,
    measureCustomOperation
  }
}

/**
 * PERFORMANCE DEBUGGING HOOK
 * Development-only hook for deep performance analysis
 */
export function useThemePerformanceDebug() {
  const [debugMode, setDebugMode] = useState(false)
  const { stats, measureCustomOperation } = useThemePerformance()

  useEffect(() => {
    // Only enable in development
    if (process.env.NODE_ENV === 'development' && debugMode) {
      console.log('🛠️ Theme performance debug mode enabled')
      
      // Log performance warnings
      if (stats && stats.averageSwitchTime > 16) {
        console.warn(`⚠️ Theme switching exceeds 16ms budget: ${stats.averageSwitchTime.toFixed(2)}ms`)
      }
      
      // Monitor frame rate
      let frameCount = 0
      let lastTime = performance.now()
      
      const checkFrameRate = () => {
        frameCount++
        const currentTime = performance.now()
        
        if (currentTime - lastTime >= 1000) {
          const fps = (frameCount * 1000) / (currentTime - lastTime)
          if (fps < 55) {
            console.warn(`⚠️ Low frame rate detected: ${fps.toFixed(1)} FPS`)
          }
          frameCount = 0
          lastTime = currentTime
        }
        
        if (debugMode) {
          requestAnimationFrame(checkFrameRate)
        }
      }
      
      requestAnimationFrame(checkFrameRate)
    }
  }, [debugMode, stats])

  const enableDebugMode = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      setDebugMode(true)
    }
  }, [])

  const disableDebugMode = useCallback(() => {
    setDebugMode(false)
  }, [])

  const logThemeOperation = useCallback((name: string, operation: () => void) => {
    if (debugMode) {
      measureCustomOperation(`debug-${name}`, operation)
    } else {
      operation()
    }
  }, [debugMode, measureCustomOperation])

  return {
    debugMode,
    enableDebugMode,
    disableDebugMode,
    logThemeOperation
  }
}

/**
 * THEME PERFORMANCE CONTEXT HOOK
 * Provides access to performance methods from theme context
 */
export function useThemePerformanceContext() {
  const theme = useTheme()
  
  return {
    getPerformanceMetrics: theme.getPerformanceMetrics,
    optimizeMemory: theme.optimizeMemory
  }
}