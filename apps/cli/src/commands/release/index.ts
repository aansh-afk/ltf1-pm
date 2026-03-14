/**
 * Release commands module for the LTF CLI
 * Provides release note generation and changelog tools
 */

import { Command } from 'commander';
import { registerNotesCommand } from './notes.js';

/**
 * Register all release-related commands
 */
export function registerReleaseCommands(program: Command): void {
  const releaseCommand = program
    .command('release')
    .description('Release management commands');

  // Register subcommands
  registerNotesCommand(releaseCommand);
}

export default registerReleaseCommands;
