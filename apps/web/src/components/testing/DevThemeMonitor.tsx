/**
 * DEVELOPMENT THEME MONITOR
 * Automated theme testing for development environment
 * Shows floating test status and runs automatic tests
 */

import React, { useState, useEffect } from 'react'
import { useThemeTesting, useThemeTestingStatus } from '../../hooks/useThemeTesting'
import { useTheme } from '../../contexts/ThemeContext'
import { ThemeTestingPanel } from './ThemeTestingPanel'

interface DevThemeMonitorProps {
  enabled?: boolean
  autoTest?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export function DevThemeMonitor({ 
  enabled = process.env.NODE_ENV === 'development',
  autoTest = false,
  position = 'bottom-right'
}: DevThemeMonitorProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [lastTheme, setLastTheme] = useState<string>('')
  
  const { runQuickTest, isRunning, hasResults } = useThemeTesting()
  const { status, statusColor, score, criticalIssues } = useThemeTestingStatus()
  const { currentTheme } = useTheme()

  // Auto-test on theme changes
  useEffect(() => {
    if (autoTest && currentTheme.name !== lastTheme && lastTheme !== '') {
      console.log('🔄 Auto-testing theme change:', currentTheme.name)
      setTimeout(() => runQuickTest(), 500)
    }
    setLastTheme(currentTheme.name)
  }, [currentTheme.name, autoTest, lastTheme, runQuickTest])

  // Show monitor after initial load
  useEffect(() => {
    if (enabled) {
      const timer = setTimeout(() => setIsVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [enabled])

  // Hide in production
  if (!enabled || process.env.NODE_ENV !== 'development') {
    return null
  }

  const getPositionClasses = () => {
    const base = 'fixed z-50'
    switch (position) {
      case 'top-left': return `${base} top-4 left-4`
      case 'top-right': return `${base} top-4 right-4`
      case 'bottom-left': return `${base} bottom-4 left-4`
      case 'bottom-right': return `${base} bottom-4 right-4`
      default: return `${base} bottom-4 right-4`
    }
  }

  const getStatusIcon = () => {
    if (isRunning) return '🔄'
    if (hasResults) {
      if (criticalIssues > 0) return '🔴'
      if (score >= 90) return '🟢'
      if (score >= 80) return '🟡'
      return '🔴'
    }
    return '🧪'
  }

  const getStatusText = () => {
    if (isRunning) return 'Testing...'
    if (hasResults) {
      if (criticalIssues > 0) return `${criticalIssues} issues`
      return `${score}/100`
    }
    return 'Ready'
  }

  if (!isVisible) return null

  return (
    <>
      {/* Floating Status Monitor */}
      <div className={getPositionClasses()}>
        <div 
          className="brutal-card p-2 cursor-pointer hover:scale-105 transition-transform bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)]"
          onClick={() => setShowPanel(!showPanel)}
          title="Click to open theme testing panel"
        >
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-lg">{getStatusIcon()}</span>
            <div className="font-mono">
              <div className="font-bold">{currentTheme.name}</div>
              <div className="text-xs text-[var(--theme-foreground-secondary)]">
                {getStatusText()}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-2 flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              runQuickTest()
            }}
            disabled={isRunning}
            className="brutal-btn text-xs px-2 py-1 min-w-0"
            title="Run quick test"
          >
            🧪
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowPanel(true)
            }}
            className="brutal-btn text-xs px-2 py-1 min-w-0"
            title="Open test panel"
          >
            📋
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsVisible(false)
            }}
            className="brutal-btn text-xs px-2 py-1 min-w-0"
            title="Hide monitor"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Full Testing Panel Modal */}
      {showPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-auto">
            <ThemeTestingPanel 
              onClose={() => setShowPanel(false)}
              className="m-0"
            />
          </div>
        </div>
      )}
    </>
  )
}

/**
 * THEME TESTING CONSOLE LOGGER
 * Logs theme testing results to console for debugging
 */
export function useThemeTestingConsoleLogger(enabled: boolean = process.env.NODE_ENV === 'development') {
  const { results, isRunning } = useThemeTesting()
  const { currentTheme } = useTheme()

  useEffect(() => {
    if (!enabled || !results) return

    console.group('🧪 Theme Testing Results')
    console.log('📊 Overall Score:', results.overallScore)
    console.log('🎨 Current Theme:', currentTheme.name)
    
    if (results.summary.criticalIssues > 0) {
      console.group('🔴 Critical Issues')
      results.themeResults.forEach(theme => {
        if (theme.criticalIssues.length > 0) {
          console.log(`${theme.themeName}:`, theme.criticalIssues)
        }
      })
      console.groupEnd()
    }
    
    if (results.summary.warnings > 0) {
      console.group('🟡 Warnings')
      results.themeResults.forEach(theme => {
        if (theme.warnings.length > 0) {
          console.log(`${theme.themeName}:`, theme.warnings)
        }
      })
      console.groupEnd()
    }
    
    console.table(
      results.themeResults.map(theme => ({
        Theme: theme.themeName,
        Score: theme.overallScore,
        'Switch Time': `${theme.performanceMetrics.switchTime.toFixed(1)}ms`,
        Accessibility: theme.accessibilityReport.overallCompliance,
        'Critical Issues': theme.criticalIssues.length,
        Warnings: theme.warnings.length
      }))
    )
    
    console.groupEnd()
  }, [results, enabled, currentTheme.name])

  useEffect(() => {
    if (enabled && isRunning) {
      console.log('🔄 Theme testing in progress...')
    }
  }, [isRunning, enabled])
}

/**
 * GLOBAL THEME TESTING KEYBOARD SHORTCUTS
 * Adds keyboard shortcuts for theme testing in development
 */
export function useThemeTestingShortcuts(enabled: boolean = process.env.NODE_ENV === 'development') {
  const { runQuickTest, runFullTest, clearResults } = useThemeTesting()

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + T for quick test
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Q') {
        event.preventDefault()
        runQuickTest()
        console.log('⚡ Quick theme test triggered by keyboard shortcut')
      }
      
      // Ctrl/Cmd + Shift + F for full test
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'F') {
        event.preventDefault()
        runFullTest()
        console.log('🧪 Full theme test triggered by keyboard shortcut')
      }
      
      // Ctrl/Cmd + Shift + C for clear results
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault()
        clearResults()
        console.log('🧹 Theme test results cleared by keyboard shortcut')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    // Log available shortcuts on mount
    console.log('⌨️ Theme testing shortcuts enabled:')
    console.log('  Ctrl/Cmd + Shift + Q: Quick test')
    console.log('  Ctrl/Cmd + Shift + F: Full test')
    console.log('  Ctrl/Cmd + Shift + C: Clear results')

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, runQuickTest, runFullTest, clearResults])
}

/**
 * COMPREHENSIVE DEV THEME TESTING PROVIDER
 * Combines all development testing features
 */
export function DevThemeTestingProvider({ children }: { children: React.ReactNode }) {
  const isDev = process.env.NODE_ENV === 'development'
  
  // Enable all development features
  useThemeTestingConsoleLogger(isDev)
  useThemeTestingShortcuts(isDev)

  return (
    <>
      {children}
      <DevThemeMonitor enabled={isDev} autoTest={false} />
    </>
  )
}