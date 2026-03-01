import { v } from "convex/values";
import { action, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
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

    // Resolve API key: platform env vars (beta: all users get AI)
    const userApiKey = process.env.CEREBRAS_API_KEY || process.env.GROQ_API_KEY;

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

    if (!userApiKey) {
      return baseInsights;
    }

    // Generate AI insights
    const prompt = `
You are a project management expert analyzing a software project. Based on the following data, provide insights:

Project: ${analysisData.project.name}
${
  analysisData.sprint
    ? `
Current Sprint: ${analysisData.sprint.name}
Progress: ${analysisData.sprint.progress.toFixed(1)}% tasks complete
Time Elapsed: ${analysisData.sprint.daysElapsed} of ${analysisData.sprint.sprintDaysTotal} days (${analysisData.sprint.timeProgress.toFixed(0)}%)
Days Remaining: ${analysisData.sprint.daysRemaining}
`
    : "No active sprint"
}

Metrics:
- Total Tasks: ${analysisData.metrics.totalTasks}
- Completed: ${analysisData.metrics.completedTasks}
- In Progress: ${analysisData.metrics.inProgressTasks}
- Blocked: ${analysisData.metrics.blockedTasks}
- Average Velocity: ${analysisData.metrics.avgVelocity.toFixed(1)} points/sprint
- Current Velocity: ${analysisData.metrics.currentVelocity} points

Team (${analysisData.team.size} members):
${analysisData.team.workload.map((m: any) => `- ${m.name}: ${m.tasksAssigned} tasks (${m.tasksCompleted} completed)`).join("\n")}

Identified Risks:
${analysisData.risks.length > 0 ? analysisData.risks.map((r: any) => `- [${r.severity.toUpperCase()}] ${r.message}`).join("\n") : "None identified"}

Provide a JSON response with:
1. sprintHealth: { score (0-100), prediction ("on-track", "at-risk", or "delayed"), confidence (0-1), suggestions (array of actionable suggestions) }
2. teamInsights: { sentiment ("positive", "neutral", or "concerned"), observations (array of observations about team performance) }
3. recommendations: Array of 3 specific actionable recommendations

Response must be valid JSON only, no markdown or explanation.`;

    try {
      const aiResponse = await ctx.runAction(
        internal.internalQueries.generateWithAI,
        {
          prompt,
          model: "gpt-oss-120b",
          complexity: "high",
          temperature: 0.3,
          apiKey: userApiKey,
        },
      );

      const aiInsights = JSON.parse(aiResponse);

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

    // Resolve API key: platform env vars (beta: all users get AI)
    const userApiKey = process.env.CEREBRAS_API_KEY || process.env.GROQ_API_KEY;

    if (!userApiKey) {
      throw new Error(
        "AI features require API key setup. Set CEREBRAS_API_KEY or GROQ_API_KEY in your Convex environment.",
      );
    }

    const prompt = `
You are a technical project manager. Break down the following feature request into specific, actionable tasks for a software development team.

Project Context: ${project.name}
Feature Request: ${args.description}
${args.epicTitle ? `Epic Title: ${args.epicTitle}` : ""}

Generate 3-8 specific tasks that would be needed to implement this feature. For each task provide:
1. title: Clear, action-oriented title (max 100 chars)
2. description: Detailed description of what needs to be done
3. type: One of "task", "feature", "bug", "improvement"
4. priority: One of "low", "medium", "high", "urgent"
5. estimatedPoints: Story points estimate (1, 2, 3, 5, 8, or 13)
6. suggestedAssigneeRole: One of "frontend", "backend", "fullstack", "devops", "qa"
7. dependencies: Array of task titles this depends on (can be empty)
8. acceptanceCriteria: Array of specific criteria that must be met

Response must be a valid JSON object with a "tasks" array containing the task objects. No markdown or explanation.`;

    try {
      const aiResponse = await ctx.runAction(
        internal.internalQueries.generateWithAI,
        {
          prompt,
          model: "gpt-oss-120b",
          complexity: "medium",
          temperature: 0.7,
          apiKey: userApiKey,
        },
      );

      const result = JSON.parse(aiResponse);

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

    // Resolve API key: platform env vars (beta: all users get AI)
    const userApiKey = process.env.CEREBRAS_API_KEY || process.env.GROQ_API_KEY;

    if (!userApiKey) {
      // Return basic summary without AI
      return {
        summary: summaryData,
        narrative: `Today: ${summaryData.completed.tasks} tasks completed, ${summaryData.inProgress.tasks} in progress${blockedTasks.length > 0 ? `, ${blockedTasks.length} blocked` : ""}.`,
        aiGenerated: false,
      };
    }

    // Generate AI-enhanced summary
    const prompt = `
Generate a concise daily standup summary for a software team based on this activity:

Date: ${targetDate}

Completed Today:
- ${summaryData.completed.tasks} tasks
- ${summaryData.completed.commits} commits
- ${summaryData.completed.prsMerged} PRs merged

In Progress:
- ${summaryData.inProgress.tasks} tasks
- ${summaryData.inProgress.prsInReview} PRs in review

${
  blockedTasks.length > 0
    ? `
Blockers (${blockedTasks.length}):
${blockedTasks
  .slice(0, 3)
  .map((t: Doc<"tasks">) => `- ${t.title}`)
  .join("\n")}
`
    : "No blockers"
}

Provide a JSON response with:
1. narrative: A 2-3 sentence summary suitable for a standup meeting
2. keyAchievements: Array of 2-3 notable accomplishments
3. focusAreas: Array of 2-3 things the team should focus on
4. teamMood: One of "energized", "productive", "normal", "struggling"

Response must be valid JSON only.`;

    try {
      const aiResponse = await ctx.runAction(
        internal.internalQueries.generateWithAI,
        {
          prompt,
          model: "gpt-oss-120b",
          complexity: "low",
          temperature: 0.5,
          apiKey: userApiKey,
        },
      );

      const aiSummary = JSON.parse(aiResponse);

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
