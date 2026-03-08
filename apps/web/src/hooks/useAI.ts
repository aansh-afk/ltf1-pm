// AI Hooks for LTF1
// React hooks for easy AI integration in components

import { useState, useCallback } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'
import { toast } from 'sonner'
import { getGeminiService } from '@/services/ai/geminiService'

/** Sprint data input for analysis */
interface SprintAnalysisInput {
  name?: string
  startDate?: string
  endDate?: string
  tasks?: Array<{ status?: string; points?: number }>
  velocity?: number
}

/** Sprint analysis result */
interface SprintAnalysisResult {
  velocity: number
  predictedCompletion: string
  completionProbability: number
  healthScore: number
  risks: string[]
  recommendations: string[]
  insights: { strongPoints: string[]; improvements: string[] }
}

/** Velocity prediction input */
interface VelocityPredictionInput {
  sprints?: Array<{ velocity?: number; completedPoints?: number }>
  teamSize?: number
}

/** Velocity prediction result */
interface VelocityPredictionResult {
  predicted_velocity: number
  confidence_level: number
  range: { optimistic: number; realistic: number; pessimistic: number }
  factors: { positive: string[]; negative: string[]; neutral: string[] }
  recommendations: string[]
}

/** Risk assessment input */
interface RiskAssessmentInput {
  projectName?: string
  tasks?: Array<{ status?: string; priority?: string }>
  timeline?: { start?: string; end?: string }
}

/** Risk assessment result */
interface RiskAssessmentResult {
  risk_summary: { overall_risk_level: string; risk_score: number }
  top_risks: Array<{ description: string; severity: string }>
  recommendations: { immediate_actions: string[] }
}

/** Question context */
interface QuestionContext {
  projectName?: string
  sprintName?: string
  data?: Record<string, unknown>
}

/** Metrics input for anomaly detection */
interface MetricsInput {
  velocity?: number[]
  burndown?: number[]
  completionRates?: number[]
}

/** Anomaly detection result */
interface AnomalyDetectionResult {
  anomalies: Array<{ metric: string; description: string }>
  severity: string
}

/** Recommendations input */
interface RecommendationsInput {
  projectData?: Record<string, unknown>
  metrics?: MetricsInput
}

/** Recommendations result */
interface RecommendationsResult {
  recommendations: string[]
}

/** Time series data for trend analysis */
interface TimeSeriesInput {
  dataPoints?: Array<{ date: string; value: number }>
  metric?: string
}

/** Trend analysis result */
interface TrendAnalysisResult {
  trend: string
  forecast: Array<{ date: string; value: number }>
}

/** Source data for task suggestions */
interface TaskSourceData {
  url?: string
  title?: string
  body?: string
  diff?: string
  [key: string]: unknown
}

// Fallback mock AI service for when Gemini is not configured
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

  async assessPriority(description: string): Promise<string> {
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

  async generatePRSummary(description: string, context: string): Promise<string> {
    return `## What Changed\n${description}\n\n## Why\n- Addresses user requirements\n- Improves system functionality\n\n## Testing\n- Unit tests added\n- Manual testing completed`
  }

  // Add missing methods for compatibility
  async analyzeSprint(data: SprintAnalysisInput): Promise<SprintAnalysisResult> {
    return {
      velocity: 42,
      predictedCompletion: new Date().toISOString(),
      completionProbability: 0.75,
      healthScore: 72,
      risks: [],
      recommendations: ['Keep up the good work'],
      insights: { strongPoints: ['Good velocity'], improvements: ['Reduce scope changes'] }
    }
  }

  async generateCodeReview(code: string, context: string): Promise<string> {
    return '✅ Code looks good!\n\nConsiderations:\n- Add error handling\n- Consider edge cases'
  }

  async predictVelocity(data: VelocityPredictionInput): Promise<VelocityPredictionResult> {
    return {
      predicted_velocity: 45,
      confidence_level: 0.7,
      range: { optimistic: 50, realistic: 45, pessimistic: 40 },
      factors: { positive: ['Team stable'], negative: [], neutral: [] },
      recommendations: ['Maintain current pace']
    }
  }

  async assessRisks(data: RiskAssessmentInput): Promise<RiskAssessmentResult> {
    return {
      risk_summary: { overall_risk_level: 'MEDIUM', risk_score: 42 },
      top_risks: [],
      recommendations: { immediate_actions: [] }
    }
  }

  async answerQuestion(question: string, context: QuestionContext): Promise<string> {
    return `Based on the data, ${question.toLowerCase()}`
  }

  async explainTechnical(concept: string, audience: string): Promise<string> {
    return `${concept} is a technical concept that...`
  }

  async detectAnomalies(metrics: MetricsInput): Promise<AnomalyDetectionResult> {
    return { anomalies: [], severity: 'low' }
  }

  async generateRecommendations(data: RecommendationsInput): Promise<RecommendationsResult> {
    return { recommendations: ['Continue current practices'] }
  }

  async analyzeTrends(data: TimeSeriesInput): Promise<TrendAnalysisResult> {
    return { trend: 'stable', forecast: [] }
  }
}

// Get AI service (Gemini or Mock)
const getAIService = () => {
  try {
    const geminiService = getGeminiService()
    if (geminiService) {
      return geminiService
    }
  } catch (error) {
    console.warn('AI service not available, using mock AI')
  }
  return new MockAIService()
}

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
      const aiService = getAIService()
      const title = await aiService.generateTaskTitle(description)

      // Track the AI session
      await trackSession({
        type: 'task.title.generate',
        input: description,
        output: title,
        model: 'gpt-oss-120b',
        tokens: { input: description.length / 4, output: title.length / 4, total: (description.length + title.length) / 4 },
        cost: 0.0001,
        latency: 100,
        cached: false,
      })

      return title
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
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
      const aiService = getAIService()
      const points = await aiService.estimateStoryPoints(description)

      await trackSession({
        type: 'task.points.estimate',
        input: description,
        output: points.toString(),
        model: 'gpt-oss-120b',
        tokens: { input: description.length / 4, output: 10, total: (description.length + 10) / 4 },
        cost: 0.0001,
        latency: 150,
        cached: false,
      })

      return points
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
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
      const aiService = getAIService()
      const priority = await aiService.assessPriority(description)

      await trackSession({
        type: 'task.priority.suggest',
        input: description,
        output: priority,
        model: 'gpt-oss-120b',
        tokens: { input: description.length / 4, output: 10, total: (description.length + 10) / 4 },
        cost: 0.0001,
        latency: 100,
        cached: false,
      })

      return priority
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
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
      const aiService = getAIService()
      const labels = await aiService.extractLabels(description)

      await trackSession({
        type: 'task.label.extract',
        input: description,
        output: labels.join(', '),
        model: 'gpt-oss-120b',
        tokens: { input: description.length / 4, output: 50, total: (description.length + 50) / 4 },
        cost: 0.0001,
        latency: 120,
        cached: false,
      })

      return labels
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
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
      const aiService = getAIService()
      const message = await aiService.generateCommitMessage(changes)

      await trackSession({
        type: 'commit.message.generate',
        input: changes,
        output: message,
        model: 'gpt-oss-120b',
        tokens: { input: changes.length / 4, output: message.length / 4, total: (changes.length + message.length) / 4 },
        cost: 0.0001,
        latency: 100,
        cached: false,
      })

      return message
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      toast.error('Failed to generate commit message')
      throw err
    } finally {
      setLoading(false)
    }
  }, [trackSession])

  const generatePRSummary = useCallback(async (description: string, context: string = '') => {
    setLoading(true)
    setError(null)
    try {
      const aiService = getAIService()
      const summary = await aiService.generatePRSummary(description, context)

      await trackSession({
        type: 'pr.title.generate',
        input: description,
        output: summary,
        model: 'gpt-oss-120b',
        tokens: { input: description.length / 4, output: summary.length / 4, total: (description.length + summary.length) / 4 },
        cost: 0.0005,
        latency: 300,
        cached: false,
      })

      return summary
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
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
    } catch (err: unknown) {
      toast.error('Failed to create insight')
      throw err
    }
  }, [createInsight])

  const dismissProjectInsight = useCallback(async (insightId: Id<'aiInsights'>, actionTaken?: string) => {
    try {
      await dismissInsight({ insightId, actionTaken })
      toast.success('Insight dismissed')
    } catch (err: unknown) {
      toast.error('Failed to dismiss insight')
      throw err
    }
  }, [dismissInsight])

  // AI Task Suggestions
  const createTaskSuggestion = useCallback(async (
    sourceType: 'commit' | 'pr' | 'comment' | 'manual',
    sourceData: TaskSourceData,
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
    } catch (err: unknown) {
      toast.error('Failed to create task suggestions')
      throw err
    }
  }, [createAITask])

  const acceptTaskSuggestion = useCallback(async (taskId: Id<'aiTasks'>) => {
    try {
      await updateAITaskStatus({ taskId, status: 'accepted' })
      toast.success('Task suggestion accepted')
    } catch (err: unknown) {
      toast.error('Failed to accept task suggestion')
      throw err
    }
  }, [updateAITaskStatus])

  const rejectTaskSuggestion = useCallback(async (taskId: Id<'aiTasks'>) => {
    try {
      await updateAITaskStatus({ taskId, status: 'rejected' })
      toast.info('Task suggestion rejected')
    } catch (err: unknown) {
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
    } catch (err: unknown) {
      toast.error('Failed to submit feedback')
      throw err
    }
  }, [addFeedback])

  // Sprint Analysis
  const analyzeSprint = useCallback(async (sprintData: SprintAnalysisInput) => {
    setLoading(true)
    setError(null)
    try {
      const aiService = getAIService()
      const analysis = await aiService.analyzeSprint(sprintData)

      await trackSession({
        type: 'sprint.analyze',
        input: JSON.stringify(sprintData),
        output: JSON.stringify(analysis),
        model: 'gpt-oss-120b',
        tokens: { input: 500, output: 300, total: 800 },
        cost: 0.001,
        latency: 500,
        cached: false,
      })

      return analysis
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      toast.error('Failed to analyze sprint')
      throw err
    } finally {
      setLoading(false)
    }
  }, [trackSession])

  // Code Review
  const generateCodeReview = useCallback(async (code: string, context: string) => {
    setLoading(true)
    setError(null)
    try {
      const aiService = getAIService()
      const review = await aiService.generateCodeReview(code, context)

      await trackSession({
        type: 'code.review.generate',
        input: code.substring(0, 500),
        output: review.substring(0, 500),
        model: 'gpt-oss-120b',
        tokens: { input: code.length / 4, output: review.length / 4, total: (code.length + review.length) / 4 },
        cost: 0.002,
        latency: 700,
        cached: false,
      })

      return review
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      toast.error('Failed to generate code review')
      throw err
    } finally {
      setLoading(false)
    }
  }, [trackSession])

  // Predictive Analytics
  const predictVelocity = useCallback(async (historicalData: VelocityPredictionInput) => {
    setLoading(true)
    setError(null)
    try {
      const aiService = getAIService()
      const prediction = await aiService.predictVelocity(historicalData)

      await trackSession({
        type: 'velocity.predict',
        input: JSON.stringify(historicalData),
        output: JSON.stringify(prediction),
        model: 'gpt-oss-120b',
        tokens: { input: 400, output: 200, total: 600 },
        cost: 0.001,
        latency: 400,
        cached: false,
      })

      return prediction
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      toast.error('Failed to predict velocity')
      throw err
    } finally {
      setLoading(false)
    }
  }, [trackSession])

  const assessProjectRisks = useCallback(async (projectData: RiskAssessmentInput) => {
    setLoading(true)
    setError(null)
    try {
      const aiService = getAIService()
      const risks = await aiService.assessRisks(projectData)

      await trackSession({
        type: 'risk.assess',
        input: JSON.stringify(projectData),
        output: JSON.stringify(risks),
        model: 'gpt-oss-120b',
        tokens: { input: 600, output: 400, total: 1000 },
        cost: 0.002,
        latency: 600,
        cached: false,
      })

      return risks
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      toast.error('Failed to assess risks')
      throw err
    } finally {
      setLoading(false)
    }
  }, [trackSession])

  // Natural Language
  const askQuestion = useCallback(async (question: string, context: QuestionContext) => {
    setLoading(true)
    setError(null)
    try {
      const aiService = getAIService()
      const answer = await aiService.answerQuestion(question, context)

      await trackSession({
        type: 'question.answer',
        input: question,
        output: answer,
        model: 'gpt-oss-120b',
        tokens: { input: question.length / 4, output: answer.length / 4, total: (question.length + answer.length) / 4 },
        cost: 0.001,
        latency: 300,
        cached: true,
      })

      return answer
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      toast.error('Failed to answer question')
      throw err
    } finally {
      setLoading(false)
    }
  }, [trackSession])

  const explainConcept = useCallback(async (concept: string, audience: 'executive' | 'technical' | 'junior' | 'non-technical' = 'technical') => {
    setLoading(true)
    setError(null)
    try {
      const aiService = getAIService()
      const explanation = await aiService.explainTechnical(concept, audience)

      await trackSession({
        type: 'concept.explain',
        input: concept,
        output: explanation.substring(0, 500),
        model: 'gpt-oss-120b',
        tokens: { input: 100, output: explanation.length / 4, total: 100 + explanation.length / 4 },
        cost: 0.001,
        latency: 400,
        cached: true,
      })

      return explanation
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      toast.error('Failed to explain concept')
      throw err
    } finally {
      setLoading(false)
    }
  }, [trackSession])

  // Insights Generation
  const detectAnomalies = useCallback(async (metrics: MetricsInput) => {
    setLoading(true)
    setError(null)
    try {
      const aiService = getAIService()
      const anomalies = await aiService.detectAnomalies(metrics)

      await trackSession({
        type: 'anomaly.detect',
        input: JSON.stringify(metrics),
        output: JSON.stringify(anomalies),
        model: 'gpt-oss-120b',
        tokens: { input: 500, output: 300, total: 800 },
        cost: 0.002,
        latency: 500,
        cached: false,
      })

      return anomalies
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      toast.error('Failed to detect anomalies')
      throw err
    } finally {
      setLoading(false)
    }
  }, [trackSession])

  const getRecommendations = useCallback(async (data: RecommendationsInput) => {
    setLoading(true)
    setError(null)
    try {
      const aiService = getAIService()
      const recommendations = await aiService.generateRecommendations(data)

      await trackSession({
        type: 'recommendation.generate',
        input: JSON.stringify(data),
        output: JSON.stringify(recommendations),
        model: 'gpt-oss-120b',
        tokens: { input: 400, output: 400, total: 800 },
        cost: 0.002,
        latency: 600,
        cached: false,
      })

      return recommendations
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      toast.error('Failed to generate recommendations')
      throw err
    } finally {
      setLoading(false)
    }
  }, [trackSession])

  const analyzeTrends = useCallback(async (timeSeriesData: TimeSeriesInput) => {
    setLoading(true)
    setError(null)
    try {
      const aiService = getAIService()
      const trends = await aiService.analyzeTrends(timeSeriesData)

      await trackSession({
        type: 'trend.analyze',
        input: JSON.stringify(timeSeriesData),
        output: JSON.stringify(trends),
        model: 'gpt-oss-120b',
        tokens: { input: 600, output: 400, total: 1000 },
        cost: 0.002,
        latency: 700,
        cached: false,
      })

      return trends
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      toast.error('Failed to analyze trends')
      throw err
    } finally {
      setLoading(false)
    }
  }, [trackSession])

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
    generateCodeReview,

    // Sprint Analysis
    analyzeSprint,

    // Predictive Analytics
    predictVelocity,
    assessProjectRisks,

    // Natural Language
    askQuestion,
    explainConcept,

    // Insights Generation
    detectAnomalies,
    getRecommendations,
    analyzeTrends,

    // Insights Management
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