// AI Hooks for LTF1
// React hooks for easy AI integration in components

import { useState, useCallback } from 'react'
import { useMutation, useQuery, useAction } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { toast } from 'sonner'

// ==============================================
// MAIN AI HOOK
// ==============================================

export function useAI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Convex actions (Server-Side AI)
  const generateTaskDetailsAction = useAction(api.ai.actions.generateTaskDetails)
  const analyzeSprintAction = useAction(api.ai.actions.analyzeSprint)
  const generatePRSummaryAction = useAction(api.ai.actions.generatePRSummary)

  // Convex mutations
  const trackSession = useMutation(api.ai.mutations.trackAISession)
  const addFeedback = useMutation(api.ai.mutations.addAIFeedback)
  const createInsight = useMutation(api.ai.mutations.createAIInsight)
  const dismissInsight = useMutation(api.ai.mutations.dismissAIInsight)
  const createAITask = useMutation(api.ai.mutations.createAITaskSuggestion)
  const updateAITaskStatus = useMutation(api.ai.mutations.updateAITaskStatus)

  // Task Intelligence
  const generateTaskDetails = useCallback(async (description: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await generateTaskDetailsAction({ description });
      return result;
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to generate task details')
      throw err
    } finally {
      setLoading(false)
    }
  }, [generateTaskDetailsAction])

  // Backward compatibility wrappers (can be deprecated later)
  const suggestTaskTitle = useCallback(async (description: string) => {
    const details = await generateTaskDetails(description);
    return details.title;
  }, [generateTaskDetails]);

  const estimateComplexity = useCallback(async (description: string) => {
    const details = await generateTaskDetails(description);
    return details.points;
  }, [generateTaskDetails]);

  const suggestPriority = useCallback(async (description: string) => {
    const details = await generateTaskDetails(description);
    return details.priority;
  }, [generateTaskDetails]);

  const extractLabels = useCallback(async (description: string) => {
    const details = await generateTaskDetails(description);
    return details.labels;
  }, [generateTaskDetails]);

  // Code Intelligence
  const generatePRSummary = useCallback(async (diff: string, context: string = '') => {
    setLoading(true)
    setError(null)
    try {
      const summary = await generatePRSummaryAction({ diff, context });
      return summary
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to generate PR summary')
      throw err
    } finally {
      setLoading(false)
    }
  }, [generatePRSummaryAction])

  // Sprint Analysis
  const analyzeSprint = useCallback(async (sprintId: Id<"sprints">) => {
    setLoading(true)
    setError(null)
    try {
      const analysis = await analyzeSprintAction({ sprintId });
      return analysis
    } catch (err: any) {
      setError(err.message)
      toast.error('Failed to analyze sprint')
      throw err
    } finally {
      setLoading(false)
    }
  }, [analyzeSprintAction])

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
    
    // Core Actions (New)
    generateTaskDetails,
    analyzeSprint,
    generatePRSummary,

    // Legacy wrappers (for compatibility if needed)
    suggestTaskTitle,
    estimateComplexity,
    suggestPriority,
    extractLabels,
    
    // Insights Management
    createProjectInsight,
    dismissProjectInsight,
    
    // Task Suggestions
    createTaskSuggestion,
    acceptTaskSuggestion,
    rejectTaskSuggestion,
    
    // Feedback
    provideFeedback,

    // Deprecated placeholders to prevent build errors
    generateCommitMessage: async (changes: string) => `fix: ${changes}`,
    generateCodeReview: async (code: string) => "Code review pending...",
    predictVelocity: async (data: any) => ({ predicted_velocity: 0 }),
    assessProjectRisks: async (data: any) => ({ risk_summary: { overall_risk_level: 'LOW' } }),
    askQuestion: async (q: string) => "I can't answer that right now.",
    explainConcept: async (c: string) => `${c} is a concept.`,
    detectAnomalies: async (m: any) => ({ anomalies: [] }),
    getRecommendations: async (d: any) => ({ recommendations: [] }),
    analyzeTrends: async (d: any) => ({ trend: 'stable' }),
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
