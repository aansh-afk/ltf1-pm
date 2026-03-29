#!/usr/bin/env node
/**
 * LTF CLI - Terminal interface for LTF1 project management
 *
 * Main entry point that sets up Commander.js and registers all commands.
 */

import { Command } from "commander";
import { registerAuthCommands } from "../commands/auth/index.js";
import { registerProjectCommands } from "../commands/project/index.js";
import { registerTaskCommands } from "../commands/task/index.js";
import { registerSprintCommands } from "../commands/sprint/index.js";
import { registerAICommands } from "../commands/ai/index.js";
import { registerGitCommands } from "../commands/git/index.js";
import { registerDaemonCommands } from "../commands/daemon/index.js";
import { registerTimeCommands } from "../commands/time/index.js";
import { registerSearchCommands } from "../commands/search/index.js";
import { registerNotificationsCommands } from "../commands/notifications/index.js";
import { registerConfigCommands } from "../commands/config/index.js";
import { registerCompletionCommands } from "../commands/completions/index.js";
import { registerReleaseCommands } from "../commands/release/index.js";
import { registerPRCommands } from "../commands/pr/index.js";
import { registerAgentCommands } from "../commands/agent/index.js";
import { registerSkillCommands } from "../commands/skill/index.js";
import { registerUpdateCommand } from "../commands/update.js";
import output from "../lib/output.js";
import { checkForUpdate } from "../lib/updater.js";
import { execFileSync, execFile } from "child_process";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

function launchGoTUI() {
  // Look for the Go TUI binary in several locations
  const candidates = [
    // Development: built in apps/tui/
    resolve(process.cwd(), "apps/tui/ltf-tui"),
    // Installed globally alongside the CLI
    resolve(dirname(fileURLToPath(import.meta.url)), "../../tui/ltf-tui"),
    // In PATH
    "ltf-tui",
  ];

  for (const bin of candidates) {
    try {
      if (bin === "ltf-tui" || existsSync(bin)) {
        execFileSync(bin, { stdio: "inherit" });
        return;
      }
    } catch {
      continue;
    }
  }

  // Fallback: try `go run` from the apps/tui directory
  const tuiDir = resolve(process.cwd(), "apps/tui");
  if (existsSync(resolve(tuiDir, "main.go"))) {
    console.log("Building TUI from source...");
    try {
      execFileSync("go", ["run", "main.go"], { cwd: tuiDir, stdio: "inherit" });
      return;
    } catch {
      // fall through
    }
  }

  console.error("Go TUI binary not found. Build it first:");
  console.error("  cd apps/tui && go build -o ltf-tui .");
  process.exit(1);
}

const program = new Command();

// CLI metadata
program
  .name("ltf")
  .description("LTF CLI - Terminal interface for LTF1 project management")
  .version("0.1.0")
  .configureOutput({
    // Custom error handling
    outputError: (str) => {
      output.error(str.replace("error: ", ""));
    },
  });

// Register command groups
registerAuthCommands(program);
registerProjectCommands(program);
registerTaskCommands(program);
registerSprintCommands(program);
registerAICommands(program);
registerGitCommands(program);
registerDaemonCommands(program);
registerTimeCommands(program);
registerSearchCommands(program);
registerNotificationsCommands(program);
registerConfigCommands(program);
registerCompletionCommands(program);
registerReleaseCommands(program);
registerPRCommands(program);
registerAgentCommands(program);
registerSkillCommands(program);
registerUpdateCommand(program);

// Global options
program
  .option("--json", "Output in JSON format")
  .option("--no-color", "Disable colored output")
  .option("--debug", "Enable debug mode");

// Dashboard command
program
  .command("dashboard")
  .alias("d")
  .description("Launch the interactive TUI dashboard")
  .action(async () => {
    launchGoTUI();
  });

// Handle unknown commands
program.on("command:*", () => {
  output.error(`Unknown command: ${program.args.join(" ")}`);
  output.log("");
  output.log("Run `ltf --help` to see available commands");
  process.exit(1);
});

// Default action (no command) - Launch dashboard
program.action(async () => {
  // Only show welcome box if running interactively (not in watch mode)
  // tsx watch passes extra args, and we want to skip the banner on restarts
  const isWatchMode = process.env.TSX_DEV || process.argv.includes("--watch");

  if (isWatchMode) {
    // In dev mode, just show a minimal message
    console.log(
      output.colors.muted("LTF CLI ready. Run `ltf --help` for commands."),
    );
    return;
  }

  // Launch the TUI dashboard
  launchGoTUI();
});

// Parse and execute
async function main() {
  // Non-blocking update check — fire and forget, print banner if available
  checkForUpdate()
    .then((info) => {
      if (info.available) {
        console.log(
          output.colors.warning(
            `\n  Update available: ${output.colors.muted(info.current)} → ${output.colors.success(info.latest)}`,
          ),
        );
        console.log(
          output.colors.muted("  Run `ltf update` to install\n"),
        );
      }
    })
    .catch(() => {
      /* swallow — never block the CLI */
    });

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    // Handle errors gracefully
    if (error instanceof Error) {
      output.error(error.message);
      if (process.env.LTF_DEBUG) {
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
}

main();
