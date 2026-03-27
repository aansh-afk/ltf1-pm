/**
 * COMPREHENSIVE THEME TESTING PANEL
 * UI component for running and visualizing theme tests
 */

import React, { useState } from 'react'
import { useThemeTesting, useThemeTestingStatus } from '@/hooks/useThemeTesting'
import { useTheme } from '@/contexts/ThemeContext'
import { globalThemes } from '@/themes/globalThemes'
import BrutalSelect from '@/components/ui/BrutalSelect'

interface ThemeTestingPanelProps {
  className?: string
  onClose?: () => void
}

export function ThemeTestingPanel({ className = '', onClose }: ThemeTestingPanelProps) {
  const {
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
  } = useThemeTesting()
  
  const { status, statusColor, score, criticalIssues } = useThemeTestingStatus()
  const { currentTheme, availableThemes } = useTheme()
  const [selectedTheme, setSelectedTheme] = useState<string>(currentTheme.name)
  const [showDetailedResults, setShowDetailedResults] = useState(false)
  
  const summary = getTestSummary()

  const handleExportResults = () => {
    try {
      const data = exportResults()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `theme-test-results-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export results:', error)
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'running': return '🔄'
      case 'completed': return score >= 80 ? '✅' : '⚠️'
      default: return '🧪'
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
            <h2 className="text-xl font-bold uppercase tracking-wider">Theme Testing Suite</h2>
            <p className="text-sm text-[var(--theme-foreground-secondary)]">
              Comprehensive theme validation and performance testing
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="brutal-btn w-10 h-10 p-0 flex items-center justify-center"
            aria-label="Close testing panel"
          >
            ✕
          </button>
        )}
      </div>

      {/* Status Overview */}
      {hasResults && summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="brutal-card p-4 text-center">
            <div className={`text-2xl font-bold ${getScoreColor(summary.overallScore)}`}>
              {summary.overallScore}
            </div>
            <div className="text-xs text-[var(--theme-foreground-secondary)] uppercase">
              Overall Score
            </div>
          </div>
          
          <div className="brutal-card p-4 text-center">
            <div className="text-2xl font-bold text-[var(--theme-foreground)]">
              {summary.passedTests}/{summary.totalTests}
            </div>
            <div className="text-xs text-[var(--theme-foreground-secondary)] uppercase">
              Tests Passed
            </div>
          </div>
          
          <div className="brutal-card p-4 text-center">
            <div className="text-2xl font-bold text-brutal-error">
              {summary.criticalIssues}
            </div>
            <div className="text-xs text-[var(--theme-foreground-secondary)] uppercase">
              Critical Issues
            </div>
          </div>
          
          <div className="brutal-card p-4 text-center">
            <div className="text-2xl font-bold text-brutal-warning">
              {summary.warnings}
            </div>
            <div className="text-xs text-[var(--theme-foreground-secondary)] uppercase">
              Warnings
            </div>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {isRunning && progress && (
        <div className="brutal-card p-4">
          <div className="mb-2">
            <div className="font-bold text-sm uppercase">Testing Progress</div>
            <div className="text-xs text-[var(--theme-foreground-secondary)]">
              {progress.currentTheme} - {progress.currentComponent}
            </div>
          </div>
          <div className="brutal-progress">
            <div 
              className="brutal-progress-bar"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <div className="text-xs text-right mt-1">{progress.percentage}%</div>
        </div>
      )}

      {/* Test Controls */}
      <div className="space-y-4">
        <div>
          <h3 className="font-bold uppercase text-sm mb-3">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={runQuickTest}
              disabled={isRunning}
              className="brutal-btn text-sm"
            >
              ⚡ Quick Test
            </button>
            
            <button
              onClick={runFullTest}
              disabled={isRunning}
              className="brutal-btn text-sm"
            >
              🧪 Full Test Suite
            </button>
            
            <button
              onClick={clearResults}
              disabled={isRunning || !hasResults}
              className="brutal-btn text-sm"
            >
              🧹 Clear Results
            </button>
          </div>
        </div>

        {/* Single Theme Testing */}
        <div>
          <h3 className="font-bold uppercase text-sm mb-3">Test Single Theme</h3>
          <div className="flex space-x-3">
            <BrutalSelect
              value={selectedTheme}
              onChange={(value: string) => setSelectedTheme(value)}
              options={availableThemes.map(theme => ({
                value: theme,
                label: globalThemes[theme].name,
              }))}
              label="Theme"
            />
            
            <button
              onClick={() => runSingleThemeTest(selectedTheme)}
              disabled={isRunning}
              className="brutal-btn text-sm"
            >
              🎨 Test Theme
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {hasResults && summary && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold uppercase text-sm">Test Results</h3>
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
                💾 Export JSON
              </button>
            </div>
          </div>

          {/* Theme Scores */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase text-[var(--theme-foreground-secondary)]">
              Theme Scores
            </h4>
            {results?.themeResults.map(themeResult => (
              <div key={themeResult.themeName} className="flex items-center justify-between p-2 bg-[var(--theme-background-secondary)]">
                <span className="font-mono text-sm">{themeResult.themeName}</span>
                <div className="flex items-center space-x-3">
                  <span className={`font-bold ${getScoreColor(themeResult.overallScore)}`}>
                    {themeResult.overallScore}/100
                  </span>
                  <span className="text-xs text-[var(--theme-foreground-secondary)]">
                    {themeResult.performanceMetrics.switchTime.toFixed(1)}ms
                  </span>
                  <span className={`text-xs px-2 py-1 ${
                    themeResult.accessibilityReport.overallCompliance === 'AAA' ? 'bg-brutal-success text-event-horizon' :
                    themeResult.accessibilityReport.overallCompliance === 'AA' ? 'bg-brutal-warning text-event-horizon' :
                    'bg-brutal-error text-event-horizon'
                  }`}>
                    {themeResult.accessibilityReport.overallCompliance}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Performance Metrics */}
          <div className="brutal-card p-4">
            <h4 className="font-bold text-sm uppercase mb-2">Performance Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--theme-foreground-secondary)]">Best Theme:</span>
                <span className="ml-2 font-mono">{summary.bestTheme}</span>
              </div>
              <div>
                <span className="text-[var(--theme-foreground-secondary)]">Worst Theme:</span>
                <span className="ml-2 font-mono">{summary.worstTheme}</span>
              </div>
              <div>
                <span className="text-[var(--theme-foreground-secondary)]">Avg Performance:</span>
                <span className="ml-2 font-mono">{summary.averagePerformance.toFixed(1)}ms</span>
              </div>
              <div>
                <span className="text-[var(--theme-foreground-secondary)]">Accessibility:</span>
                <span className="ml-2 font-mono">{summary.accessibilityCompliance.toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          {showDetailedResults && results && (
            <div className="brutal-card p-4">
              <h4 className="font-bold text-sm uppercase mb-2">Detailed Report</h4>
              <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap font-mono text-[var(--theme-foreground-secondary)]">
                {results.detailedReport}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {!hasResults && !isRunning && (
        <div className="brutal-card p-4 text-sm text-[var(--theme-foreground-secondary)]">
          <h4 className="font-bold text-[var(--theme-foreground)] mb-2">Testing Guide:</h4>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>Quick Test:</strong> Tests current theme in ~1 second</li>
            <li><strong>Full Test Suite:</strong> Tests all 9 themes comprehensively</li>
            <li><strong>Single Theme:</strong> Tests one specific theme in detail</li>
            <li><strong>Score 80+:</strong> Theme passes quality standards</li>
            <li><strong>Brutalist Protocol:</strong> Enforces zero radius, mono font, instant changes</li>
            <li><strong>WCAG Compliance:</strong> AA minimum, AAA preferred</li>
          </ul>
        </div>
      )}
    </div>
  )
}

/**
 * COMPACT THEME TESTING STATUS
 * Smaller component for status bars or dashboards
 */
export function ThemeTestingStatus({ className = '' }: { className?: string }) {
  const { status, statusColor, score, criticalIssues } = useThemeTestingStatus()
  const { runQuickTest, isRunning } = useThemeTesting()

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <button
        onClick={runQuickTest}
        disabled={isRunning}
        className="brutal-btn text-xs px-3 py-1"
        title="Run quick theme test"
      >
        🧪 Test
      </button>
      
      <div className="flex items-center space-x-2 text-sm">
        <span>{status === 'running' ? '🔄' : score >= 80 ? '✅' : '⚠️'}</span>
        <span className="font-mono">
          {status === 'running' ? 'Testing...' : score > 0 ? `${score}/100` : 'Ready'}
        </span>
        {criticalIssues > 0 && (
          <span className="text-brutal-error font-bold">
            {criticalIssues} issues
          </span>
        )}
      </div>
    </div>
  )
}