// AI Actions
// Handles interaction with Google Gemini API

import { action } from "../_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPTS } from "./prompts";
import { api } from "../_generated/api";

// Model routing strategy
enum AIModel {
  FLASH = 'gemini-2.5-flash-latest',
  FLASH_LITE = 'gemini-2.5-flash-8b-latest'
}

// Helpers
const getGeminiModel = (modelName: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: modelName });
};

// Generate text content
const generateText = async (prompt: string, systemPrompt: string, modelName: string) => {
  const model = getGeminiModel(modelName);
  const fullPrompt = `${systemPrompt}\n\nUser Input: ${prompt}`;

  try {
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  } catch (error: any) {
    console.error("Gemini API error:", error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
};

// Generate JSON content
const generateJSON = async (prompt: string, systemPrompt: string, modelName: string) => {
  const text = await generateText(prompt, systemPrompt, modelName);
  // Strip markdown code blocks if present
  const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
  try {
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Failed to parse JSON response:", text);
    throw new Error("AI returned invalid JSON");
  }
};

// Actions

export const generateTaskDetails = action({
  args: {
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const details = await generateJSON(
      args.description,
      SYSTEM_PROMPTS.TASK_DETAILS_JSON,
      AIModel.FLASH_LITE
    );

    await ctx.runMutation(api.ai.mutations.trackAISession, {
        type: 'task.details.generate',
        input: args.description,
        output: JSON.stringify(details),
        model: AIModel.FLASH_LITE,
        tokens: { input: args.description.length / 4, output: 100, total: 0 },
        cost: 0,
        latency: 0,
        cached: false
    });

    return {
      title: details.title || "",
      points: details.points || 0,
      priority: (details.priority || "medium").toLowerCase(),
      labels: details.labels || [],
    };
  },
});

export const analyzeSprint = action({
  args: {
    sprintId: v.id("sprints"),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.runQuery(api.tasks.internal.listBySprint, { sprintId: args.sprintId });

    if (!tasks || tasks.length === 0) {
        return {
            velocity: 0,
            healthScore: 100,
            risks: [],
            recommendations: ["Start adding tasks to the sprint."],
            insights: { strongPoints: [], improvements: [] }
        };
    }

    const sprintData = {
        taskCount: tasks.length,
        tasks: tasks.map((t: any) => ({
            title: t.title,
            status: t.status,
            points: t.estimate?.points || 0,
            priority: t.priority,
            assignee: t.assigneeId
        }))
    };

    const analysis = await generateJSON(
      JSON.stringify(sprintData),
      SYSTEM_PROMPTS.SPRINT_ANALYSIS,
      AIModel.FLASH
    );

    await ctx.runMutation(api.ai.mutations.trackAISession, {
        type: 'sprint.analyze',
        input: JSON.stringify(sprintData).substring(0, 1000),
        output: JSON.stringify(analysis).substring(0, 1000),
        model: AIModel.FLASH,
        tokens: { input: 0, output: 0, total: 0 },
        cost: 0,
        latency: 0,
        cached: false
    });

    return analysis;
  },
});

export const generatePRSummary = action({
  args: {
    diff: v.string(),
    context: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const summary = await generateText(
      `Changes:\n${args.diff}\n\nContext:\n${args.context || ''}`,
      SYSTEM_PROMPTS.PR_SUMMARY,
      AIModel.FLASH
    );

    await ctx.runMutation(api.ai.mutations.trackAISession, {
        type: 'pr.summary.generate',
        input: args.diff.substring(0, 500),
        output: summary.substring(0, 500),
        model: AIModel.FLASH,
        tokens: { input: 0, output: 0, total: 0 },
        cost: 0,
        latency: 0,
        cached: false
    });

    return summary;
  },
});
