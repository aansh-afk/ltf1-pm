import { ConvexReactClient } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'

// Import existing enums and prompts from geminiService
import {
  TaskComplexity,
  SYSTEM_PROMPTS
} from './geminiService'

// Credit costs for different operations
export const CREDIT_COSTS = {
  simple: 1,      // Simple operations like title generation
  moderate: 2,    // Moderate operations like story points
  complex: 5,     // Complex operations like code generation
  analysis: 10,   // Deep analysis operations
}

// Function category mapping for the backend resolver
const COMPLEXITY_TO_CATEGORY: Record<string, string> = {
  task_title: 'task_generation',
  story_points: 'task_generation',
  subtasks: 'task_generation',
  assignee_suggestion: 'task_generation',
  code_review: 'code_review',
  test_generation: 'code_review',
  meeting_agenda: 'standup_summary',
  meeting_summary: 'standup_summary',
}

// Enhanced AI service - thin wrapper over Convex backend action
export class EnhancedGeminiService {
  private convexClient: ConvexReactClient
  private projectId: string | undefined

  constructor(convexClient: ConvexReactClient, projectId?: string) {
    this.convexClient = convexClient
    this.projectId = projectId
  }

  setProjectId(projectId: string | undefined) {
    this.projectId = projectId
  }

  // Generic method to make AI requests via backend
  async generateContent(
    prompt: string,
    requestType: string,
    _complexity: TaskComplexity = TaskComplexity.MODERATE
  ): Promise<string> {
    const functionCategory = COMPLEXITY_TO_CATEGORY[requestType] || 'default'

    const result = await (this.convexClient as any).action(
      api.ai.generate.generate,
      {
        prompt,
        projectId: this.projectId,
        functionCategory,
      }
    )

    return result.text
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
}

// Singleton instance
let serviceInstance: EnhancedGeminiService | null = null

export const getEnhancedGeminiService = (convexClient: ConvexReactClient, projectId?: string): EnhancedGeminiService => {
  if (!serviceInstance) {
    serviceInstance = new EnhancedGeminiService(convexClient, projectId)
  }
  if (projectId) {
    serviceInstance.setProjectId(projectId)
  }
  return serviceInstance
}
