import { v } from "convex/values";
import { action, internalQuery } from "../../_generated/server";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { getCurrentUserOrThrow } from "../../lib/auth";
import type { LinearTeam, LinearViewer } from "./types";

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
      // Linear personal API keys are sent as the raw Authorization value.
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Linear API returned ${res.status}: ${text.slice(0, 300)}`,
    );
  }

  const body = (await res.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (body.errors && body.errors.length > 0) {
    throw new Error(
      `Linear GraphQL error: ${body.errors.map((e) => e.message).join("; ")}`,
    );
  }

  if (!body.data) {
    throw new Error("Linear GraphQL response missing data");
  }

  return body.data;
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
 * Validate an API key and return the signed-in user + list of teams the key can see.
 */
export const testConnection = action({
  args: { apiKey: v.string() },
  returns: v.object({
    viewer: v.object({
      id: v.string(),
      name: v.string(),
      email: v.string(),
    }),
    teams: v.array(
      v.object({
        id: v.string(),
        key: v.string(),
        name: v.string(),
        issueCount: v.number(),
      }),
    ),
  }),
  handler: async (_ctx, args) => {
    const data = await linearGraphQL<{
      viewer: LinearViewer;
      teams: { nodes: Array<LinearTeam> };
    }>(
      args.apiKey,
      `query {
        viewer { id name email }
        teams(first: 50) {
          nodes { id key name issueCount }
        }
      }`,
    );

    return {
      viewer: {
        id: data.viewer.id,
        name: data.viewer.name,
        email: data.viewer.email,
      },
      teams: data.teams.nodes.map((t) => ({
        id: t.id,
        key: t.key,
        name: t.name,
        issueCount: t.issueCount,
      })),
    };
  },
});

/**
 * Kick off an import job. Credentials are passed through to the worker and
 * never persisted to the database.
 */
export const startImport = action({
  args: {
    apiKey: v.string(),
    workspaceId: v.id("workspaces"),
    teamId: v.string(),
    teamName: v.string(),
    teamKey: v.string(),
    targetProjectId: v.optional(v.id("projects")),
  },
  returns: v.id("imports"),
  handler: async (ctx, args): Promise<Id<"imports">> => {
    const user: { _id: Id<"users"> } = await ctx.runQuery(
      internal.integrations.linear.import.whoAmI,
      {},
    );

    const importId: Id<"imports"> = await ctx.runMutation(
      internal.integrations.imports.createImportJob,
      {
        workspaceId: args.workspaceId,
        source: "linear",
        triggeredBy: user._id,
        params: {
          externalScopeId: args.teamId,
          externalScopeName: `${args.teamKey} — ${args.teamName}`,
          targetProjectId: args.targetProjectId,
        },
      },
    );

    await ctx.scheduler.runAfter(
      0,
      internal.integrations.linear.importWorker.run,
      {
        importId,
        apiKey: args.apiKey,
        workspaceId: args.workspaceId,
        teamId: args.teamId,
        teamName: args.teamName,
        teamKey: args.teamKey,
        targetProjectId: args.targetProjectId,
        triggeredBy: user._id,
      },
    );

    return importId;
  },
});
