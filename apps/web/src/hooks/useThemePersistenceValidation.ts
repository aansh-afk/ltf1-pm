/**
 * THEME PERSISTENCE VALIDATION HOOK
 * React hook for validating theme persistence and state management
 */

import { useState, useCallback, useEffect } from 'react'
import { 
  themePersistenceValidator, 
  crossSessionValidator, 
  ThemePersistenceUtils,
  type SessionTestResult,
  type CrossSessionValidationResult 
} from '../utils/themePersistenceValidator'
import { useTheme } from '../contexts/ThemeContext'

interface PersistenceValidationState {
  isRunning: boolean
  sessionResult: SessionTestResult | null
  crossSessionResult: CrossSessionValidationResult | null
  lastValidation: string | null
  currentValidationStatus: 'idle' | 'session-testing' | 'cross-session-testing' | 'completed' | 'failed'
}

interface UsePersistenceValidationReturn {
  // State
  state: PersistenceValidationState
  
  // Test controls
  runSessionValidation: () => Promise<void>
  runCrossSessionValidation: () => Promise<void>
  runQuickCheck: () => Promise<{ passed: boolean; issues: string[] }>
  clearResults: () => void
  
  // Results analysis
  getValidationSummary: () => ValidationSummary | null
  exportResults: () => string
  getCurrentStateValidation: () => { isValid: boolean; currentTheme: string | null; hasHighContrast: boolean }
  
  // Utilities
  hasResults: boolean
  overallScore: number
  criticalIssuesCount: number
}

interface ValidationSummary {
  sessionScore: number
  crossSessionScore: number
  consistencyScore: number
  reliabilityScore: number
  totalTests: number
  passedTests: number
  failedTests: number
  criticalIssues: string[]
  recommendations: string[]
  browserCompatibility: {
    localStorage: boolean
    sessionStorage: boolean
    cookies: boolean
    cssCustomProperties: boolean
  }
}

/**
 * THEME PERSISTENCE VALIDATION HOOK
 * Comprehensive testing of theme persistence across sessions
 */
export function useThemePersistenceValidation(): UsePersistenceValidationReturn {
  const [state, setState] = useState<PersistenceValidationState>({
    isRunning: false,
    sessionResult: null,
    crossSessionResult: null,
    lastValidation: null,
    currentValidationStatus: 'idle'
  })

  const { currentTheme } = useTheme()

  /**
   * RUN SESSION VALIDATION
   * Tests persistence within current browser session
   */
  const runSessionValidation = useCallback(async () => {
    if (state.isRunning) return

    setState(prev => ({
      ...prev,
      isRunning: true,
      currentValidationStatus: 'session-testing'
    }))

    try {
      console.log('🎯 Starting session persistence validation...')
      
      const result = await themePersistenceValidator.runComprehensiveValidation()
      
      setState(prev => ({
        ...prev,
        isRunning: false,
        sessionResult: result,
        lastValidation: new Date().toISOString(),
        currentValidationStatus: 'completed'
      }))

      console.log(`✅ Session validation completed! Score: ${result.overallScore}/100`)

    } catch (error) {
      console.error('❌ Session validation failed:', error)
      
      setState(prev => ({
        ...prev,
        isRunning: false,
        currentValidationStatus: 'failed'
      }))
    }
  }, [state.isRunning])

  /**
   * RUN CROSS-SESSION VALIDATION
   * Tests persistence across multiple simulated browser sessions
   */
  const runCrossSessionValidation = useCallback(async () => {
    if (state.isRunning) return

    setState(prev => ({
      ...prev,
      isRunning: true,
      currentValidationStatus: 'cross-session-testing'
    }))

    try {
      console.log('🌐 Starting cross-session persistence validation...')
      
      const result = await crossSessionValidator.simulateCrossSessionTesting()
      
      setState(prev => ({
        ...prev,
        isRunning: false,
        crossSessionResult: result,
        lastValidation: new Date().toISOString(),
        currentValidationStatus: 'completed'
      }))

      console.log(`✅ Cross-session validation completed! Score: ${result.overallPersistenceScore}/100`)

    } catch (error) {
      console.error('❌ Cross-session validation failed:', error)
      
      setState(prev => ({
        ...prev,
        isRunning: false,
        currentValidationStatus: 'failed'
      }))
    }
  }, [state.isRunning])

  /**
   * RUN QUICK PERSISTENCE CHECK
   * Fast validation of basic persistence functionality
   */
  const runQuickCheck = useCallback(async (): Promise<{ passed: boolean; issues: string[] }> => {
    try {
      console.log('⚡ Running quick persistence check...')
      
      const result = await ThemePersistenceUtils.quickPersistenceCheck()
      
      console.log(`⚡ Quick check completed: ${result.passed ? 'PASSED' : 'FAILED'}`)
      if (result.issues.length > 0) {
        console.warn('Issues found:', result.issues)
      }
      
      return result
    } catch (error) {
      console.error('❌ Quick check failed:', error)
      return { passed: false, issues: [String(error)] }
    }
  }, [])

  /**
   * CLEAR VALIDATION RESULTS
   * Resets all validation data
   */
  const clearResults = useCallback(() => {
    setState({
      isRunning: false,
      sessionResult: null,
      crossSessionResult: null,
      lastValidation: null,
      currentValidationStatus: 'idle'
    })
  }, [])

  /**
   * GET VALIDATION SUMMARY
   * Returns comprehensive summary of validation results
   */
  const getValidationSummary = useCallback((): ValidationSummary | null => {
    if (!state.sessionResult && !state.crossSessionResult) return null

    const sessionScore = state.sessionResult?.overallScore || 0
    const crossSessionScore = state.crossSessionResult?.overallPersistenceScore || 0
    const consistencyScore = state.crossSessionResult?.consistencyScore || 0
    const reliabilityScore = state.crossSessionResult?.reliabilityScore || 0

    const totalTests = (state.sessionResult?.persistenceTests.length || 0) + 
                      (state.crossSessionResult?.summary.totalTests || 0)
    const passedTests = (state.sessionResult?.persistenceTests.filter(t => t.passed).length || 0) + 
                       (state.crossSessionResult?.summary.passedTests || 0)
    const failedTests = totalTests - passedTests

    const criticalIssues = [
      ...(state.sessionResult?.criticalIssues || []),
      ...(state.crossSessionResult?.sessionResults.flatMap(s => s.criticalIssues) || [])
    ]

    const recommendations = [
      ...(state.sessionResult?.recommendations || []),
      ...(state.crossSessionResult?.sessionResults.flatMap(s => s.recommendations) || [])
    ]

    const browserInfo = state.sessionResult?.browserInfo || {
      localStorageEnabled: false,
      sessionStorageEnabled: false,
      cookiesEnabled: false
    }

    return {
      sessionScore,
      crossSessionScore,
      consistencyScore,
      reliabilityScore,
      totalTests,
      passedTests,
      failedTests,
      criticalIssues,
      recommendations,
      browserCompatibility: {
        localStorage: browserInfo.localStorageEnabled,
        sessionStorage: browserInfo.sessionStorageEnabled,
        cookies: browserInfo.cookiesEnabled,
        cssCustomProperties: CSS.supports('--test', 'value')
      }
    }
  }, [state.sessionResult, state.crossSessionResult])

  /**
   * EXPORT VALIDATION RESULTS
   * Returns JSON string of all validation data
   */
  const exportResults = useCallback((): string => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      currentTheme: currentTheme.name,
      sessionResult: state.sessionResult,
      crossSessionResult: state.crossSessionResult,
      summary: getValidationSummary()
    }

    return JSON.stringify(exportData, null, 2)
  }, [state.sessionResult, state.crossSessionResult, currentTheme.name, getValidationSummary])

  /**
   * GET CURRENT STATE VALIDATION
   * Validates the current persistence state
   */
  const getCurrentStateValidation = useCallback(() => {
    return ThemePersistenceUtils.validateCurrentState()
  }, [])

  // Computed properties
  const hasResults = state.sessionResult !== null || state.crossSessionResult !== null
  const overallScore = getValidationSummary()?.sessionScore || 0
  const criticalIssuesCount = getValidationSummary()?.criticalIssues.length || 0

  // Log validation completion in development
  useEffect(() => {
    if (state.currentValidationStatus === 'completed' && process.env.NODE_ENV === 'development') {
      const summary = getValidationSummary()
      if (summary) {
        console.log('📋 Persistence validation completed:', {
          sessionScore: summary.sessionScore,
          crossSessionScore: summary.crossSessionScore,
          totalTests: summary.totalTests,
          criticalIssues: summary.criticalIssues.length
        })
      }
    }
  }, [state.currentValidationStatus, getValidationSummary])

  return {
    state,
    runSessionValidation,
    runCrossSessionValidation,
    runQuickCheck,
    clearResults,
    getValidationSummary,
    exportResults,
    getCurrentStateValidation,
    hasResults,
    overallScore,
    criticalIssuesCount
  }
}

/**
 * PERSISTENCE MONITORING HOOK
 * Continuously monitors theme persistence health
 */
export function useThemePersistenceMonitoring(enabled: boolean = false) {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const [issues, setIssues] = useState<string[]>([])
  
  const { runQuickCheck } = useThemePersistenceValidation()
  const { currentTheme } = useTheme()

  // Monitor persistence on theme changes
  useEffect(() => {
    if (enabled && isMonitoring) {
      const checkPersistence = async () => {
        const result = await runQuickCheck()
        setLastCheck(new Date())
        setIssues(result.issues)
        
        if (!result.passed && process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Persistence issues detected:', result.issues)
        }
      }

      // Check immediately on theme change
      checkPersistence()

      // Set up periodic checking
      const interval = setInterval(checkPersistence, 30000) // Every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [currentTheme, enabled, isMonitoring, runQuickCheck])

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true)
    if (process.env.NODE_ENV === 'development') {
      console.log('👁️ Started persistence monitoring')
    }
  }, [])

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
    if (process.env.NODE_ENV === 'development') {
      console.log('⏹️ Stopped persistence monitoring')
    }
  }, [])

  return {
    isMonitoring,
    lastCheck,
    issues,
    hasIssues: issues.length > 0,
    startMonitoring,
    stopMonitoring
  }
}

/**
 * AUTOMATED PERSISTENCE VALIDATION HOOK
 * Automatically validates persistence on app initialization
 */
export function useAutomatedPersistenceValidation(enabled: boolean = process.env.NODE_ENV === 'development') {
  const { runQuickCheck } = useThemePersistenceValidation()
  const [hasValidated, setHasValidated] = useState(false)

  useEffect(() => {
    if (enabled && !hasValidated) {
      const validateOnStartup = async () => {
        try {
          const result = await runQuickCheck()
          setHasValidated(true)
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Startup persistence validation:', result.passed ? 'PASSED' : 'FAILED')
            if (result.issues.length > 0) {
              console.warn('Persistence issues on startup:', result.issues)
            }
          }
        } catch (error) {
          console.error('Failed startup persistence validation:', error)
        }
      }

      // Run validation after a short delay to allow app initialization
      const timeout = setTimeout(validateOnStartup, 2000)
      
      return () => clearTimeout(timeout)
    }
  }, [enabled, hasValidated, runQuickCheck])

  return { hasValidated }
}