/**
 * Skill run command
 * Execute a workspace skill by name
 */

import { Command } from "commander";
import { makeFunctionReference } from "convex/server";
import { requireAuth } from "../../lib/auth.js";
import { getAuthenticatedClient, action } from "../../lib/convex.js";
import { getContext, hasProjectContext } from "../../lib/config.js";
import output from "../../lib/output.js";
import { getErrorMessage } from "../../lib/errors.js";

interface RunOptions {
  task?: string;
  json?: boolean;
}

interface SkillResult {
  success: boolean;
  output?: string;
  error?: string;
}

export function runSkillCommand(program: Command): void {
  program
    .command("run <name>")
    .description("Execute a workspace skill by name")
    .option("--task <taskId>", "Run skill in the context of a specific task")
    .option("--json", "Output as JSON")
    .action(async (name: string, options: RunOptions) => {
      await requireAuth();

      const context = getContext();
      if (!hasProjectContext()) {
        output.error(
          "No project selected",
          "Run `ltf project select` to select a project",
        );
        process.exit(1);
      }

      const spin = output.spinner(`Running skill "${name}"...`);

      try {
        const client = getAuthenticatedClient();

        const result = (await action(
          client,
          makeFunctionReference<"action">("skills/actions:runSkill"),
          {
            workspaceId: context?.workspaceId as string,
            skillName: name,
            taskId: options.task,
          },
        )) as SkillResult;

        spin.stop();

        if (options.json) {
          output.json(result);
          return;
        }

        if (result?.success) {
          output.success(`Skill "${name}" completed`);
          if (result.output) {
            output.newline();
            output.log(result.output);
          }
        } else {
          output.error(
            `Skill "${name}" failed`,
            result?.error || "Unknown error",
          );
          process.exit(1);
        }
      } catch (err) {
        spin.stop();
        output.error(`Failed to run skill "${name}"`, getErrorMessage(err));
        process.exit(1);
      }
    });
}
