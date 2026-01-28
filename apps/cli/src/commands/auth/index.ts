/**
 * Auth commands module for the LTF CLI
 * Registers all authentication-related commands
 */

import { Command } from 'commander';
import { createLoginCommand } from './login.js';
import { createLogoutCommand } from './logout.js';
import { createStatusCommand } from './status.js';

/**
 * Register auth commands with the parent program
 */
export function registerAuthCommands(program: Command): void {
  const authCommand = new Command('auth')
    .description('Authentication commands');

  // Register subcommands
  authCommand.addCommand(createLoginCommand());
  authCommand.addCommand(createLogoutCommand());
  authCommand.addCommand(createStatusCommand());

  // Default action when 'ltf auth' is run without subcommand
  authCommand.action(() => {
    authCommand.help();
  });

  program.addCommand(authCommand);
}

// Export individual commands for direct use
export { createLoginCommand } from './login.js';
export { createLogoutCommand } from './logout.js';
export { createStatusCommand } from './status.js';

export default registerAuthCommands;
