// AI-related type definitions for LTF1

export interface TaskSuggestion {
  title: string
  description: string
  storyPoints: number
  type: 'feature' | 'bug' | 'refactor' | 'docs' | 'test'
  fromCommit?: string
  confidence: number
  source: 'git' | 'manual' | 'ai'
  metadata?: {
    model: string
    timestamp: string
    [key: string]: any
  }
}

export interface ProjectActivity {
  id: string
  type: 'commit' | 'pr' | 'issue' | 'comment' | 'review'
  timestamp: string
  author: string
  description: string
  storyPoints?: number
  status?: 'completed' | 'in-progress' | 'pending'
  metadata?: Record<string, any>
}

export interface SprintRecommendation {
  velocity: number
  trend: 'increasing' | 'stable' | 'decreasing'
  recommendations: string[]
  risks: string[]
  suggestedCapacity?: number
  confidenceScore?: number
}

export interface ReleaseNotes {
  version: string
  date: string
  features: string[]
  bugFixes: string[]
  improvements: string[]
  breakingChanges?: string[]
}

export interface AIUsageMetrics {
  totalCredits: number
  usedCredits: number
  remainingCredits: number
  resetDate: string
  operations: {
    taskGeneration: number
    storyPointEstimation: number
    prDescriptions: number
    velocityAnalysis: number
    releaseNotes: number
  }
}

export interface AIModelConfig {
  provider: 'cerebras' | 'groq'
  model: string
  temperature: number
  maxTokens: number
  apiKey?: string
  endpoint?: string
}

export interface AIResponse<T> {
  success: boolean
  data?: T
  error?: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    cost?: number
  }
  cached?: boolean
}