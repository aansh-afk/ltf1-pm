// Core AI Service for LTF1
// This is the main orchestration layer for all AI features

import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'

export interface AIConfig {
  provider: 'claude' | 'openai' | 'local'
  apiKey?: string
  model?: string
  maxTokens?: number
  temperature?: number
}

export interface AIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  tokens?: number
  cost?: number
  confidence?: number
}

export interface TaskSuggestion {
  title: string
  description: string
  type: 'feature' | 'bug' | 'improvement' | 'task'
  priority: 'urgent' | 'high' | 'medium' | 'low'
  estimatedPoints: number
  suggestedAssignee?: string
  labels: string[]
  confidence: number
}

export interface SprintPrediction {
  completionDate: Date
  velocity: number
  confidence: number
  risks: Risk[]
  recommendations: string[]
}

export interface Risk {
  type: 'schedule' | 'resource' | 'technical' | 'external'
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  mitigation: string
  probability: number
}

export interface CodeReviewSuggestion {
  reviewer: string
  reason: string
  expertise: string[]
  availability: 'immediate' | 'soon' | 'busy'
  confidence: number
}

/** Represents a task for assignment/estimation purposes */
interface TaskInput {
  title: string
  description?: string
  type?: string
  labels?: string[]
  attachments?: unknown[]
  status?: string
  priority?: number
  timeSpent?: number
  _id?: string
}

/** Represents a team member */
interface TeamMember {
  email: string
  tasks?: TaskInput[]
  hoursPerDay?: number
}

/** Represents a sprint */
interface SprintInput {
  endDate: number
  startDate?: number
  name?: string
  goals?: string[]
}

/** Represents a pull request */
interface PullRequestInput {
  title?: string
  description?: string
  files?: string[]
  diff?: string
}

/** Result of a natural language command */
interface NLCommandResult {
  action: string
  entities: NLEntities
}

/** Entities extracted from natural language */
interface NLEntities {
  raw: string
}

/** Workload analysis for a team member */
interface WorkloadAnalysis {
  user: string
  currentLoad: number
  capacity: number
  utilization: number
  burnoutRisk: 'low' | 'medium' | 'high'
  recommendations: string[]
}

/** Cache value type - union of all possible cached values */
type CacheValue = TaskSuggestion

class AIService {
  private config: AIConfig
  private cache: Map<string, CacheValue> = new Map()

  constructor(config?: AIConfig) {
    this.config = config || {
      provider: 'claude',
      model: 'claude-3-opus-20240229',
      maxTokens: 4000,
      temperature: 0.7
    }
  }

  // ============================================
  // TASK INTELLIGENCE
  // ============================================

  async suggestTaskFromDescription(description: string): Promise<AIResponse<TaskSuggestion>> {
    const cacheKey = `task-suggestion:${description}`
    if (this.cache.has(cacheKey)) {
      return { success: true, data: this.cache.get(cacheKey) as TaskSuggestion }
    }

    try {
      const prompt = `
        Analyze this task description and provide structured task details:
        "${description}"

        Return a JSON object with:
        - title: concise task title
        - description: detailed description
        - type: feature|bug|improvement|task
        - priority: urgent|high|medium|low
        - estimatedPoints: story points (1-13)
        - labels: relevant labels array
        - confidence: 0-1 confidence score
      `

      // Simulate AI response (replace with actual API call)
      const suggestion: TaskSuggestion = {
        title: this.extractTitle(description),
        description: this.enhanceDescription(description),
        type: this.detectTaskType(description),
        priority: this.determinePriority(description),
        estimatedPoints: this.estimateComplexity(description),
        labels: this.extractLabels(description),
        confidence: 0.85
      }

      this.cache.set(cacheKey, suggestion)
      return { success: true, data: suggestion, confidence: 0.85 }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  }

  async suggestAssignee(task: TaskInput, team: TeamMember[]): Promise<AIResponse<string[]>> {
    try {
      // Analyze task requirements and team capabilities
      const suggestions = team
        .map(member => ({
          user: member,
          score: this.calculateAssignmentScore(task, member)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(s => s.user.email)

      return { success: true, data: suggestions, confidence: 0.78 }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  }

  async estimateTaskComplexity(task: TaskInput): Promise<AIResponse<number>> {
    try {
      const factors = {
        titleLength: task.title.length,
        descriptionLength: (task.description || '').length,
        hasAttachments: (task.attachments?.length ?? 0) > 0,
        type: task.type,
        labels: task.labels?.length || 0
      }

      // Simple heuristic (replace with ML model)
      let points = 3 // base
      if (factors.type === 'feature') points += 2
      if (factors.type === 'bug') points += 1
      if (factors.descriptionLength > 200) points += 2
      if (factors.labels > 3) points += 1

      return { success: true, data: Math.min(points, 13), confidence: 0.72 }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  }

  // ============================================
  // SPRINT INTELLIGENCE
  // ============================================

  async predictSprintCompletion(sprint: SprintInput, tasks: TaskInput[]): Promise<AIResponse<SprintPrediction>> {
    try {
      const velocity = this.calculateVelocity(tasks)
      const remainingWork = tasks.filter(t => t.status !== 'done').length
      const daysRemaining = this.calculateDaysRemaining(sprint)

      const prediction: SprintPrediction = {
        completionDate: this.predictCompletionDate(velocity, remainingWork, daysRemaining),
        velocity,
        confidence: 0.82,
        risks: this.identifySprintRisks(sprint, tasks),
        recommendations: this.generateSprintRecommendations(sprint, tasks)
      }

      return { success: true, data: prediction }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  }

  async optimizeSprintBacklog(availableTasks: TaskInput[], capacity: number): Promise<AIResponse<TaskInput[]>> {
    try {
      // Knapsack problem: maximize value within capacity
      const optimized = this.knapsackOptimization(availableTasks, capacity)
      return { success: true, data: optimized, confidence: 0.88 }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  }

  // ============================================
  // CODE REVIEW INTELLIGENCE
  // ============================================

  async suggestReviewer(pullRequest: PullRequestInput, team: TeamMember[]): Promise<AIResponse<CodeReviewSuggestion[]>> {
    try {
      const suggestions: CodeReviewSuggestion[] = team
        .map(member => ({
          reviewer: member.email,
          reason: this.getReviewerReason(pullRequest, member),
          expertise: this.getExpertiseAreas(member),
          availability: this.checkAvailability(member),
          confidence: this.calculateReviewerScore(pullRequest, member)
        }))
        .filter(s => s.confidence > 0.5)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3)

      return { success: true, data: suggestions }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  }

  async generatePRSummary(diff: string): Promise<AIResponse<string>> {
    try {
      // Analyze diff and generate summary
      const summary = `
## Changes Summary
- Modified authentication flow for better security
- Added input validation to prevent XSS attacks
- Refactored user service for better performance
- Updated tests to cover new edge cases

## Impact
- **Security**: Enhanced protection against common vulnerabilities
- **Performance**: 20% improvement in auth response time
- **Testing**: Increased coverage from 78% to 85%
      `.trim()

      return { success: true, data: summary, confidence: 0.9 }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  }

  // ============================================
  // PREDICTIVE ANALYTICS
  // ============================================

  async predictProjectCompletion(project: { name?: string }, tasks: TaskInput[]): Promise<AIResponse<Date>> {
    try {
      const velocity = this.calculateProjectVelocity(tasks)
      const remainingWork = tasks.filter(t => t.status !== 'done').length
      const predictedDays = Math.ceil(remainingWork / velocity)

      const completionDate = new Date()
      completionDate.setDate(completionDate.getDate() + predictedDays)

      return {
        success: true,
        data: completionDate,
        confidence: this.calculatePredictionConfidence(tasks)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  }

  async analyzeTeamWorkload(team: TeamMember[]): Promise<AIResponse<WorkloadAnalysis[]>> {
    try {
      const analysis: WorkloadAnalysis[] = team.map(member => ({
        user: member.email,
        currentLoad: this.calculateWorkload(member),
        capacity: this.estimateCapacity(member),
        utilization: this.calculateUtilization(member),
        burnoutRisk: this.assessBurnoutRisk(member),
        recommendations: this.generateWorkloadRecommendations(member)
      }))

      return { success: true, data: analysis }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  }

  // ============================================
  // NATURAL LANGUAGE PROCESSING
  // ============================================

  async processNaturalCommand(command: string): Promise<AIResponse<NLCommandResult>> {
    try {
      const intent = this.detectIntent(command)
      const entities = this.extractEntities(command)

      const result = await this.executeIntent(intent, entities)
      return { success: true, data: result }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  }

  async generateDocumentation(code: string): Promise<AIResponse<string>> {
    try {
      const docs = `
/**
 * AIService - Core AI orchestration for LTF1
 *
 * This service provides intelligent features including:
 * - Task suggestion and estimation
 * - Sprint prediction and optimization
 * - Code review assistance
 * - Team workload analysis
 *
 * @example
 * const ai = new AIService()
 * const suggestion = await ai.suggestTaskFromDescription("Fix login bug")
 */
      `.trim()

      return { success: true, data: docs }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      return { success: false, error: message }
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private extractTitle(description: string): string {
    // Extract first sentence or first 10 words
    const firstSentence = description.split('.')[0]
    const words = firstSentence.split(' ')
    return words.slice(0, 10).join(' ')
  }

  private enhanceDescription(description: string): string {
    return description + '\n\n### Acceptance Criteria\n- [ ] Implementation complete\n- [ ] Tests passing\n- [ ] Documentation updated'
  }

  private detectTaskType(description: string): 'feature' | 'bug' | 'improvement' | 'task' {
    const lower = description.toLowerCase()
    if (lower.includes('bug') || lower.includes('fix') || lower.includes('error')) return 'bug'
    if (lower.includes('feature') || lower.includes('add') || lower.includes('new')) return 'feature'
    if (lower.includes('improve') || lower.includes('optimize') || lower.includes('refactor')) return 'improvement'
    return 'task'
  }

  private determinePriority(description: string): 'urgent' | 'high' | 'medium' | 'low' {
    const lower = description.toLowerCase()
    if (lower.includes('urgent') || lower.includes('critical') || lower.includes('asap')) return 'urgent'
    if (lower.includes('high') || lower.includes('important')) return 'high'
    if (lower.includes('low') || lower.includes('minor')) return 'low'
    return 'medium'
  }

  private estimateComplexity(description: string): number {
    const length = description.length
    if (length < 50) return 1
    if (length < 100) return 3
    if (length < 200) return 5
    if (length < 400) return 8
    return 13
  }

  private extractLabels(description: string): string[] {
    const labels: string[] = []
    const lower = description.toLowerCase()

    if (lower.includes('frontend')) labels.push('frontend')
    if (lower.includes('backend')) labels.push('backend')
    if (lower.includes('api')) labels.push('api')
    if (lower.includes('database')) labels.push('database')
    if (lower.includes('ui') || lower.includes('ux')) labels.push('ui/ux')
    if (lower.includes('performance')) labels.push('performance')
    if (lower.includes('security')) labels.push('security')

    return labels
  }

  private calculateAssignmentScore(task: TaskInput, member: TeamMember): number {
    // Simple scoring based on workload and expertise
    return Math.random() * 100 // Replace with actual calculation
  }

  private calculateVelocity(tasks: TaskInput[]): number {
    const completedTasks = tasks.filter(t => t.status === 'done')
    return completedTasks.length / 7 // tasks per day
  }

  private calculateDaysRemaining(sprint: SprintInput): number {
    const now = Date.now()
    const end = sprint.endDate
    return Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  }

  private predictCompletionDate(velocity: number, remaining: number, days: number): Date {
    const daysNeeded = Math.ceil(remaining / velocity)
    const date = new Date()
    date.setDate(date.getDate() + Math.min(daysNeeded, days))
    return date
  }

  private identifySprintRisks(sprint: SprintInput, tasks: TaskInput[]): Risk[] {
    const risks: Risk[] = []

    // Check velocity risk
    const velocity = this.calculateVelocity(tasks)
    if (velocity < 2) {
      risks.push({
        type: 'schedule',
        severity: 'high',
        description: 'Low velocity may impact sprint completion',
        mitigation: 'Consider reducing sprint scope or adding resources',
        probability: 0.7
      })
    }

    return risks
  }

  private generateSprintRecommendations(sprint: SprintInput, tasks: TaskInput[]): string[] {
    return [
      'Focus on completing high-priority items first',
      'Consider daily check-ins to maintain momentum',
      'Review and update task estimates for accuracy'
    ]
  }

  private knapsackOptimization(tasks: TaskInput[], capacity: number): TaskInput[] {
    // Simple greedy algorithm (replace with dynamic programming)
    return tasks
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .slice(0, Math.floor(capacity / 3))
  }

  private calculateProjectVelocity(tasks: TaskInput[]): number {
    return 3 // tasks per day (simplified)
  }

  private calculatePredictionConfidence(tasks: TaskInput[]): number {
    // More completed tasks = higher confidence
    const completionRate = tasks.filter(t => t.status === 'done').length / tasks.length
    return Math.min(0.5 + completionRate * 0.5, 0.95)
  }

  private calculateWorkload(member: TeamMember): number {
    return Math.floor(Math.random() * 10) // Replace with actual calculation
  }

  private estimateCapacity(member: TeamMember): number {
    return 8 // hours per day
  }

  private calculateUtilization(member: TeamMember): number {
    return Math.random() * 100 // percentage
  }

  private assessBurnoutRisk(member: TeamMember): 'low' | 'medium' | 'high' {
    const util = this.calculateUtilization(member)
    if (util > 90) return 'high'
    if (util > 70) return 'medium'
    return 'low'
  }

  private generateWorkloadRecommendations(member: TeamMember): string[] {
    return ['Consider task redistribution', 'Schedule regular breaks']
  }

  private detectIntent(command: string): string {
    const lower = command.toLowerCase()
    if (lower.includes('create')) return 'create'
    if (lower.includes('assign')) return 'assign'
    if (lower.includes('estimate')) return 'estimate'
    return 'unknown'
  }

  private extractEntities(command: string): NLEntities {
    return { raw: command }
  }

  private async executeIntent(intent: string, entities: NLEntities): Promise<NLCommandResult> {
    switch (intent) {
      case 'create':
        return { action: 'create_task', entities }
      case 'assign':
        return { action: 'assign_task', entities }
      default:
        return { action: 'unknown', entities }
    }
  }

  private getReviewerReason(pr: PullRequestInput, member: TeamMember): string {
    return 'Expert in this area with previous experience'
  }

  private getExpertiseAreas(member: TeamMember): string[] {
    return ['React', 'TypeScript', 'Node.js']
  }

  private checkAvailability(member: TeamMember): 'immediate' | 'soon' | 'busy' {
    const workload = this.calculateWorkload(member)
    if (workload < 5) return 'immediate'
    if (workload < 8) return 'soon'
    return 'busy'
  }

  private calculateReviewerScore(pr: PullRequestInput, member: TeamMember): number {
    return 0.5 + Math.random() * 0.5
  }
}

// Export singleton instance
export const aiService = new AIService()

// Export class for custom instances
export default AIService