/**
 * COMPREHENSIVE THEME INTEGRATION VALIDATION PANEL
 * Final integration testing and validation UI component
 */

import React, { useState, useEffect } from 'react'
import { 
  useThemeIntegrationValidation, 
  useIntegrationHealthMonitoring,
  useProductionReadiness 
} from '../../hooks/useThemeIntegrationValidation'
import { useTheme } from '../../contexts/ThemeContext'

interface ThemeIntegrationPanelProps {
  className?: string
  onClose?: () => void
}

export function ThemeIntegrationPanel({ className = '', onClose }: ThemeIntegrationPanelProps) {
  const {
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
  } = useThemeIntegrationValidation()

  const {
    isMonitoring,
    lastHealthCheck,
    healthIssues,
    isHealthy,
    hasHealthIssues,
    startMonitoring,
    stopMonitoring
  } = useIntegrationHealthMonitoring()

  const {
    isProductionReady,
    readinessScore,
    readinessStatus,
    readinessRecommendations
  } = useProductionReadiness()

  const { currentTheme } = useTheme()
  const [quickCheckResult, setQuickCheckResult] = useState<{ passed: boolean; score: number; issues: string[] } | null>(null)
  const [systemHealth, setSystemHealth] = useState(validateSystemHealth())
  const [showDetailedResults, setShowDetailedResults] = useState(false)
  
  const summary = getValidationSummary()

  // Update system health when theme changes
  useEffect(() => {
    setSystemHealth(validateSystemHealth())
  }, [currentTheme, validateSystemHealth])

  const handleQuickCheck = async () => {
    const result = await runQuickIntegrationCheck()
    setQuickCheckResult(result)
  }

  const handleExportResults = () => {
    try {
      const data = exportResults()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `theme-integration-validation-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export results:', error)
    }
  }

  const getStatusIcon = () => {
    if (state.isRunning) return '🔄'
    if (hasResults) {
      if (passedIntegration) return '✅'
      if (criticalIssuesCount > 0) return '❌'
      return '⚠️'
    }
    return '🚀'
  }

  const getStatusText = () => {
    if (state.isRunning) return state.currentPhase
    if (hasResults) {
      if (passedIntegration) return `Integration Validated (${overallScore}/100)`
      return `Integration Issues Detected (${overallScore}/100)`
    }
    return 'Ready for Integration Validation'
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-brutal-success'
    if (score >= 80) return 'text-brutal-warning'
    if (score >= 60) return 'text-brutal-error'
    return 'text-brutal-error'
  }

  const getReadinessStatusColor = () => {
    switch (readinessStatus) {
      case 'ready': return 'text-brutal-success'
      case 'review-required': return 'text-brutal-warning'
      case 'not-ready': return 'text-brutal-error'
      default: return 'text-[var(--theme-foreground-secondary)]'
    }
  }

  const getReadinessStatusText = () => {
    switch (readinessStatus) {
      case 'ready': return 'PRODUCTION READY'
      case 'review-required': return 'REVIEW REQUIRED'
      case 'not-ready': return 'NOT READY'
      default: return 'UNKNOWN'
    }
  }

  return (
    <div className={`brutal-card p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wider">Integration Validation</h2>
            <p className="text-sm text-[var(--theme-foreground-secondary)]">
              Comprehensive theme system integration testing
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="brutal-btn w-10 h-10 p-0 flex items-center justify-center"
            aria-label="Close integration panel"
          >
            ✕
          </button>
        )}
      </div>

      {/* Production Readiness Status */}
      <div className="brutal-card p-4">
        <h3 className="font-bold text-sm uppercase mb-3">Production Readiness</h3>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">
              {isProductionReady ? '🟢' : readinessStatus === 'review-required' ? '🟡' : '🔴'}
            </span>
            <div>
              <div className={`font-bold text-lg ${getReadinessStatusColor()}`}>
                {getReadinessStatusText()}
              </div>
              <div className="text-sm text-[var(--theme-foreground-secondary)]">
                Readiness Score: {readinessScore}/100
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-[var(--theme-foreground-secondary)]">
              Current Theme
            </div>
            <div className="font-mono font-bold">{currentTheme.name}</div>
          </div>
        </div>
        
        {readinessRecommendations.length > 0 && (
          <div className="space-y-1">
            <div className="font-bold text-xs uppercase text-[var(--theme-foreground-secondary)]">
              Recommendations:
            </div>
            {readinessRecommendations.map((rec, index) => (
              <div key={index} className="text-xs">
                • {rec}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Health Status */}
      <div className="brutal-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm uppercase">System Health</h3>
          <div className="flex items-center space-x-2">
            <span className={isHealthy ? 'text-brutal-success' : 'text-brutal-error'}>
              {isHealthy ? '✅' : '❌'}
            </span>
            <span className="text-sm">{isHealthy ? 'Healthy' : 'Issues Detected'}</span>
          </div>
        </div>
        
        {hasHealthIssues && (
          <div className="space-y-1 text-xs">
            {healthIssues.map((issue, index) => (
              <div key={index} className="text-brutal-error">
                • {issue}
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className={`brutal-btn text-xs ${isMonitoring ? 'bg-brutal-warning text-event-horizon' : ''}`}
          >
            {isMonitoring ? '⏹️ Stop Monitor' : '👁️ Monitor Health'}
          </button>
          
          {lastHealthCheck && (
            <span className="text-xs text-[var(--theme-foreground-secondary)]">
              Last check: {lastHealthCheck.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Validation Progress */}
      {state.isRunning && (
        <div className="brutal-card p-4">
          <div className="mb-2">
            <div className="font-bold text-sm uppercase">Validation Progress</div>
            <div className="text-xs text-[var(--theme-foreground-secondary)]">
              {state.currentPhase}
            </div>
          </div>
          <div className="brutal-progress">
            <div 
              className="brutal-progress-bar"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <div className="text-xs text-right mt-1">{state.progress}%</div>
        </div>
      )}

      {/* Overall Scores */}
      {hasResults && summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="brutal-card p-4 text-center">
            <div className={`text-2xl font-bold ${getScoreColor(summary.overallScore)}`}>
              {summary.overallScore}
            </div>
            <div className="text-xs text-[var(--theme-foreground-secondary)] uppercase">
              Overall Score
            </div>
          </div>
          
          <div className="brutal-card p-4 text-center">
            <div className={`text-2xl font-bold ${getScoreColor(summary.systemHealthScore)}`}>
              {summary.systemHealthScore}
            </div>
            <div className="text-xs text-[var(--theme-foreground-secondary)] uppercase">
              System Health
            </div>
          </div>
          
          <div className="brutal-card p-4 text-center">
            <div className={`text-2xl font-bold ${getScoreColor(summary.userExperienceScore)}`}>
              {summary.userExperienceScore}
            </div>
            <div className="text-xs text-[var(--theme-foreground-secondary)] uppercase">
              User Experience
            </div>
          </div>
        </div>
      )}

      {/* Test Controls */}
      <div className="space-y-4">
        <div>
          <h3 className="font-bold uppercase text-sm mb-3">Integration Tests</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={handleQuickCheck}
              disabled={state.isRunning}
              className="brutal-btn text-sm"
            >
              ⚡ Quick Check
            </button>
            
            <button
              onClick={runFullIntegrationTest}
              disabled={state.isRunning}
              className="brutal-btn text-sm"
            >
              🚀 Full Integration Test
            </button>
            
            <button
              onClick={() => setSystemHealth(validateSystemHealth())}
              disabled={state.isRunning}
              className="brutal-btn text-sm"
            >
              🔍 Check System Health
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
      </div>

      {/* Quick Check Results */}
      {quickCheckResult && (
        <div className="brutal-card p-4">
          <h4 className="font-bold text-sm uppercase mb-2 flex items-center">
            ⚡ Quick Integration Check
            <span className={`ml-2 text-xs px-2 py-1 ${quickCheckResult.passed ? 'bg-brutal-success text-event-horizon' : 'bg-brutal-error text-event-horizon'}`}>
              {quickCheckResult.passed ? 'PASSED' : 'FAILED'}
            </span>
          </h4>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Integration Score:</span>
            <span className={`font-bold ${getScoreColor(quickCheckResult.score)}`}>
              {quickCheckResult.score}/100
            </span>
          </div>
          
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

      {/* Module Scores */}
      {hasResults && summary && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold uppercase text-sm">Module Results</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowDetailedResults(!showDetailedResults)}
                className="brutal-btn text-xs"
              >
                {showDetailedResults ? '📄 Hide Details' : '📋 Show Details'}
              </button>
              
              <button
                onClick={handleExportResults}
                className="brutal-btn text-xs"
              >
                💾 Export Results
              </button>
            </div>
          </div>

          {/* Module Scores Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(summary.moduleScores).map(([module, score]) => (
              <div key={module} className="brutal-card p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm capitalize">{module.replace(/([A-Z])/g, ' $1')}</span>
                  <span className={`font-bold ${getScoreColor(score)}`}>
                    {score}/100
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Workflow Results */}
          <div className="brutal-card p-4">
            <h4 className="font-bold text-sm uppercase mb-2">User Workflow Results</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-[var(--theme-foreground)]">
                  {summary.workflowResults.totalWorkflows}
                </div>
                <div className="text-xs text-[var(--theme-foreground-secondary)] uppercase">
                  Total Workflows
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-brutal-success">
                  {summary.workflowResults.passedWorkflows}
                </div>
                <div className="text-xs text-[var(--theme-foreground-secondary)] uppercase">
                  Passed
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-brutal-error">
                  {summary.workflowResults.failedWorkflows}
                </div>
                <div className="text-xs text-[var(--theme-foreground-secondary)] uppercase">
                  Failed
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

          {/* Warnings */}
          {summary.warnings.length > 0 && (
            <div className="brutal-card p-4">
              <h4 className="font-bold text-sm uppercase mb-2 text-brutal-warning">Warnings</h4>
              <div className="space-y-1 text-xs">
                {summary.warnings.slice(0, 5).map((warning, index) => (
                  <div key={index} className="text-[var(--theme-foreground-secondary)]">
                    • {warning}
                  </div>
                ))}
                {summary.warnings.length > 5 && (
                  <div className="text-xs text-[var(--theme-foreground-secondary)]">
                    ... and {summary.warnings.length - 5} more warnings
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Detailed Report */}
          {showDetailedResults && state.result && (
            <div className="brutal-card p-4">
              <h4 className="font-bold text-sm uppercase mb-2">Detailed Integration Report</h4>
              <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap font-mono text-[var(--theme-foreground-secondary)]">
                {state.result.detailedReport}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Final Validation Status */}
      {hasResults && (
        <div className={`brutal-card p-6 text-center ${passedIntegration ? 'bg-brutal-success/10' : 'bg-brutal-error/10'}`}>
          <div className="text-4xl mb-2">
            {passedIntegration ? '🟢' : '🔴'}
          </div>
          <div className={`text-xl font-bold uppercase ${passedIntegration ? 'text-brutal-success' : 'text-brutal-error'}`}>
            {passedIntegration ? 'INTEGRATION VALIDATED' : 'INTEGRATION FAILED'}
          </div>
          <div className="text-sm text-[var(--theme-foreground-secondary)] mt-2">
            {passedIntegration 
              ? 'Theme system is fully integrated and production ready'
              : 'Integration issues detected - review required before production'
            }
          </div>
          <div className="text-xs text-[var(--theme-foreground-secondary)] mt-1">
            Test Duration: {summary?.testDuration.toFixed(2)}ms
          </div>
        </div>
      )}

      {/* Help Text */}
      {!hasResults && !state.isRunning && (
        <div className="brutal-card p-4 text-sm text-[var(--theme-foreground-secondary)]">
          <h4 className="font-bold text-[var(--theme-foreground)] mb-2">Integration Testing Guide:</h4>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>Quick Check:</strong> Fast validation of integration health (~1 second)</li>
            <li><strong>Full Integration Test:</strong> Comprehensive system-wide validation</li>
            <li><strong>System Health:</strong> Real-time monitoring of theme system health</li>
            <li><strong>Production Ready:</strong> Score 90+ with zero critical issues</li>
            <li><strong>Module Testing:</strong> Individual component validation</li>
            <li><strong>User Workflows:</strong> End-to-end user journey testing</li>
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * COMPACT INTEGRATION STATUS
 * Smaller component for dashboards and status bars
 */
export function ThemeIntegrationStatus({ className = '' }: { className?: string }) {
  const { hasResults, overallScore, passedIntegration, criticalIssuesCount } = useThemeIntegrationValidation()
  const { runQuickIntegrationCheck } = useThemeIntegrationValidation()
  const { isProductionReady, readinessStatus } = useProductionReadiness()

  const getStatusIcon = () => {
    if (hasResults) {
      if (isProductionReady) return '🟢'
      if (passedIntegration) return '🟡'
      return '🔴'
    }
    return '🚀'
  }

  const getStatusText = () => {
    if (hasResults) {
      return readinessStatus.toUpperCase().replace('-', ' ')
    }
    return 'READY'
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <button
        onClick={runQuickIntegrationCheck}
        className="brutal-btn text-xs px-3 py-1"
        title="Run quick integration check"
      >
        🚀 Validate
      </button>
      
      <div className="flex items-center space-x-2 text-sm">
        <span>{getStatusIcon()}</span>
        <span className="font-mono">
          {hasResults ? `${overallScore}/100` : getStatusText()}
        </span>
        {criticalIssuesCount > 0 && (
          <span className="text-brutal-error font-bold">
            {criticalIssuesCount} critical
          </span>
        )}
      </div>
    </div>
  )
}