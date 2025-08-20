// AI Hooks for LTF1
// React hooks for easy AI integration in components

import { useState, useCallback } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { toast } from 'sonner'

// Mock AI service for now (will be replaced with actual Gemini integration)
class MockAIService {
  async generateTaskTitle(description: string): Promise<string> {
    const words = description.split(' ').slice(0, 5)
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  async estimateStoryPoints(description: string): Promise<number> {
    const complexity = description.length
    if (complexity < 50) return 1
    if (complexity < 100) return 3
    if (complexity < 200) return 5
    if (complexity < 400) return 8
    return 13
  }

  async suggestPriority(description: string): Promise<'urgent' | 'high' | 'medium' | 'low'> {
    const lower = description.toLowerCase()
    if (lower.includes('urgent') || lower.includes('critical')) return 'urgent'
    if (lower.includes('high') || lower.includes('important')) return 'high'
    if (lower.includes('low') || lower.includes('minor')) return 'low'
    return 'medium'
  }

  async extractLabels(description: string): Promise<string[]> {
    const labels: string[] = []
    const lower = description.toLowerCase()
    
    if (lower.includes('frontend')) labels.push('frontend')
    if (lower.includes('backend')) labels.push('backend')
    if (lower.includes('api')) labels.push('api')
    if (lower.includes('database')) labels.push('database')
    if (lower.includes('ui') || lower.includes('ux')) labels.push('ui/ux')
    if (lower.includes('performance')) labels.push('performance')
    if (lower.includes('security')) labels.push('security')
    
    return labels.length > 0 ? labels : ['general']
  }

  async generateCommitMessage(changes: string): Promise<string> {
    const verb = changes.toLowerCase().includes('fix') ? 'fix' : 
                changes.toLowerCase().includes('add') ? 'feat' : 
                changes.toLowerCase().includes('update') ? 'chore' : 'feat'
    
    return `${verb}: ${changes.toLowerCase()}`
  }

  async generatePRSummary(description: string): Promise<string> {
    return `## What Changed\n${description}\n\n## Why\n- Addresses user requirements\n- Improves system functionality\n\n## Testing\n- Unit tests added\n- Manual testing completed`
  }
}

const mockAI = new MockAIService()

// ==============================================
// MAIN AI HOOK
// ==============================================

export function useAI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Convex mutations
  const trackSession = useMutation(api.ai.mutations.trackAISession)
  const addFeedback = useMutation(api.ai.mutations.addAIFeedback)
  const createInsight = useMutation(api.ai.mutations.createAIInsight)
  const dismissInsight = useMutation(api.ai.mutations.dismissAIInsight)
  const createAITask = useMutation(api.ai.mutations.createAITaskSuggestion)
  const updateAITaskStatus = useMutation(api.ai.mutations.updateAITaskStatus)

  // Task Intelligence
  const suggestTaskTitle = useCallback(async (description: string) => {
    setLoading(true)
    setError(null)
    try {
      const title = await mockAI.generateTaskTitle(description)
      
      // Track the AI session
      await trackSession({
        type: 'task.title.generate',
        input: description,
        output: title,
        model: 'gemini-2.5-flash-lite',
        tokens: { input: description.length / 4, output: title.length / 4, total: (description.length + title.length) / 4 },
        cost: 0.0001,
        latency: 100,
        cached: false,
      })
      
      return title
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to generate task title')
      throw err
    } finally {
      setLoading(false)
    }
  }, [trackSession])

  const estimateComplexity = useCallback(async (description: string) => {
    setLoading(true)
    setError(null)
    try {
      const points = await mockAI.estimateStoryPoints(description)
      
      await trackSession({
        type: 'task.points.estimate',
        input: description,
        output: points.toString(),
        model: 'gemini-2.5-flash-lite',
        tokens: { input: description.length / 4, output: 10, total: (description.length + 10) / 4 },
        cost: 0.0001,
        latency: 150,
        cached: false,
      })
      
      return points
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to estimate complexity')
      throw err
    } finally {
      setLoading(false)
    }
  }, [trackSession])

  const suggestPriority = useCallback(async (description: string) => {
    setLoading(true)
    setError(null)
    try {
      const priority = await mockAI.suggestPriority(description)
      
      await trackSession({
        type: 'task.priority.suggest',
        input: description,
        output: priority,
        model: 'gemini-2.5-flash-lite',
        tokens: { input: description.length / 4, output: 10, total: (description.length + 10) / 4 },
        cost: 0.0001,
        latency: 100,
        cached: false,
      })
      
      return priority
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to suggest priority')
      throw err
    } finally {
      setLoading(false)
    }
  }, [trackSession])

  const extractLabels = useCallback(async (description: string) => {
    setLoading(true)
    setError(null)
    try {
      const labels = await mockAI.extractLabels(description)
      
      await trackSession({
        type: 'task.label.extract',
        input: description,
        output: labels.join(', '),
        model: 'gemini-2.5-flash-lite',
        tokens: { input: description.length / 4, output: 50, total: (description.length + 50) / 4 },
        cost: 0.0001,
        latency: 120,
        cached: false,
      })
      
      return labels
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to extract labels')
      throw err
    } finally {
      setLoading(false)
    }
  }, [trackSession])

  // Code Intelligence
  const generateCommitMessage = useCallback(async (changes: string) => {
    setLoading(true)
    setError(null)
    try {
      const message = await mockAI.generateCommitMessage(changes)
      
      await trackSession({
        type: 'commit.message.generate',
        input: changes,
        output: message,
        model: 'gemini-2.5-flash-lite',
        tokens: { input: changes.length / 4, output: message.length / 4, total: (changes.length + message.length) / 4 },
        cost: 0.0001,
        latency: 100,
        cached: false,
      })
      
      return message
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to generate commit message')
      throw err
    } finally {
      setLoading(false)
    }
  }, [trackSession])

  const generatePRSummary = useCallback(async (description: string) => {
    setLoading(true)
    setError(null)
    try {
      const summary = await mockAI.generatePRSummary(description)
      
      await trackSession({
        type: 'pr.title.generate',
        input: description,
        output: summary,
        model: 'gemini-2.5-flash',
        tokens: { input: description.length / 4, output: summary.length / 4, total: (description.length + summary.length) / 4 },
        cost: 0.0005,
        latency: 300,
        cached: false,
      })
      
      return summary
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to generate PR summary')
      throw err
    } finally {
      setLoading(false)
    }
  }, [trackSession])

  // Insights Management
  const createProjectInsight = useCallback(async (
    projectId: string,
    title: string,
    description: string,
    severity: 'critical' | 'high' | 'medium' | 'low' = 'medium'
  ) => {
    try {
      await createInsight({
        targetType: 'project',
        targetId: projectId,
        insightType: 'recommendation',
        severity,
        title,
        description,
        recommendations: ['Review and take action on this insight'],
      })
      toast.success('Insight created')
    } catch (err: any) {
      toast.error('Failed to create insight')
      throw err
    }
  }, [createInsight])

  const dismissProjectInsight = useCallback(async (insightId: Id<'aiInsights'>, actionTaken?: string) => {
    try {
      await dismissInsight({ insightId, actionTaken })
      toast.success('Insight dismissed')
    } catch (err: any) {
      toast.error('Failed to dismiss insight')
      throw err
    }
  }, [dismissInsight])

  // AI Task Suggestions
  const createTaskSuggestion = useCallback(async (
    sourceType: 'commit' | 'pr' | 'comment' | 'manual',
    sourceData: any,
    suggestions: Array<{
      title: string
      description: string
      type: string
      priority: string
      estimate?: number
      confidence: number
    }>
  ) => {
    try {
      await createAITask({
        sourceType,
        sourceData,
        suggestedTasks: suggestions,
      })
      toast.success('Task suggestions created')
    } catch (err: any) {
      toast.error('Failed to create task suggestions')
      throw err
    }
  }, [createAITask])

  const acceptTaskSuggestion = useCallback(async (taskId: Id<'aiTasks'>) => {
    try {
      await updateAITaskStatus({ taskId, status: 'accepted' })
      toast.success('Task suggestion accepted')
    } catch (err: any) {
      toast.error('Failed to accept task suggestion')
      throw err
    }
  }, [updateAITaskStatus])

  const rejectTaskSuggestion = useCallback(async (taskId: Id<'aiTasks'>) => {
    try {
      await updateAITaskStatus({ taskId, status: 'rejected' })
      toast.info('Task suggestion rejected')
    } catch (err: any) {
      toast.error('Failed to reject task suggestion')
      throw err
    }
  }, [updateAITaskStatus])

  // Feedback
  const provideFeedback = useCallback(async (
    sessionId: Id<'aiSessions'>,
    rating: number,
    helpful: boolean,
    comment?: string
  ) => {
    try {
      await addFeedback({ sessionId, helpful, rating, comment })
      toast.success('Thank you for your feedback!')
    } catch (err: any) {
      toast.error('Failed to submit feedback')
      throw err
    }
  }, [addFeedback])

  return {
    // State
    loading,
    error,
    
    // Task Intelligence
    suggestTaskTitle,
    estimateComplexity,
    suggestPriority,
    extractLabels,
    
    // Code Intelligence
    generateCommitMessage,
    generatePRSummary,
    
    // Insights
    createProjectInsight,
    dismissProjectInsight,
    
    // Task Suggestions
    createTaskSuggestion,
    acceptTaskSuggestion,
    rejectTaskSuggestion,
    
    // Feedback
    provideFeedback,
  }
}

// ==============================================
// SPECIALIZED HOOKS
// ==============================================

// Hook for AI insights
export function useAIInsights(targetType?: 'task' | 'sprint' | 'project' | 'team' | 'user', targetId?: string) {
  const insights = useQuery(
    api.ai.queries.getActiveInsights,
    targetType && targetId ? { targetType, targetId } : {}
  )
  
  return {
    insights: insights || [],
    loading: insights === undefined,
  }
}

// Hook for AI usage statistics
export function useAIStats(workspaceId: Id<'workspaces'>, timeRange: 'day' | 'week' | 'month' = 'day') {
  const stats = useQuery(
    api.ai.queries.getWorkspaceAIStats,
    { workspaceId, timeRange }
  )
  
  return {
    stats,
    loading: stats === undefined,
  }
}

// Hook for pending AI task suggestions
export function useAITaskSuggestions() {
  const suggestions = useQuery(api.ai.queries.getPendingAITasks, {})
  
  return {
    suggestions: suggestions || [],
    loading: suggestions === undefined,
  }
}

// Hook for AI feedback summary
export function useAIFeedback(workspaceId: Id<'workspaces'>) {
  const feedback = useQuery(
    api.ai.queries.getAIFeedbackSummary,
    { workspaceId }
  )
  
  return {
    feedback,
    loading: feedback === undefined,
  }
}

// Hook for user AI sessions
export function useUserAISessions(limit: number = 50, type?: string) {
  const sessions = useQuery(
    api.ai.queries.getUserAISessions,
    { limit, type }
  )
  
  return {
    sessions: sessions || [],
    loading: sessions === undefined,
  }
}