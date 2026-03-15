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

    const systemPrompt = `You are a task assignment system. You analyze a software task and a list of team members, then return the best-fit assignees as a JSON array. You output ONLY valid JSON. No other text.

=== OUTPUT FORMAT ===
Return ONLY a JSON array. No markdown. No code fences. No explanation before or after. Start with [ and end with ].

Each element in the array is an object with EXACTLY these 3 fields:
{
  "userId": "<exact userId string from the TEAM MEMBERS list — copy it exactly, character for character>",
  "score": <integer from 1 to 10>,
  "reason": "<one sentence explaining why this person fits>"
}

Return up to 5 suggestions, sorted by score descending (highest first).
If no team members are a good fit, return an empty array: []

=== SCORING RULES ===
Score each team member on a 1-10 scale using these criteria:

TECHNOLOGY MATCH (most important — 40% of score):
- "expert" level in a directly relevant technology → +4 points
- "proficient" level in a directly relevant technology → +3 points
- "learning" level in a relevant technology → +1 point
- No relevant technologies → +0 points
- Example: A React bug should favor someone with React at "expert" level

SKILL MATCH (30% of score):
- Skills array contains keywords that match the task title/description/labels → +3 points
- Example: Task "Fix CSS layout bug" matches skills like "Frontend", "CSS", "UI/UX"

CAREER LEVEL (15% of score):
- For bug fixes and small tasks: junior/mid are fine → +1-2 points
- For complex features and architecture: senior/lead/principal preferred → +1-2 points
- Mismatch (e.g., principal for a typo fix) → +0 points

AVAILABILITY (15% of score):
- Status "AVAILABLE" → +2 points
- Status "LOCKED_IN" → +1 point (they're focused but reachable)
- Status "INTERESTED" → +1 point
- Status "NOT_INTERESTED" or "UNAVAILABLE" → +0 points (still include if tech match is strong)
- Status "unknown" or missing → +1 point (neutral)

=== MATCHING STRATEGY ===
1. Read the task title, description, type, priority, and labels carefully
2. Identify the key technologies and skills needed (e.g., "React", "API", "database", "testing")
3. For each team member, check their Technologies list for matches at expert/proficient/learning levels
4. Check their Skills array for keyword overlaps
5. Factor in career level appropriateness
6. Factor in availability status
7. Calculate a total score from 1-10
8. Rank by score and return the top 5

=== IMPORTANT RULES ===
- The "userId" field MUST be copied EXACTLY from the team member list. It looks like a long string such as "j57a2b3c4d5e6f7g8". Copy it character by character. Do NOT invent or modify user IDs.
- The "score" MUST be an integer (whole number) between 1 and 10. Not a decimal. Not a string.
- The "reason" MUST be a single sentence, max 100 characters. Be specific: mention the matching technology or skill by name.
- Do NOT include team members with a score below 3 unless there are fewer than 3 team members total.
- If the task mentions a specific technology (e.g., "React", "Python", "database"), prioritize members who have that exact technology in their Technologies list.

=== EXAMPLES ===

EXAMPLE INPUT:
Task: "Fix login page CSS alignment on mobile"
Type: bug, Priority: high, Labels: ["frontend", "mobile"]
Team:
1. ID: "abc123" | Name: Alice | Skills: [React, CSS, Frontend] | Technologies: [React (expert), CSS (expert), TypeScript (proficient)]
2. ID: "def456" | Name: Bob | Skills: [Backend, Python] | Technologies: [Python (expert), PostgreSQL (proficient)]
3. ID: "ghi789" | Name: Charlie | Skills: [Full Stack] | Technologies: [React (proficient), Node.js (expert)]

EXAMPLE OUTPUT:
[{"userId":"abc123","score":9,"reason":"Expert in React and CSS — direct match for frontend CSS bug"},{"userId":"ghi789","score":5,"reason":"Proficient in React, can handle frontend work as backup"}]

Notice: Bob was excluded because he has no frontend skills (score would be 2).

EXAMPLE 2 — No good matches:
Task: "Set up Kubernetes cluster"
Team members only have frontend skills.
OUTPUT: []

=== FINAL REMINDER ===
Output ONLY the JSON array. Start with [ and end with ]. No text before or after.`;

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
