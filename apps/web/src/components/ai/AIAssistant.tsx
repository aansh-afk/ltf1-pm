// AI Assistant Component
// Provides AI assistance in forms and inputs

import React, { useState, useCallback } from 'react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { HiSparkles, HiLightningBolt, HiRefresh } from 'react-icons/hi'
import { useAI } from '../../hooks/useAI'
import { AISuggestion, AIIndicator } from './AIIndicator'

interface AIAssistantProps {
  context: 'task' | 'commit' | 'pr' | 'general'
  value?: string
  onSuggestion?: (suggestion: any) => void
  className?: string
}

export function AIAssistant({ 
  context, 
  value = '', 
  onSuggestion,
  className 
}: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [activeModel, setActiveModel] = useState<'flash' | 'flash-lite' | 'auto'>('auto')
  
  const { 
    loading,
    suggestTaskTitle,
    estimateComplexity,
    suggestPriority,
    extractLabels,
    generateCommitMessage,
    generatePRSummary 
  } = useAI()

  const generateSuggestions = useCallback(async () => {
    if (!value.trim()) return

    setSuggestions([])
    const newSuggestions: any[] = []

    try {
      if (context === 'task') {
        // Generate multiple task-related suggestions
        const [title, points, priority, labels] = await Promise.all([
          suggestTaskTitle(value),
          estimateComplexity(value),
          suggestPriority(value),
          extractLabels(value)
        ])

        newSuggestions.push(
          { type: 'title', value: title, confidence: 0.85 },
          { type: 'points', value: points, confidence: 0.75 },
          { type: 'priority', value: priority, confidence: 0.8 },
          { type: 'labels', value: labels, confidence: 0.7 }
        )
      } else if (context === 'commit') {
        const message = await generateCommitMessage(value)
        newSuggestions.push({ type: 'message', value: message, confidence: 0.9 })
      } else if (context === 'pr') {
        const summary = await generatePRSummary(value)
        newSuggestions.push({ type: 'summary', value: summary, confidence: 0.85 })
      }

      setSuggestions(newSuggestions)
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
    }
  }, [value, context, suggestTaskTitle, estimateComplexity, suggestPriority, extractLabels, generateCommitMessage, generatePRSummary])

  const acceptSuggestion = useCallback((suggestion: any) => {
    if (onSuggestion) {
      onSuggestion(suggestion)
    }
    setIsOpen(false)
  }, [onSuggestion])

  const formatSuggestionText = (suggestion: any) => {
    switch (suggestion.type) {
      case 'title':
        return `Title: ${suggestion.value}`
      case 'points':
        return `Story Points: ${suggestion.value}`
      case 'priority':
        return `Priority: ${suggestion.value.toUpperCase()}`
      case 'labels':
        return `Labels: ${suggestion.value.join(', ')}`
      case 'message':
        return suggestion.value
      case 'summary':
        return suggestion.value
      default:
        return suggestion.value
    }
  }

  return (
    <div className={clsx('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading || !value.trim()}
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5',
          'bg-black border-2 border-yellow-400',
          'font-mono text-xs uppercase font-bold',
          'hover:bg-yellow-400 hover:text-black transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          loading && 'animate-pulse'
        )}
      >
        {loading ? (
          <HiLightningBolt className="w-4 h-4 animate-spin" />
        ) : (
          <HiSparkles className="w-4 h-4" />
        )}
        AI Assist
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full mt-2 left-0 z-50 w-96"
          >
            <div className="bg-black border-2 border-yellow-400 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-yellow-400 font-bold uppercase text-sm">
                  AI Suggestions
                </h3>
                <div className="flex items-center gap-2">
                  <AIIndicator active={loading} loading={loading} model={activeModel} />
                  <button
                    onClick={generateSuggestions}
                    disabled={loading}
                    className="p-1 text-yellow-400 hover:text-yellow-300 disabled:opacity-50"
                  >
                    <HiRefresh className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {value.trim() && (
                <div className="mb-3 p-2 bg-gray-900 border border-gray-700">
                  <p className="text-xs text-gray-400 uppercase mb-1">Context:</p>
                  <p className="text-sm text-white font-mono">{value}</p>
                </div>
              )}

              {suggestions.length === 0 && !loading && (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">
                    Click refresh to generate AI suggestions
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <AISuggestion
                    key={index}
                    suggestion={formatSuggestionText(suggestion)}
                    confidence={suggestion.confidence}
                    onAccept={() => acceptSuggestion(suggestion)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface AIFieldAssistantProps {
  fieldName: string
  fieldType: 'title' | 'description' | 'priority' | 'labels' | 'points'
  currentValue?: string
  onApply: (value: any) => void
  className?: string
}

export function AIFieldAssistant({
  fieldName,
  fieldType,
  currentValue = '',
  onApply,
  className
}: AIFieldAssistantProps) {
  const [suggestion, setSuggestion] = useState<any>(null)
  const [showSuggestion, setShowSuggestion] = useState(false)
  
  const { 
    loading,
    suggestTaskTitle,
    estimateComplexity,
    suggestPriority,
    extractLabels 
  } = useAI()

  const generateFieldSuggestion = useCallback(async () => {
    if (!currentValue.trim()) return

    try {
      let result: any
      switch (fieldType) {
        case 'title':
          result = await suggestTaskTitle(currentValue)
          break
        case 'points':
          result = await estimateComplexity(currentValue)
          break
        case 'priority':
          result = await suggestPriority(currentValue)
          break
        case 'labels':
          result = await extractLabels(currentValue)
          break
        default:
          return
      }
      
      setSuggestion(result)
      setShowSuggestion(true)
    } catch (error) {
      console.error('Failed to generate suggestion:', error)
    }
  }, [currentValue, fieldType, suggestTaskTitle, estimateComplexity, suggestPriority, extractLabels])

  const applySuggestion = useCallback(() => {
    if (suggestion) {
      onApply(suggestion)
      setShowSuggestion(false)
    }
  }, [suggestion, onApply])

  const formatSuggestion = () => {
    if (!suggestion) return ''
    
    switch (fieldType) {
      case 'labels':
        return Array.isArray(suggestion) ? suggestion.join(', ') : suggestion
      case 'points':
        return `${suggestion} story points`
      case 'priority':
        return suggestion.toUpperCase()
      default:
        return suggestion
    }
  }

  return (
    <div className={clsx('inline-flex items-center gap-2', className)}>
      <button
        onClick={generateFieldSuggestion}
        disabled={loading || !currentValue.trim()}
        className={clsx(
          'p-1.5 text-yellow-400 hover:text-yellow-300',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          loading && 'animate-spin'
        )}
        title={`Get AI suggestion for ${fieldName}`}
      >
        {loading ? (
          <HiLightningBolt className="w-4 h-4" />
        ) : (
          <HiSparkles className="w-4 h-4" />
        )}
      </button>

      <AnimatePresence>
        {showSuggestion && suggestion && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-2"
          >
            <span className="text-sm text-gray-400">
              {formatSuggestion()}
            </span>
            <button
              onClick={applySuggestion}
              className="px-2 py-0.5 bg-yellow-400 text-black font-bold uppercase text-xs hover:bg-yellow-300"
            >
              Apply
            </button>
            <button
              onClick={() => setShowSuggestion(false)}
              className="px-2 py-0.5 border border-gray-600 text-gray-400 font-bold uppercase text-xs hover:text-white"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface AISmartInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'title' | 'description' | 'commit' | 'general'
  autoSuggest?: boolean
  className?: string
}

export function AISmartInput({
  value,
  onChange,
  placeholder,
  type = 'general',
  autoSuggest = false,
  className
}: AISmartInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const { 
    loading,
    suggestTaskTitle,
    generateCommitMessage 
  } = useAI()

  const generateSuggestion = useCallback(async () => {
    if (!value.trim() || value.length < 10) return

    try {
      let suggestion: string
      if (type === 'title') {
        suggestion = await suggestTaskTitle(value)
      } else if (type === 'commit') {
        suggestion = await generateCommitMessage(value)
      } else {
        return
      }
      
      setSuggestions([suggestion])
    } catch (error) {
      console.error('Failed to generate suggestion:', error)
    }
  }, [value, type, suggestTaskTitle, generateCommitMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return

    if (e.key === 'Tab' && selectedIndex >= 0) {
      e.preventDefault()
      onChange(suggestions[selectedIndex])
      setSuggestions([])
      setSelectedIndex(-1)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(Math.min(selectedIndex + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(Math.max(selectedIndex - 1, -1))
    } else if (e.key === 'Escape') {
      setSuggestions([])
      setSelectedIndex(-1)
    }
  }

  React.useEffect(() => {
    if (autoSuggest) {
      const timer = setTimeout(() => {
        generateSuggestion()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [value, autoSuggest, generateSuggestion])

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={clsx(
            'w-full px-3 py-2 pr-10',
            'bg-black border-2 border-gray-600',
            'text-white font-mono',
            'focus:border-yellow-400 focus:outline-none',
            'placeholder-gray-500',
            className
          )}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <HiLightningBolt className="w-4 h-4 text-yellow-400 animate-spin" />
          </div>
        )}
        {!loading && autoSuggest && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <HiSparkles className="w-4 h-4 text-yellow-400" />
          </div>
        )}
      </div>

      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full mt-1 left-0 right-0 z-50"
          >
            <div className="bg-black border-2 border-yellow-400 py-1">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={clsx(
                    'px-3 py-2 cursor-pointer',
                    'text-sm font-mono',
                    selectedIndex === index ? 'bg-yellow-400 text-black' : 'text-white hover:bg-gray-900'
                  )}
                  onClick={() => {
                    onChange(suggestion)
                    setSuggestions([])
                    setSelectedIndex(-1)
                  }}
                >
                  <div className="flex items-center gap-2">
                    <HiSparkles className="w-3 h-3" />
                    <span>{suggestion}</span>
                  </div>
                  <span className="text-xs opacity-60">Press Tab to accept</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}