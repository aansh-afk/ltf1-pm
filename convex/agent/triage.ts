"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

// ─── Triage System Prompt ────────────────────────────────────────────────

const TRIAGE_SYSTEM_PROMPT = `You are a task triage agent for a project management tool called LTF1.
Analyze the given task and suggest triage fields.

CRITICAL RULES:
1. Respond with ONLY valid JSON. No markdown fences, no explanation, no preamble.
2. Use only the exact field names and value types specified.
3. For type, use one of: "feature", "bug", "improvement", "task", "epic"
4. For priority, use one of: "urgent", "high", "medium", "low"
5. For labels, only suggest labels from the provided existing labels list.
6. For assignee, suggest a userId from the provided team list based on skill match.
7. For duplicate detection, compare the title against recent tasks and flag if very similar.`;

// ─── AI Response Parser ──────────────────────────────────────────────────

interface TriageResult {
  suggestedType?: string;
  suggestedPriority?: string;
  suggestedAssigneeIds?: string[];
  suggestedLabels?: string[];
  duplicateOfTaskId?: string;
  confidence: number;
  reasoning?: string;
}

function parseTriageResponse(text: string): TriageResult {
  try {
    let cleaned = text.trim();
    // Strip markdown code fences if present
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const parsed = JSON.parse(cleaned);
    return {
      suggestedType: parsed.type || parsed.suggestedType || undefined,
      suggestedPriority: parsed.priority || parsed.suggestedPriority || undefined,
      suggestedAssigneeIds: parsed.assigneeIds || parsed.suggestedAssigneeIds || undefined,
      suggestedLabels: parsed.labels || parsed.suggestedLabels || undefined,
      duplicateOfTaskId: parsed.duplicateOfTaskId || undefined,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      reasoning: parsed.reasoning || undefined,
    };
  } catch {
    return {
      confidence: 0,
      reasoning: "Failed to parse AI response",
    };
  }
}

// ─── Simple String Similarity (for duplicate detection) ──────────────────

function similarity(a: string, b: string): number {
  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();
  if (aLower === bLower) return 1.0;

  const aWords = new Set(aLower.split(/\s+/));
  const bWords = new Set(bLower.split(/\s+/));
  const intersection = new Set([...aWords].filter((w) => bWords.has(w)));
  const union = new Set([...aWords, ...bWords]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

// ─── Main Triage Action ──────────────────────────────────────────────────

export const triageTask = internalAction({
  args: {
    taskId: v.id("tasks"),
    workspaceId: v.id("workspaces"),
    projectId: v.id("projects"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get workspace to check triageMode
    const context: {
      workspace: Record<string, unknown> | null;
      recentTasks: Array<Record<string, unknown>>;
      activeSprint: Record<string, unknown> | null;
      teamMembers: Array<Record<string, unknown>>;
      recentActivity: Array<Record<string, unknown>>;
      currentTask: Record<string, unknown> | null;
    // @ts-ignore — deep type instantiation
    } = await ctx.runQuery(internal.agent.context.assembleContext, {
      workspaceId: args.workspaceId,
      projectId: args.projectId,
      taskId: args.taskId,
    });

    if (!context.workspace || !context.currentTask) {
      return null;
    }

    // Check triageMode
    const settings = (context.workspace as any).settings;
    const triageMode: string = settings?.triageMode || "off";

    if (triageMode === "off") {
      return null;
    }

    // Check if AI features are enabled
    if (!settings?.features?.aiFeatures) {
      return null;
    }

    const task = context.currentTask as any;

    // Collect existing labels from recent tasks
    const existingLabels = new Set<string>();
    for (const t of context.recentTasks) {
      const labels = (t as any).labels;
      if (Array.isArray(labels)) {
        for (const l of labels) {
          existingLabels.add(l);
        }
      }
    }

    // Build team info for the prompt
    const teamInfo = context.teamMembers.map((m: any) => ({
      userId: m.userId,
      name: m.name,
      skills: m.skills || [],
      techStack: (m.techStack || []).map((ts: any) =>
        typeof ts === "string" ? ts : ts.name
      ),
    }));

    // Build recent task titles for duplicate detection
    const recentTaskTitles = context.recentTasks.slice(0, 30).map((t: any) => ({
      id: t._id,
      title: t.title,
    }));

    // Check for duplicates locally first (simple string similarity)
    let duplicateOfTaskId: string | undefined;
    for (const rt of recentTaskTitles) {
      if (rt.id !== args.taskId && similarity(task.title, rt.title) > 0.8) {
        duplicateOfTaskId = rt.id;
        break;
      }
    }

    // Build AI prompt
    const prompt = `Analyze this task and suggest triage fields:

Task title: ${task.title}
Task description: ${task.description || "No description provided"}
Current type: ${task.type}
Current priority: ${task.priority}

Existing labels in this project: [${Array.from(existingLabels).join(", ")}]

Team members:
${teamInfo.map((m: any) => `- ${m.name} (id: ${m.userId}): skills=[${m.skills.join(", ")}], tech=[${m.techStack.join(", ")}]`).join("\n")}

Recent tasks (for duplicate detection):
${recentTaskTitles.map((t: any) => `- [${t.id}] ${t.title}`).join("\n")}

${duplicateOfTaskId ? `NOTE: Local duplicate detection found potential duplicate: ${duplicateOfTaskId}` : ""}

Respond with JSON:
{
  "type": "feature|bug|improvement|task|epic",
  "priority": "urgent|high|medium|low",
  "labels": ["label1", "label2"],
  "assigneeIds": ["userId1"],
  "duplicateOfTaskId": "taskId or null",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of your suggestions"
}`;

    // Call AI using existing infrastructure
    let triageResult: TriageResult;
    try {
      const aiResponse: { text: string; model: string; provider: string } =
        await ctx.runAction(internal.ai.providers.generateWithProvider, {
          provider: "groq" as const,
          model: "openai/gpt-oss-20b",
          apiKey: process.env.GROQ_API_KEY || "",
          prompt,
          systemPrompt: TRIAGE_SYSTEM_PROMPT,
          temperature: 0.3,
          maxTokens: 1024,
          complexity: "low" as const,
        });

      triageResult = parseTriageResponse(aiResponse.text);
    } catch (error: any) {
      // If AI call fails, use local heuristics only
      triageResult = {
        confidence: 0.3,
        reasoning: `AI call failed: ${error.message}. Used local heuristics.`,
        duplicateOfTaskId,
      };
    }

    // Override with local duplicate detection if AI missed it
    if (duplicateOfTaskId && !triageResult.duplicateOfTaskId) {
      triageResult.duplicateOfTaskId = duplicateOfTaskId;
    }

    // Validate suggested type
    const validTypes = ["feature", "bug", "improvement", "task", "epic"];
    if (triageResult.suggestedType && !validTypes.includes(triageResult.suggestedType)) {
      triageResult.suggestedType = undefined;
    }

    // Validate suggested priority
    const validPriorities = ["urgent", "high", "medium", "low"];
    if (triageResult.suggestedPriority && !validPriorities.includes(triageResult.suggestedPriority)) {
      triageResult.suggestedPriority = undefined;
    }

    // Filter labels to only existing ones
    if (triageResult.suggestedLabels) {
      triageResult.suggestedLabels = triageResult.suggestedLabels.filter((l) =>
        existingLabels.has(l)
      );
    }

    // Validate assignee IDs against team members
    const validUserIds = new Set(context.teamMembers.map((m: any) => m.userId));
    if (triageResult.suggestedAssigneeIds) {
      triageResult.suggestedAssigneeIds = triageResult.suggestedAssigneeIds.filter((id) =>
        validUserIds.has(id)
      );
    }

    if (triageMode === "auto") {
      // Auto-apply suggestions directly
      await ctx.runMutation(internal.agent.triageMutations.applyTriageSuggestion, {
        taskId: args.taskId,
        suggestedType: triageResult.suggestedType,
        suggestedPriority: triageResult.suggestedPriority,
        suggestedAssigneeIds: (triageResult.suggestedAssigneeIds || []) as Id<"users">[],
        suggestedLabels: triageResult.suggestedLabels,
      });

      // Create suggestion record as auto_applied
      await ctx.runMutation(internal.agent.triageMutations.createTriageSuggestionRecord, {
        taskId: args.taskId,
        workspaceId: args.workspaceId,
        projectId: args.projectId,
        suggestedType: triageResult.suggestedType,
        suggestedPriority: triageResult.suggestedPriority,
        suggestedAssigneeIds: (triageResult.suggestedAssigneeIds || []) as Id<"users">[],
        suggestedLabels: triageResult.suggestedLabels,
        duplicateOfTaskId: triageResult.duplicateOfTaskId as Id<"tasks"> | undefined,
        confidence: triageResult.confidence,
        reasoning: triageResult.reasoning,
        status: "auto_applied" as const,
        autoApplied: true,
      });

      // Log agent activity
      await ctx.runMutation(internal.agent.triageMutations.logAgentActivity, {
        workspaceId: args.workspaceId,
        type: "triage" as const,
        taskId: args.taskId,
        description: `Auto-triaged task "${task.title}": type=${triageResult.suggestedType || task.type}, priority=${triageResult.suggestedPriority || task.priority}`,
        metadata: { confidence: triageResult.confidence, mode: "auto" },
      });
    } else if (triageMode === "review") {
      // Create pending suggestion for human review
      await ctx.runMutation(internal.agent.triageMutations.createTriageSuggestionRecord, {
        taskId: args.taskId,
        workspaceId: args.workspaceId,
        projectId: args.projectId,
        suggestedType: triageResult.suggestedType,
        suggestedPriority: triageResult.suggestedPriority,
        suggestedAssigneeIds: (triageResult.suggestedAssigneeIds || []) as Id<"users">[],
        suggestedLabels: triageResult.suggestedLabels,
        duplicateOfTaskId: triageResult.duplicateOfTaskId as Id<"tasks"> | undefined,
        confidence: triageResult.confidence,
        reasoning: triageResult.reasoning,
        status: "pending" as const,
        autoApplied: false,
      });

      // Log agent activity
      await ctx.runMutation(internal.agent.triageMutations.logAgentActivity, {
        workspaceId: args.workspaceId,
        type: "triage" as const,
        taskId: args.taskId,
        description: `Created triage suggestion for task "${task.title}" (pending review)`,
        metadata: { confidence: triageResult.confidence, mode: "review" },
      });
    }

    return null;
  },
});
