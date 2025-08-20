// AI Analytics Dashboard
// Comprehensive dashboard for AI usage, insights, and performance

import React, { useState } from 'react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { 
  HiSparkles, 
  HiLightningBolt, 
  HiTrendingUp, 
  HiChartBar,
  HiClock,
  HiCurrencyDollar,
  HiDatabase,
  HiExclamation,
  HiCheckCircle,
  HiXCircle
} from 'react-icons/hi'
import { useAIStats, useAIInsights, useAITaskSuggestions, useAIFeedback, useUserAISessions } from '../../hooks/useAI'
import { AIInsightCard, AITaskSuggestionCard, AIStatsWidget } from './AIIndicator'
import type { Id } from '../../../../../convex/_generated/dataModel'

interface AIAnalyticsDashboardProps {
  workspaceId: Id<'workspaces'>
  className?: string
}

export function AIAnalyticsDashboard({ workspaceId, className }: AIAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day')
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'suggestions' | 'sessions'>('overview')
  
  const { stats, loading: statsLoading } = useAIStats(workspaceId, timeRange)
  const { insights, loading: insightsLoading } = useAIInsights()
  const { suggestions, loading: suggestionsLoading } = useAITaskSuggestions()
  const { feedback, loading: feedbackLoading } = useAIFeedback(workspaceId)
  const { sessions, loading: sessionsLoading } = useUserAISessions(20)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: HiChartBar },
    { id: 'insights', label: 'Insights', icon: HiLightningBolt },
    { id: 'suggestions', label: 'Suggestions', icon: HiSparkles },
    { id: 'sessions', label: 'Sessions', icon: HiClock }
  ]

  return (
    <div className={clsx('bg-black border-2 border-yellow-400 p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <HiSparkles className="w-8 h-8 text-yellow-400" />
          <h2 className="text-2xl font-bold uppercase text-yellow-400">
            AI Analytics Dashboard
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 uppercase">Time Range:</span>
          <div className="flex gap-1">
            {(['day', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={clsx(
                  'px-3 py-1 uppercase text-xs font-bold transition-colors',
                  timeRange === range
                    ? 'bg-yellow-400 text-black'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b-2 border-gray-800">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 uppercase text-sm font-bold transition-colors',
                activeTab === tab.id
                  ? 'text-yellow-400 border-b-2 border-yellow-400'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <OverviewTab 
            stats={stats} 
            feedback={feedback}
            loading={statsLoading || feedbackLoading} 
          />
        )}
        
        {activeTab === 'insights' && (
          <InsightsTab 
            insights={insights} 
            loading={insightsLoading} 
          />
        )}
        
        {activeTab === 'suggestions' && (
          <SuggestionsTab 
            suggestions={suggestions} 
            loading={suggestionsLoading} 
          />
        )}
        
        {activeTab === 'sessions' && (
          <SessionsTab 
            sessions={sessions} 
            loading={sessionsLoading} 
          />
        )}
      </div>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({ stats, feedback, loading }: any) {
  if (loading) {
    return <LoadingState />
  }

  if (!stats) {
    return <EmptyState message="No AI usage data available" />
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          icon={HiChartBar}
          label="Total Requests"
          value={stats.totalSessions.toLocaleString()}
          trend={"+12%"}
          trendUp={true}
        />
        <MetricCard
          icon={HiDatabase}
          label="Tokens Used"
          value={`${(stats.totalTokens / 1000).toFixed(1)}K`}
          trend={"-5%"}
          trendUp={false}
        />
        <MetricCard
          icon={HiCurrencyDollar}
          label="Total Cost"
          value={`$${stats.totalCost.toFixed(2)}`}
          trend={"+8%"}
          trendUp={true}
        />
        <MetricCard
          icon={HiClock}
          label="Avg Latency"
          value={`${stats.averageLatency.toFixed(0)}ms`}
          trend={"-15%"}
          trendUp={false}
        />
      </div>

      {/* Model Usage */}
      <div className="bg-gray-900 border-2 border-gray-700 p-4">
        <h3 className="text-yellow-400 font-bold uppercase mb-3">Model Distribution</h3>
        <div className="space-y-2">
          <ModelUsageBar 
            model="Gemini 2.5 Flash" 
            count={stats.modelUsage.flash} 
            total={stats.totalSessions}
            color="yellow"
          />
          <ModelUsageBar 
            model="Gemini 2.5 Flash Lite" 
            count={stats.modelUsage.flashLite} 
            total={stats.totalSessions}
            color="green"
          />
        </div>
      </div>

      {/* Usage by Type */}
      <div className="bg-gray-900 border-2 border-gray-700 p-4">
        <h3 className="text-yellow-400 font-bold uppercase mb-3">Top Use Cases</h3>
        <div className="space-y-2">
          {Object.entries(stats.typeBreakdown)
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .slice(0, 5)
            .map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-gray-300 font-mono">{type}</span>
                <span className="text-white font-bold">{count as number}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Feedback Summary */}
      {feedback && (
        <div className="bg-gray-900 border-2 border-gray-700 p-4">
          <h3 className="text-yellow-400 font-bold uppercase mb-3">User Feedback</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase text-gray-400 mb-1">Average Rating</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">
                  {feedback.averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-gray-400">/ 5.0</span>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400 mb-1">Helpful Rate</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">
                  {feedback.helpfulPercentage.toFixed(0)}%
                </span>
                <HiCheckCircle className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Insights Tab Component
function InsightsTab({ insights, loading }: any) {
  if (loading) {
    return <LoadingState />
  }

  if (!insights || insights.length === 0) {
    return <EmptyState message="No active AI insights" />
  }

  return (
    <div className="space-y-4">
      {insights.map((insight: any) => (
        <AIInsightCard
          key={insight._id}
          type={insight.insightType}
          severity={insight.severity}
          title={insight.title}
          description={insight.description}
          recommendations={insight.recommendations}
          onDismiss={() => console.log('Dismiss insight', insight._id)}
          onAction={() => console.log('Take action on insight', insight._id)}
        />
      ))}
    </div>
  )
}

// Suggestions Tab Component
function SuggestionsTab({ suggestions, loading }: any) {
  if (loading) {
    return <LoadingState />
  }

  if (!suggestions || suggestions.length === 0) {
    return <EmptyState message="No pending AI task suggestions" />
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {suggestions.map((suggestion: any) => (
        <div key={suggestion._id}>
          {suggestion.suggestedTasks.map((task: any, index: number) => (
            <AITaskSuggestionCard
              key={index}
              title={task.title}
              description={task.description}
              type={task.type}
              priority={task.priority}
              estimate={task.estimate}
              confidence={task.confidence}
              onAccept={() => console.log('Accept task', task)}
              onReject={() => console.log('Reject task', task)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// Sessions Tab Component
function SessionsTab({ sessions, loading }: any) {
  if (loading) {
    return <LoadingState />
  }

  if (!sessions || sessions.length === 0) {
    return <EmptyState message="No AI sessions recorded" />
  }

  return (
    <div className="space-y-2">
      {sessions.map((session: any) => (
        <div 
          key={session._id}
          className="bg-gray-900 border border-gray-700 p-3 hover:border-yellow-400 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs uppercase text-gray-400">{session.type}</span>
                <span className={clsx(
                  'px-2 py-0.5 text-xs font-bold uppercase',
                  session.model === 'gemini-2.5-flash' ? 'bg-yellow-500 text-black' : 'bg-green-500 text-black'
                )}>
                  {session.model === 'gemini-2.5-flash' ? 'Flash' : 'Flash Lite'}
                </span>
                {session.cached && (
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold uppercase">
                    Cached
                  </span>
                )}
              </div>
              <p className="text-sm text-white font-mono mb-1">
                {session.input.substring(0, 100)}...
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>Tokens: {session.tokens.total}</span>
                <span>Cost: ${session.cost.toFixed(4)}</span>
                <span>Latency: {session.latency}ms</span>
                <span>{new Date(session.createdAt).toLocaleString()}</span>
              </div>
            </div>
            {session.feedback && (
              <div className="flex items-center gap-1">
                {session.feedback.helpful ? (
                  <HiCheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <HiXCircle className="w-5 h-5 text-red-400" />
                )}
                <span className="text-sm font-bold text-white">
                  {session.feedback.rating}/5
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Helper Components
function MetricCard({ icon: Icon, label, value, trend, trendUp }: any) {
  return (
    <div className="bg-gray-900 border-2 border-gray-700 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5 text-yellow-400" />
        <span className="text-xs uppercase text-gray-400">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-white">{value}</span>
        {trend && (
          <span className={clsx(
            'text-sm font-bold',
            trendUp ? 'text-green-400' : 'text-red-400'
          )}>
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}

function ModelUsageBar({ model, count, total, color }: any) {
  const percentage = total > 0 ? (count / total) * 100 : 0
  
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-300">{model}</span>
        <span className="text-sm font-bold text-white">
          {count} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="h-4 bg-gray-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={clsx(
            'h-full',
            color === 'yellow' ? 'bg-yellow-400' : 'bg-green-400'
          )}
        />
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <HiLightningBolt className="w-12 h-12 text-yellow-400 animate-spin mx-auto mb-3" />
        <p className="text-gray-400 uppercase">Loading AI data...</p>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <HiExclamation className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">{message}</p>
      </div>
    </div>
  )
}