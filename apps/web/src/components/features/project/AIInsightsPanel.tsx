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
        return <HiOutlineCheckCircle className="w-20px h-20px text-[#22C55E]" />
      case 'at-risk':
        return <HiOutlineExclamation className="w-20px h-20px text-[#F59E0B]" />
      case 'delayed':
        return <HiOutlineClock className="w-20px h-20px text-[#EF4444]" />
      default:
        return <HiOutlineSparkles className="w-20px h-20px" />
    }
  }
  
  const getHealthColor = (prediction: string) => {
    switch (prediction) {
      case 'on-track':
        return '#22C55E'
      case 'at-risk':
        return '#F59E0B'
      case 'delayed':
        return '#EF4444'
      default:
        return '#F9FAFB'
    }
  }
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#EF4444'
      case 'medium':
        return '#F59E0B'
      case 'low':
        return '#06B6D4'
      default:
        return '#9CA3AF'
    }
  }
  
  if (loading && !insights) {
    return (
      <div className="bg-[#111111] border-2 border-[#2E2E35] p-4">
        <div className="flex items-center gap-[6px]">
          <HiOutlineSparkles className="w-20px h-20px animate-pulse text-[#6366F1]" />
          <span className="text-sm text-[#9CA3AF] font-['IBM_Plex_Mono',monospace]">Generating AI insights...</span>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-[#111111] border-2 border-[#EF4444] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[6px]">
            <HiOutlineExclamation className="w-20px h-20px text-[#EF4444]" />
            <span className="text-sm text-[#F9FAFB]">Failed to load insights</span>
          </div>
          <button
            onClick={fetchInsights}
            className="p-[4px] hover:bg-[#0A0A0A] transition-colors"
            title="Retry"
          >
            <HiOutlineRefresh className="w-16px h-16px text-[#9CA3AF]" />
          </button>
        </div>
      </div>
    )
  }
  
  if (!insights) return null
  
  if (compact) {
    // Compact view for overview tab
    return (
      <div className="bg-[#111111] border-2 border-[#2E2E35] p-3">
        <div className="flex items-center justify-between mb-[6px]">
          <div className="flex items-center gap-[4px]">
            <HiOutlineSparkles className="w-16px h-16px text-[#6366F1]" />
            <h3 className="text-sm font-bold uppercase font-['IBM_Plex_Mono',monospace] text-[#F9FAFB]">AI Insights</h3>
            {insights.aiGenerated && (
              <span className="text-xs text-[#6B7280]">
                (AI-Powered)
              </span>
            )}
          </div>
          <button
            onClick={fetchInsights}
            className="p-4px hover:bg-[#0A0A0A] transition-colors"
            title="Refresh insights"
            disabled={loading}
          >
            <HiOutlineRefresh className={`w-14px h-14px text-[#9CA3AF] ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[6px]">
          {/* Sprint Health */}
          <div className="flex items-center gap-[4px]">
            {getHealthIcon(insights.sprintHealth.prediction)}
            <div>
              <div className="text-sm font-bold" style={{ color: getHealthColor(insights.sprintHealth.prediction) }}>
                Sprint Health: {insights.sprintHealth.score}%
              </div>
              <div className="text-xs text-[#9CA3AF]">
                {insights.sprintHealth.prediction.replace('-', ' ')}
              </div>
            </div>
          </div>
          
          {/* Key Metric */}
          <div className="flex items-center gap-[4px]">
            {insights.metrics.currentVelocity > insights.metrics.avgVelocity ? (
              <HiOutlineTrendingUp className="w-20px h-20px text-[#22C55E]" />
            ) : (
              <HiOutlineTrendingDown className="w-20px h-20px text-[#F59E0B]" />
            )}
            <div>
              <div className="text-sm font-bold text-[#F9FAFB]">
                {insights.metrics.completionRate.toFixed(0)}% Complete
              </div>
              <div className="text-xs text-[#9CA3AF]">
                {insights.metrics.completedTasks}/{insights.metrics.totalTasks} tasks
              </div>
            </div>
          </div>
          
          {/* Top Risk or Suggestion */}
          {(insights.risks.length > 0 || insights.sprintHealth.suggestions.length > 0) && (
            <div className="flex items-center gap-[4px]">
              <HiOutlineLightBulb className="w-20px h-20px text-[#06B6D4]" />
              <div className="text-xs text-[#9CA3AF]">
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
    <div className="bg-[#111111] border-2 border-[#2E2E35] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[6px]">
          <HiOutlineSparkles className="w-4 h-4 text-[#6366F1]" />
          <h2 className="text-[14px] font-semibold font-bold uppercase font-['IBM_Plex_Mono',monospace] text-[#F9FAFB]">AI Project Insights</h2>
          {insights.aiGenerated && (
            <span className="text-xs text-[#9CA3AF] px-[4px] py-4px bg-[#6366F1]/10 border border-[#6366F1]">
              AI-POWERED
            </span>
          )}
        </div>
        <button
          onClick={fetchInsights}
          className="p-[4px] hover:bg-[#0A0A0A] transition-colors"
          title="Refresh insights"
          disabled={loading}
        >
          <HiOutlineRefresh className={`w-20px h-20px text-[#9CA3AF] ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Sprint Health Score */}
      <div className="border-2 p-[10px]" style={{ borderColor: getHealthColor(insights.sprintHealth.prediction) }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-[6px] mb-[4px]">
              {getHealthIcon(insights.sprintHealth.prediction)}
              <h3 className="text-base font-bold font-['IBM_Plex_Mono',monospace] text-[#F9FAFB]">Sprint Health Score</h3>
            </div>
            <div className="text-[20px] font-bold mb-[2px]" style={{ color: getHealthColor(insights.sprintHealth.prediction) }}>
              {insights.sprintHealth.score}%
            </div>
            <div className="text-sm text-[#9CA3AF]">
              Status: {insights.sprintHealth.prediction.toUpperCase().replace('-', ' ')}
            </div>
            {insights.sprintHealth.confidence && (
              <div className="text-xs text-[#6B7280] mt-4px">
                Confidence: {(insights.sprintHealth.confidence * 100).toFixed(0)}%
              </div>
            )}
          </div>
          
          {/* Metrics Summary */}
          <div className="grid grid-cols-2 gap-[8px]">
            <div>
              <div className="text-xs text-[#9CA3AF] font-['IBM_Plex_Mono',monospace]">Completed</div>
              <div className="text-[14px] font-semibold font-bold text-[#F9FAFB]">{insights.metrics.completedTasks}</div>
            </div>
            <div>
              <div className="text-xs text-[#9CA3AF] font-['IBM_Plex_Mono',monospace]">In Progress</div>
              <div className="text-[14px] font-semibold font-bold text-[#F9FAFB]">{insights.metrics.inProgressTasks}</div>
            </div>
            <div>
              <div className="text-xs text-[#9CA3AF] font-['IBM_Plex_Mono',monospace]">Blocked</div>
              <div className="text-[14px] font-semibold font-bold text-[#EF4444]">{insights.metrics.blockedTasks}</div>
            </div>
            <div>
              <div className="text-xs text-[#9CA3AF] font-['IBM_Plex_Mono',monospace]">Velocity</div>
              <div className="text-[14px] font-semibold font-bold text-[#F9FAFB]">{insights.metrics.currentVelocity}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Suggestions */}
      {insights.sprintHealth.suggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase mb-[6px] flex items-center gap-[4px] font-['IBM_Plex_Mono',monospace] text-[#F9FAFB]">
            <HiOutlineLightBulb className="w-16px h-16px text-[#06B6D4]" />
            AI Suggestions
          </h3>
          <div className="space-y-[4px]">
            {insights.sprintHealth.suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-[4px] p-[4px] bg-[#06B6D4]/10 border border-[#06B6D4]">
                <span className="text-xs">💡</span>
                <span className="text-sm text-[#F9FAFB]">{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Risks */}
      {insights.risks.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase mb-[6px] flex items-center gap-[4px] font-['IBM_Plex_Mono',monospace] text-[#F9FAFB]">
            <HiOutlineExclamation className="w-16px h-16px text-[#F59E0B]" />
            Identified Risks
          </h3>
          <div className="space-y-[4px]">
            {insights.risks.map((risk, index) => (
              <div
                key={index}
                className="flex items-start gap-[4px] p-[4px] border"
                style={{
                  borderColor: getSeverityColor(risk.severity),
                  backgroundColor: getSeverityColor(risk.severity) + '10'
                }}
              >
                <span className="text-xs font-bold font-['IBM_Plex_Mono',monospace]" style={{ color: getSeverityColor(risk.severity) }}>
                  {risk.severity.toUpperCase()}
                </span>
                <span className="text-sm text-[#F9FAFB]">{risk.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Team Insights */}
      {insights.teamInsights && (
        <div>
          <h3 className="text-sm font-bold uppercase mb-[6px] font-['IBM_Plex_Mono',monospace] text-[#F9FAFB]">Team Insights</h3>
          <div className="space-y-[4px]">
            <div className="flex items-center gap-[4px]">
              <span className="text-sm text-[#9CA3AF]">Team Sentiment:</span>
              <span
                className="text-sm font-bold px-[4px] py-4px border font-['IBM_Plex_Mono',monospace]"
                style={{
                  borderColor: insights.teamInsights.sentiment === 'positive' ? '#22C55E' :
                               insights.teamInsights.sentiment === 'concerned' ? '#F59E0B' :
                               '#06B6D4',
                  backgroundColor: (insights.teamInsights.sentiment === 'positive' ? '#22C55E' :
                                   insights.teamInsights.sentiment === 'concerned' ? '#F59E0B' :
                                   '#06B6D4') + '20'
                }}
              >
                {insights.teamInsights.sentiment.toUpperCase()}
              </span>
            </div>
            {insights.teamInsights.observations.map((observation, index) => (
              <div key={index} className="text-sm text-[#9CA3AF]">
                • {observation}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Recommendations */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase mb-[6px] font-['IBM_Plex_Mono',monospace] text-[#F9FAFB]">Recommendations</h3>
          <div className="space-y-[4px]">
            {insights.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-[4px]">
                <span className="text-sm text-[#6366F1]">{index + 1}.</span>
                <span className="text-sm text-[#F9FAFB]">{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="pt-[8px] border-t border-[#1F1F23] flex items-center justify-between">
        <span className="text-xs text-[#6B7280] font-['IBM_Plex_Mono',monospace]">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </span>
        <span className="text-xs text-[#6B7280] font-['IBM_Plex_Mono',monospace]">
          Auto-refreshes every 5 minutes
        </span>
      </div>
    </div>
  )
}