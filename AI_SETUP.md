# LTF1 AI Features Setup Guide

## Overview

LTF1 integrates Google's Gemini AI models (Gemini 2.5 Flash and Flash Lite) to provide intelligent assistance throughout the project management workflow. The system uses smart model routing to optimize for both performance and cost.

## Features

### 🎯 Task Intelligence
- **Task Title Generation** - Creates clear, actionable task titles
- **Story Point Estimation** - Fibonacci-based complexity estimation
- **Priority Assessment** - Automatic priority suggestions (Urgent/High/Medium/Low)
- **Label Extraction** - Intelligent categorization and tagging

### 📊 Sprint Analysis
- **Velocity Analysis** - Current and historical velocity tracking
- **Sprint Health Metrics** - Completion rates, scope creep detection
- **Risk Assessment** - Identifies and prioritizes sprint risks
- **Burndown Analysis** - Ideal vs actual progress tracking

### 💻 Code Development
- **Commit Message Generation** - Conventional commit format
- **PR Summary Generation** - Detailed pull request descriptions
- **Code Review Feedback** - Constructive review comments with severity levels
- **Documentation Generation** - Automated documentation creation

### 🔮 Predictive Analytics
- **Velocity Prediction** - Forecast team performance
- **Risk Assessment** - Project risk identification and mitigation
- **Capacity Planning** - Resource optimization and workload distribution
- **Deadline Prediction** - Timeline forecasting with confidence intervals

### 💬 Natural Language
- **Project Q&A** - Answer questions about project status
- **Technical Explanations** - Multi-level explanations for different audiences
- **Smart Summarization** - Sprint, meeting, and code review summaries

### 🔍 Insights Generation
- **Anomaly Detection** - Pattern detection and alert generation
- **Recommendations Engine** - Data-driven improvement suggestions
- **Trend Analysis** - Time series analysis and pattern recognition

## Setup Instructions

### 1. Get a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the generated API key

Alternative: Use [Google Cloud Console](https://console.cloud.google.com/apis/credentials) if you have a GCP account

### 2. Configure Environment Variables

Add your API key to `apps/web/.env.local`:

```env
# AI Service Configuration
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Restart Development Server

```bash
npm run dev
```

### 4. Test AI Features

Navigate to `/test-ai` in your browser to test the AI features.

## Model Routing Strategy

The system automatically selects the appropriate model based on task complexity:

### Gemini 2.5 Flash Lite (8B)
Used for simple tasks with caching:
- Task title generation
- Priority assessment
- Label extraction
- Simple Q&A

### Gemini 2.5 Flash
Used for complex analysis:
- Sprint analysis
- Code review generation
- Predictive analytics
- Trend analysis
- Anomaly detection

## Usage Examples

### In React Components

```typescript
import { useAI } from '../hooks/useAI'

function TaskCreator() {
  const ai = useAI()
  
  const handleGenerateTitle = async (description: string) => {
    const title = await ai.suggestTaskTitle(description)
    const points = await ai.estimateComplexity(description)
    const priority = await ai.suggestPriority(description)
    const labels = await ai.extractLabels(description)
    
    // Use the AI-generated values
    console.log({ title, points, priority, labels })
  }
}
```

### Terminal Commands

The terminal (accessed with backtick `) includes 30+ AI commands:

```bash
# Task intelligence
ai suggest-title "implement user authentication"
ai estimate-points "add OAuth2 support"
ai suggest-priority "fix production bug"
ai extract-labels "frontend React component"

# Sprint analysis
ai analyze-sprint
ai predict-velocity
ai assess-risks

# Code development
ai commit-message
ai pr-summary
ai review-code

# Natural language
ai ask "What's our current velocity?"
ai explain "microservices" --audience junior
```

## Cost Optimization

The system optimizes costs through:

1. **Smart Model Routing** - Uses lighter models when possible
2. **Response Caching** - Caches responses for 5 minutes
3. **Batch Processing** - Groups similar requests
4. **Token Tracking** - Monitors usage in real-time

## Privacy & Security

- API keys are stored locally in `.env.local`
- Never commit API keys to version control
- All AI sessions are tracked in Convex for auditing
- User feedback is collected to improve prompts

## Troubleshooting

### API Key Not Working
- Verify the key is correctly set in `.env.local`
- Check that the Gemini API is enabled in your Google Cloud project
- Ensure you have billing enabled if using Google Cloud

### Features Using Mock Data
- If no API key is configured, the system falls back to mock AI
- Check browser console for warnings about missing API key

### Rate Limiting
- Gemini has rate limits per API key
- Consider implementing request queuing for high-volume usage

## System Prompts

All AI behaviors are defined in `ai-system-prompts/` folder (gitignored for planning). Each category has detailed prompts defining:
- Role and context
- Input/output formats
- Decision criteria
- Examples and edge cases

## Contributing

To improve AI features:
1. Update system prompts in `ai-system-prompts/`
2. Test changes with real data
3. Collect user feedback
4. Iterate on prompt engineering

## Support

For issues or questions:
- Check browser console for errors
- Verify API key configuration
- Test with `/test-ai` page
- Review system prompts for expected behavior