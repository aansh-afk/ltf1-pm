/**
 * THEME TESTING REACT HOOK
 * React hook for running comprehensive theme testing in the UI
 */

import { useState, useCallback, useEffect } from 'react'
import { themeTestingSuite, ThemeTestingUtils, type ThemeTestingSuiteResults } from '@/utils/themeTestingSuite'
import type { ThemeName } from '@/themes/themeTypes'
import { useTheme } from '@/contexts/ThemeContext'

interface UseThemeTestingReturn {
  // Test state
  isRunning: boolean
  results: ThemeTestingSuiteResults | null
  progress: {
    currentTheme: string
    currentComponent: string
    percentage: number
  } | null
  
  // Test controls
  runFullTest: () => Promise<void>
  runQuickTest: () => Promise<void>
  runSingleThemeTest: (themeName: string) => Promise<void>
  clearResults: () => void
  
  // Results analysis
  exportResults: () => string
  getTestSummary: () => TestSummary | null
  hasResults: boolean
}

interface TestSummary {
  overallScore: number
  totalTests: number
  passedTests: number
  failedTests: number
  criticalIssues: number
  warnings: number
  bestTheme: string
  worstTheme: string
  averagePerformance: number
  accessibilityCompliance: number
}

/**
 * THEME TESTING HOOK
 * Provides comprehensive theme testing capabilities
 */
export function useThemeTesting(): UseThemeTestingReturn {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<ThemeTestingSuiteResults | null>(null)
  const [progress, setProgress] = useState<{
    currentTheme: string
    currentComponent: string
    percentage: number
  } | null>(null)
  
  const { currentTheme } = useTheme()

  /**
   * RUN COMPREHENSIVE THEME TESTING
   * Tests all themes across all components
   */
  const runFullTest = useCallback(async () => {
    if (isRunning) return
    
    setIsRunning(true)
    setProgress({ currentTheme: 'Starting...', currentComponent: 'Initializing', percentage: 0 })
    
    try {
      console.log('🧪 Starting comprehensive theme testing...')
      
      // Run the comprehensive test suite
      const testResults = await themeTestingSuite.runComprehensiveTest()
      
      setResults(testResults)
      setProgress(null)
      
      console.log('✅ Theme testing completed successfully!')
      console.log(`📊 Overall score: ${testResults.overallScore}/100`)
      
    } catch (error) {
      console.error('❌ Theme testing failed:', error)
      setProgress(null)
    } finally {
      setIsRunning(false)
    }
  }, [isRunning])

  /**
   * RUN QUICK THEME TEST
   * Tests current theme only for rapid feedback
   */
  const runQuickTest = useCallback(async () => {
    if (isRunning) return
    
    setIsRunning(true)
    setProgress({ currentTheme: currentTheme.name, currentComponent: 'Quick scan', percentage: 50 })
    
    try {
      console.log('⚡ Running quick theme test...')
      
      const quickResults = await ThemeTestingUtils.quickTest()
      
      // Create simplified results for quick test
      const simplifiedResults: ThemeTestingSuiteResults = {
        testStartTime: new Date().toISOString(),
        testEndTime: new Date().toISOString(),
        totalDuration: 100, // Placeholder
        themeResults: [],
        overallScore: quickResults.score,
        passedThemes: quickResults.score >= 80 ? [currentTheme.name as ThemeName] : [],
        failedThemes: quickResults.score < 80 ? [currentTheme.name as ThemeName] : [],
        summary: {
          totalTests: 1,
          passedTests: quickResults.score >= 80 ? 1 : 0,
          failedTests: quickResults.score < 80 ? 1 : 0,
          criticalIssues: quickResults.issues.filter(i => i.includes('CRITICAL')).length,
          warnings: quickResults.issues.filter(i => !i.includes('CRITICAL')).length
        },
        detailedReport: `Quick test of ${currentTheme.name} theme completed with score ${quickResults.score}/100`
      }
      
      setResults(simplifiedResults)
      setProgress(null)
      
      console.log(`✅ Quick test completed! Score: ${quickResults.score}/100`)
      
    } catch (error) {
      console.error('❌ Quick test failed:', error)
      setProgress(null)
    } finally {
      setIsRunning(false)
    }
  }, [isRunning, currentTheme])

  /**
   * RUN SINGLE THEME TEST
   * Tests one specific theme comprehensively
   */
  const runSingleThemeTest = useCallback(async (themeName: string) => {
    if (isRunning) return
    
    setIsRunning(true)
    setProgress({ currentTheme: themeName, currentComponent: 'Initializing', percentage: 0 })
    
    try {
      console.log(`🎨 Testing ${themeName} theme...`)
      
      // This would require extending the test suite to test individual themes
      // For now, we'll run the full test and filter results
      const fullResults = await themeTestingSuite.runComprehensiveTest()
      const themeResult = fullResults.themeResults.find(r => r.themeName === themeName)
      
      if (themeResult) {
        const singleThemeResults: ThemeTestingSuiteResults = {
          ...fullResults,
          themeResults: [themeResult],
          overallScore: themeResult.overallScore,
          passedThemes: themeResult.overallScore >= 80 ? [themeName as ThemeName] : [],
          failedThemes: themeResult.overallScore < 80 ? [themeName as ThemeName] : [],
          summary: {
            totalTests: themeResult.componentResults.length,
            passedTests: themeResult.componentResults.filter(c => c.passed).length,
            failedTests: themeResult.componentResults.filter(c => !c.passed).length,
            criticalIssues: themeResult.criticalIssues.length,
            warnings: themeResult.warnings.length
          }
        }
        
        setResults(singleThemeResults)
      }
      
      setProgress(null)
      console.log(`✅ ${themeName} theme testing completed!`)
      
    } catch (error) {
      console.error(`❌ ${themeName} theme testing failed:`, error)
      setProgress(null)
    } finally {
      setIsRunning(false)
    }
  }, [isRunning])

  /**
   * CLEAR TEST RESULTS
   * Resets all test data
   */
  const clearResults = useCallback(() => {
    setResults(null)
    setProgress(null)
  }, [])

  /**
   * EXPORT TEST RESULTS
   * Returns JSON string of test results
   */
  const exportResults = useCallback((): string => {
    if (!results) {
      throw new Error('No test results to export')
    }
    
    return JSON.stringify(results, null, 2)
  }, [results])

  /**
   * GET TEST SUMMARY
   * Returns summarized test results
   */
  const getTestSummary = useCallback((): TestSummary | null => {
    if (!results) return null
    
    const themeScores = results.themeResults.map(r => r.overallScore)
    const bestTheme = results.themeResults.reduce((best, current) => 
      current.overallScore > best.overallScore ? current : best
    ).themeName
    
    const worstTheme = results.themeResults.reduce((worst, current) => 
      current.overallScore < worst.overallScore ? current : worst
    ).themeName
    
    const averagePerformance = results.themeResults.reduce((sum, r) => 
      sum + r.performanceMetrics.switchTime, 0
    ) / results.themeResults.length
    
    const accessibilityCompliance = results.themeResults.filter(r => 
      r.accessibilityReport.overallCompliance === 'AA' || r.accessibilityReport.overallCompliance === 'AAA'
    ).length / results.themeResults.length * 100
    
    return {
      overallScore: results.overallScore,
      totalTests: results.summary.totalTests,
      passedTests: results.summary.passedTests,
      failedTests: results.summary.failedTests,
      criticalIssues: results.summary.criticalIssues,
      warnings: results.summary.warnings,
      bestTheme,
      worstTheme,
      averagePerformance,
      accessibilityCompliance
    }
  }, [results])

  // Computed properties
  const hasResults = results !== null

  // Log test completion in development
  useEffect(() => {
    if (results && process.env.NODE_ENV === 'development') {
      console.log('📋 Theme testing results updated:', {
        overallScore: results.overallScore,
        totalTests: results.summary.totalTests,
        criticalIssues: results.summary.criticalIssues
      })
    }
  }, [results])

  return {
    isRunning,
    results,
    progress,
    runFullTest,
    runQuickTest,
    runSingleThemeTest,
    clearResults,
    exportResults,
    getTestSummary,
    hasResults
  }
}

/**
 * THEME TESTING STATUS HOOK
 * Provides simple status information for the UI
 */
export function useThemeTestingStatus() {
  const { isRunning, hasResults, getTestSummary } = useThemeTesting()
  const summary = getTestSummary()
  
  const status = isRunning ? 'running' : hasResults ? 'completed' : 'ready'
  const statusColor = isRunning ? 'yellow' : hasResults ? 
    (summary && summary.overallScore >= 80 ? 'green' : 'red') : 'gray'
  
  return {
    status,
    statusColor,
    isRunning,
    hasResults,
    score: summary?.overallScore || 0,
    criticalIssues: summary?.criticalIssues || 0
  }
}

/**
 * AUTOMATED THEME TESTING HOOK
 * Automatically runs tests on theme changes (development only)
 */
export function useAutomatedThemeTesting(enabled: boolean = false) {
  const { currentTheme } = useTheme()
  const { runQuickTest, isRunning } = useThemeTesting()
  
  useEffect(() => {
    if (enabled && process.env.NODE_ENV === 'development' && !isRunning) {
      // Debounce theme testing
      const timeout = setTimeout(() => {
        console.log('🔄 Auto-testing theme on change...')
        runQuickTest()
      }, 1000)
      
      return () => clearTimeout(timeout)
    }
  }, [currentTheme, enabled, isRunning, runQuickTest])
}