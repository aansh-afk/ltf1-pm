"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
// @ts-ignore — deep type instantiation
import { api, internal } from "../_generated/api";

// CLI entry point: generate a task description from a brief
export const generateDescription = action({
  args: {
    brief: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const result: { text: string; model: string; provider: "cerebras" | "groq" } =
      await ctx.runAction(api.ai.generate.generate, {
        prompt: args.brief,
        systemPrompt: `You are a technical project manager. Given a brief task idea, write a clear, detailed task description suitable for a developer. Include: what needs to be done, acceptance criteria, and any technical considerations. Keep it concise but thorough. Output plain text, not JSON.`,
        functionCategory: "task_description",
        temperature: 0.4,
        maxTokens: 1000,
      });

    return result.text;
  },
});

// CLI entry point: suggest tasks based on recent project activity
export const suggestTasks = action({
  args: {
    projectId: v.string(),
    count: v.optional(v.number()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const count = args.count || 5;

    // Fetch project context
    const project = await ctx.runQuery(internal.internalQueries.getProject, {
      projectId: args.projectId as any,
    });
    if (!project) throw new Error("Project not found");

    const tasks = await ctx.runQuery(internal.internalQueries.getProjectTasks, {
      projectId: args.projectId as any,
    });

    // Build context from recent tasks
    const recentTasks = (tasks as any[])
      .sort((a: any, b: any) => b.updatedAt - a.updatedAt)
      .slice(0, 20);

    const taskSummary = recentTasks
      .map((t: any) => `- [${t.status}] ${t.title}`)
      .join("\n");

    const result: { text: string; model: string; provider: "cerebras" | "groq" } =
      await ctx.runAction(api.ai.generate.generate, {
        prompt: `Project: ${(project as any).name}
Description: ${(project as any).description || "No description"}

Recent tasks:
${taskSummary || "No tasks yet"}

Based on the project context and recent activity, suggest ${count} new tasks the team should work on. Consider gaps, follow-ups, and improvements.

Return a JSON object with a "suggestions" array. Each suggestion has: "title", "description", "priority" (low/medium/high), "type" (task/feature/bug/improvement), and "reasoning".`,
        systemPrompt: `You are a technical project manager. Analyze project activity and suggest actionable tasks. Output ONLY valid JSON. No markdown fences.`,
        functionCategory: "task_suggestions",
        temperature: 0.5,
        maxTokens: 2000,
      });

    return result.text;
  },
});

// CLI entry point: analyze sprint/project health
export const analyzeTask = action({
  args: {
    sprintId: v.optional(v.string()),
    projectId: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // If we have a projectId, use generateProjectInsights directly
    if (args.projectId) {
      // @ts-ignore — deep type instantiation
      const insights: any = await ctx.runAction(
        api.ai.projectInsights.generateProjectInsights,
        {
          projectId: args.projectId as any,
          sprintId: args.sprintId as any,
        },
      );
      return JSON.stringify(insights, null, 2);
    }

    // If only sprintId, look up the project from the sprint
    if (args.sprintId) {
      // @ts-ignore — deep type instantiation
      const sprint: any = await ctx.runQuery(internal.internalQueries.getSprint, {
        sprintId: args.sprintId as any,
      });
      if (!sprint) throw new Error("Sprint not found");
      // @ts-ignore — deep type instantiation
      const insights: any = await ctx.runAction(
        api.ai.projectInsights.generateProjectInsights,
        {
          projectId: sprint.projectId,
          sprintId: args.sprintId as any,
        },
      );
      return JSON.stringify(insights, null, 2);
    }

    throw new Error(
      "Either projectId or sprintId is required for analysis",
    );
  },
});
