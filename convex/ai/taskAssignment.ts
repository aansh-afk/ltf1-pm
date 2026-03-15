"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
// @ts-ignore
import { api, internal } from "../_generated/api";

/**
 * AI-powered task assignment suggestion.
 * Takes task details + project members and uses AI to rank best-fit assignees.
 */
export const suggestAssignees = action({
  args: {
    taskId: v.optional(v.id("tasks")),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    taskType: v.optional(v.string()),
    priority: v.optional(v.string()),
    labels: v.optional(v.array(v.string())),
  },
  returns: v.array(
    v.object({
      userId: v.string(),
      score: v.number(),
      reason: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    let title = args.title ?? "";
    let description = args.description ?? "";
    let projectId = args.projectId;
    let taskType = args.taskType ?? "";
    let priority = args.priority ?? "";
    let labels = args.labels ?? [];

    // If taskId provided, fetch task details
    if (args.taskId) {
      const task: any = await ctx.runQuery(
        internal.ai.taskAssignmentQueries.getTaskDetails,
        { taskId: args.taskId }
      );
      if (task) {
        title = task.title;
        description = task.description ?? "";
        projectId = task.projectId;
        taskType = task.type ?? "";
        priority = task.priority ?? "";
        labels = task.labels ?? [];
      }
    }

    if (!projectId) {
      throw new Error("projectId is required");
    }

    // Get team skills
    const teamSkills: Array<{
      userId: string;
      name: string;
      email: string;
      avatarUrl: string | undefined;
      skills: Array<string>;
      technologies: Array<{ name: string; level: string }>;
      careerLevel: string | undefined;
      status: string | undefined;
      role: string | undefined;
    }> = await ctx.runQuery(
      internal.ai.taskAssignmentQueries.getProjectTeamSkills,
      { projectId }
    );

    if (teamSkills.length === 0) {
      return [];
    }

    // Build the AI prompt
    const teamSummary = teamSkills
      .map((member, i) => {
        const techList = member.technologies
          .map((t) => `${t.name} (${t.level})`)
          .join(", ");
        const skillList = member.skills.join(", ");
        const availability = member.status ?? "unknown";
        return `${i + 1}. ID: "${member.userId}" | Name: ${member.name} | Role: ${member.role ?? "N/A"} | Level: ${member.careerLevel ?? "N/A"} | Status: ${availability} | Skills: [${skillList}] | Technologies: [${techList}]`;
      })
      .join("\n");

    const taskSummary = [
      `Title: ${title}`,
      description ? `Description: ${description}` : null,
      taskType ? `Type: ${taskType}` : null,
      priority ? `Priority: ${priority}` : null,
      labels.length > 0 ? `Labels: ${labels.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const systemPrompt = `You are a task assignment AI for a software development team. Given a task description and team member profiles, rank the best-fit assignees.

Consider these factors:
1. Technology match: Does the member have relevant technologies at expert/proficient level?
2. Skill match: Do their skills align with the task requirements?
3. Career level: Is their seniority appropriate for the task complexity?
4. Availability: Prefer AVAILABLE or LOCKED_IN members over AFK or IN_MEETING.

Return ONLY a JSON array (no markdown, no code fences, no explanation) with up to 5 suggestions ranked by fit:
[{"userId": "<exact userId string>", "score": <1-10>, "reason": "<1 sentence explanation>"}]

If no good matches exist, return an empty array [].`;

    const prompt = `TASK:\n${taskSummary}\n\nTEAM MEMBERS:\n${teamSummary}`;

    try {
      const aiResult: { text: string; model: string; provider: "cerebras" | "groq" } =
        await ctx.runAction(api.ai.generate.generate, {
          prompt,
          systemPrompt,
          functionCategory: "task_assignment",
          temperature: 0.3,
          maxTokens: 1024,
        });

      // Parse the AI response - strip code fences if present
      let responseText = aiResult.text.trim();
      if (responseText.startsWith("```")) {
        responseText = responseText
          .replace(/^```(?:json)?\s*/, "")
          .replace(/\s*```$/, "");
      }

      const parsed = JSON.parse(responseText);

      if (!Array.isArray(parsed)) {
        return [];
      }

      // Validate and filter to only real team member IDs
      const validUserIds = new Set(teamSkills.map((m) => m.userId));
      const suggestions: Array<{
        userId: string;
        score: number;
        reason: string;
      }> = [];

      for (const item of parsed) {
        if (
          item &&
          typeof item.userId === "string" &&
          validUserIds.has(item.userId) &&
          typeof item.score === "number" &&
          typeof item.reason === "string"
        ) {
          suggestions.push({
            userId: item.userId,
            score: Math.min(10, Math.max(1, Math.round(item.score))),
            reason: item.reason,
          });
        }
      }

      // Sort by score descending
      suggestions.sort((a, b) => b.score - a.score);

      return suggestions.slice(0, 5);
    } catch (error: any) {
      console.error("AI task assignment failed:", error.message);
      throw new Error(
        "Failed to generate assignment suggestions. Please try again."
      );
    }
  },
});
