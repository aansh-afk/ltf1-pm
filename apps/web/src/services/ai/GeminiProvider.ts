// Gemini AI Provider for LTF1
// Smart routing between Gemini 2.5 Flash and Flash Lite based on task complexity

import { GoogleGenerativeAI, GenerativeModel, SafetySetting, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

export interface GeminiConfig {
  apiKey: string
  defaultModel?: 'gemini-2.5-flash' | 'gemini-2.5-flash-lite'
  maxRetries?: number
  timeout?: number
}

export interface GeminiRequest {
  prompt: string
  model?: 'gemini-2.5-flash' | 'gemini-2.5-flash-lite' | 'auto'
  temperature?: number
  maxTokens?: number
  topP?: number
  topK?: number
  systemPrompt?: string
  jsonMode?: boolean
}

export interface GeminiResponse<T = any> {
  success: boolean
  data?: T
  model: string
  tokens: {
    input: number
    output: number
    total: number
  }
  cost: number
  latency: number
  cached?: boolean
}

export interface TaskComplexity {
  score: number // 0-1
  reasoning: string
  recommendedModel: 'gemini-2.5-flash' | 'gemini-2.5-flash-lite'
  estimatedTokens: number
}

// Cost per 1M tokens (example rates - adjust based on actual pricing)
const PRICING = {
  'gemini-2.5-flash': {
    input: 0.35,  // $0.35 per 1M input tokens
    output: 1.05  // $1.05 per 1M output tokens
  },
  'gemini-2.5-flash-lite': {
    input: 0.10,  // $0.10 per 1M input tokens
    output: 0.30  // $0.30 per 1M output tokens
  }
}

// Token limits
const MODEL_LIMITS = {
  'gemini-2.5-flash': {
    maxInput: 128000,
    maxOutput: 8192,
    rateLimit: 100 // requests per minute
  },
  'gemini-2.5-flash-lite': {
    maxInput: 32000,
    maxOutput: 4096,
    rateLimit: 200 // requests per minute
  }
}

export class GeminiProvider {
  private genAI: GoogleGenerativeAI
  private models: Map<string, GenerativeModel> = new Map()
  private requestCache: Map<string, any> = new Map()
  private requestCounts: Map<string, number[]> = new Map()
  private config: GeminiConfig

  constructor(config: GeminiConfig) {
    this.config = config
    this.genAI = new GoogleGenerativeAI(config.apiKey)
    this.initializeModels()
  }

  private initializeModels() {
    // Initialize Gemini 2.5 Flash
    const flashModel = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      safetySettings: this.getSafetySettings()
    })
    this.models.set('gemini-2.5-flash', flashModel)

    // Initialize Gemini 2.5 Flash Lite
    const flashLiteModel = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
      safetySettings: this.getSafetySettings()
    })
    this.models.set('gemini-2.5-flash-lite', flashLiteModel)
  }

  private getSafetySettings(): SafetySetting[] {
    return [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ]
  }

  // ============================================
  // SMART ROUTING LOGIC
  // ============================================

  async analyzeComplexity(prompt: string): Promise<TaskComplexity> {
    const factors = {
      length: prompt.length,
      hasCode: /```[\s\S]*```/.test(prompt),
      hasStructuredData: /\{[\s\S]*\}|\[[\s\S]*\]/.test(prompt),
      requiresReasoning: /analyze|explain|compare|evaluate|design/i.test(prompt),
      requiresCreativity: /create|generate|write|compose|design/i.test(prompt),
      requiresPrecision: /calculate|exact|specific|detailed|comprehensive/i.test(prompt),
      isSimpleQuery: /what is|how to|define|list|name/i.test(prompt),
      tokenEstimate: Math.ceil(prompt.length / 4) // Rough estimate
    }

    let score = 0
    let reasoning = []

    // Calculate complexity score
    if (factors.length > 2000) {
      score += 0.3
      reasoning.push('Long input text')
    }
    if (factors.hasCode) {
      score += 0.2
      reasoning.push('Contains code')
    }
    if (factors.hasStructuredData) {
      score += 0.15
      reasoning.push('Has structured data')
    }
    if (factors.requiresReasoning) {
      score += 0.25
      reasoning.push('Requires complex reasoning')
    }
    if (factors.requiresCreativity) {
      score += 0.2
      reasoning.push('Requires creativity')
    }
    if (factors.requiresPrecision) {
      score += 0.15
      reasoning.push('Needs high precision')
    }
    if (factors.isSimpleQuery) {
      score -= 0.3
      reasoning.push('Simple query')
    }

    // Ensure score is between 0 and 1
    score = Math.max(0, Math.min(1, score))

    // Determine recommended model
    const recommendedModel = score > 0.4 ? 'gemini-2.5-flash' : 'gemini-2.5-flash-lite'

    return {
      score,
      reasoning: reasoning.join(', ') || 'Standard complexity',
      recommendedModel,
      estimatedTokens: factors.tokenEstimate
    }
  }

  async smartRoute(request: GeminiRequest): Promise<GeminiResponse> {
    let selectedModel: 'gemini-2.5-flash' | 'gemini-2.5-flash-lite'

    if (request.model === 'auto' || !request.model) {
      // Analyze complexity and auto-select model
      const complexity = await this.analyzeComplexity(request.prompt)
      selectedModel = complexity.recommendedModel
      
      console.log(`[AI Router] Complexity: ${complexity.score.toFixed(2)} | Model: ${selectedModel} | Reason: ${complexity.reasoning}`)
    } else {
      selectedModel = request.model === 'gemini-2.5-flash' ? 'gemini-2.5-flash' : 'gemini-2.5-flash-lite'
    }

    // Check rate limits
    if (!this.checkRateLimit(selectedModel)) {
      // Fallback to other model if rate limited
      selectedModel = selectedModel === 'gemini-2.5-flash' ? 'gemini-2.5-flash-lite' : 'gemini-2.5-flash'
      console.log(`[AI Router] Rate limited, falling back to ${selectedModel}`)
    }

    return this.executeRequest(request, selectedModel)
  }

  // ============================================
  // SPECIALIZED TASK HANDLERS
  // ============================================

  async quickSuggestion(prompt: string): Promise<GeminiResponse<string>> {
    // Use Flash Lite for quick suggestions
    return this.executeRequest({
      prompt,
      model: 'gemini-2.5-flash-lite',
      temperature: 0.5,
      maxTokens: 500
    }, 'gemini-2.5-flash-lite')
  }

  async complexAnalysis(prompt: string, systemPrompt?: string): Promise<GeminiResponse<any>> {
    // Use Flash for complex analysis
    return this.executeRequest({
      prompt,
      systemPrompt,
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      maxTokens: 4000,
      jsonMode: true
    }, 'gemini-2.5-flash')
  }

  async batchProcess<T>(items: string[], processor: (item: string) => string): Promise<GeminiResponse<T[]>> {
    // Use Flash Lite for batch processing simple items
    const results: T[] = []
    const startTime = Date.now()
    let totalTokens = { input: 0, output: 0, total: 0 }
    let totalCost = 0

    for (const item of items) {
      const prompt = processor(item)
      const response = await this.executeRequest({
        prompt,
        model: 'gemini-2.5-flash-lite',
        temperature: 0.3,
        maxTokens: 200
      }, 'gemini-2.5-flash-lite')

      if (response.success && response.data) {
        results.push(response.data)
        totalTokens.input += response.tokens.input
        totalTokens.output += response.tokens.output
        totalTokens.total += response.tokens.total
        totalCost += response.cost
      }
    }

    return {
      success: true,
      data: results,
      model: 'gemini-2.5-flash-lite',
      tokens: totalTokens,
      cost: totalCost,
      latency: Date.now() - startTime
    }
  }

  // ============================================
  // TASK-SPECIFIC OPTIMIZED METHODS
  // ============================================

  async generateTaskTitle(description: string): Promise<GeminiResponse<string>> {
    // Flash Lite is perfect for this
    const prompt = `Generate a concise task title (max 10 words) for: "${description}". Return only the title, no explanation.`
    return this.quickSuggestion(prompt)
  }

  async estimateStoryPoints(taskDescription: string): Promise<GeminiResponse<number>> {
    // Flash Lite can handle this
    const prompt = `Estimate story points (1,2,3,5,8,13) for this task: "${taskDescription}". Consider complexity, effort, and risk. Return only the number.`
    const response = await this.quickSuggestion(prompt)
    if (response.success && response.data) {
      response.data = parseInt(response.data) || 3
    }
    return response as GeminiResponse<number>
  }

  async analyzeSprint(sprintData: any): Promise<GeminiResponse<any>> {
    // Flash for complex analysis
    const prompt = `Analyze this sprint data and provide insights:
${JSON.stringify(sprintData, null, 2)}

Return a JSON object with:
- velocity: number
- predictedCompletion: date string
- risks: array of {type, severity, mitigation}
- recommendations: array of strings
- confidence: number (0-1)`

    return this.complexAnalysis(prompt)
  }

  async suggestCodeReviewer(prContext: any): Promise<GeminiResponse<string[]>> {
    // Flash Lite for quick matching
    const prompt = `Based on this PR context, suggest 3 reviewers from the team:
PR: ${prContext.title}
Files: ${prContext.files.join(', ')}
Team: ${prContext.team.map((m: any) => `${m.name}(${m.expertise})`).join(', ')}

Return only names as comma-separated list.`

    const response = await this.quickSuggestion(prompt)
    if (response.success && response.data) {
      response.data = response.data.split(',').map((s: string) => s.trim())
    }
    return response as GeminiResponse<string[]>
  }

  async generateDocumentation(code: string): Promise<GeminiResponse<string>> {
    // Flash for quality documentation
    const prompt = `Generate comprehensive documentation for this code:
\`\`\`typescript
${code}
\`\`\`

Include: description, parameters, return value, examples, and edge cases.`

    return this.complexAnalysis(prompt)
  }

  // ============================================
  // CORE EXECUTION
  // ============================================

  private async executeRequest(
    request: GeminiRequest,
    modelName: 'gemini-2.5-flash' | 'gemini-2.5-flash-lite'
  ): Promise<GeminiResponse> {
    const startTime = Date.now()
    
    // Check cache
    const cacheKey = this.getCacheKey(request)
    if (this.requestCache.has(cacheKey)) {
      const cached = this.requestCache.get(cacheKey)
      return {
        ...cached,
        cached: true,
        latency: 0
      }
    }

    try {
      const model = this.models.get(modelName)
      if (!model) {
        throw new Error(`Model ${modelName} not initialized`)
      }

      // Build prompt with system prompt if provided
      let fullPrompt = request.prompt
      if (request.systemPrompt) {
        fullPrompt = `System: ${request.systemPrompt}\n\nUser: ${request.prompt}`
      }
      if (request.jsonMode) {
        fullPrompt += '\n\nReturn response as valid JSON only, no markdown or explanation.'
      }

      // Generate content
      const result = await model.generateContent(fullPrompt)
      const response = result.response
      const text = response.text()

      // Parse JSON if needed
      let data: any = text
      if (request.jsonMode) {
        try {
          // Extract JSON from potential markdown code blocks
          const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/```\n?([\s\S]*?)\n?```/)
          const jsonText = jsonMatch ? jsonMatch[1] : text
          data = JSON.parse(jsonText)
        } catch (e) {
          // Try direct parse
          try {
            data = JSON.parse(text)
          } catch (e2) {
            console.warn('[AI] Failed to parse JSON response:', text)
            data = text
          }
        }
      }

      // Calculate tokens (approximate)
      const tokens = {
        input: Math.ceil(fullPrompt.length / 4),
        output: Math.ceil(text.length / 4),
        total: 0
      }
      tokens.total = tokens.input + tokens.output

      // Calculate cost
      const cost = this.calculateCost(tokens, modelName)

      // Update rate limit tracking
      this.updateRateLimit(modelName)

      const response: GeminiResponse = {
        success: true,
        data,
        model: modelName,
        tokens,
        cost,
        latency: Date.now() - startTime
      }

      // Cache successful responses
      this.requestCache.set(cacheKey, response)
      
      // Clean cache if too large
      if (this.requestCache.size > 100) {
        const firstKey = this.requestCache.keys().next().value
        this.requestCache.delete(firstKey)
      }

      return response

    } catch (error: any) {
      console.error(`[AI] Error with ${modelName}:`, error)
      
      // Try fallback model
      if (modelName === 'gemini-2.5-flash' && request.model === 'auto') {
        console.log('[AI] Falling back to Flash Lite')
        return this.executeRequest(request, 'gemini-2.5-flash-lite')
      }

      return {
        success: false,
        data: null,
        model: modelName,
        tokens: { input: 0, output: 0, total: 0 },
        cost: 0,
        latency: Date.now() - startTime
      }
    }
  }

  private calculateCost(tokens: { input: number; output: number }, model: string): number {
    const pricing = PRICING[model as keyof typeof PRICING]
    if (!pricing) return 0

    const inputCost = (tokens.input / 1_000_000) * pricing.input
    const outputCost = (tokens.output / 1_000_000) * pricing.output
    
    return Number((inputCost + outputCost).toFixed(6))
  }

  private checkRateLimit(model: string): boolean {
    const limit = MODEL_LIMITS[model as keyof typeof MODEL_LIMITS]?.rateLimit || 100
    const now = Date.now()
    const oneMinuteAgo = now - 60000

    // Get recent requests
    const recentRequests = this.requestCounts.get(model) || []
    const validRequests = recentRequests.filter(time => time > oneMinuteAgo)

    return validRequests.length < limit
  }

  private updateRateLimit(model: string) {
    const now = Date.now()
    const requests = this.requestCounts.get(model) || []
    requests.push(now)
    
    // Keep only last minute of requests
    const oneMinuteAgo = now - 60000
    const validRequests = requests.filter(time => time > oneMinuteAgo)
    
    this.requestCounts.set(model, validRequests)
  }

  private getCacheKey(request: GeminiRequest): string {
    return `${request.model}:${request.prompt.slice(0, 100)}:${request.temperature}`
  }

  // ============================================
  // USAGE ANALYTICS
  // ============================================

  getUsageStats(): {
    totalRequests: number
    totalCost: number
    modelUsage: Record<string, number>
    cacheHitRate: number
  } {
    let totalRequests = 0
    let totalCost = 0
    const modelUsage: Record<string, number> = {}

    // This would connect to actual usage tracking
    return {
      totalRequests,
      totalCost,
      modelUsage,
      cacheHitRate: this.requestCache.size > 0 ? 0.3 : 0 // Example
    }
  }
}

// Export singleton instance with smart defaults
export const gemini = new GeminiProvider({
  apiKey: process.env.VITE_GEMINI_API_KEY || '',
  defaultModel: 'gemini-2.5-flash-lite' // Start with lite for cost savings
})