/**
 * THEME PERSISTENCE VALIDATION PANEL
 * UI component for testing and validating theme persistence
 */

import React, { useState, useEffect } from 'react'
import { 
  useThemePersistenceValidation, 
  useThemePersistenceMonitoring 
} from '@/hooks/useThemePersistenceValidation'
import { useTheme } from '@/contexts/ThemeContext'

interface ThemePersistencePanelProps {
  className?: string
  onClose?: () => void
}

export function ThemePersistencePanel({ className = '', onClose }: ThemePersistencePanelProps) {
  const {
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
  } = useThemePersistenceValidation()

  const {
    isMonitoring,
    lastCheck,
    issues,
    hasIssues,
    startMonitoring,
    stopMonitoring
  } = useThemePersistenceMonitoring()

  const { currentTheme, availableThemes, setTheme } = useTheme()
  const [quickCheckResult, setQuickCheckResult] = useState<{ passed: boolean; issues: string[] } | null>(null)
  const [currentStateValidation, setCurrentStateValidation] = useState(getCurrentStateValidation())
  
  const summary = getValidationSummary()

  // Update current state validation when theme changes
  useEffect(() => {
    setCurrentStateValidation(getCurrentStateValidation())
  }, [currentTheme, getCurrentStateValidation])

  const handleQuickCheck = async () => {
    const result = await runQuickCheck()
    setQuickCheckResult(result)
  }

  const handleExportResults = () => {
    try {
      const data = exportResults()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `theme-persistence-validation-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export results:', error)
    }
  }

  const getStatusIcon = () => {
    if (state.isRunning) return '🔄'
    if (hasResults) {
      if (criticalIssuesCount > 0) return '❌'
      if (overallScore >= 90) return '✅'
      if (overallScore >= 80) return '⚠️'
      return '❌'
    }
    return '🎯'
  }

  const getStatusText = () => {
    switch (state.currentValidationStatus) {
      case 'session-testing': return 'Testing Session Persistence...'
      case 'cross-session-testing': return 'Testing Cross-Session Persistence...'
      case 'completed': return `Validation Complete (${overallScore}/100)`
      case 'failed': return 'Validation Failed'
      default: return 'Ready for Validation'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-brutal-success'
    if (score >= 80) return 'text-brutal-warning'
    if (score >= 60) return 'text-brutal-error'
    return 'text-brutal-error'
  }

  return (
    <div className={`brutal-card p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wider">Persistence Validation</h2>
            <p className="text-sm text-[var(--theme-foreground-secondary)]">
              Theme persistence and state management testing
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="brutal-btn w-10 h-10 p-0 flex items-center justify-center"
            aria-label="Close persistence panel"
          >
            ✕
          </button>
        )}
      </div>

      {/* Current State Status */}
      <div className="brutal-card p-4">
        <h3 className="font-bold text-sm uppercase mb-3">Current State</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="font-mono text-lg">{currentTheme.name}</div>
            <div className="text-xs text-[var(--theme-foreground-secondary)] uppercase">
              Active Theme
            </div>
          </div>
          
          <div className="text-center">
            <div className={`font-mono text-lg ${currentStateValidation.isValid ? 'text-brutal-success' : 'text-brutal-error'}`}>
              {currentStateValidation.isValid ? '✓' : '✗'}
            </div>
            <div className="text-xs text-[var(--theme-foreground-secondary)] uppercase">
              State Valid
            </div>
          </div>
          
          <div className="text-center">
            <div className={`font-mono text-lg ${currentStateValidation.hasHighContrast ? 'text-brutal-info' : 'text-[var(--theme-foreground-secondary)]'}`}>
              {currentStateValidation.hasHighContrast ? 'ON' : 'OFF'}
            </div>
            <div className="text-xs text-[var(--theme-foreground-secondary)] uppercase">
              High Contrast
            </div>
          </div>
        </div>
      </div>

      {/* Validation Status */}
      <div className="brutal-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm uppercase">Validation Status</h3>
          <span className="text-sm text-[var(--theme-foreground-secondary)]">
            {getStatusText()}
          </span>
        </div>
        
        {state.isRunning && (
          <div className="brutal-progress">
            <div className="brutal-progress-bar animate-pulse" style={{ width: '60%' }} />
          </div>
        )}
        
        {hasResults && summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className={`text-xl font-bold ${getScoreColor(summary.sessionScore)}`}>
                {summary.sessionScore}
              </div>
              <div className="text-xs text-[var(--theme-foreground-secondary)] uppercase">
                Session Score
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-xl font-bold ${getScoreColor(summary.crossSessionScore)}`}>
                {summary.crossSessionScore}
              </div>
              <div className="text-xs text-[var(--theme-foreground-secondary)] uppercase">
                Cross-Session
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-xl font-bold ${getScoreColor(summary.consistencyScore)}`}>
                {summary.consistencyScore}
              </div>
              <div className="text-xs text-[var(--theme-foreground-secondary)] uppercase">
                Consistency
              </div>
            </div>
            
            <div className="text-center">
              <div className={`text-xl font-bold ${getScoreColor(summary.reliabilityScore)}`}>
                {summary.reliabilityScore}
              </div>
              <div className="text-xs text-[var(--theme-foreground-secondary)] uppercase">
                Reliability
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Test Controls */}
      <div className="space-y-4">
        <div>
          <h3 className="font-bold uppercase text-sm mb-3">Validation Tests</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={handleQuickCheck}
              disabled={state.isRunning}
              className="brutal-btn text-sm"
            >
              ⚡ Quick Check
            </button>
            
            <button
              onClick={runSessionValidation}
              disabled={state.isRunning}
              className="brutal-btn text-sm"
            >
              🎯 Session Validation
            </button>
            
            <button
              onClick={runCrossSessionValidation}
              disabled={state.isRunning}
              className="brutal-btn text-sm"
            >
              🌐 Cross-Session Test
            </button>
            
            <button
              onClick={clearResults}
              disabled={state.isRunning || !hasResults}
              className="brutal-btn text-sm"
            >
              🧹 Clear Results
            </button>
          </div>
        </div>

        {/* Monitoring Controls */}
        <div>
          <h3 className="font-bold uppercase text-sm mb-3">Continuous Monitoring</h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className={`brutal-btn text-sm ${isMonitoring ? 'bg-brutal-warning text-event-horizon' : ''}`}
            >
              {isMonitoring ? '⏹️ Stop Monitor' : '👁️ Start Monitor'}
            </button>
            
            {lastCheck && (
              <span className="text-xs text-[var(--theme-foreground-secondary)]">
                Last check: {lastCheck.toLocaleTimeString()}
              </span>
            )}
            
            {hasIssues && (
              <span className="text-xs text-brutal-error font-bold">
                {issues.length} issues detected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Check Results */}
      {quickCheckResult && (
        <div className="brutal-card p-4">
          <h4 className="font-bold text-sm uppercase mb-2 flex items-center">
            ⚡ Quick Check Results
            <span className={`ml-2 text-xs px-2 py-1 ${quickCheckResult.passed ? 'bg-brutal-success text-event-horizon' : 'bg-brutal-error text-event-horizon'}`}>
              {quickCheckResult.passed ? 'PASSED' : 'FAILED'}
            </span>
          </h4>
          
          {quickCheckResult.issues.length > 0 && (
            <div className="text-sm space-y-1">
              <div className="font-bold text-brutal-error">Issues:</div>
              {quickCheckResult.issues.map((issue, index) => (
                <div key={index} className="text-xs text-[var(--theme-foreground-secondary)]">
                  • {issue}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Test Results */}
      {hasResults && summary && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold uppercase text-sm">Validation Results</h3>
            <button
              onClick={handleExportResults}
              className="brutal-btn text-xs"
            >
              💾 Export Results
            </button>
          </div>

          {/* Browser Compatibility */}
          <div className="brutal-card p-4">
            <h4 className="font-bold text-sm uppercase mb-2">Browser Compatibility</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <span className={summary.browserCompatibility.localStorage ? 'text-brutal-success' : 'text-brutal-error'}>
                  {summary.browserCompatibility.localStorage ? '✅' : '❌'}
                </span>
                <span>LocalStorage</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={summary.browserCompatibility.sessionStorage ? 'text-brutal-success' : 'text-brutal-error'}>
                  {summary.browserCompatibility.sessionStorage ? '✅' : '❌'}
                </span>
                <span>SessionStorage</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={summary.browserCompatibility.cookies ? 'text-brutal-success' : 'text-brutal-error'}>
                  {summary.browserCompatibility.cookies ? '✅' : '❌'}
                </span>
                <span>Cookies</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={summary.browserCompatibility.cssCustomProperties ? 'text-brutal-success' : 'text-brutal-error'}>
                  {summary.browserCompatibility.cssCustomProperties ? '✅' : '❌'}
                </span>
                <span>CSS Props</span>
              </div>
            </div>
          </div>

          {/* Test Summary */}
          <div className="brutal-card p-4">
            <h4 className="font-bold text-sm uppercase mb-2">Test Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-[var(--theme-foreground)]">
                  {summary.passedTests}/{summary.totalTests}
                </div>
                <div className="text-xs text-[var(--theme-foreground-secondary)] uppercase">
                  Tests Passed
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-brutal-error">
                  {summary.criticalIssues.length}
                </div>
                <div className="text-xs text-[var(--theme-foreground-secondary)] uppercase">
                  Critical Issues
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-brutal-warning">
                  {summary.recommendations.length}
                </div>
                <div className="text-xs text-[var(--theme-foreground-secondary)] uppercase">
                  Recommendations
                </div>
              </div>
            </div>
          </div>

          {/* Critical Issues */}
          {summary.criticalIssues.length > 0 && (
            <div className="brutal-card p-4">
              <h4 className="font-bold text-sm uppercase mb-2 text-brutal-error">Critical Issues</h4>
              <div className="space-y-1 text-xs">
                {summary.criticalIssues.map((issue, index) => (
                  <div key={index} className="text-brutal-error">
                    • {issue}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {summary.recommendations.length > 0 && (
            <div className="brutal-card p-4">
              <h4 className="font-bold text-sm uppercase mb-2 text-brutal-warning">Recommendations</h4>
              <div className="space-y-1 text-xs">
                {summary.recommendations.slice(0, 5).map((rec, index) => (
                  <div key={index} className="text-[var(--theme-foreground-secondary)]">
                    • {rec}
                  </div>
                ))}
                {summary.recommendations.length > 5 && (
                  <div className="text-xs text-[var(--theme-foreground-secondary)]">
                    ... and {summary.recommendations.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Theme Testing Playground */}
      <div className="brutal-card p-4">
        <h4 className="font-bold text-sm uppercase mb-3">Theme Testing Playground</h4>
        <p className="text-xs text-[var(--theme-foreground-secondary)] mb-3">
          Test theme switching and persistence manually
        </p>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {availableThemes.map(themeName => (
            <button
              key={themeName}
              onClick={() => setTheme(themeName)}
              className={`brutal-btn text-xs px-2 py-1 ${
                currentTheme.name === themeName ? 'bg-[var(--theme-primary)] text-[var(--theme-background)]' : ''
              }`}
            >
              {themeName.slice(0, 4)}
            </button>
          ))}
        </div>
      </div>

      {/* Help Text */}
      {!hasResults && !state.isRunning && (
        <div className="brutal-card p-4 text-sm text-[var(--theme-foreground-secondary)]">
          <h4 className="font-bold text-[var(--theme-foreground)] mb-2">Validation Guide:</h4>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>Quick Check:</strong> Fast validation of basic persistence</li>
            <li><strong>Session Validation:</strong> Comprehensive testing within current session</li>
            <li><strong>Cross-Session Test:</strong> Simulates multiple browser sessions</li>
            <li><strong>Score 80+:</strong> Persistence meets reliability standards</li>
            <li><strong>Monitoring:</strong> Continuous validation of persistence health</li>
            <li><strong>Browser Storage:</strong> Tests localStorage, sessionStorage, and cookies</li>
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * COMPACT PERSISTENCE STATUS
 * Smaller component for status indicators
 */
export function ThemePersistenceStatus({ className = '' }: { className?: string }) {
  const { hasResults, overallScore, criticalIssuesCount } = useThemePersistenceValidation()
  const { runQuickCheck } = useThemePersistenceValidation()
  const { hasIssues, issues } = useThemePersistenceMonitoring()

  const getStatusIcon = () => {
    if (hasIssues) return '⚠️'
    if (hasResults) {
      if (criticalIssuesCount > 0) return '❌'
      if (overallScore >= 80) return '✅'
      return '⚠️'
    }
    return '🎯'
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <button
        onClick={runQuickCheck}
        className="brutal-btn text-xs px-3 py-1"
        title="Run quick persistence check"
      >
        🎯 Check
      </button>
      
      <div className="flex items-center space-x-2 text-sm">
        <span>{getStatusIcon()}</span>
        <span className="font-mono">
          {hasResults ? `${overallScore}/100` : hasIssues ? `${issues.length} issues` : 'Ready'}
        </span>
      </div>
    </div>
  )
}