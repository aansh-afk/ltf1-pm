/**
 * Skill commands for the LTF CLI
 * Provides skill listing, execution, and creation
 */

import { Command } from "commander";
import { listSkillsCommand } from "./list.js";
import { runSkillCommand } from "./run.js";
import { createSkillCommand } from "./create.js";

export function registerSkillCommands(program: Command): void {
  const skillCmd = program
    .command("skill")
    .description("Workspace skill commands — list, run, create");

  // Register subcommands
  listSkillsCommand(skillCmd);
  runSkillCommand(skillCmd);
  createSkillCommand(skillCmd);

  // Default action: show list
  skillCmd.action(async () => {
    await skillCmd.commands
      .find((cmd) => cmd.name() === "list")
      ?.parseAsync(process.argv.slice(2));
  });
}
