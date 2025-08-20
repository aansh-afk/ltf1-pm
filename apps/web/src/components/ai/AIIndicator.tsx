// AI Indicator Component
// Shows AI activity and suggestions in the UI

import React from 'react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { HiSparkles, HiLightningBolt } from 'react-icons/hi'

interface AIIndicatorProps {
  active?: boolean
  loading?: boolean
  model?: 'flash' | 'flash-lite' | 'auto'
  text?: string
  className?: string
}

export function AIIndicator({ 
  active = false, 
  loading = false, 
  model = 'auto',
  text,
  className 
}: AIIndicatorProps) {
  if (!active && !loading) return null

  const modelColors = {
    'flash': 'text-yellow-400 border-yellow-400',
    'flash-lite': 'text-green-400 border-green-400',
    'auto': 'text-blue-400 border-blue-400'
  }

  const modelLabels = {
    'flash': 'Gemini Flash',
    'flash-lite': 'Flash Lite',
    'auto': 'Smart Routing'
  }

  return (
    <AnimatePresence>
      {(active || loading) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          className={clsx(
            'inline-flex items-center gap-2 px-3 py-1.5',
            'bg-black border-2',
            'font-mono text-xs uppercase tracking-wider',
            modelColors[model],
            className
          )}
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <HiLightningBolt className="w-4 h-4" />
            </motion.div>
          ) : (
            <HiSparkles className="w-4 h-4" />
          )}
          
          <span className="font-bold">
            {text || (loading ? 'AI THINKING...' : modelLabels[model])}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface AISuggestionProps {
  suggestion: string
  confidence?: number
  onAccept?: () => void
  onReject?: () => void
  className?: string
}

export function AISuggestion({
  suggestion,
  confidence = 0.8,
  onAccept,
  onReject,
  className
}: AISuggestionProps) {
  const confidenceColor = confidence > 0.8 ? 'text-green-400' : 
                          confidence > 0.6 ? 'text-yellow-400' : 
                          'text-red-400'

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={clsx(
        'bg-black border-2 border-yellow-400 p-3',
        'font-mono text-sm',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <HiSparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-bold uppercase text-xs">
              AI Suggestion
            </span>
            <span className={clsx('text-xs', confidenceColor)}>
              ({Math.round(confidence * 100)}% confidence)
            </span>
          </div>
          <p className="text-white">{suggestion}</p>
        </div>
        
        {(onAccept || onReject) && (
          <div className="flex gap-2">
            {onAccept && (
              <button
                onClick={onAccept}
                className="px-3 py-1 bg-green-500 text-black font-bold uppercase text-xs hover:bg-green-400 transition-colors"
              >
                Accept
              </button>
            )}
            {onReject && (
              <button
                onClick={onReject}
                className="px-3 py-1 bg-red-500 text-white font-bold uppercase text-xs hover:bg-red-400 transition-colors"
              >
                Reject
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

interface AIInsightCardProps {
  type: 'risk' | 'recommendation' | 'opportunity' | 'anomaly' | 'prediction'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  recommendations?: string[]
  onDismiss?: () => void
  onAction?: () => void
  className?: string
}

export function AIInsightCard({
  type,
  severity,
  title,
  description,
  recommendations,
  onDismiss,
  onAction,
  className
}: AIInsightCardProps) {
  const typeIcons = {
    risk: '⚠️',
    recommendation: '💡',
    opportunity: '🎯',
    anomaly: '🔴',
    prediction: '📊'
  }

  const severityColors = {
    critical: 'border-red-500 bg-red-950',
    high: 'border-orange-500 bg-orange-950',
    medium: 'border-yellow-500 bg-yellow-950',
    low: 'border-blue-500 bg-blue-950'
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={clsx(
        'border-2 p-4',
        severityColors[severity],
        'font-mono',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{typeIcons[type]}</span>
          <div>
            <h3 className="text-white font-bold uppercase">{title}</h3>
            <span className="text-xs text-gray-400 uppercase">
              {severity} {type}
            </span>
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-white text-xl font-bold"
          >
            ×
          </button>
        )}
      </div>

      <p className="text-gray-300 text-sm mb-3">{description}</p>

      {recommendations && recommendations.length > 0 && (
        <div className="mb-3">
          <p className="text-xs uppercase text-gray-400 mb-1">Recommendations:</p>
          <ul className="list-disc list-inside text-sm text-gray-300">
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {onAction && (
        <button
          onClick={onAction}
          className="px-3 py-1 bg-yellow-400 text-black font-bold uppercase text-xs hover:bg-yellow-300 transition-colors"
        >
          Take Action
        </button>
      )}
    </motion.div>
  )
}

interface AIStatsWidgetProps {
  totalRequests: number
  totalCost: number
  cacheHitRate: number
  averageLatency: number
  className?: string
}

export function AIStatsWidget({
  totalRequests,
  totalCost,
  cacheHitRate,
  averageLatency,
  className
}: AIStatsWidgetProps) {
  return (
    <div className={clsx(
      'bg-black border-2 border-yellow-400 p-4',
      'font-mono',
      className
    )}>
      <div className="flex items-center gap-2 mb-3">
        <HiSparkles className="w-5 h-5 text-yellow-400" />
        <h3 className="text-yellow-400 font-bold uppercase">AI Usage Stats</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-400 uppercase text-xs">Requests</p>
          <p className="text-white font-bold">{totalRequests.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-400 uppercase text-xs">Cost</p>
          <p className="text-white font-bold">${totalCost.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-400 uppercase text-xs">Cache Hit</p>
          <p className="text-white font-bold">{(cacheHitRate * 100).toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-gray-400 uppercase text-xs">Latency</p>
          <p className="text-white font-bold">{averageLatency.toFixed(0)}ms</p>
        </div>
      </div>
    </div>
  )
}

interface AITaskSuggestionCardProps {
  title: string
  description: string
  type: string
  priority: string
  estimate?: number
  confidence: number
  onAccept?: () => void
  onReject?: () => void
  className?: string
}

export function AITaskSuggestionCard({
  title,
  description,
  type,
  priority,
  estimate,
  confidence,
  onAccept,
  onReject,
  className
}: AITaskSuggestionCardProps) {
  const priorityColors = {
    urgent: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={clsx(
        'bg-black border-2 border-yellow-400 p-4',
        'font-mono',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <HiSparkles className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-400 font-bold uppercase text-xs">
            AI Suggested Task
          </span>
          <span className="text-gray-400 text-xs">
            ({Math.round(confidence * 100)}% confidence)
          </span>
        </div>
      </div>

      <h4 className="text-white font-bold mb-2">{title}</h4>
      <p className="text-gray-300 text-sm mb-3">{description}</p>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs uppercase text-gray-400">Type:</span>
        <span className="text-white text-sm">{type}</span>
        
        <span className="text-xs uppercase text-gray-400">Priority:</span>
        <span className={clsx(
          'px-2 py-0.5 text-xs font-bold uppercase',
          priorityColors[priority as keyof typeof priorityColors],
          priority === 'low' ? 'text-black' : 'text-white'
        )}>
          {priority}
        </span>
        
        {estimate && (
          <>
            <span className="text-xs uppercase text-gray-400">Points:</span>
            <span className="text-white text-sm">{estimate}</span>
          </>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="flex-1 px-3 py-1.5 bg-green-500 text-black font-bold uppercase text-xs hover:bg-green-400 transition-colors"
        >
          Create Task
        </button>
        <button
          onClick={onReject}
          className="flex-1 px-3 py-1.5 bg-red-500 text-white font-bold uppercase text-xs hover:bg-red-400 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </motion.div>
  )
}