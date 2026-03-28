/**
 * Agent status command
 * Shows agent activity summary and statistics
 */

import { Command } from "commander";
import { makeFunctionReference } from "convex/server";
import { requireAuth } from "../../lib/auth.js";
import { getAuthenticatedClient, query } from "../../lib/convex.js";
import { getContext, hasProjectContext } from "../../lib/config.js";
import output from "../../lib/output.js";
import { getErrorMessage } from "../../lib/errors.js";

interface TriageStats {
  pending: number;
  accepted: number;
  rejected: number;
  total: number;
}

interface ActivityItem {
  _id: string;
  action: string;
  description: string;
  timestamp: number;
  actor?: string;
}

interface StatusOptions {
  json?: boolean;
}

export function statusCommand(program: Command): void {
  program
    .command("status")
    .description("Show AI agent activity summary and statistics")
    .option("--json", "Output as JSON")
    .action(async (options: StatusOptions) => {
      await requireAuth();

      const context = getContext();
      if (!hasProjectContext()) {
        output.error(
          "No project selected",
          "Run `ltf project select` to select a project",
        );
        process.exit(1);
      }

      const spin = output.spinner("Fetching agent status...");

      try {
        const client = getAuthenticatedClient();
        const projectId = context?.projectId as string;

        // Fetch stats and activity in parallel
        const [stats, activity] = await Promise.all([
          query(
            client,
            makeFunctionReference<"query">("agent/queries:getTriageStats"),
            { projectId },
          ) as Promise<TriageStats>,
          query(
            client,
            makeFunctionReference<"query">("agent/queries:getAgentActivityFeed"),
            { projectId },
          ) as Promise<ActivityItem[]>,
        ]);

        spin.stop();

        if (options.json) {
          output.json({ stats, activity });
          return;
        }

        // Display stats
        output.header("Agent Statistics");
        output.keyValue([
          ["Pending", output.colors.warning(String(stats?.pending ?? 0))],
          ["Accepted", output.colors.success(String(stats?.accepted ?? 0))],
          ["Rejected", output.colors.error(String(stats?.rejected ?? 0))],
          ["Total", String(stats?.total ?? 0)],
        ]);

        // Display recent activity
        if (activity && activity.length > 0) {
          output.newline();
          output.header("Recent Activity");

          output.table(activity as unknown as Record<string, unknown>[], [
            {
              header: "Action",
              key: "action",
              width: 16,
              formatter: (v) => output.colors.highlight(String(v || "")),
            },
            {
              header: "Description",
              key: "description",
              width: 44,
              formatter: (v) => {
                const s = String(v || "");
                return s.length > 41 ? s.slice(0, 41) + "..." : s;
              },
            },
            {
              header: "Time",
              key: "timestamp",
              width: 20,
              formatter: (v) => {
                if (typeof v !== "number") return "—";
                const d = new Date(v);
                return d.toLocaleString();
              },
            },
          ]);
        } else {
          output.newline();
          output.info("No recent agent activity");
        }

        output.newline();
        output.log(
          output.colors.muted("Run `ltf agent triage` to review pending items"),
        );
      } catch (err) {
        spin.stop();
        output.error("Failed to fetch agent status", getErrorMessage(err));
        process.exit(1);
      }
    });
}
