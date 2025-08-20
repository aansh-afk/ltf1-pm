import React, { useState } from 'react'
import { useAI } from '../hooks/useAI'

export default function TestAI() {
  const ai = useAI()
  const [taskDescription, setTaskDescription] = useState('')
  const [results, setResults] = useState<any>({})

  const testTaskIntelligence = async () => {
    if (!taskDescription) {
      alert('Please enter a task description')
      return
    }

    try {
      const title = await ai.suggestTaskTitle(taskDescription)
      const points = await ai.estimateComplexity(taskDescription)
      const priority = await ai.suggestPriority(taskDescription)
      const labels = await ai.extractLabels(taskDescription)

      setResults(prev => ({
        ...prev,
        taskIntelligence: {
          title,
          points,
          priority,
          labels
        }
      }))
    } catch (error) {
      console.error('Task intelligence test failed:', error)
    }
  }

  const testCodeIntelligence = async () => {
    try {
      const commitMsg = await ai.generateCommitMessage('Fixed authentication bug and added user validation')
      const prSummary = await ai.generatePRSummary('Implemented OAuth2 authentication with Google and GitHub providers', 'Security enhancement')

      setResults(prev => ({
        ...prev,
        codeIntelligence: {
          commitMsg,
          prSummary: prSummary.substring(0, 200) + '...'
        }
      }))
    } catch (error) {
      console.error('Code intelligence test failed:', error)
    }
  }

  const testSprintAnalysis = async () => {
    try {
      const analysis = await ai.analyzeSprint({
        sprintName: 'Sprint 23',
        startDate: '2024-01-01',
        endDate: '2024-01-14',
        totalPoints: 55,
        completedPoints: 42,
        totalTasks: 15,
        completedTasks: 12,
        teamSize: 5
      })

      setResults(prev => ({
        ...prev,
        sprintAnalysis: analysis
      }))
    } catch (error) {
      console.error('Sprint analysis test failed:', error)
    }
  }

  const testNaturalLanguage = async () => {
    try {
      const answer = await ai.askQuestion('What is the team velocity?', { velocity: 45 })
      const explanation = await ai.explainConcept('microservices', 'junior')

      setResults(prev => ({
        ...prev,
        naturalLanguage: {
          answer,
          explanation: explanation.substring(0, 200) + '...'
        }
      }))
    } catch (error) {
      console.error('Natural language test failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-black text-green-500 p-8 font-mono">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-white">
          LTF1 AI FEATURES TEST
        </h1>

        {ai.loading && (
          <div className="mb-4 p-4 border border-yellow-500 text-yellow-500">
            PROCESSING...
          </div>
        )}

        {ai.error && (
          <div className="mb-4 p-4 border border-red-500 text-red-500">
            ERROR: {ai.error}
          </div>
        )}

        <div className="mb-8 p-4 border border-green-500">
          <h2 className="text-xl font-bold mb-4 text-white">TASK DESCRIPTION</h2>
          <textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            className="w-full p-2 bg-black border border-green-500 text-green-500"
            rows={4}
            placeholder="Enter a task description to test AI features..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={testTaskIntelligence}
            disabled={ai.loading}
            className="p-4 border border-green-500 hover:bg-green-500 hover:text-black transition-colors disabled:opacity-50"
          >
            TEST TASK INTELLIGENCE
          </button>
          <button
            onClick={testCodeIntelligence}
            disabled={ai.loading}
            className="p-4 border border-green-500 hover:bg-green-500 hover:text-black transition-colors disabled:opacity-50"
          >
            TEST CODE INTELLIGENCE
          </button>
          <button
            onClick={testSprintAnalysis}
            disabled={ai.loading}
            className="p-4 border border-green-500 hover:bg-green-500 hover:text-black transition-colors disabled:opacity-50"
          >
            TEST SPRINT ANALYSIS
          </button>
          <button
            onClick={testNaturalLanguage}
            disabled={ai.loading}
            className="p-4 border border-green-500 hover:bg-green-500 hover:text-black transition-colors disabled:opacity-50"
          >
            TEST NATURAL LANGUAGE
          </button>
        </div>

        {Object.keys(results).length > 0 && (
          <div className="p-4 border border-green-500">
            <h2 className="text-xl font-bold mb-4 text-white">RESULTS</h2>
            <pre className="text-green-500 overflow-x-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 p-4 border border-yellow-500 text-yellow-500">
          <h3 className="font-bold mb-2">CONFIGURATION STATUS</h3>
          <p>API Key: {import.meta.env.VITE_GEMINI_API_KEY ? '✓ CONFIGURED' : '✗ NOT SET'}</p>
          <p className="text-sm mt-2">
            To use real AI features, set VITE_GEMINI_API_KEY in apps/web/.env.local
          </p>
        </div>
      </div>
    </div>
  )
}