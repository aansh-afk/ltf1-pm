/**
 * THEME INTEGRATION VALIDATION HOOK
 * React hook for comprehensive theme system integration validation
 */

import { useState, useCallback, useEffect } from 'react'
import { 
  themeIntegrationValidator, 
  IntegrationTestingUtils,
  type SystemIntegrationResult 
} from '../utils/themeIntegrationValidator'
import { useTheme } from '../contexts/ThemeContext'

interface IntegrationValidationState {
  isRunning: boolean
  currentPhase: string
  progress: number
  result: SystemIntegrationResult | null
  lastValidation: string | null
  validationStatus: 'idle' | 'running' | 'completed' | 'failed'
}

interface UseIntegrationValidationReturn {
  // State
  state: IntegrationValidationState
  
  // Test controls
  runFullIntegrationTest: () => Promise<void>
  runQuickIntegrationCheck: () => Promise<{ passed: boolean; score: number; issues: string[] }>
  validateSystemHealth: () => { isHealthy: boolean; issues: string[] }
  clearResults: () => void
  
  // Results analysis
  getValidationSummary: () => IntegrationSummary | null
  exportResults: () => string
  
  // Utilities
  hasResults: boolean
  overallScore: number
  systemHealthScore: number
  userExperienceScore: number
  passedIntegration: boolean
  criticalIssuesCount: number
}

interface IntegrationSummary {
  overallScore: number
  systemHealthScore: number
  userExperienceScore: number
  moduleScores: {
    themeSystem: number
    accessibility: number
    performance: number
    persistence: number
    userInterface: number
  }
  workflowResults: {
    totalWorkflows: number
    passedWorkflows: number
    failedWorkflows: number
  }
  criticalIssues: string[]
  warnings: string[]
  recommendations: string[]
  testDuration: number
  passedIntegration: boolean
}

/**
 * THEME INTEGRATION VALIDATION HOOK
 * Comprehensive testing of the entire theme system integration
 */
export function useThemeIntegrationValidation(): UseIntegrationValidationReturn {
  const [state, setState] = useState<IntegrationValidationState>({
    isRunning: false,
    currentPhase: '',
    progress: 0,
    result: null,
    lastValidation: null,
    validationStatus: 'idle'
  })

  const { currentTheme } = useTheme()

  /**
   * RUN FULL INTEGRATION TEST
   * Comprehensive validation of the entire theme system
   */
  const runFullIntegrationTest = useCallback(async () => {
    if (state.isRunning) return

    setState(prev => ({
      ...prev,
      isRunning: true,
      validationStatus: 'running',
      currentPhase: 'Initializing integration test...',
      progress: 0
    }))

    try {
      console.log('🚀 Starting comprehensive integration validation...')

      // Simulate progress updates
      const progressSteps = [
        { phase: 'Testing theme system integration...', progress: 10 },
        { phase: 'Validating accessibility integration...', progress: 25 },
        { phase: 'Checking performance integration...', progress: 40 },
        { phase: 'Testing persistence integration...', progress: 55 },
        { phase: 'Validating UI integration...', progress: 70 },
        { phase: 'Running user workflow tests...', progress: 85 },
        { phase: 'Compiling final results...', progress: 95 }
      ]

      // Start the integration test
      const integrationTestPromise = themeIntegrationValidator.runComprehensiveIntegration()

      // Update progress
      for (const step of progressSteps) {
        setState(prev => ({
          ...prev,
          currentPhase: step.phase,
          progress: step.progress
        }))
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      const result = await integrationTestPromise

      setState(prev => ({
        ...prev,
        isRunning: false,
        validationStatus: 'completed',
        result,
        lastValidation: new Date().toISOString(),
        currentPhase: 'Integration validation completed',
        progress: 100
      }))

      console.log(`✅ Integration validation completed! Score: ${result.overallScore}/100`)
      console.log(`🎯 System Health: ${result.systemHealthScore}/100`)
      console.log(`👤 User Experience: ${result.userExperienceScore}/100`)

      if (result.passedIntegration) {
        console.log('🟢 SYSTEM INTEGRATION VALIDATED - PRODUCTION READY!')
      } else {
        console.warn('🔴 INTEGRATION ISSUES DETECTED - REVIEW REQUIRED')
      }

    } catch (error) {
      console.error('❌ Integration validation failed:', error)
      
      setState(prev => ({
        ...prev,
        isRunning: false,
        validationStatus: 'failed',
        currentPhase: 'Integration validation failed',
        progress: 0
      }))
    }
  }, [state.isRunning])

  /**
   * RUN QUICK INTEGRATION CHECK
   * Fast validation of integration health
   */
  const runQuickIntegrationCheck = useCallback(async (): Promise<{ passed: boolean; score: number; issues: string[] }> => {
    try {
      console.log('⚡ Running quick integration check...')
      
      const result = await IntegrationTestingUtils.quickIntegrationCheck()
      
      console.log(`⚡ Quick integration check: ${result.passed ? 'PASSED' : 'FAILED'} (${result.score}/100)`)
      if (result.issues.length > 0) {
        console.warn('Issues found:', result.issues)
      }
      
      return result
    } catch (error) {
      console.error('❌ Quick integration check failed:', error)
      return { passed: false, score: 0, issues: [String(error)] }
    }
  }, [])

  /**
   * VALIDATE SYSTEM HEALTH
   * Checks current system health status
   */
  const validateSystemHealth = useCallback(() => {
    return IntegrationTestingUtils.validateSystemHealth()
  }, [])

  /**
   * CLEAR VALIDATION RESULTS
   * Resets all validation data
   */
  const clearResults = useCallback(() => {
    setState({
      isRunning: false,
      currentPhase: '',
      progress: 0,
      result: null,
      lastValidation: null,
      validationStatus: 'idle'
    })
  }, [])

  /**
   * GET VALIDATION SUMMARY
   * Returns comprehensive summary of validation results
   */
  const getValidationSummary = useCallback((): IntegrationSummary | null => {
    if (!state.result) return null

    const result = state.result

    return {
      overallScore: result.overallScore,
      systemHealthScore: result.systemHealthScore,
      userExperienceScore: result.userExperienceScore,
      moduleScores: {
        themeSystem: result.modules.themeSystem.score,
        accessibility: result.modules.accessibility.score,
        performance: result.modules.performance.score,
        persistence: result.modules.persistence.score,
        userInterface: result.modules.userInterface.score
      },
      workflowResults: {
        totalWorkflows: result.userWorkflows.length,
        passedWorkflows: result.userWorkflows.filter(w => w.passed).length,
        failedWorkflows: result.userWorkflows.filter(w => !w.passed).length
      },
      criticalIssues: result.criticalIssues,
      warnings: result.warnings,
      recommendations: result.recommendations,
      testDuration: result.totalDuration,
      passedIntegration: result.passedIntegration
    }
  }, [state.result])

  /**
   * EXPORT VALIDATION RESULTS
   * Returns JSON string of all validation data
   */
  const exportResults = useCallback((): string => {
    if (!state.result) {
      throw new Error('No validation results to export')
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      currentTheme: currentTheme.name,
      integrationResult: state.result,
      summary: getValidationSummary(),
      systemHealth: validateSystemHealth()
    }

    return JSON.stringify(exportData, null, 2)
  }, [state.result, currentTheme.name, getValidationSummary, validateSystemHealth])

  // Computed properties
  const hasResults = state.result !== null
  const overallScore = state.result?.overallScore || 0
  const systemHealthScore = state.result?.systemHealthScore || 0
  const userExperienceScore = state.result?.userExperienceScore || 0
  const passedIntegration = state.result?.passedIntegration || false
  const criticalIssuesCount = state.result?.criticalIssues.length || 0

  // Log validation completion in development
  useEffect(() => {
    if (state.validationStatus === 'completed' && process.env.NODE_ENV === 'development') {
      const summary = getValidationSummary()
      if (summary) {
        console.log('📋 Integration validation completed:', {
          overallScore: summary.overallScore,
          systemHealth: summary.systemHealthScore,
          userExperience: summary.userExperienceScore,
          passedIntegration: summary.passedIntegration,
          criticalIssues: summary.criticalIssues.length
        })

        // Show final status
        if (summary.passedIntegration) {
          console.log('🟢 THEME SYSTEM INTEGRATION VALIDATION COMPLETE')
          console.log('✅ System is production ready!')
        } else {
          console.log('🔴 INTEGRATION VALIDATION FAILED')
          console.log('❌ System requires attention before production deployment')
        }
      }
    }
  }, [state.validationStatus, getValidationSummary])

  return {
    state,
    runFullIntegrationTest,
    runQuickIntegrationCheck,
    validateSystemHealth,
    clearResults,
    getValidationSummary,
    exportResults,
    hasResults,
    overallScore,
    systemHealthScore,
    userExperienceScore,
    passedIntegration,
    criticalIssuesCount
  }
}

/**
 * INTEGRATION HEALTH MONITORING HOOK
 * Continuously monitors integration health
 */
export function useIntegrationHealthMonitoring(enabled: boolean = false) {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [lastHealthCheck, setLastHealthCheck] = useState<Date | null>(null)
  const [healthIssues, setHealthIssues] = useState<string[]>([])
  const [isHealthy, setIsHealthy] = useState(true)
  
  const { validateSystemHealth } = useIntegrationValidationReturn()

  // Monitor system health periodically
  useEffect(() => {
    if (enabled && isMonitoring) {
      const checkHealth = () => {
        const health = validateSystemHealth()
        setLastHealthCheck(new Date())
        setHealthIssues(health.issues)
        setIsHealthy(health.isHealthy)
        
        if (!health.isHealthy && process.env.NODE_ENV === 'development') {
          console.warn('⚠️ System health issues detected:', health.issues)
        }
      }

      // Check immediately
      checkHealth()

      // Set up periodic checking
      const interval = setInterval(checkHealth, 60000) // Every minute
      
      return () => clearInterval(interval)
    }
  }, [enabled, isMonitoring, validateSystemHealth])

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true)
    if (process.env.NODE_ENV === 'development') {
      console.log('👁️ Started integration health monitoring')
    }
  }, [])

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
    if (process.env.NODE_ENV === 'development') {
      console.log('⏹️ Stopped integration health monitoring')
    }
  }, [])

  return {
    isMonitoring,
    lastHealthCheck,
    healthIssues,
    isHealthy,
    hasHealthIssues: healthIssues.length > 0,
    startMonitoring,
    stopMonitoring
  }
}

/**
 * PRODUCTION READINESS HOOK
 * Validates production readiness of the theme system
 */
export function useProductionReadiness() {
  const { hasResults, passedIntegration, overallScore, criticalIssuesCount } = useIntegrationValidationReturn()
  const { isHealthy } = useIntegrationHealthMonitoring()

  const isProductionReady = hasResults && passedIntegration && overallScore >= 90 && criticalIssuesCount === 0 && isHealthy
  
  const readinessScore = hasResults ? 
    Math.min(100, overallScore + (isHealthy ? 10 : 0) - (criticalIssuesCount * 20)) : 0

  const getReadinessStatus = (): 'ready' | 'review-required' | 'not-ready' | 'unknown' => {
    if (!hasResults) return 'unknown'
    if (isProductionReady) return 'ready'
    if (overallScore >= 80 && criticalIssuesCount === 0) return 'review-required'
    return 'not-ready'
  }

  const getReadinessRecommendations = (): string[] => {
    const recommendations: string[] = []
    
    if (!hasResults) {
      recommendations.push('Run comprehensive integration validation')
    }
    
    if (overallScore < 90) {
      recommendations.push('Improve integration test scores to 90+')
    }
    
    if (criticalIssuesCount > 0) {
      recommendations.push('Resolve all critical integration issues')
    }
    
    if (!isHealthy) {
      recommendations.push('Fix system health issues')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('System is production ready!')
    }
    
    return recommendations
  }

  return {
    isProductionReady,
    readinessScore,
    readinessStatus: getReadinessStatus(),
    readinessRecommendations: getReadinessRecommendations()
  }
}

// Helper function to access the main hook from other hooks
function useIntegrationValidationReturn() {
  // This would normally be imported from the main hook
  // For this implementation, we'll create a simplified version
  return {
    validateSystemHealth: () => IntegrationTestingUtils.validateSystemHealth(),
    hasResults: false,
    passedIntegration: false,
    overallScore: 0,
    criticalIssuesCount: 0
  }
}