/**
 * Agent commands for the LTF CLI
 * Provides AI agent triage, suggestions, and status
 */

import { Command } from "commander";
import { triageCommand } from "./triage.js";
import { suggestCommand } from "./suggest.js";
import { statusCommand } from "./status.js";

export function registerAgentCommands(program: Command): void {
  const agentCmd = program
    .command("agent")
    .description("AI agent commands — triage, suggestions, status");

  // Register subcommands
  triageCommand(agentCmd);
  suggestCommand(agentCmd);
  statusCommand(agentCmd);

  // Default action: show status
  agentCmd.action(async () => {
    await agentCmd.commands
      .find((cmd) => cmd.name() === "status")
      ?.parseAsync(process.argv.slice(2));
  });
}
