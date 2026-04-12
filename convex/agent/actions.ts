"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
// @ts-ignore — deep type instantiation
import { api, internal } from "../_generated/api";

// CLI entry point: suggest next actions for a project based on current state
export const suggestNextActions = action({
  args: {
    projectId: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Fetch project context
    // @ts-ignore — deep type instantiation
    const project: any = await ctx.runQuery(internal.internalQueries.getProject, {
      projectId: args.projectId as any,
    });
    if (!project) throw new Error("Project not found");

    // @ts-ignore — deep type instantiation
    const tasks: any[] = await ctx.runQuery(internal.internalQueries.getProjectTasks, {
      projectId: args.projectId as any,
    });

    // @ts-ignore — deep type instantiation
    const sprints: any[] = await ctx.runQuery(
      internal.internalQueries.getProjectSprints,
      { projectId: args.projectId as any },
    );

    // Build context
    const activeSprint = (sprints as any[]).find(
      (s: any) => s.status === "active",
    );
    const inProgress = (tasks as any[]).filter(
      (t: any) => t.status === "in_progress",
    );
    const blocked = (tasks as any[]).filter((t: any) => {
      if (t.status === "done" || t.status === "cancelled") return false;
      if (t.dependencies && t.dependencies.length > 0) {
        return t.dependencies.some((depId: any) => {
          const dep = (tasks as any[]).find((dt: any) => dt._id === depId);
          return dep && dep.status !== "done";
        });
      }
      return false;
    });
    const backlog = (tasks as any[]).filter(
      (t: any) => t.status === "backlog",
    );

    // @ts-ignore — deep type instantiation
    const result: any = await ctx.runAction(api.ai.generate.generate, {
      prompt: `Project: ${(project as any).name}
Active sprint: ${activeSprint ? (activeSprint as any).name : "none"}
In progress: ${inProgress.length} tasks
Blocked: ${blocked.length} tasks${blocked.length > 0 ? ` (${blocked.slice(0, 3).map((t: any) => t.title).join(", ")})` : ""}
Backlog: ${backlog.length} tasks

Top in-progress:
${inProgress
  .slice(0, 5)
  .map((t: any) => `- ${t.title}`)
  .join("\n")}

Suggest 3-5 specific next actions the team should take right now. Consider unblocking work, prioritizing high-value items, and sprint goals.

Return a JSON object with an "actions" array. Each action has: "action" (imperative sentence), "reasoning" (why this matters), "priority" (high/medium/low), "category" (unblock/prioritize/review/plan).`,
      systemPrompt: `You are an AI project management agent. Analyze the current project state and suggest immediate next actions. Output ONLY valid JSON. No markdown fences.`,
      functionCategory: "agent_suggestions",
      temperature: 0.4,
      maxTokens: 1500,
    });

    return result.text;
  },
});
