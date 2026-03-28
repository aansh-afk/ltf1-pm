/**
 * Skill create command
 * Interactive skill creation using inquirer
 */

import { Command } from "commander";
import { makeFunctionReference } from "convex/server";
import inquirer from "inquirer";
import { requireAuth } from "../../lib/auth.js";
import { getAuthenticatedClient, mutation } from "../../lib/convex.js";
import { getContext, hasProjectContext } from "../../lib/config.js";
import output from "../../lib/output.js";
import { getErrorMessage } from "../../lib/errors.js";

interface CreateOptions {
  json?: boolean;
}

export function createSkillCommand(program: Command): void {
  program
    .command("create")
    .alias("new")
    .description("Create a new workspace skill (interactive)")
    .option("--json", "Output result as JSON")
    .action(async (options: CreateOptions) => {
      await requireAuth();

      const context = getContext();
      if (!hasProjectContext()) {
        output.error(
          "No project selected",
          "Run `ltf project select` to select a project",
        );
        process.exit(1);
      }

      output.header("Create a Skill");

      const answers = await inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: "Skill name:",
          validate: (v: string) =>
            v.trim().length > 0 || "Name is required",
        },
        {
          type: "input",
          name: "description",
          message: "Description:",
        },
        {
          type: "list",
          name: "trigger",
          message: "Trigger type:",
          choices: [
            { name: "Manual (run explicitly)", value: "manual" },
            { name: "On task create", value: "on_task_create" },
            { name: "On task update", value: "on_task_update" },
            { name: "On sprint start", value: "on_sprint_start" },
            { name: "Scheduled (cron)", value: "scheduled" },
          ],
        },
        {
          type: "input",
          name: "prompt",
          message: "AI prompt / instructions:",
          validate: (v: string) =>
            v.trim().length > 0 || "Prompt is required",
        },
        {
          type: "confirm",
          name: "enabled",
          message: "Enable immediately?",
          default: true,
        },
      ]);

      const spin = output.spinner("Creating skill...");

      try {
        const client = getAuthenticatedClient();

        const skillId = await mutation(
          client,
          makeFunctionReference<"mutation">("skills/mutations:createSkill"),
          {
            workspaceId: context?.workspaceId as string,
            name: answers.name.trim(),
            description: answers.description?.trim() || undefined,
            trigger: answers.trigger,
            prompt: answers.prompt.trim(),
            enabled: answers.enabled,
          },
        );

        spin.stop();

        if (options.json) {
          output.json({ skillId, name: answers.name });
          return;
        }

        output.success(`Skill "${answers.name}" created`);
        output.newline();
        output.keyValue([
          ["ID", String(skillId)],
          ["Name", answers.name],
          ["Trigger", answers.trigger],
          ["Status", answers.enabled ? "active" : "disabled"],
        ]);

        output.newline();
        output.log(
          output.colors.muted(
            `Run it: ltf skill run ${answers.name}`,
          ),
        );
      } catch (err) {
        spin.stop();
        output.error("Failed to create skill", getErrorMessage(err));
        process.exit(1);
      }
    });
}
