/**
 * PR commands module for the LTF CLI
 * Provides pull request creation and management
 */

import { Command } from 'commander';
import { registerCreateCommand } from './create.js';

/**
 * Register all PR-related commands
 */
export function registerPRCommands(program: Command): void {
  const prCommand = program
    .command('pr')
    .description('Pull request commands');

  // Register subcommands
  registerCreateCommand(prCommand);
}

export default registerPRCommands;
