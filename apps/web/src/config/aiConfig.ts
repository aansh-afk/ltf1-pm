// AI Configuration for LTF1
// Smart routing configuration for Gemini 2.5 Flash and Flash Lite

export interface AITaskConfig {
  taskType: string
  model: 'gemini-2.0-flash-exp' | 'gemini-1.5-flash-8b' | 'auto'
  temperature: number
  maxTokens: number
  cacheEnabled: boolean
  priority: 'realtime' | 'fast' | 'batch'
  costTier: 'economy' | 'balanced' | 'performance'
}

// ============================================
// SMART TASK ROUTING CONFIGURATION
// ============================================

export const AI_TASK_ROUTING: Record<string, AITaskConfig> = {
  // ========== ULTRA-LIGHT TASKS (Flash Lite) ==========
  // These are simple, fast tasks that don't need complex reasoning
  
  'task.title.generate': {
    taskType: 'Generate task title from description',
    model: 'gemini-1.5-flash-8b',
    temperature: 0.3,
    maxTokens: 50,
    cacheEnabled: true,
    priority: 'realtime',
    costTier: 'economy'
  },

  'task.priority.suggest': {
    taskType: 'Suggest task priority',
    model: 'gemini-1.5-flash-8b',
    temperature: 0.2,
    maxTokens: 20,
    cacheEnabled: true,
    priority: 'realtime',
    costTier: 'economy'
  },

  'task.label.extract': {
    taskType: 'Extract labels from description',
    model: 'gemini-1.5-flash-8b',
    temperature: 0.1,
    maxTokens: 100,
    cacheEnabled: true,
    priority: 'fast',
    costTier: 'economy'
  },

  'task.points.estimate': {
    taskType: 'Estimate story points',
    model: 'gemini-1.5-flash-8b',
    temperature: 0.4,
    maxTokens: 30,
    cacheEnabled: true,
    priority: 'fast',
    costTier: 'economy'
  },

  'user.availability.check': {
    taskType: 'Check user availability',
    model: 'gemini-1.5-flash-8b',
    temperature: 0.1,
    maxTokens: 50,
    cacheEnabled: true,
    priority: 'realtime',
    costTier: 'economy'
  },

  'commit.message.generate': {
    taskType: 'Generate commit message',
    model: 'gemini-1.5-flash-8b',
    temperature: 0.5,
    maxTokens: 100,
    cacheEnabled: false,
    priority: 'fast',
    costTier: 'economy'
  },

  'search.query.parse': {
    taskType: 'Parse natural language search',
    model: 'gemini-1.5-flash-8b',
    temperature: 0.2,
    maxTokens: 100,
    cacheEnabled: true,
    priority: 'realtime',
    costTier: 'economy'
  },

  // ========== MEDIUM COMPLEXITY TASKS (Flash Lite or Flash) ==========
  // These need some reasoning but not deep analysis

  'task.description.enhance': {
    taskType: 'Enhance task description',
    model: 'auto', // Will choose based on length
    temperature: 0.6,
    maxTokens: 500,
    cacheEnabled: true,
    priority: 'fast',
    costTier: 'balanced'
  },

  'task.assignee.suggest': {
    taskType: 'Suggest task assignee',
    model: 'auto',
    temperature: 0.4,
    maxTokens: 200,
    cacheEnabled: true,
    priority: 'fast',
    costTier: 'balanced'
  },

  'pr.title.generate': {
    taskType: 'Generate PR title and description',
    model: 'auto',
    temperature: 0.5,
    maxTokens: 300,
    cacheEnabled: false,
    priority: 'fast',
    costTier: 'balanced'
  },

  'meeting.agenda.suggest': {
    taskType: 'Suggest meeting agenda',
    model: 'auto',
    temperature: 0.6,
    maxTokens: 400,
    cacheEnabled: true,
    priority: 'fast',
    costTier: 'balanced'
  },

  // ========== COMPLEX TASKS (Flash) ==========
  // These require deep reasoning, analysis, or creativity

  'sprint.analysis.complete': {
    taskType: 'Complete sprint analysis',
    model: 'gemini-2.0-flash-exp',
    temperature: 0.7,
    maxTokens: 2000,
    cacheEnabled: false,
    priority: 'batch',
    costTier: 'performance'
  },

  'code.review.comprehensive': {
    taskType: 'Comprehensive code review',
    model: 'gemini-2.0-flash-exp',
    temperature: 0.6,
    maxTokens: 3000,
    cacheEnabled: false,
    priority: 'batch',
    costTier: 'performance'
  },

  'documentation.generate': {
    taskType: 'Generate comprehensive documentation',
    model: 'gemini-2.0-flash-exp',
    temperature: 0.5,
    maxTokens: 4000,
    cacheEnabled: true,
    priority: 'batch',
    costTier: 'performance'
  },

  'architecture.design': {
    taskType: 'Design system architecture',
    model: 'gemini-2.0-flash-exp',
    temperature: 0.8,
    maxTokens: 5000,
    cacheEnabled: false,
    priority: 'batch',
    costTier: 'performance'
  },

  'project.risk.analysis': {
    taskType: 'Project risk analysis',
    model: 'gemini-2.0-flash-exp',
    temperature: 0.6,
    maxTokens: 2500,
    cacheEnabled: false,
    priority: 'batch',
    costTier: 'performance'
  },

  'team.performance.analysis': {
    taskType: 'Team performance analysis',
    model: 'gemini-2.0-flash-exp',
    temperature: 0.5,
    maxTokens: 3000,
    cacheEnabled: false,
    priority: 'batch',
    costTier: 'performance'
  },

  'test.cases.generate': {
    taskType: 'Generate comprehensive test cases',
    model: 'gemini-2.0-flash-exp',
    temperature: 0.4,
    maxTokens: 4000,
    cacheEnabled: true,
    priority: 'batch',
    costTier: 'performance'
  },

  'meeting.transcript.analyze': {
    taskType: 'Analyze meeting transcript',
    model: 'gemini-2.0-flash-exp',
    temperature: 0.5,
    maxTokens: 3000,
    cacheEnabled: false,
    priority: 'batch',
    costTier: 'performance'
  }
}

// ============================================
// COST OPTIMIZATION STRATEGIES
// ============================================

export const COST_OPTIMIZATION = {
  // Batch processing windows for non-urgent tasks
  batchWindows: [
    { start: '02:00', end: '06:00', discount: 0.2 }, // 20% discount
    { start: '22:00', end: '02:00', discount: 0.1 }  // 10% discount
  ],

  // Cache TTL based on task type (in seconds)
  cacheTTL: {
    'task.title.generate': 3600,      // 1 hour
    'task.priority.suggest': 7200,    // 2 hours
    'task.label.extract': 7200,       // 2 hours
    'documentation.generate': 86400,   // 24 hours
    'default': 1800                   // 30 minutes
  },

  // Request deduplication window (in ms)
  deduplicationWindow: 5000,

  // Fallback strategies when primary model fails
  fallbackStrategies: {
    'gemini-2.0-flash-exp': 'gemini-1.5-flash-8b',
    'gemini-1.5-flash-8b': 'cached-response'
  },

  // Maximum retries per model
  maxRetries: {
    'gemini-2.0-flash-exp': 2,
    'gemini-1.5-flash-8b': 3
  }
}

// ============================================
// INTELLIGENT BATCHING CONFIGURATION
// ============================================

export const BATCH_CONFIG = {
  // Batch similar requests together
  batchableTaskTypes: [
    'task.title.generate',
    'task.priority.suggest',
    'task.points.estimate',
    'commit.message.generate'
  ],

  // Batch size limits
  maxBatchSize: {
    'gemini-2.0-flash-exp': 10,
    'gemini-1.5-flash-8b': 25
  },

  // Wait time before processing batch (ms)
  batchWaitTime: {
    'realtime': 100,
    'fast': 500,
    'batch': 2000
  }
}

// ============================================
// PROMPT TEMPLATES
// ============================================

export const PROMPT_TEMPLATES = {
  // System prompts for consistency
  systemPrompts: {
    'task': 'You are an expert project manager assistant. Be concise and practical.',
    'code': 'You are an expert software engineer. Focus on best practices and clean code.',
    'analysis': 'You are a data analyst. Provide insights backed by evidence.',
    'creative': 'You are a creative assistant. Generate innovative and practical solutions.'
  },

  // Output format instructions
  outputFormats: {
    'json': 'Return response as valid JSON only, no markdown or explanation.',
    'list': 'Return as a simple comma-separated list.',
    'markdown': 'Format response as clean markdown.',
    'plain': 'Return plain text without formatting.'
  }
}

// ============================================
// USAGE LIMITS AND QUOTAS
// ============================================

export const USAGE_LIMITS = {
  // Per user per day
  daily: {
    'gemini-2.0-flash-exp': {
      requests: 100,
      tokens: 500000
    },
    'gemini-1.5-flash-8b': {
      requests: 1000,
      tokens: 2000000
    }
  },

  // Per workspace per month
  monthly: {
    'gemini-2.0-flash-exp': {
      requests: 5000,
      tokens: 25000000,
      cost: 50 // USD
    },
    'gemini-1.5-flash-8b': {
      requests: 50000,
      tokens: 100000000,
      cost: 20 // USD
    }
  },

  // Rate limiting
  rateLimit: {
    'gemini-2.0-flash-exp': {
      requestsPerMinute: 60,
      tokensPerMinute: 100000
    },
    'gemini-1.5-flash-8b': {
      requestsPerMinute: 200,
      tokensPerMinute: 50000
    }
  }
}

// ============================================
// MONITORING AND ANALYTICS
// ============================================

export const MONITORING_CONFIG = {
  // Metrics to track
  metrics: [
    'request_count',
    'token_usage',
    'cost_per_user',
    'response_time',
    'error_rate',
    'cache_hit_rate',
    'model_distribution'
  ],

  // Alert thresholds
  alerts: {
    costPerDay: 10,         // Alert if daily cost exceeds $10
    errorRate: 0.05,        // Alert if error rate > 5%
    responseTime: 3000,     // Alert if response time > 3s
    tokenUsage: 0.8         // Alert at 80% of quota
  },

  // Logging configuration
  logging: {
    level: 'info',
    includePrompts: false,  // Don't log full prompts for privacy
    includeResponses: false,
    logErrors: true,
    logCosts: true
  }
}

// ============================================
// FEATURE FLAGS
// ============================================

export const AI_FEATURES = {
  // Enable/disable features
  enabled: {
    taskSuggestions: true,
    sprintAnalysis: true,
    codeReview: true,
    documentation: true,
    meetingTranscription: false, // Requires additional setup
    voiceCommands: false,        // Requires additional setup
    realtimeCollaboration: true,
    predictiveAnalytics: true
  },

  // Experimental features (opt-in)
  experimental: {
    autoTaskCreation: false,
    autoCodeGeneration: false,
    sentimentAnalysis: false,
    anomalyDetection: false
  },

  // User preferences
  userPreferences: {
    aiSuggestionsDefault: true,
    autoCompleteDefault: true,
    smartNotifications: true,
    batchProcessing: true
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getTaskConfig(taskType: string): AITaskConfig {
  return AI_TASK_ROUTING[taskType] || {
    taskType: 'Unknown task',
    model: 'auto',
    temperature: 0.5,
    maxTokens: 1000,
    cacheEnabled: true,
    priority: 'fast',
    costTier: 'balanced'
  }
}

export function shouldBatchRequest(taskType: string): boolean {
  return BATCH_CONFIG.batchableTaskTypes.includes(taskType)
}

export function getCacheTTL(taskType: string): number {
  return COST_OPTIMIZATION.cacheTTL[taskType] || COST_OPTIMIZATION.cacheTTL.default
}

export function isWithinQuota(model: string, usage: { requests: number; tokens: number }): boolean {
  const limits = USAGE_LIMITS.daily[model as keyof typeof USAGE_LIMITS.daily]
  if (!limits) return false
  
  return usage.requests < limits.requests && usage.tokens < limits.tokens
}

export function calculateEstimatedCost(tokens: number, model: string): number {
  // Rough cost estimation
  const rates = {
    'gemini-2.0-flash-exp': 0.0014,      // $1.40 per 1M tokens average
    'gemini-1.5-flash-8b': 0.0004  // $0.40 per 1M tokens average
  }
  
  const rate = rates[model as keyof typeof rates] || 0.001
  return (tokens / 1_000_000) * rate
}