import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
// @ts-ignore — deep type instantiation
import { internal, api } from "../_generated/api";
import { Id, Doc } from "../_generated/dataModel";

// Generate AI insights for project health and sprint status
export const generateProjectInsights = action({
  args: {
    projectId: v.id("projects"),
    sprintId: v.optional(v.id("sprints")),
  },
  handler: async (ctx, args): Promise<any> => {
    // Fetch project data
    const [project, tasks, sprints, team]: [
      Doc<"projects"> | null,
      Doc<"tasks">[],
      Doc<"sprints">[],
      Doc<"users">[],
    ] = await Promise.all([
      ctx.runQuery(internal.internalQueries.getProject, {
        projectId: args.projectId,
      }),
      ctx.runQuery(internal.internalQueries.getProjectTasks, {
        projectId: args.projectId,
      }),
      ctx.runQuery(internal.internalQueries.getProjectSprints, {
        projectId: args.projectId,
      }),
      ctx.runQuery(internal.internalQueries.getProjectTeam, {
        projectId: args.projectId,
      }),
    ]);

    if (!project) throw new Error("Project not found");

    // Get current sprint or specified sprint
    const currentSprint = args.sprintId
      ? sprints.find((s: Doc<"sprints">) => s._id === args.sprintId)
      : sprints.find((s: Doc<"sprints">) => s.status === "active");

    // Calculate metrics
    const sprintTasks = currentSprint
      ? tasks.filter((t: Doc<"tasks">) => t.sprintId === currentSprint._id)
      : [];

    const completedTasks = sprintTasks.filter(
      (t: Doc<"tasks">) => t.status === "done",
    ).length;
    const totalTasks = sprintTasks.length;
    const inProgressTasks = sprintTasks.filter(
      (t: Doc<"tasks">) => t.status === "in_progress",
    ).length;

    // Detect blocked tasks: tasks that have dependencies where not all deps are done,
    // or tasks stuck in the same non-done status for >3 days with no updates
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const blockedTasks = sprintTasks.filter((t: Doc<"tasks">) => {
      if (
        t.status === "done" ||
        t.status === "cancelled" ||
        t.status === "backlog"
      )
        return false;
      // Check dependency-based blocking
      if (t.dependencies && t.dependencies.length > 0) {
        const depTasks = t.dependencies
          .map((depId: any) =>
            tasks.find((dt: Doc<"tasks">) => dt._id === depId),
          )
          .filter(Boolean);
        const hasUnfinishedDeps = depTasks.some(
          (dep: any) => dep && dep.status !== "done",
        );
        if (hasUnfinishedDeps) return true;
      }
      // Check stale tasks: in_progress or in_review with no update for 3+ days
      if (
        (t.status === "in_progress" || t.status === "in_review") &&
        now - t.updatedAt > THREE_DAYS_MS
      ) {
        return true;
      }
      return false;
    }).length;

    // Calculate velocity and trends
    const completedSprints = sprints
      .filter((s: Doc<"sprints">) => s.status === "completed")
      .slice(-5);
    const velocities = completedSprints.map((s: Doc<"sprints">) => {
      const sTasks = tasks.filter(
        (t: Doc<"tasks">) => t.sprintId === s._id && t.status === "done",
      );
      return sTasks.reduce(
        (sum: number, t: Doc<"tasks">) => sum + (t.estimate?.points || 0),
        0,
      );
    });
    const avgVelocity =
      velocities.length > 0
        ? velocities.reduce((a: number, b: number) => a + b, 0) /
          velocities.length
        : 0;

    // Current sprint velocity (points completed so far)
    const currentVelocity = sprintTasks
      .filter((t: Doc<"tasks">) => t.status === "done")
      .reduce(
        (sum: number, t: Doc<"tasks">) => sum + (t.estimate?.points || 0),
        0,
      );

    // Calculate sprint duration and elapsed time
    const sprintDaysTotal = currentSprint
      ? Math.max(
          1,
          Math.ceil(
            (currentSprint.endDate - currentSprint.startDate) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 1;
    const daysRemaining = currentSprint?.endDate
      ? Math.max(
          0,
          Math.ceil((currentSprint.endDate - now) / (1000 * 60 * 60 * 24)),
        )
      : 0;
    const daysElapsed = sprintDaysTotal - daysRemaining;
    const timeProgress =
      sprintDaysTotal > 0 ? (daysElapsed / sprintDaysTotal) * 100 : 0;
    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Improved health score: weighted combination of pace, completion, and blockers
    let healthScore = 100;
    if (currentSprint && totalTasks > 0) {
      // Pace factor: how completion rate compares to time elapsed
      const paceRatio = timeProgress > 0 ? completionRate / timeProgress : 1;
      const paceFactor = Math.min(paceRatio, 1.2); // Cap at 120% pace

      // Base score from pace (0-60 points)
      healthScore = Math.round(paceFactor * 50);

      // Completion bonus (0-30 points)
      healthScore += Math.round((completionRate / 100) * 30);

      // Blocker penalty (-5 per blocked task, max -20)
      healthScore -= Math.min(blockedTasks * 5, 20);

      // In-progress bonus (active work is good, 0-10 points)
      const activeRatio = totalTasks > 0 ? inProgressTasks / totalTasks : 0;
      healthScore += Math.round(Math.min(activeRatio * 40, 10));

      // Clamp to 0-100
      healthScore = Math.max(0, Math.min(100, healthScore));
    } else if (totalTasks === 0) {
      healthScore = 0;
    }

    // Determine prediction based on score
    let prediction: "on-track" | "at-risk" | "delayed" = "on-track";
    if (healthScore < 40) prediction = "delayed";
    else if (healthScore < 65) prediction = "at-risk";

    // Prepare data for AI analysis
    const analysisData: any = {
      project: {
        name: project.name,
        description: project.description,
      },
      sprint: currentSprint
        ? {
            name: currentSprint.name,
            startDate: currentSprint.startDate,
            endDate: currentSprint.endDate,
            progress: completionRate,
            daysRemaining,
            daysElapsed,
            sprintDaysTotal,
            timeProgress,
          }
        : null,
      metrics: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks,
        completionRate,
        avgVelocity,
        currentVelocity,
      },
      team: {
        size: team.length,
        workload: team.map((member: Doc<"users">) => ({
          name: member.name,
          tasksAssigned: tasks.filter(
            (t: Doc<"tasks">) => t.assigneeId === member._id,
          ).length,
          tasksCompleted: tasks.filter(
            (t: Doc<"tasks">) =>
              t.assigneeId === member._id && t.status === "done",
          ).length,
        })),
      },
      risks: [] as Array<{ type: string; severity: string; message: string }>,
    };

    // Identify risks
    if (analysisData.sprint) {
      if (daysRemaining < 3 && completionRate < 70) {
        analysisData.risks.push({
          type: "sprint_completion",
          severity: "high",
          message: "Sprint at risk of not completing on time",
        });
      }
      if (blockedTasks > 0) {
        analysisData.risks.push({
          type: "blockers",
          severity:
            blockedTasks > 3 ? "high" : blockedTasks > 1 ? "medium" : "low",
          message: `${blockedTasks} task${blockedTasks === 1 ? " is" : "s are"} blocked`,
        });
      }
      // Pace risk: falling behind
      if (timeProgress > 50 && completionRate < timeProgress * 0.5) {
        analysisData.risks.push({
          type: "pace",
          severity: "high",
          message: `Team has completed ${completionRate.toFixed(0)}% of tasks but ${timeProgress.toFixed(0)}% of sprint time has elapsed`,
        });
      }
      // Workload imbalance
      const workloads = analysisData.team.workload.map(
        (m: any) => m.tasksAssigned,
      );
      if (workloads.length > 1) {
        const maxLoad = Math.max(...workloads);
        const minLoad = Math.min(...workloads);
        if (maxLoad > 0 && maxLoad > minLoad * 3) {
          analysisData.risks.push({
            type: "workload_imbalance",
            severity: "medium",
            message:
              "Significant workload imbalance detected across team members",
          });
        }
      }
    }

    // Build the base insights result
    const baseInsights = {
      sprintHealth: {
        score: healthScore,
        prediction,
        confidence: currentSprint ? 0.85 : 0.5,
        suggestions: analysisData.risks.map((r: any) => r.message),
      },
      metrics: analysisData.metrics,
      risks: analysisData.risks,
      aiGenerated: false,
    };

    // Generate AI insights via the centralized generate action
    const systemPrompt = `You are a project management expert. You analyze software project data and return insights as JSON.

Output ONLY valid JSON. No markdown. No code fences. No explanation.

Return a JSON object with these exact fields:
{
  "sprintHealth": {
    "score": <number 0-100>,
    "prediction": "<one of: on-track, at-risk, delayed>",
    "confidence": <number 0.0-1.0>,
    "suggestions": ["array of actionable suggestion strings"]
  },
  "teamInsights": {
    "sentiment": "<one of: positive, neutral, concerned>",
    "observations": ["array of observation strings about team performance"]
  },
  "recommendations": ["array of 3 specific actionable recommendation strings"]
}

Start with { and end with }. No other text.`;

    const prompt = `Project: ${analysisData.project.name}
${analysisData.sprint ? `Sprint: ${analysisData.sprint.name} | Progress: ${analysisData.sprint.progress.toFixed(1)}% | Days remaining: ${analysisData.sprint.daysRemaining}` : "No active sprint"}
Tasks: ${analysisData.metrics.totalTasks} total, ${analysisData.metrics.completedTasks} done, ${analysisData.metrics.inProgressTasks} in progress, ${analysisData.metrics.blockedTasks} blocked
Velocity: ${analysisData.metrics.avgVelocity.toFixed(1)} avg, ${analysisData.metrics.currentVelocity} current
Team (${analysisData.team.size}): ${analysisData.team.workload.map((m: any) => `${m.name}: ${m.tasksAssigned} tasks (${m.tasksCompleted} done)`).join(", ")}
Risks: ${analysisData.risks.length > 0 ? analysisData.risks.map((r: any) => `[${r.severity}] ${r.message}`).join("; ") : "None"}

Return JSON insights.`;

    try {
      const aiResult: { text: string; model: string; provider: "cerebras" | "groq" } =
        await ctx.runAction(api.ai.generate.generate, {
          prompt,
          systemPrompt,
          functionCategory: "project_insights",
          temperature: 0.3,
          maxTokens: 1500,
        });

      let responseText = aiResult.text.trim();
      if (responseText.startsWith("```")) {
        responseText = responseText.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      }
      const aiInsights = JSON.parse(responseText);

      return {
        ...aiInsights,
        metrics: analysisData.metrics,
        risks: analysisData.risks,
        aiGenerated: true,
      };
    } catch (error) {
      console.error("AI generation failed:", error);
      // Fallback to computed insights
      return baseInsights;
    }
  },
});

// Generate smart task breakdown from natural language
export const generateTasksFromDescription = action({
  args: {
    projectId: v.id("projects"),
    description: v.string(),
    epicTitle: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    const project = await ctx.runQuery(internal.internalQueries.getProject, {
      projectId: args.projectId,
    });

    if (!project) throw new Error("Project not found");

    const systemPrompt = `You are a technical project manager for a software development team. You break down feature requests into specific, actionable tasks.

You output ONLY valid JSON. No markdown. No code fences. No explanation before or after.

=== OUTPUT FORMAT ===
Return a JSON object with a single "tasks" array. Each task object has EXACTLY these fields:
{
  "title": "string — clear, action-oriented title, max 100 characters",
  "description": "string — detailed description of what needs to be done",
  "type": "string — MUST be one of: task, feature, bug, improvement",
  "priority": "string — MUST be one of: low, medium, high, urgent",
  "estimatedPoints": "number — MUST be one of: 1, 2, 3, 5, 8, 13",
  "suggestedAssigneeRole": "string — MUST be one of: frontend, backend, fullstack, devops, qa",
  "dependencies": ["array of task title strings this depends on, can be empty []"],
  "acceptanceCriteria": ["array of specific criteria strings that must be met"]
}

=== RULES ===
- Generate 3-8 tasks per request
- Each task title must be unique and action-oriented (start with a verb: "Implement", "Create", "Add", "Fix", "Configure")
- estimatedPoints must be a number (not a string): 1, 2, 3, 5, 8, or 13
- type must be exactly one of: "task", "feature", "bug", "improvement" (lowercase)
- priority must be exactly one of: "low", "medium", "high", "urgent" (lowercase)
- suggestedAssigneeRole must be exactly one of: "frontend", "backend", "fullstack", "devops", "qa" (lowercase)
- dependencies array references other task titles from the same list (use empty array [] if none)
- acceptanceCriteria should have 2-5 specific, testable criteria per task

=== EXAMPLE OUTPUT ===
{"tasks":[{"title":"Create user registration API endpoint","description":"Build POST /api/auth/register endpoint with email, password, and name validation. Hash passwords with bcrypt. Return JWT token on success.","type":"feature","priority":"high","estimatedPoints":5,"suggestedAssigneeRole":"backend","dependencies":[],"acceptanceCriteria":["Accepts email, password, name in request body","Validates email format and password strength","Returns 201 with JWT token on success","Returns 400 with validation errors on invalid input","Passwords are hashed before storage"]},{"title":"Build registration form UI","description":"Create a responsive registration form with email, password, confirm password, and name fields. Client-side validation with error messages.","type":"feature","priority":"high","estimatedPoints":3,"suggestedAssigneeRole":"frontend","dependencies":["Create user registration API endpoint"],"acceptanceCriteria":["Form has all required fields","Client-side validation shows inline errors","Submit calls the registration API","Success redirects to dashboard","Loading state shown during submission"]}]}

=== FINAL REMINDER ===
Output ONLY the JSON object starting with { and ending with }. No text before or after.`;

    const prompt = `Project: ${project.name}
Feature Request: ${args.description}
${args.epicTitle ? `Epic Title: ${args.epicTitle}` : ""}

Break this into 3-8 specific development tasks. Return ONLY the JSON object.`;

    try {
      const aiResult: { text: string; model: string; provider: "cerebras" | "groq" } =
        await ctx.runAction(api.ai.generate.generate, {
          prompt,
          systemPrompt,
          functionCategory: "task_generation",
          temperature: 0.4,
          maxTokens: 3000,
        });

      let responseText = aiResult.text.trim();
      if (responseText.startsWith("```")) {
        responseText = responseText.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      }

      const result = JSON.parse(responseText);

      return {
        tasks: result.tasks,
        epicSummary:
          args.epicTitle ||
          `Generated from: ${args.description.substring(0, 50)}...`,
        aiGenerated: true,
      };
    } catch (error) {
      console.error("Task generation failed:", error);
      throw new Error("Failed to generate tasks. Please try again.");
    }
  },
});

// Generate daily standup summary
export const generateStandupSummary = action({
  args: {
    projectId: v.id("projects"),
    date: v.optional(v.string()), // ISO date string, defaults to today
  },
  handler: async (ctx, args): Promise<any> => {
    const targetDate = args.date || new Date().toISOString().split("T")[0];
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch relevant data
    const [tasks, commits, pullRequests, team]: [
      Doc<"tasks">[],
      any,
      any,
      Doc<"users">[],
    ] = await Promise.all([
      ctx.runQuery(internal.internalQueries.getProjectTasks, {
        projectId: args.projectId,
      }),
      // GitHub integration - temporarily disabled
      Promise.resolve({ commits: [], pullRequests: [] }), // ctx.runQuery(internal.integrations.github.getProjectRecentActivity, {
      //  projectId: args.projectId,
      //  limit: 50,
      // }),
      ctx.runQuery(internal.internalQueries.getProjectMeetings, {
        projectId: args.projectId,
      }),
      ctx.runQuery(internal.internalQueries.getProjectTeam, {
        projectId: args.projectId,
      }),
    ]);

    // Filter for today's activity
    const todaysTasks: Doc<"tasks">[] = tasks.filter((t: Doc<"tasks">) => {
      const updatedAt = new Date(t.updatedAt);
      return updatedAt >= startOfDay && updatedAt <= endOfDay;
    });

    const completedToday: Doc<"tasks">[] = todaysTasks.filter(
      (t: Doc<"tasks">) => t.status === "done",
    );
    const startedToday = todaysTasks.filter(
      (t: Doc<"tasks">) => t.status === "in_progress",
    );
    // Note: blocked field doesn't exist in schema
    const blockedTasks: Doc<"tasks">[] = []; // Placeholder - needs business logic

    // Get today's commits and PRs from the activity
    const todaysCommits =
      commits?.commits?.filter((c: any) => {
        const commitDate = new Date(c.timestamp);
        return commitDate >= startOfDay && commitDate <= endOfDay;
      }) || [];

    const todaysPRs =
      commits?.pullRequests?.filter((pr: any) => {
        const prDate = new Date(pr.updatedAt || pr.createdAt);
        return prDate >= startOfDay && prDate <= endOfDay;
      }) || [];

    // Build summary data
    const summaryData: any = {
      date: targetDate,
      completed: {
        tasks: completedToday.length,
        commits: todaysCommits.length,
        prsOpened: todaysPRs.filter((pr: any) => pr.state === "open").length,
        prsMerged: todaysPRs.filter((pr: any) => pr.state === "merged").length,
      },
      inProgress: {
        tasks: startedToday.length,
        prsInReview: todaysPRs.filter(
          (pr: any) => pr.state === "open" && !pr.draft,
        ).length,
      },
      blockers: blockedTasks.map((t: Doc<"tasks">) => ({
        title: t.title,
        assignee: t.assigneeId,
        blockedSince: t.updatedAt,
      })),
      highlights: [] as string[],
    };

    // Add highlights
    if (completedToday.length > 5) {
      summaryData.highlights.push(
        `🎉 ${completedToday.length} tasks completed today!`,
      );
    }
    if (todaysPRs.filter((pr: any) => pr.state === "merged").length > 0) {
      summaryData.highlights.push(
        `✅ ${todaysPRs.filter((pr: any) => pr.state === "merged").length} PRs merged`,
      );
    }
    if (blockedTasks.length > 0) {
      summaryData.highlights.push(
        `⚠️ ${blockedTasks.length} tasks currently blocked`,
      );
    }

    // Generate AI-enhanced summary via centralized generate action
    const standupSystemPrompt = `You are a standup meeting summarizer. You analyze daily activity data and return a concise summary as JSON.

Output ONLY valid JSON. No markdown. No code fences. No explanation.

Return a JSON object with these exact fields:
{
  "narrative": "string — 2-3 sentence summary suitable for a standup meeting",
  "keyAchievements": ["array of 2-3 notable accomplishment strings"],
  "focusAreas": ["array of 2-3 things the team should focus on"],
  "teamMood": "string — MUST be one of: energized, productive, normal, struggling"
}

Start with { and end with }. No other text.`;

    const standupPrompt = `Date: ${targetDate}
Done: ${summaryData.completed.tasks} tasks, ${summaryData.completed.commits} commits, ${summaryData.completed.prsMerged} PRs merged
In Progress: ${summaryData.inProgress.tasks} tasks, ${summaryData.inProgress.prsInReview} PRs in review
${blockedTasks.length > 0 ? `Blocked (${blockedTasks.length}): ${blockedTasks.slice(0, 3).map((t: Doc<"tasks">) => t.title).join(", ")}` : "No blockers"}

Return JSON standup summary.`;

    try {
      const aiResult: { text: string; model: string; provider: "cerebras" | "groq" } =
        await ctx.runAction(api.ai.generate.generate, {
          prompt: standupPrompt,
          systemPrompt: standupSystemPrompt,
          functionCategory: "standup_summary",
          temperature: 0.4,
          maxTokens: 800,
        });

      let responseText = aiResult.text.trim();
      if (responseText.startsWith("```")) {
        responseText = responseText.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      }
      const aiSummary = JSON.parse(responseText);

      return {
        summary: summaryData,
        ...aiSummary,
        aiGenerated: true,
      };
    } catch (error) {
      console.error("AI summary generation failed:", error);
      // Fallback to basic summary
      return {
        summary: summaryData,
        narrative: `Today: ${summaryData.completed.tasks} tasks completed, ${summaryData.inProgress.tasks} in progress${blockedTasks.length > 0 ? `, ${blockedTasks.length} blocked` : ""}.`,
        aiGenerated: false,
      };
    }
  },
});
