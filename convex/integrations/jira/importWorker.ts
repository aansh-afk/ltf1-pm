import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import type {
  JiraIssue,
  JiraSearchResult,
  JiraSprint,
  JiraStatus,
} from "./types";
import { jiraRequest } from "./import";

function mapPriority(
  name: string | undefined,
): "urgent" | "high" | "medium" | "low" {
  switch ((name ?? "").toLowerCase()) {
    case "highest":
      return "urgent";
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
    case "lowest":
      return "low";
    default:
      return "medium";
  }
}

function mapStatus(
  status: JiraStatus,
):
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "cancelled" {
  const name = status.name.toLowerCase();
  if (/(backlog)/.test(name)) return "backlog";
  if (/(review)/.test(name)) return "in_review";
  if (/(cancel|won'?t do|abandoned)/.test(name)) return "cancelled";
  if (/(in\s*progress|doing|started)/.test(name)) return "in_progress";
  if (/(done|closed|resolved|complete)/.test(name)) return "done";
  if (/(to\s*do|open|new|ready)/.test(name)) return "todo";

  switch (status.statusCategory.key) {
    case "new":
      return "todo";
    case "indeterminate":
      return "in_progress";
    case "done":
      return "done";
    default:
      return "todo";
  }
}

function mapType(
  jiraTypeName: string,
): "feature" | "bug" | "improvement" | "task" | "epic" {
  const name = jiraTypeName.toLowerCase();
  if (name === "bug") return "bug";
  if (name === "epic") return "epic";
  if (name === "story" || name === "feature") return "feature";
  if (name === "improvement") return "improvement";
  return "task";
}

function parseTimestamp(s: string | undefined | null): number | undefined {
  if (!s) return undefined;
  const t = Date.parse(s);
  return Number.isNaN(t) ? undefined : t;
}

/**
 * Walk an ADF (Atlassian Document Format) tree and extract plain text.
 * ADF nodes shape: { type, text?, content?: Node[] }
 */
function adfToPlainText(node: unknown): string {
  if (node === null || node === undefined) return "";
  if (typeof node === "string") return node;
  if (typeof node !== "object") return "";
  const n = node as { type?: string; text?: string; content?: Array<unknown> };
  if (typeof n.text === "string") return n.text;
  if (Array.isArray(n.content)) {
    const parts = n.content.map((c) => adfToPlainText(c));
    // Insert line breaks between block-level nodes for readability.
    if (n.type === "paragraph" || n.type === "heading") {
      return parts.join("") + "\n";
    }
    if (n.type === "doc" || n.type === "bulletList" || n.type === "orderedList") {
      return parts.join("");
    }
    return parts.join("");
  }
  return "";
}

function extractSprintFromIssue(issue: JiraIssue): JiraSprint | undefined {
  const raw = issue.fields.customfield_10020;
  if (!raw) return undefined;
  if (Array.isArray(raw)) {
    // Prefer active > future > closed.
    const active = raw.find((s) => s.state === "active");
    const future = raw.find((s) => s.state === "future");
    return active ?? future ?? raw[0];
  }
  return raw;
}

export const run = internalAction({
  args: {
    importId: v.id("imports"),
    host: v.string(),
    email: v.string(),
    apiToken: v.string(),
    workspaceId: v.id("workspaces"),
    projectId: v.string(),
    projectKey: v.string(),
    projectName: v.string(),
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
        progress: { ...progress, currentStep: "Resolving target project" },
      });

      let ltf1ProjectId: Id<"projects">;
      if (args.targetProjectId) {
        ltf1ProjectId = args.targetProjectId;
      } else {
        ltf1ProjectId = await ctx.runMutation(
          internal.integrations.jira.mutations.createImportedProject,
          {
            workspaceId: args.workspaceId,
            reporterId: args.triggeredBy,
            name: args.projectName,
            key: args.projectKey,
            externalId: args.projectId,
            externalKey: args.projectKey,
            externalUrl: `https://${args.host}/browse/${args.projectKey}`,
            description: `Imported from Jira project ${args.projectKey}`,
          },
        );
        progress.projectsCreated = 1;
      }

      progress.currentStep = "Fetching issues";
      await ctx.runMutation(internal.integrations.imports.updateImportProgress, {
        importId: args.importId,
        progress,
      });

      // Track sprints we've already materialized during this run.
      const sprintIdToLtf1: Map<number, Id<"sprints">> = new Map();

      let startAt = 0;
      const pageSize = 100;
      let total = Infinity;
      const jql = encodeURIComponent(`project = "${args.projectKey}"`);
      const fields = [
        "summary",
        "description",
        "status",
        "priority",
        "issuetype",
        "labels",
        "duedate",
        "created",
        "updated",
        "resolutiondate",
        "customfield_10016", // story points
        "customfield_10020", // sprint
      ].join(",");

      while (startAt < total) {
        const page = await jiraRequest<JiraSearchResult>(
          args.host,
          args.email,
          args.apiToken,
          `/rest/api/3/search?jql=${jql}&fields=${fields}&startAt=${startAt}&maxResults=${pageSize}`,
        );

        total = page.total;

        for (const issue of page.issues) {
          // Materialize the sprint if we haven't seen it in this import.
          let sprintLtf1Id: Id<"sprints"> | undefined = undefined;
          const jiraSprint = extractSprintFromIssue(issue);
          if (jiraSprint) {
            const cached = sprintIdToLtf1.get(jiraSprint.id);
            if (cached) {
              sprintLtf1Id = cached;
            } else {
              const startMs =
                parseTimestamp(jiraSprint.startDate) ?? Date.now();
              const endMs =
                parseTimestamp(jiraSprint.endDate) ??
                startMs + 14 * 24 * 60 * 60 * 1000;
              const created: Id<"sprints"> = await ctx.runMutation(
                internal.integrations.jira.mutations.createImportedSprint,
                {
                  projectId: ltf1ProjectId,
                  name: jiraSprint.name,
                  goal: jiraSprint.goal,
                  startDate: startMs,
                  endDate: endMs,
                  status:
                    jiraSprint.state === "active"
                      ? "active"
                      : jiraSprint.state === "closed"
                        ? "completed"
                        : "planning",
                },
              );
              sprintIdToLtf1.set(jiraSprint.id, created);
              progress.sprintsCreated += 1;
              sprintLtf1Id = created;
            }
          }

          const description = adfToPlainText(issue.fields.description).trim();

          const result: { taskId: Id<"tasks">; created: boolean } =
            await ctx.runMutation(
              internal.integrations.jira.mutations.upsertImportedTask,
              {
                projectId: ltf1ProjectId,
                reporterId: args.triggeredBy,
                externalId: issue.id,
                externalKey: issue.key,
                externalUrl: `https://${args.host}/browse/${issue.key}`,
                title: issue.fields.summary,
                description: description.length > 0 ? description : undefined,
                status: mapStatus(issue.fields.status),
                priority: mapPriority(issue.fields.priority?.name),
                type: mapType(issue.fields.issuetype.name),
                labels: issue.fields.labels,
                dueDate: parseTimestamp(issue.fields.duedate),
                completedAt: parseTimestamp(issue.fields.resolutiondate),
                estimatePoints: issue.fields.customfield_10016,
                sprintId: sprintLtf1Id,
              },
            );

          if (result.created) progress.tasksCreated += 1;
          else progress.tasksUpdated += 1;
          progress.total += 1;
        }

        await ctx.runMutation(
          internal.integrations.imports.updateImportProgress,
          { importId: args.importId, progress: { ...progress } },
        );

        startAt += page.issues.length;
        if (page.issues.length === 0) break;
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
