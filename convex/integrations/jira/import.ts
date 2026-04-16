import { v } from "convex/values";
import { action, internalQuery } from "../../_generated/server";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { getCurrentUserOrThrow } from "../../lib/auth";
import type { JiraMyself, JiraProject } from "./types";

function normalizeHost(host: string): string {
  // Accept "acme.atlassian.net", "https://acme.atlassian.net", or with trailing /.
  let h = host.trim();
  h = h.replace(/^https?:\/\//, "");
  h = h.replace(/\/+$/, "");
  return h;
}

function basicAuthHeader(email: string, apiToken: string): string {
  // Jira Cloud uses Basic auth with `email:apiToken`.
  const creds = `${email}:${apiToken}`;
  // btoa is available in the Convex V8 runtime.
  return `Basic ${btoa(creds)}`;
}

export async function jiraRequest<T>(
  host: string,
  email: string,
  apiToken: string,
  path: string,
): Promise<T> {
  const res = await fetch(`https://${normalizeHost(host)}${path}`, {
    method: "GET",
    headers: {
      Authorization: basicAuthHeader(email, apiToken),
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira API ${res.status}: ${text.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export const whoAmI = internalQuery({
  args: {},
  returns: v.object({ _id: v.id("users") }),
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    return { _id: user._id };
  },
});

/**
 * Validate credentials and return the caller + the projects they can access.
 */
export const testConnection = action({
  args: {
    host: v.string(),
    email: v.string(),
    apiToken: v.string(),
  },
  returns: v.object({
    me: v.object({
      accountId: v.string(),
      displayName: v.string(),
      emailAddress: v.optional(v.string()),
    }),
    projects: v.array(
      v.object({
        id: v.string(),
        key: v.string(),
        name: v.string(),
        projectTypeKey: v.string(),
      }),
    ),
  }),
  handler: async (_ctx, args) => {
    const me = await jiraRequest<JiraMyself>(
      args.host,
      args.email,
      args.apiToken,
      "/rest/api/3/myself",
    );

    const projects = await jiraRequest<{ values: Array<JiraProject> }>(
      args.host,
      args.email,
      args.apiToken,
      "/rest/api/3/project/search?maxResults=50",
    );

    return {
      me: {
        accountId: me.accountId,
        displayName: me.displayName,
        emailAddress: me.emailAddress,
      },
      projects: projects.values.map((p) => ({
        id: p.id,
        key: p.key,
        name: p.name,
        projectTypeKey: p.projectTypeKey,
      })),
    };
  },
});

export const startImport = action({
  args: {
    host: v.string(),
    email: v.string(),
    apiToken: v.string(),
    workspaceId: v.id("workspaces"),
    projectKey: v.string(),
    projectName: v.string(),
    projectId: v.string(),
    targetProjectId: v.optional(v.id("projects")),
  },
  returns: v.id("imports"),
  handler: async (ctx, args): Promise<Id<"imports">> => {
    const user: { _id: Id<"users"> } = await ctx.runQuery(
      internal.integrations.jira.import.whoAmI,
      {},
    );

    const importId: Id<"imports"> = await ctx.runMutation(
      internal.integrations.imports.createImportJob,
      {
        workspaceId: args.workspaceId,
        source: "jira",
        triggeredBy: user._id,
        params: {
          externalScopeId: args.projectId,
          externalScopeName: `${args.projectKey} — ${args.projectName}`,
          jiraHost: normalizeHost(args.host),
          targetProjectId: args.targetProjectId,
        },
      },
    );

    await ctx.scheduler.runAfter(
      0,
      internal.integrations.jira.importWorker.run,
      {
        importId,
        host: normalizeHost(args.host),
        email: args.email,
        apiToken: args.apiToken,
        workspaceId: args.workspaceId,
        projectId: args.projectId,
        projectKey: args.projectKey,
        projectName: args.projectName,
        targetProjectId: args.targetProjectId,
        triggeredBy: user._id,
      },
    );

    return importId;
  },
});
