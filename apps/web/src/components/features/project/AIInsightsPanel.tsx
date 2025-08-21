import React, { useState, useEffect } from 'react'
import { useAction } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { 
  HiOutlineSparkles, 
  HiOutlineLightBulb, 
  HiOutlineExclamation,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineRefresh,
  HiOutlineCheckCircle,
  HiOutlineClock
} from 'react-icons/hi'

interface AIInsightsPanelProps {
  projectId: Id<'projects'>
  sprintId?: Id<'sprints'>
  compact?: boolean
}

interface InsightsData {
  sprintHealth: {
    score: number
    prediction: 'on-track' | 'at-risk' | 'delayed'
    confidence: number
    suggestions: string[]
  }
  teamInsights?: {
    sentiment: 'positive' | 'neutral' | 'concerned'
    observations: string[]
  }
  recommendations?: string[]
  metrics: {
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    blockedTasks: number
    completionRate: number
    avgVelocity: number
    currentVelocity: number
  }
  risks: {
    type: string
    severity: 'high' | 'medium' | 'low'
    message: string
  }[]
  aiGenerated: boolean
}

export default function AIInsightsPanel({ projectId, sprintId, compact = false }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  
  const generateInsights = useAction(api.ai.projectInsights.generateProjectInsights)
  
  const fetchInsights = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await generateInsights({ projectId, sprintId })
      setInsights(data as InsightsData)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights')
      console.error('Failed to generate insights:', err)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchInsights()
  }, [projectId, sprintId])
  
  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchInsights()
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [projectId, sprintId])
  
  const getHealthIcon = (prediction: string) => {
    switch (prediction) {
      case 'on-track':
        return <HiOutlineCheckCircle className="w-20px h-20px text-[var(--theme-success)]" />
      case 'at-risk':
        return <HiOutlineExclamation className="w-20px h-20px text-[var(--theme-warning)]" />
      case 'delayed':
        return <HiOutlineClock className="w-20px h-20px text-[var(--theme-error)]" />
      default:
        return <HiOutlineSparkles className="w-20px h-20px" />
    }
  }
  
  const getHealthColor = (prediction: string) => {
    switch (prediction) {
      case 'on-track':
        return 'var(--theme-success)'
      case 'at-risk':
        return 'var(--theme-warning)'
      case 'delayed':
        return 'var(--theme-error)'
      default:
        return 'var(--theme-foreground)'
    }
  }
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'var(--theme-error)'
      case 'medium':
        return 'var(--theme-warning)'
      case 'low':
        return 'var(--theme-info)'
      default:
        return 'var(--theme-foreground-secondary)'
    }
  }
  
  if (loading && !insights) {
    return (
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px">
        <div className="flex items-center gap-12px">
          <HiOutlineSparkles className="w-20px h-20px animate-pulse text-[var(--theme-primary)]" />
          <span className="text-brutal-sm">Generating AI insights...</span>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-error)] p-24px">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-12px">
            <HiOutlineExclamation className="w-20px h-20px text-[var(--theme-error)]" />
            <span className="text-brutal-sm">Failed to load insights</span>
          </div>
          <button
            onClick={fetchInsights}
            className="p-8px hover:bg-[var(--theme-hover)] transition-colors"
            title="Retry"
          >
            <HiOutlineRefresh className="w-16px h-16px" />
          </button>
        </div>
      </div>
    )
  }
  
  if (!insights) return null
  
  if (compact) {
    // Compact view for overview tab
    return (
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-16px">
        <div className="flex items-center justify-between mb-12px">
          <div className="flex items-center gap-8px">
            <HiOutlineSparkles className="w-16px h-16px text-[var(--theme-primary)]" />
            <h3 className="text-brutal-sm font-bold uppercase">AI Insights</h3>
            {insights.aiGenerated && (
              <span className="text-brutal-xs text-[var(--theme-foreground-secondary)]">
                (AI-Powered)
              </span>
            )}
          </div>
          <button
            onClick={fetchInsights}
            className="p-4px hover:bg-[var(--theme-hover)] transition-colors"
            title="Refresh insights"
            disabled={loading}
          >
            <HiOutlineRefresh className={`w-14px h-14px ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12px">
          {/* Sprint Health */}
          <div className="flex items-center gap-8px">
            {getHealthIcon(insights.sprintHealth.prediction)}
            <div>
              <div className="text-brutal-sm font-bold" style={{ color: getHealthColor(insights.sprintHealth.prediction) }}>
                Sprint Health: {insights.sprintHealth.score}%
              </div>
              <div className="text-brutal-xs text-[var(--theme-foreground-secondary)]">
                {insights.sprintHealth.prediction.replace('-', ' ')}
              </div>
            </div>
          </div>
          
          {/* Key Metric */}
          <div className="flex items-center gap-8px">
            {insights.metrics.currentVelocity > insights.metrics.avgVelocity ? (
              <HiOutlineTrendingUp className="w-20px h-20px text-[var(--theme-success)]" />
            ) : (
              <HiOutlineTrendingDown className="w-20px h-20px text-[var(--theme-warning)]" />
            )}
            <div>
              <div className="text-brutal-sm font-bold">
                {insights.metrics.completionRate.toFixed(0)}% Complete
              </div>
              <div className="text-brutal-xs text-[var(--theme-foreground-secondary)]">
                {insights.metrics.completedTasks}/{insights.metrics.totalTasks} tasks
              </div>
            </div>
          </div>
          
          {/* Top Risk or Suggestion */}
          {(insights.risks.length > 0 || insights.sprintHealth.suggestions.length > 0) && (
            <div className="flex items-center gap-8px">
              <HiOutlineLightBulb className="w-20px h-20px text-[var(--theme-info)]" />
              <div className="text-brutal-xs">
                {insights.risks.length > 0 
                  ? insights.risks[0].message
                  : insights.sprintHealth.suggestions[0]
                }
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // Full view
  return (
    <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px space-y-24px">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-12px">
          <HiOutlineSparkles className="w-24px h-24px text-[var(--theme-primary)]" />
          <h2 className="text-brutal-lg font-bold uppercase">AI Project Insights</h2>
          {insights.aiGenerated && (
            <span className="text-brutal-xs text-[var(--theme-foreground-secondary)] px-8px py-4px bg-[var(--theme-primary)]/10 border border-[var(--theme-primary)]">
              AI-POWERED
            </span>
          )}
        </div>
        <button
          onClick={fetchInsights}
          className="p-8px hover:bg-[var(--theme-hover)] transition-colors"
          title="Refresh insights"
          disabled={loading}
        >
          <HiOutlineRefresh className={`w-20px h-20px ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Sprint Health Score */}
      <div className="border-2 p-16px" style={{ borderColor: getHealthColor(insights.sprintHealth.prediction) }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-12px mb-8px">
              {getHealthIcon(insights.sprintHealth.prediction)}
              <h3 className="text-brutal-md font-bold">Sprint Health Score</h3>
            </div>
            <div className="text-brutal-2xl font-bold mb-4px" style={{ color: getHealthColor(insights.sprintHealth.prediction) }}>
              {insights.sprintHealth.score}%
            </div>
            <div className="text-brutal-sm text-[var(--theme-foreground-secondary)]">
              Status: {insights.sprintHealth.prediction.toUpperCase().replace('-', ' ')}
            </div>
            {insights.sprintHealth.confidence && (
              <div className="text-brutal-xs text-[var(--theme-foreground-tertiary)] mt-4px">
                Confidence: {(insights.sprintHealth.confidence * 100).toFixed(0)}%
              </div>
            )}
          </div>
          
          {/* Metrics Summary */}
          <div className="grid grid-cols-2 gap-16px">
            <div>
              <div className="text-brutal-xs text-[var(--theme-foreground-secondary)]">Completed</div>
              <div className="text-brutal-lg font-bold">{insights.metrics.completedTasks}</div>
            </div>
            <div>
              <div className="text-brutal-xs text-[var(--theme-foreground-secondary)]">In Progress</div>
              <div className="text-brutal-lg font-bold">{insights.metrics.inProgressTasks}</div>
            </div>
            <div>
              <div className="text-brutal-xs text-[var(--theme-foreground-secondary)]">Blocked</div>
              <div className="text-brutal-lg font-bold text-[var(--theme-error)]">{insights.metrics.blockedTasks}</div>
            </div>
            <div>
              <div className="text-brutal-xs text-[var(--theme-foreground-secondary)]">Velocity</div>
              <div className="text-brutal-lg font-bold">{insights.metrics.currentVelocity}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Suggestions */}
      {insights.sprintHealth.suggestions.length > 0 && (
        <div>
          <h3 className="text-brutal-sm font-bold uppercase mb-12px flex items-center gap-8px">
            <HiOutlineLightBulb className="w-16px h-16px" />
            AI Suggestions
          </h3>
          <div className="space-y-8px">
            {insights.sprintHealth.suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-8px p-8px bg-[var(--theme-info)]/10 border border-[var(--theme-info)]">
                <span className="text-brutal-xs">💡</span>
                <span className="text-brutal-sm">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Risks */}
      {insights.risks.length > 0 && (
        <div>
          <h3 className="text-brutal-sm font-bold uppercase mb-12px flex items-center gap-8px">
            <HiOutlineExclamation className="w-16px h-16px" />
            Identified Risks
          </h3>
          <div className="space-y-8px">
            {insights.risks.map((risk, index) => (
              <div 
                key={index} 
                className="flex items-start gap-8px p-8px border"
                style={{ 
                  borderColor: getSeverityColor(risk.severity),
                  backgroundColor: getSeverityColor(risk.severity) + '10'
                }}
              >
                <span className="text-brutal-xs font-bold" style={{ color: getSeverityColor(risk.severity) }}>
                  {risk.severity.toUpperCase()}
                </span>
                <span className="text-brutal-sm">{risk.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Team Insights */}
      {insights.teamInsights && (
        <div>
          <h3 className="text-brutal-sm font-bold uppercase mb-12px">Team Insights</h3>
          <div className="space-y-8px">
            <div className="flex items-center gap-8px">
              <span className="text-brutal-sm">Team Sentiment:</span>
              <span 
                className="text-brutal-sm font-bold px-8px py-4px border"
                style={{
                  borderColor: insights.teamInsights.sentiment === 'positive' ? 'var(--theme-success)' :
                               insights.teamInsights.sentiment === 'concerned' ? 'var(--theme-warning)' :
                               'var(--theme-info)',
                  backgroundColor: (insights.teamInsights.sentiment === 'positive' ? 'var(--theme-success)' :
                                   insights.teamInsights.sentiment === 'concerned' ? 'var(--theme-warning)' :
                                   'var(--theme-info)') + '20'
                }}
              >
                {insights.teamInsights.sentiment.toUpperCase()}
              </span>
            </div>
            {insights.teamInsights.observations.map((observation, index) => (
              <div key={index} className="text-brutal-sm text-[var(--theme-foreground-secondary)]">
                • {observation}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Recommendations */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <div>
          <h3 className="text-brutal-sm font-bold uppercase mb-12px">Recommendations</h3>
          <div className="space-y-8px">
            {insights.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-8px">
                <span className="text-brutal-sm text-[var(--theme-primary)]">{index + 1}.</span>
                <span className="text-brutal-sm">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="pt-16px border-t border-[var(--theme-border)] flex items-center justify-between">
        <span className="text-brutal-xs text-[var(--theme-foreground-tertiary)]">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </span>
        <span className="text-brutal-xs text-[var(--theme-foreground-tertiary)]">
          Auto-refreshes every 5 minutes
        </span>
      </div>
    </div>
  )
}