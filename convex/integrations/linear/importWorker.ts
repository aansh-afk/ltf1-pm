import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type { LinearCycle, LinearIssue, LinearPageInfo } from "./types";

const LINEAR_GRAPHQL_URL = "https://api.linear.app/graphql";

async function linearGraphQL<T>(
  apiKey: string,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const res = await fetch(LINEAR_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(
      `Linear API ${res.status}: ${(await res.text()).slice(0, 300)}`,
    );
  }
  const body = (await res.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };
  if (body.errors?.length) {
    throw new Error(
      `Linear GraphQL: ${body.errors.map((e) => e.message).join("; ")}`,
    );
  }
  if (!body.data) throw new Error("Linear response missing data");
  return body.data;
}

function mapPriority(
  linearPriority: number,
): "urgent" | "high" | "medium" | "low" {
  switch (linearPriority) {
    case 1:
      return "urgent";
    case 2:
      return "high";
    case 3:
      return "medium";
    case 4:
      return "low";
    default:
      return "medium";
  }
}

function mapStatus(
  stateType: string,
):
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "cancelled" {
  switch (stateType) {
    case "backlog":
      return "backlog";
    case "unstarted":
      return "todo";
    case "started":
      return "in_progress";
    case "completed":
      return "done";
    case "canceled":
      return "cancelled";
    default:
      return "todo";
  }
}

function parseTimestamp(iso: string | null | undefined): number | undefined {
  if (!iso) return undefined;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? undefined : t;
}

export const run = internalAction({
  args: {
    importId: v.id("imports"),
    apiKey: v.string(),
    workspaceId: v.id("workspaces"),
    teamId: v.string(),
    teamName: v.string(),
    teamKey: v.string(),
    targetProjectId: v.optional(v.id("projects")),
    triggeredBy: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const progress = {
      projectsCreated: 0,
      tasksCreated: 0,
      tasksUpdated: 0,
      tasksSkipped: 0,
      sprintsCreated: 0,
      total: 0,
      currentStep: "Starting import",
    };

    try {
      await ctx.runMutation(internal.integrations.imports.updateImportProgress, {
        importId: args.importId,
        status: "running",
        progress: { ...progress, currentStep: "Fetching team metadata" },
      });

      // 1) Resolve or create the target project.
      let projectId: Id<"projects">;
      if (args.targetProjectId) {
        projectId = args.targetProjectId;
      } else {
        projectId = await ctx.runMutation(
          internal.integrations.linear.mutations.createImportedProject,
          {
            workspaceId: args.workspaceId,
            reporterId: args.triggeredBy,
            name: args.teamName,
            key: args.teamKey,
            externalId: args.teamId,
            externalKey: args.teamKey,
            externalUrl: `https://linear.app/team/${args.teamKey}`,
            description: `Imported from Linear team ${args.teamKey}`,
            importSource: "linear",
          },
        );
        progress.projectsCreated = 1;
      }

      // 2) Fetch cycles for this team and create sprints.
      progress.currentStep = "Fetching cycles";
      await ctx.runMutation(internal.integrations.imports.updateImportProgress, {
        importId: args.importId,
        progress,
      });

      const cyclesData = await linearGraphQL<{
        team: {
          cycles: { nodes: Array<LinearCycle> };
        };
      }>(
        args.apiKey,
        `query($teamId: String!) {
          team(id: $teamId) {
            cycles(first: 100) {
              nodes { id number name startsAt endsAt completedAt }
            }
          }
        }`,
        { teamId: args.teamId },
      );

      const cycleIdToSprintId = new Map<string, Id<"sprints">>();
      for (const cycle of cyclesData.team.cycles.nodes) {
        const start = parseTimestamp(cycle.startsAt);
        const end = parseTimestamp(cycle.endsAt);
        if (start === undefined || end === undefined) continue;
        const sprintId: Id<"sprints"> = await ctx.runMutation(
          internal.integrations.linear.mutations.createImportedSprint,
          {
            projectId,
            name: cycle.name ?? `Cycle ${cycle.number}`,
            startDate: start,
            endDate: end,
            status: cycle.completedAt
              ? "completed"
              : start <= Date.now() && Date.now() <= end
                ? "active"
                : "planning",
          },
        );
        cycleIdToSprintId.set(cycle.id, sprintId);
        progress.sprintsCreated += 1;
      }

      // 3) Paginate through all issues for the team.
      progress.currentStep = "Importing issues";
      await ctx.runMutation(internal.integrations.imports.updateImportProgress, {
        importId: args.importId,
        progress,
      });

      let cursor: string | null = null;
      let hasNext = true;
      const pageSize = 50;

      type IssuesPage = {
        team: {
          issues: {
            nodes: Array<LinearIssue>;
            pageInfo: LinearPageInfo;
          };
        };
      };

      while (hasNext) {
        const page: IssuesPage = await linearGraphQL<IssuesPage>(
          args.apiKey,
          `query($teamId: String!, $first: Int!, $after: String) {
            team(id: $teamId) {
              issues(first: $first, after: $after) {
                pageInfo { hasNextPage endCursor }
                nodes {
                  id identifier number title description url priority
                  estimate createdAt updatedAt completedAt dueDate startedAt
                  state { id name type }
                  labels(first: 20) { nodes { id name } }
                  cycle { id }
                  parent { id }
                }
              }
            }
          }`,
          { teamId: args.teamId, first: pageSize, after: cursor },
        );

        const issues = page.team.issues.nodes;
        for (const issue of issues) {
          const sprintId = issue.cycle
            ? cycleIdToSprintId.get(issue.cycle.id)
            : undefined;

          const result: { taskId: Id<"tasks">; created: boolean } =
            await ctx.runMutation(
              internal.integrations.linear.mutations.upsertImportedTask,
              {
                projectId,
                reporterId: args.triggeredBy,
                importSource: "linear",
                externalId: issue.id,
                externalKey: issue.identifier,
                externalUrl: issue.url,
                title: issue.title,
                description: issue.description ?? undefined,
                status: mapStatus(issue.state.type),
                priority: mapPriority(issue.priority),
                type: "task",
                labels: issue.labels.nodes.map((l: { name: string }) => l.name),
                dueDate: parseTimestamp(issue.dueDate),
                startDate: parseTimestamp(issue.startedAt),
                completedAt: parseTimestamp(issue.completedAt),
                estimatePoints: issue.estimate ?? undefined,
                sprintId,
              },
            );

          if (result.created) progress.tasksCreated += 1;
          else progress.tasksUpdated += 1;
          progress.total += 1;
        }

        // Report progress after each page.
        await ctx.runMutation(
          internal.integrations.imports.updateImportProgress,
          { importId: args.importId, progress: { ...progress } },
        );

        hasNext = page.team.issues.pageInfo.hasNextPage;
        cursor = page.team.issues.pageInfo.endCursor;
      }

      progress.currentStep = "Completed";
      await ctx.runMutation(internal.integrations.imports.updateImportProgress, {
        importId: args.importId,
        status: "completed",
        progress,
        completedAt: Date.now(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await ctx.runMutation(internal.integrations.imports.updateImportProgress, {
        importId: args.importId,
        status: "failed",
        progress,
        error: message,
        completedAt: Date.now(),
      });
    }
    return null;
  },
});
