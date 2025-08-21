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
    const [project, tasks, sprints, team]: [Doc<"projects"> | null, Doc<"tasks">[], Doc<"sprints">[], Doc<"users">[]] = await Promise.all([
      ctx.runQuery(internal.internalQueries.getProject, { projectId: args.projectId }),
      ctx.runQuery(internal.internalQueries.getProjectTasks, { projectId: args.projectId }),
      ctx.runQuery(internal.internalQueries.getProjectSprints, { projectId: args.projectId }),
      ctx.runQuery(internal.internalQueries.getProjectTeam, { projectId: args.projectId }),
    ]);

    if (!project) throw new Error("Project not found");

    // Get current sprint or specified sprint
    const currentSprint = args.sprintId 
      ? sprints.find((s: Doc<"sprints">) => s._id === args.sprintId)
      : sprints.find((s: Doc<"sprints">) => s.status === 'active');

    // Calculate metrics
    const sprintTasks = currentSprint 
      ? tasks.filter((t: Doc<"tasks">) => t.sprintId === currentSprint._id)
      : [];

    const completedTasks = sprintTasks.filter((t: Doc<"tasks">) => t.status === 'done').length;
    const totalTasks = sprintTasks.length;
    const inProgressTasks = sprintTasks.filter((t: Doc<"tasks">) => t.status === 'in_progress').length;
    // Note: blocked field doesn't exist in schema, using status for blocked detection
    const blockedTasks = 0; // Placeholder - needs business logic for what constitutes 'blocked'

    // Calculate velocity and trends
    const completedSprints = sprints.filter((s: Doc<"sprints">) => s.status === 'completed').slice(-5);
    const velocities = completedSprints.map((s: Doc<"sprints">) => {
      const sprintTasks = tasks.filter((t: Doc<"tasks">) => t.sprintId === s._id && t.status === 'done');
      return sprintTasks.reduce((sum: number, t: Doc<"tasks">) => sum + (t.estimate?.points || 0), 0);
    });
    const avgVelocity = velocities.length > 0 
      ? velocities.reduce((a: number, b: number) => a + b, 0) / velocities.length 
      : 0;

    // Prepare data for AI analysis
    const analysisData: any = {
      project: {
        name: project.name,
        description: project.description,
      },
      sprint: currentSprint ? {
        name: currentSprint.name,
        startDate: currentSprint.startDate,
        endDate: currentSprint.endDate,
        progress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        daysRemaining: currentSprint.endDate 
          ? Math.ceil((new Date(currentSprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : 0,
      } : null,
      metrics: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        avgVelocity,
        currentVelocity: completedTasks,
      },
      team: {
        size: team.length,
        workload: team.map((member: Doc<"users">) => ({
          name: member.name,
          tasksAssigned: tasks.filter((t: Doc<"tasks">) => t.assigneeId === member._id).length,
          tasksCompleted: tasks.filter((t: Doc<"tasks">) => t.assigneeId === member._id && t.status === 'done').length,
        })),
      },
      risks: [] as Array<{ type: string; severity: string; message: string; }>,
    };

    // Identify risks
    if (analysisData.sprint) {
      if (analysisData.sprint.daysRemaining < 3 && analysisData.metrics.completionRate < 70) {
        analysisData.risks.push({
          type: 'sprint_completion',
          severity: 'high',
          message: 'Sprint at risk of not completing on time',
        });
      }
      if (blockedTasks > 2) {
        analysisData.risks.push({
          type: 'blockers',
          severity: 'medium',
          message: `${blockedTasks} tasks are blocked`,
        });
      }
    }

    // Get user's API key
    const userApiKey = await ctx.runQuery(internal.internalQueries.getUserApiKey, {});
    
    if (!userApiKey) {
      // Return basic insights without AI
      return {
        sprintHealth: {
          score: Math.round(analysisData.metrics.completionRate),
          prediction: analysisData.metrics.completionRate > 70 ? "on-track" : "at-risk",
          confidence: 0.75,
          suggestions: analysisData.risks.map((r: any) => r.message),
        },
        metrics: analysisData.metrics,
        risks: analysisData.risks,
        aiGenerated: false,
      };
    }

    // Generate AI insights using Gemini
    const prompt = `
You are a project management expert analyzing a software project. Based on the following data, provide insights:

Project: ${analysisData.project.name}
${analysisData.sprint ? `
Current Sprint: ${analysisData.sprint.name}
Progress: ${analysisData.sprint.progress.toFixed(1)}%
Days Remaining: ${analysisData.sprint.daysRemaining}
` : 'No active sprint'}

Metrics:
- Total Tasks: ${analysisData.metrics.totalTasks}
- Completed: ${analysisData.metrics.completedTasks}
- In Progress: ${analysisData.metrics.inProgressTasks}
- Blocked: ${analysisData.metrics.blockedTasks}
- Average Velocity: ${analysisData.metrics.avgVelocity.toFixed(1)} points/sprint
- Current Velocity: ${analysisData.metrics.currentVelocity} points

Team (${analysisData.team.size} members):
${analysisData.team.workload.map((m: any) => `- ${m.name}: ${m.tasksAssigned} tasks (${m.tasksCompleted} completed)`).join('\n')}

Provide a JSON response with:
1. sprintHealth: { score (0-100), prediction ("on-track", "at-risk", or "delayed"), confidence (0-1), suggestions (array of actionable suggestions) }
2. teamInsights: { sentiment ("positive", "neutral", or "concerned"), observations (array of observations about team performance) }
3. recommendations: Array of 3 specific actionable recommendations

Response must be valid JSON only, no markdown or explanation.`;

    try {
      const aiResponse = await ctx.runAction(internal.internalQueries.generateWithGemini, {
        prompt,
        model: "gemini-2.0-flash-exp",
        temperature: 0.3,
        apiKey: userApiKey,
      });

      const aiInsights = JSON.parse(aiResponse);
      
      return {
        ...aiInsights,
        metrics: analysisData.metrics,
        risks: analysisData.risks,
        aiGenerated: true,
      };
    } catch (error) {
      console.error("AI generation failed:", error);
      // Fallback to basic insights
      return {
        sprintHealth: {
          score: Math.round(analysisData.metrics.completionRate),
          prediction: analysisData.metrics.completionRate > 70 ? "on-track" : "at-risk",
          confidence: 0.75,
          suggestions: analysisData.risks.map((r: any) => r.message),
        },
        metrics: analysisData.metrics,
        risks: analysisData.risks,
        aiGenerated: false,
      };
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
      projectId: args.projectId 
    });
    
    if (!project) throw new Error("Project not found");

    // Get user's API key
    const userApiKey = await ctx.runQuery(internal.internalQueries.getUserApiKey, {});
    
    if (!userApiKey) {
      throw new Error("AI features require API key setup");
    }

    const prompt = `
You are a technical project manager. Break down the following feature request into specific, actionable tasks for a software development team.

Project Context: ${project.name}
Feature Request: ${args.description}
${args.epicTitle ? `Epic Title: ${args.epicTitle}` : ''}

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
      const aiResponse = await ctx.runAction(internal.internalQueries.generateWithGemini, {
        prompt,
        model: "gemini-2.0-flash-exp",
        temperature: 0.7,
        apiKey: userApiKey,
      });

      const result = JSON.parse(aiResponse);
      
      return {
        tasks: result.tasks,
        epicSummary: args.epicTitle || `Generated from: ${args.description.substring(0, 50)}...`,
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
    const targetDate = args.date || new Date().toISOString().split('T')[0];
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch relevant data
    const [tasks, commits, pullRequests, team]: [Doc<"tasks">[], any, any, Doc<"users">[]] = await Promise.all([
      ctx.runQuery(internal.internalQueries.getProjectTasks, { projectId: args.projectId }),
      // GitHub integration - temporarily disabled
      Promise.resolve({ commits: [], pullRequests: [] }), // ctx.runQuery(internal.integrations.github.getProjectRecentActivity, { 
      //  projectId: args.projectId,
      //  limit: 50,
      // }),
      ctx.runQuery(internal.internalQueries.getProjectMeetings, { projectId: args.projectId }),
      ctx.runQuery(internal.internalQueries.getProjectTeam, { projectId: args.projectId }),
    ]);

    // Filter for today's activity
    const todaysTasks: Doc<"tasks">[] = tasks.filter((t: Doc<"tasks">) => {
      const updatedAt = new Date(t.updatedAt);
      return updatedAt >= startOfDay && updatedAt <= endOfDay;
    });

    const completedToday: Doc<"tasks">[] = todaysTasks.filter((t: Doc<"tasks">) => t.status === 'done');
    const startedToday = todaysTasks.filter((t: Doc<"tasks">) => t.status === 'in_progress');
    // Note: blocked field doesn't exist in schema
    const blockedTasks: Doc<"tasks">[] = []; // Placeholder - needs business logic

    // Get today's commits and PRs from the activity
    const todaysCommits = commits?.commits?.filter((c: any) => {
      const commitDate = new Date(c.timestamp);
      return commitDate >= startOfDay && commitDate <= endOfDay;
    }) || [];

    const todaysPRs = commits?.pullRequests?.filter((pr: any) => {
      const prDate = new Date(pr.updatedAt || pr.createdAt);
      return prDate >= startOfDay && prDate <= endOfDay;
    }) || [];

    // Build summary data
    const summaryData: any = {
      date: targetDate,
      completed: {
        tasks: completedToday.length,
        commits: todaysCommits.length,
        prsOpened: todaysPRs.filter((pr: any) => pr.state === 'open').length,
        prsMerged: todaysPRs.filter((pr: any) => pr.state === 'merged').length,
      },
      inProgress: {
        tasks: startedToday.length,
        prsInReview: todaysPRs.filter((pr: any) => pr.state === 'open' && !pr.draft).length,
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
      summaryData.highlights.push(`🎉 ${completedToday.length} tasks completed today!`);
    }
    if (todaysPRs.filter((pr: any) => pr.state === 'merged').length > 0) {
      summaryData.highlights.push(`✅ ${todaysPRs.filter((pr: any) => pr.state === 'merged').length} PRs merged`);
    }
    if (blockedTasks.length > 0) {
      summaryData.highlights.push(`⚠️ ${blockedTasks.length} tasks currently blocked`);
    }

    // Get user's API key for enhanced summary
    const userApiKey = await ctx.runQuery(internal.internalQueries.getUserApiKey, {});
    
    if (!userApiKey) {
      // Return basic summary without AI
      return {
        summary: summaryData,
        narrative: `Today: ${summaryData.completed.tasks} tasks completed, ${summaryData.inProgress.tasks} in progress${blockedTasks.length > 0 ? `, ${blockedTasks.length} blocked` : ''}.`,
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

${blockedTasks.length > 0 ? `
Blockers (${blockedTasks.length}):
${blockedTasks.slice(0, 3).map((t: Doc<"tasks">) => `- ${t.title}`).join('\n')}
` : 'No blockers'}

Provide a JSON response with:
1. narrative: A 2-3 sentence summary suitable for a standup meeting
2. keyAchievements: Array of 2-3 notable accomplishments
3. focusAreas: Array of 2-3 things the team should focus on
4. teamMood: One of "energized", "productive", "normal", "struggling"

Response must be valid JSON only.`;

    try {
      const aiResponse = await ctx.runAction(internal.internalQueries.generateWithGemini, {
        prompt,
        model: "gemini-2.0-flash-exp",
        temperature: 0.5,
        apiKey: userApiKey,
      });

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
        narrative: `Today: ${summaryData.completed.tasks} tasks completed, ${summaryData.inProgress.tasks} in progress${blockedTasks.length > 0 ? `, ${blockedTasks.length} blocked` : ''}.`,
        aiGenerated: false,
      };
    }
  },
});