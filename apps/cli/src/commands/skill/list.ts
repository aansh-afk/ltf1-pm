/**
 * Skill list command
 * Shows available workspace skills
 */

import { Command } from "commander";
import { makeFunctionReference } from "convex/server";
import { requireAuth } from "../../lib/auth.js";
import { getAuthenticatedClient, query } from "../../lib/convex.js";
import { getContext, hasProjectContext } from "../../lib/config.js";
import output from "../../lib/output.js";
import { getErrorMessage } from "../../lib/errors.js";

interface Skill {
  _id: string;
  name: string;
  description?: string;
  trigger?: string;
  enabled?: boolean;
  lastRun?: number;
}

interface ListOptions {
  json?: boolean;
  all?: boolean;
}

export function listSkillsCommand(program: Command): void {
  program
    .command("list")
    .alias("ls")
    .description("List available workspace skills")
    .option("--json", "Output as JSON")
    .option("--all", "Show disabled skills too")
    .action(async (options: ListOptions) => {
      await requireAuth();

      const context = getContext();
      if (!hasProjectContext()) {
        output.error(
          "No project selected",
          "Run `ltf project select` to select a project",
        );
        process.exit(1);
      }

      const spin = output.spinner("Fetching skills...");

      try {
        const client = getAuthenticatedClient();

        const skills = (await query(
          client,
          makeFunctionReference<"query">("skills/queries:getWorkspaceSkills"),
          { workspaceId: context?.workspaceId as string },
        )) as Skill[];

        spin.stop();

        // Filter disabled unless --all
        const filtered = options.all
          ? skills
          : (skills || []).filter((s) => s.enabled !== false);

        if (options.json) {
          output.json(filtered);
          return;
        }

        if (!filtered || filtered.length === 0) {
          output.info("No skills found. Create one with `ltf skill create`");
          return;
        }

        output.header("Workspace Skills");

        output.table(filtered as unknown as Record<string, unknown>[], [
          {
            header: "Name",
            key: "name",
            width: 22,
            formatter: (v) => output.colors.highlight(String(v || "")),
          },
          {
            header: "Description",
            key: "description",
            width: 40,
            formatter: (v) => {
              const s = String(v || "");
              return s.length > 37 ? s.slice(0, 37) + "..." : s;
            },
          },
          {
            header: "Trigger",
            key: "trigger",
            width: 16,
            formatter: (v) => v ? String(v) : output.colors.muted("manual"),
          },
          {
            header: "Status",
            key: "enabled",
            width: 10,
            formatter: (v) =>
              v === false
                ? output.colors.muted("disabled")
                : output.colors.success("active"),
          },
        ]);

        output.newline();
        output.log(
          output.colors.muted(`${filtered.length} skill(s) available`),
        );
      } catch (err) {
        spin.stop();
        output.error("Failed to fetch skills", getErrorMessage(err));
        process.exit(1);
      }
    });
}
