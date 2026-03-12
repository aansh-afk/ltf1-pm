import { ProjectActivity, TaskSuggestion, SprintRecommendation } from '@/types/ai'

interface OpenRouterConfig {
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
}

interface OpenRouterResponse {
  id: string
  choices: Array<{
    message: {
      content: string
      role: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

class OpenRouterService {
  private config: OpenRouterConfig
  private baseUrl = 'https://openrouter.ai/api/v1'

  constructor() {
    this.config = {
      apiKey: import.meta.env.VITE_OPENROUTER_API_KEY || '',
      model: 'nvidia/llama-3.1-nemotron-70b-instruct', // GPT-OSS-120B identifier on OpenRouter
      temperature: 0.3, // Lower for more consistent outputs
      maxTokens: 2000
    }
  }

  private async makeRequest(messages: Array<{ role: string; content: string }>): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('OpenRouter API key not configured')
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://ltf1.dev', // Required by OpenRouter
          'X-Title': 'LTF1 Project Management' // Optional but recommended
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
          stream: false
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`OpenRouter API error: ${error.message || response.statusText}`)
      }

      const data: OpenRouterResponse = await response.json()
      return data.choices[0]?.message?.content || ''
    } catch (error) {
      console.error('OpenRouter request failed:', error)
      throw error
    }
  }

  // Convert Git commits to task suggestions
  async generateTasksFromCommits(commits: string[]): Promise<TaskSuggestion[]> {
    const prompt = `Convert these Git commits into actionable tasks. For each commit, extract:
1. A clear task title
2. A description of what was done
3. Estimated story points (1-8 based on complexity)
4. Task type (feature/bug/refactor/docs/test)

Commits:
${commits.join('\n')}

Return as JSON array with structure:
[{
  "title": "string",
  "description": "string",
  "storyPoints": number,
  "type": "feature|bug|refactor|docs|test",
  "fromCommit": "original commit message"
}]`

    try {
      const response = await this.makeRequest([
        { role: 'system', content: 'You are a Git-savvy project management assistant. Convert commits to tasks efficiently.' },
        { role: 'user', content: prompt }
      ])

      const tasks = JSON.parse(response)
      return tasks.map((task: any) => ({
        ...task,
        confidence: 0.85, // GPT-OSS-120B has good accuracy
        source: 'git',
        metadata: {
          model: 'gpt-oss-120b',
          timestamp: new Date().toISOString()
        }
      }))
    } catch (error) {
      console.error('Failed to generate tasks from commits:', error)
      return []
    }
  }

  // Generate PR descriptions from diff
  async generatePRDescription(diff: string, commits: string[]): Promise<string> {
    const prompt = `Based on this Git diff and commit messages, generate a concise PR description.

Commits:
${commits.slice(0, 10).join('\n')}

Diff summary (first 5000 chars):
${diff.substring(0, 5000)}

Generate a PR description with:
1. Summary (1-2 sentences)
2. Changes (bullet points)
3. Testing notes
4. Breaking changes (if any)`

    try {
      const response = await this.makeRequest([
        { role: 'system', content: 'You are a senior developer writing clear PR descriptions.' },
        { role: 'user', content: prompt }
      ])

      return response
    } catch (error) {
      console.error('Failed to generate PR description:', error)
      return 'Failed to generate description'
    }
  }

  // Estimate story points from task description
  async estimateStoryPoints(title: string, description: string): Promise<number> {
    const prompt = `Estimate story points for this task:

Title: ${title}
Description: ${description}

Use Fibonacci scale (1, 2, 3, 5, 8) where:
- 1 = trivial change, < 1 hour
- 2 = simple task, 1-2 hours  
- 3 = moderate task, 2-4 hours
- 5 = complex task, 4-8 hours
- 8 = very complex, > 1 day

Return only the number.`

    try {
      const response = await this.makeRequest([
        { role: 'system', content: 'You are an experienced developer estimating task complexity.' },
        { role: 'user', content: prompt }
      ])

      const points = parseInt(response.trim())
      return isNaN(points) ? 3 : Math.min(8, Math.max(1, points))
    } catch (error) {
      console.error('Failed to estimate story points:', error)
      return 3 // Default to medium complexity
    }
  }

  // Analyze team velocity from historical data
  async analyzeVelocity(activities: ProjectActivity[]): Promise<SprintRecommendation> {
    const recentActivities = activities.slice(-100) // Last 100 activities
    
    const prompt = `Analyze this team's activity and provide velocity insights:

Recent activities:
${JSON.stringify(recentActivities.slice(0, 20), null, 2)}

Provide:
1. Average velocity (story points per sprint)
2. Trend (increasing/stable/decreasing)
3. Recommendations for next sprint
4. Risk factors

Return as JSON.`

    try {
      const response = await this.makeRequest([
        { role: 'system', content: 'You are an agile coach analyzing team performance.' },
        { role: 'user', content: prompt }
      ])

      return JSON.parse(response)
    } catch (error) {
      console.error('Failed to analyze velocity:', error)
      return {
        velocity: 20,
        trend: 'stable',
        recommendations: ['Maintain current pace'],
        risks: []
      }
    }
  }

  // Generate release notes from completed tasks
  async generateReleaseNotes(tasks: TaskSuggestion[], version: string): Promise<string> {
    const prompt = `Generate release notes for version ${version} from these completed tasks:

${JSON.stringify(tasks, null, 2)}

Format:
# Release ${version}

## Features
- ...

## Bug Fixes
- ...

## Improvements
- ...

Keep it concise and user-focused.`

    try {
      const response = await this.makeRequest([
        { role: 'system', content: 'You are a technical writer creating release notes.' },
        { role: 'user', content: prompt }
      ])

      return response
    } catch (error) {
      console.error('Failed to generate release notes:', error)
      return `# Release ${version}\n\nRelease notes generation failed.`
    }
  }

  // Get remaining API credits (OpenRouter specific)
  async getRemainingCredits(): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/key`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.credits || 0
      }
    } catch (error) {
      console.error('Failed to get API credits:', error)
    }
    return 0
  }
}

export const openRouterService = new OpenRouterService()