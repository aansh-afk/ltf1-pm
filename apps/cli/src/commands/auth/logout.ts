/**
 * Logout command for the LTF CLI
 * Clears stored credentials and resets client
 */

import { Command } from 'commander';
import { logout } from '../../lib/auth.js';
import { getAuth, clearContext } from '../../lib/config.js';
import output from '../../lib/output.js';

/**
 * Execute the logout command
 */
export async function logoutAction(): Promise<void> {
  // Check if already logged out
  const existingAuth = getAuth();
  if (!existingAuth?.token) {
    output.warning('You are not currently logged in');
    return;
  }

  const spin = output.spinner('Logging out...');

  try {
    // Clear auth credentials
    logout();

    // Also clear project context since it's tied to the authenticated user
    clearContext();

    spin.stop();
    output.success('Successfully logged out');
    output.info('Your credentials have been cleared');
    output.newline();
    output.info('Run `ltf auth login` to authenticate again');
  } catch (error) {
    spin.stop();
    if (error instanceof Error) {
      output.error('Logout failed', error.message);
    } else {
      output.error('Logout failed', 'An unexpected error occurred');
    }
    process.exit(1);
  }
}

/**
 * Create and return the logout command
 */
export function createLogoutCommand() {
  const logoutCommand = new Command('logout')
    .description('Log out and clear stored credentials')
    .action(logoutAction);

  return logoutCommand;
}

export default createLogoutCommand;
