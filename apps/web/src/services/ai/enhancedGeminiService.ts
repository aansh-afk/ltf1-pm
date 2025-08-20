import { GoogleGenerativeAI } from '@google/generative-ai'
import { api } from '../../../../../convex/_generated/api'
import { ConvexReactClient } from 'convex/react'

// Import existing enums and prompts from geminiService
import { 
  AIModel, 
  TaskComplexity, 
  AIFeatureCategory,
  SYSTEM_PROMPTS 
} from './geminiService'

// Credit costs for different operations
export const CREDIT_COSTS = {
  simple: 1,      // Simple operations like title generation
  moderate: 2,    // Moderate operations like story points
  complex: 5,     // Complex operations like code generation
  analysis: 10,   // Deep analysis operations
}

// Enhanced Gemini service with BYOK support
export class EnhancedGeminiService {
  private genAI: GoogleGenerativeAI | null = null
  private convexClient: ConvexReactClient
  private userApiKey: string | null = null
  private platformApiKey: string | null = null
  private keyType: 'user' | 'platform' | 'free' = 'free'

  constructor(convexClient: ConvexReactClient) {
    this.convexClient = convexClient
    this.platformApiKey = import.meta.env.VITE_GEMINI_API_KEY || null
  }

  // Initialize the service with appropriate API key
  async initialize(): Promise<void> {
    try {
      // Check user's AI credits and key status
      const userCredits = await this.convexClient.query(
        api.aiCredits.queries.getUserAICredits,
        {}
      )

      if (!userCredits) {
        throw new Error('AI features not configured. Please set up in Settings.')
      }

      // Determine which key to use
      if (userCredits.hasOwnKey && userCredits.hasApiKey) {
        // User has their own API key (BYOK)
        this.keyType = 'user'
        // In a real implementation, you'd decrypt the key from the backend
        // For now, we'll need to get it from settings
        const apiKey = await this.getUserApiKey()
        if (apiKey) {
          this.genAI = new GoogleGenerativeAI(apiKey)
          this.userApiKey = apiKey
        }
      } else if (userCredits.subscriptionTier === 'pro' || userCredits.subscriptionTier === 'enterprise') {
        // Pro/Enterprise users use platform key
        this.keyType = 'platform'
        if (this.platformApiKey) {
          this.genAI = new GoogleGenerativeAI(this.platformApiKey)
        }
      } else {
        // Free tier users with credits
        this.keyType = 'free'
        if (this.platformApiKey) {
          this.genAI = new GoogleGenerativeAI(this.platformApiKey)
        }
      }

      if (!this.genAI) {
        throw new Error('No API key available. Please configure AI settings.')
      }
    } catch (error) {
      console.error('Failed to initialize AI service:', error)
      throw error
    }
  }

  // Get user's API key from local storage (encrypted in production)
  private async getUserApiKey(): Promise<string | null> {
    // In production, this would be retrieved securely from backend
    // For now, we'll use localStorage
    return localStorage.getItem('ltf1_user_api_key')
  }

  // Check if user can make a request
  private async canMakeRequest(estimatedCredits: number): Promise<boolean> {
    if (this.keyType === 'user') {
      // BYOK users have no limits
      return true
    }

    const result = await this.convexClient.query(
      api.aiCredits.queries.canMakeAIRequest,
      { estimatedCredits }
    )

    if (!result.canMakeRequest) {
      throw new Error(result.reason || 'Cannot make AI request')
    }

    return true
  }

  // Track usage after making a request
  private async trackUsage(
    requestType: string,
    model: string,
    promptTokens: number,
    completionTokens: number,
    creditsUsed: number,
    success: boolean,
    error?: string,
    responseTime?: number
  ): Promise<void> {
    await this.convexClient.mutation(
      api.aiCredits.mutations.trackAIUsage,
      {
        requestType,
        model,
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        creditsUsed,
        keyType: this.keyType,
        success,
        error,
        responseTime: responseTime || 0
      }
    )
  }

  // Estimate tokens (rough approximation)
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }

  // Generic method to make AI requests with credit checking
  async generateContent(
    prompt: string,
    requestType: string,
    complexity: TaskComplexity = TaskComplexity.MODERATE
  ): Promise<string> {
    if (!this.genAI) {
      await this.initialize()
      if (!this.genAI) {
        throw new Error('AI service not initialized')
      }
    }

    // Calculate credit cost
    const creditCost = 
      complexity === TaskComplexity.SIMPLE ? CREDIT_COSTS.simple :
      complexity === TaskComplexity.MODERATE ? CREDIT_COSTS.moderate :
      CREDIT_COSTS.complex

    // Check if user can make request
    await this.canMakeRequest(creditCost)

    const startTime = Date.now()
    let success = false
    let error: string | undefined

    try {
      // Select model based on complexity and key type
      const modelName = 
        this.keyType === 'user' ? 
          AIModel.FLASH : // BYOK users get best model
        complexity === TaskComplexity.SIMPLE ? 
          AIModel.FLASH_LITE :
          AIModel.FLASH

      const model = this.genAI.getGenerativeModel({ model: modelName })
      
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      success = true

      // Track usage
      const promptTokens = this.estimateTokens(prompt)
      const completionTokens = this.estimateTokens(text)
      const responseTime = Date.now() - startTime

      await this.trackUsage(
        requestType,
        modelName,
        promptTokens,
        completionTokens,
        creditCost,
        success,
        undefined,
        responseTime
      )

      return text
    } catch (err: any) {
      error = err.message
      success = false

      // Track failed usage
      await this.trackUsage(
        requestType,
        AIModel.FLASH,
        this.estimateTokens(prompt),
        0,
        0, // No credits charged for failures
        success,
        error,
        Date.now() - startTime
      )

      throw err
    }
  }

  // Task Intelligence Features
  async generateTaskTitle(description: string): Promise<string> {
    const prompt = `${SYSTEM_PROMPTS.TASK_TITLE}\n\nTask Description: ${description}`
    return this.generateContent(prompt, 'task_title', TaskComplexity.SIMPLE)
  }

  async estimateStoryPoints(
    title: string,
    description: string,
    acceptanceCriteria?: string[]
  ): Promise<number> {
    const criteriaText = acceptanceCriteria?.join('\n') || 'None specified'
    const prompt = `${SYSTEM_PROMPTS.STORY_POINTS}\n\nTask Title: ${title}\nDescription: ${description}\nAcceptance Criteria:\n${criteriaText}`
    
    const result = await this.generateContent(prompt, 'story_points', TaskComplexity.MODERATE)
    return parseInt(result.trim()) || 3
  }

  async generateSubtasks(
    parentTask: { title: string; description: string }
  ): Promise<string[]> {
    const prompt = `${SYSTEM_PROMPTS.SUBTASKS}\n\nParent Task Title: ${parentTask.title}\nDescription: ${parentTask.description}`
    
    const result = await this.generateContent(prompt, 'subtasks', TaskComplexity.MODERATE)
    return result.split('\n').filter(line => line.trim())
  }

  async suggestAssignee(
    task: { title: string; description: string; requiredSkills?: string[] },
    teamMembers: Array<{ name: string; skills: string[]; currentLoad: number }>
  ): Promise<string> {
    const teamInfo = teamMembers.map(m => 
      `${m.name}: Skills: ${m.skills.join(', ')}, Current Load: ${m.currentLoad} tasks`
    ).join('\n')
    
    const prompt = `${SYSTEM_PROMPTS.ASSIGNEE_SUGGESTION}\n\nTask: ${task.title}\nDescription: ${task.description}\nRequired Skills: ${task.requiredSkills?.join(', ') || 'Any'}\n\nTeam Members:\n${teamInfo}`
    
    return this.generateContent(prompt, 'assignee_suggestion', TaskComplexity.MODERATE)
  }

  // Code Development Features
  async generateCodeReviewChecklist(
    code: string,
    language: string,
    context?: string
  ): Promise<string[]> {
    const prompt = `${SYSTEM_PROMPTS.CODE_REVIEW_CHECKLIST}\n\nLanguage: ${language}\nContext: ${context || 'General code review'}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``
    
    const result = await this.generateContent(prompt, 'code_review', TaskComplexity.COMPLEX)
    return result.split('\n').filter(line => line.trim())
  }

  async generateTestCases(
    functionality: string,
    acceptanceCriteria: string[]
  ): Promise<string> {
    const criteriaText = acceptanceCriteria.join('\n')
    const prompt = `${SYSTEM_PROMPTS.TEST_GENERATION}\n\nFunctionality: ${functionality}\n\nAcceptance Criteria:\n${criteriaText}`
    
    return this.generateContent(prompt, 'test_generation', TaskComplexity.COMPLEX)
  }

  // Meeting Intelligence
  async generateMeetingAgenda(
    meetingType: string,
    participants: string[],
    topics?: string[]
  ): Promise<string> {
    const topicsText = topics?.join('\n- ') || 'To be determined'
    const prompt = `${SYSTEM_PROMPTS.MEETING_AGENDA}\n\nMeeting Type: ${meetingType}\nParticipants: ${participants.join(', ')}\nTopics:\n- ${topicsText}`
    
    return this.generateContent(prompt, 'meeting_agenda', TaskComplexity.MODERATE)
  }

  async summarizeMeetingNotes(notes: string): Promise<string> {
    const prompt = `${SYSTEM_PROMPTS.MEETING_SUMMARY}\n\nMeeting Notes:\n${notes}`
    return this.generateContent(prompt, 'meeting_summary', TaskComplexity.MODERATE)
  }

  // Get current credit status
  async getCreditStatus(): Promise<{
    creditsRemaining: number
    keyType: 'user' | 'platform' | 'free'
    hasOwnKey: boolean
    subscriptionTier: string
  }> {
    const userCredits = await this.convexClient.query(
      api.aiCredits.queries.getUserAICredits,
      {}
    )

    return {
      creditsRemaining: userCredits?.creditsRemaining || 0,
      keyType: this.keyType,
      hasOwnKey: userCredits?.hasOwnKey || false,
      subscriptionTier: userCredits?.subscriptionTier || 'free'
    }
  }
}

// Singleton instance
let serviceInstance: EnhancedGeminiService | null = null

export const getEnhancedGeminiService = (convexClient: ConvexReactClient): EnhancedGeminiService => {
  if (!serviceInstance) {
    serviceInstance = new EnhancedGeminiService(convexClient)
  }
  return serviceInstance
}