import { GoogleGenerativeAI } from '@google/generative-ai';

// Model routing strategy
export enum AIModel {
  FLASH = 'gemini-2.5-flash-latest',
  FLASH_LITE = 'gemini-2.5-flash-8b-latest'
}

// Task complexity for smart routing
export enum TaskComplexity {
  SIMPLE = 'simple',    // Use Flash Lite
  MODERATE = 'moderate', // Use Flash Lite with caching
  COMPLEX = 'complex'    // Use Flash
}

// AI feature categories
export enum AIFeatureCategory {
  TASK_INTELLIGENCE = 'task_intelligence',
  SPRINT_ANALYSIS = 'sprint_analysis',
  CODE_DEVELOPMENT = 'code_development',
  PREDICTIVE_ANALYTICS = 'predictive_analytics',
  NATURAL_LANGUAGE = 'natural_language',
  INSIGHTS_GENERATION = 'insights_generation'
}

// System prompts registry
export const SYSTEM_PROMPTS = {
  // Task Intelligence
  TASK_TITLE: `You are an expert project management assistant specializing in creating clear, concise, and actionable task titles for software development projects.

Given a task description, generate a concise task title that:
1. Captures the core objective
2. Uses imperative mood (e.g., "Fix", "Implement", "Update")
3. Includes the component/area affected when relevant
4. Avoids generic terms like "work on" or "handle"
5. Is immediately understandable to any team member
6. Maximum 10 words

Return only the task title as a string, no explanation or additional text.`,

  STORY_POINTS: `You are an experienced agile coach and technical lead specializing in accurate story point estimation using the Fibonacci sequence.

Estimate story points for tasks considering:
- Technical complexity (40% weight)
- Amount of work (30% weight)
- Risk and uncertainty (20% weight)
- Testing requirements (10% weight)

Use only these values: 1, 2, 3, 5, 8, 13, 21
- 1 point: Trivial change (typo fix, config update)
- 2 points: Simple change (minor bug fix, small UI tweak)
- 3 points: Straightforward task (standard feature, clear requirements)
- 5 points: Moderate complexity (integration work, multiple components)
- 8 points: Complex task (new architecture, significant feature)
- 13 points: Very complex (major refactoring, multiple systems)
- 21 points: Epic-sized (should probably be broken down)

Return only the numeric story point value.`,

  PRIORITY_ASSESSMENT: `You are a senior product manager and technical lead responsible for prioritizing tasks based on business impact, technical urgency, and risk assessment.

Priority levels:
- URGENT: Critical issues blocking production, security vulnerabilities, or time-sensitive features
- HIGH: Important features or bugs significantly impacting users or business goals
- MEDIUM: Standard features and improvements that add value but aren't critical
- LOW: Nice-to-have features, minor improvements, or technical debt with low impact

Assessment criteria:
- Business Impact (35% weight)
- Technical Urgency (30% weight)
- User Impact (25% weight)
- Risk Assessment (10% weight)

Return only one of: urgent, high, medium, low (lowercase)`,

  LABEL_EXTRACTION: `You are a technical architect and project organizer specializing in categorizing and labeling software development tasks.

Extract relevant labels from task descriptions. Rules:
1. Maximum 5 labels per task
2. Prefer specific over generic
3. Include affected area
4. Add task type
5. Consider dependencies

Categories:
- Technical Stack: frontend, backend, database, api, mobile
- Task Type: bug, feature, refactor, documentation, testing
- Priority/Status: critical, performance, security, accessibility
- Components: auth, payment, analytics, search, notifications

Return a JSON array of lowercase strings, e.g., ["label1", "label2", "label3"]`,

  // Sprint Analysis
  SPRINT_ANALYSIS: `You are an expert Agile coach and data analyst specializing in sprint performance analysis.

Analyze sprint data and provide:
1. Velocity Analysis (current, rolling average, trend)
2. Sprint Health Metrics (completion rate, scope creep, carry-over rate)
3. Risk Assessment (Critical/High/Medium/Low)
4. Burndown Analysis (ideal vs actual, trend line)
5. Team Performance Indicators

Return JSON with:
- velocity: number
- predictedCompletion: date
- completionProbability: 0-1
- healthScore: 0-100
- risks: array of risk objects
- recommendations: array of strings
- insights: object with strongPoints and improvements`,

  // Code Development
  COMMIT_MESSAGE: `You are a senior developer specializing in creating clear, informative git commit messages following conventional commit standards.

Format: <type>(<scope>): <subject>

Types: feat, fix, refactor, perf, docs, style, test, chore, build, ci, revert

Rules:
- Subject: max 50 chars, imperative mood, no period
- Body: explain what and why (not how), wrap at 72 chars
- Include issue references

Return complete commit message with proper formatting.`,

  PR_SUMMARY: `You are a senior software engineer creating comprehensive pull request descriptions.

Include:
- Summary (2-3 sentences)
- Changes (bulleted list)
- Motivation (why needed)
- Testing instructions
- Screenshots (if UI changes)
- Checklist

Use markdown formatting. Be specific and actionable.`,

  CODE_REVIEW: `You are a senior software architect providing constructive code review feedback.

Categories:
- 🔴 Critical: Must fix before merge
- 🟠 Major: Should fix before merge
- 🟡 Minor: Consider fixing
- 💭 Nitpicks: Optional improvements

Focus on: security, performance, maintainability, testing

Provide specific examples and suggestions. Be constructive and educational.`,

  // Predictive Analytics
  VELOCITY_PREDICTION: `You are a data scientist specializing in predictive analytics for software teams.

Analyze historical velocity data and predict future performance considering:
- Team capacity and availability
- Performance trends
- Risk adjustments
- Seasonal factors

Return JSON with:
- predicted_velocity: number
- confidence_level: 0-1
- range: {optimistic, realistic, pessimistic}
- factors: {positive[], negative[], neutral[]}
- recommendations: string[]`,

  RISK_ASSESSMENT: `You are a risk management specialist identifying and quantifying project risks.

Assess risks in categories:
- Technical (architecture, integration, performance)
- Schedule (timeline, dependencies, scope)
- Resource (skills, capacity, budget)
- Quality (testing, bugs, documentation)
- Business (stakeholder, market, ROI)

Score: Probability × Impact × Detectability

Return JSON with prioritized risks and mitigation strategies.`,

  // Natural Language
  PROJECT_QA: `You are an intelligent project assistant answering questions about project status, team performance, and technical details.

Answer structure:
1. Direct answer to question
2. Supporting context
3. Evidence/data
4. Follow-up suggestions

Be conversational but professional. Use markdown formatting.`,

  TECHNICAL_EXPLANATION: `You are a technical educator explaining complex concepts at different levels.

Adjust explanation based on audience:
- Executive: Business impact, strategic implications
- Technical Lead: Architecture, patterns, tradeoffs
- Developer: Implementation, code examples
- Junior: Fundamentals, step-by-step, analogies
- Non-technical: Simple analogies, real-world comparisons

Start simple, add detail progressively.`,

  // Insights Generation
  ANOMALY_DETECTION: `You are a data analytics expert detecting unusual patterns in software development metrics.

Monitor for anomalies in:
- Performance (velocity, productivity, cycle time)
- Quality (bugs, test failures, complexity)
- Team (attendance, commits, workload)
- Process (bottlenecks, scope creep, deployments)

Return severity level (critical/high/medium/low) with actionable recommendations.`,

  RECOMMENDATIONS: `You are a strategic advisor providing data-driven recommendations.

Categories:
- Process Optimization
- Team Performance
- Technical Improvements
- Resource Management
- Quality Enhancement

Include: problem statement, solution, expected benefits, ROI, implementation steps, success metrics.`,

  TREND_ANALYSIS: `You are a data scientist identifying patterns and trends in development metrics.

Analyze:
- Direction (increasing/decreasing/stable)
- Rate of change
- Seasonal patterns
- Correlations
- Inflection points

Provide forecasts with confidence intervals and actionable insights.`
};

export class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private responseCache: Map<string, { response: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(apiKey: string) {
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('Valid Gemini API key required. Set VITE_GEMINI_API_KEY in .env.local');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // Determine task complexity for model routing
  private determineComplexity(
    category: AIFeatureCategory,
    inputLength: number,
    requiresAnalysis: boolean = false
  ): TaskComplexity {
    // Complex categories always use Flash
    if ([
      AIFeatureCategory.PREDICTIVE_ANALYTICS,
      AIFeatureCategory.INSIGHTS_GENERATION,
      AIFeatureCategory.SPRINT_ANALYSIS
    ].includes(category)) {
      return TaskComplexity.COMPLEX;
    }

    // Long inputs or analysis requirements
    if (inputLength > 1000 || requiresAnalysis) {
      return TaskComplexity.COMPLEX;
    }

    // Simple tasks
    if ([
      AIFeatureCategory.TASK_INTELLIGENCE
    ].includes(category) && inputLength < 200) {
      return TaskComplexity.SIMPLE;
    }

    return TaskComplexity.MODERATE;
  }

  // Select model based on complexity
  private selectModel(complexity: TaskComplexity): AIModel {
    switch (complexity) {
      case TaskComplexity.SIMPLE:
        return AIModel.FLASH_LITE;
      case TaskComplexity.MODERATE:
        return AIModel.FLASH_LITE; // With caching
      case TaskComplexity.COMPLEX:
        return AIModel.FLASH;
      default:
        return AIModel.FLASH;
    }
  }

  // Check cache for recent responses
  private getCachedResponse(key: string): any | null {
    const cached = this.responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.response;
    }
    this.responseCache.delete(key);
    return null;
  }

  // Cache response
  private cacheResponse(key: string, response: any): void {
    this.responseCache.set(key, { response, timestamp: Date.now() });
    // Clean old cache entries
    if (this.responseCache.size > 100) {
      const oldestKey = this.responseCache.keys().next().value;
      this.responseCache.delete(oldestKey);
    }
  }

  // Generic AI request handler
  private async makeRequest(
    prompt: string,
    systemPrompt: string,
    category: AIFeatureCategory,
    useCache: boolean = true
  ): Promise<any> {
    const cacheKey = `${category}:${prompt}`;
    
    // Check cache
    if (useCache) {
      const cached = this.getCachedResponse(cacheKey);
      if (cached) return cached;
    }

    // Determine model
    const complexity = this.determineComplexity(category, prompt.length);
    const modelName = this.selectModel(complexity);
    const model = this.genAI.getGenerativeModel({ model: modelName });

    // Combine system and user prompts
    const fullPrompt = `${systemPrompt}\n\nUser Input: ${prompt}`;

    try {
      const result = await model.generateContent(fullPrompt);
      const response = result.response.text();
      
      // Cache if appropriate
      if (useCache && complexity !== TaskComplexity.COMPLEX) {
        this.cacheResponse(cacheKey, response);
      }

      // Parse JSON responses where expected
      if (response.startsWith('{') || response.startsWith('[')) {
        try {
          return JSON.parse(response);
        } catch {
          return response;
        }
      }

      return response;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`AI request failed: ${error.message}`);
    }
  }

  // Task Intelligence Features
  async generateTaskTitle(description: string): Promise<string> {
    return this.makeRequest(
      description,
      SYSTEM_PROMPTS.TASK_TITLE,
      AIFeatureCategory.TASK_INTELLIGENCE
    );
  }

  async estimateStoryPoints(description: string): Promise<number> {
    const response = await this.makeRequest(
      description,
      SYSTEM_PROMPTS.STORY_POINTS,
      AIFeatureCategory.TASK_INTELLIGENCE
    );
    return parseInt(response, 10);
  }

  async assessPriority(description: string): Promise<string> {
    return this.makeRequest(
      description,
      SYSTEM_PROMPTS.PRIORITY_ASSESSMENT,
      AIFeatureCategory.TASK_INTELLIGENCE
    );
  }

  async extractLabels(description: string): Promise<string[]> {
    return this.makeRequest(
      description,
      SYSTEM_PROMPTS.LABEL_EXTRACTION,
      AIFeatureCategory.TASK_INTELLIGENCE
    );
  }

  // Sprint Analysis
  async analyzeSprint(sprintData: any): Promise<any> {
    return this.makeRequest(
      JSON.stringify(sprintData),
      SYSTEM_PROMPTS.SPRINT_ANALYSIS,
      AIFeatureCategory.SPRINT_ANALYSIS,
      false // Don't cache complex analysis
    );
  }

  // Code Development
  async generateCommitMessage(changes: string): Promise<string> {
    return this.makeRequest(
      changes,
      SYSTEM_PROMPTS.COMMIT_MESSAGE,
      AIFeatureCategory.CODE_DEVELOPMENT
    );
  }

  async generatePRSummary(changes: string, context: string): Promise<string> {
    return this.makeRequest(
      `Changes:\n${changes}\n\nContext:\n${context}`,
      SYSTEM_PROMPTS.PR_SUMMARY,
      AIFeatureCategory.CODE_DEVELOPMENT
    );
  }

  async generateCodeReview(code: string, context: string): Promise<string> {
    return this.makeRequest(
      `Code:\n${code}\n\nContext:\n${context}`,
      SYSTEM_PROMPTS.CODE_REVIEW,
      AIFeatureCategory.CODE_DEVELOPMENT,
      false
    );
  }

  // Predictive Analytics
  async predictVelocity(historicalData: any): Promise<any> {
    return this.makeRequest(
      JSON.stringify(historicalData),
      SYSTEM_PROMPTS.VELOCITY_PREDICTION,
      AIFeatureCategory.PREDICTIVE_ANALYTICS,
      false
    );
  }

  async assessRisks(projectData: any): Promise<any> {
    return this.makeRequest(
      JSON.stringify(projectData),
      SYSTEM_PROMPTS.RISK_ASSESSMENT,
      AIFeatureCategory.PREDICTIVE_ANALYTICS,
      false
    );
  }

  // Natural Language
  async answerQuestion(question: string, context: any): Promise<string> {
    return this.makeRequest(
      `Question: ${question}\nContext: ${JSON.stringify(context)}`,
      SYSTEM_PROMPTS.PROJECT_QA,
      AIFeatureCategory.NATURAL_LANGUAGE
    );
  }

  async explainTechnical(concept: string, audience: string): Promise<string> {
    return this.makeRequest(
      `Concept: ${concept}\nAudience: ${audience}`,
      SYSTEM_PROMPTS.TECHNICAL_EXPLANATION,
      AIFeatureCategory.NATURAL_LANGUAGE
    );
  }

  // Insights Generation
  async detectAnomalies(metrics: any): Promise<any> {
    return this.makeRequest(
      JSON.stringify(metrics),
      SYSTEM_PROMPTS.ANOMALY_DETECTION,
      AIFeatureCategory.INSIGHTS_GENERATION,
      false
    );
  }

  async generateRecommendations(data: any): Promise<any> {
    return this.makeRequest(
      JSON.stringify(data),
      SYSTEM_PROMPTS.RECOMMENDATIONS,
      AIFeatureCategory.INSIGHTS_GENERATION,
      false
    );
  }

  async analyzeTrends(timeSeriesData: any): Promise<any> {
    return this.makeRequest(
      JSON.stringify(timeSeriesData),
      SYSTEM_PROMPTS.TREND_ANALYSIS,
      AIFeatureCategory.INSIGHTS_GENERATION,
      false
    );
  }

  // Get model usage stats
  getUsageStats() {
    return {
      cacheSize: this.responseCache.size,
      cacheHitRate: 0, // Would need to track this
      modelsUsed: {
        flash: AIModel.FLASH,
        flashLite: AIModel.FLASH_LITE
      }
    };
  }

  // Clear cache
  clearCache() {
    this.responseCache.clear();
  }
}

// Singleton instance
let geminiService: GeminiAIService | null = null;

export const getGeminiService = (): GeminiAIService => {
  if (!geminiService) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.warn('Gemini API key not configured. AI features will use mock data.');
      return null as any;
    }
    geminiService = new GeminiAIService(apiKey);
  }
  return geminiService;
};