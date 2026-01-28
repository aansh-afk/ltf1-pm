/**
 * Git commands module for the LTF CLI
 * Provides git integration including branch/task linking, hooks, and sync
 */

import { Command } from 'commander';
import { registerLinkCommand } from './link.js';
import { registerSyncCommand } from './sync.js';
import { registerHooksCommand } from './hooks.js';
import { registerStatusCommand } from './status.js';
import { registerHookHandlerCommand } from './hook-handler.js';

/**
 * Register all git-related commands
 */
export function registerGitCommands(program: Command): void {
  const gitCommand = program
    .command('git')
    .description('Git integration commands');

  // Register subcommands
  registerLinkCommand(gitCommand);
  registerSyncCommand(gitCommand);
  registerHooksCommand(gitCommand);
  registerStatusCommand(gitCommand);
  registerHookHandlerCommand(gitCommand);
}

export default registerGitCommands;
