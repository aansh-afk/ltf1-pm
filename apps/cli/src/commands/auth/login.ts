/**
 * Login command for the LTF CLI
 * Supports browser OAuth and API token authentication
 */

import { Command } from 'commander';
import { loginWithBrowser, loginWithToken } from '../../lib/auth.js';
import { setAuth, getAuth } from '../../lib/config.js';
import output from '../../lib/output.js';

/**
 * Execute the login command
 */
export async function loginAction(options: { token?: string }): Promise<void> {
  // Check if already authenticated
  const existingAuth = getAuth();
  if (existingAuth?.token) {
    output.warning('You are already logged in');
    output.info('Run `ltf auth logout` first to switch accounts');
    return;
  }

  const spin = output.spinner('Authenticating...');

  try {
    if (options.token) {
      // Token-based login
      spin.text = 'Validating API token...';
      const authConfig = await loginWithToken(options.token);
      setAuth(authConfig);
      spin.stop();

      output.newline();
      output.log(output.colors.success('  ✓ ') + output.colors.bold('AUTHENTICATED'));
      output.newline();
      output.keyValue([
        ['Method', 'API Token'],
        ['Status', output.colors.success('Active')],
      ]);
    } else {
      // Browser-based OAuth login
      spin.stop();
      output.info('Opening browser for authentication...');
      output.log(output.colors.muted('  Waiting for browser callback...'));
      output.newline();

      const authConfig = await loginWithBrowser();
      setAuth(authConfig);

      // Clear the line and show success
      output.newline();
      output.log(output.colors.success('  ✓ ') + output.colors.bold('AUTHENTICATED'));
      output.newline();
      output.keyValue([
        ['Email', authConfig.email || 'N/A'],
        ['Method', 'Browser OAuth'],
        ['Expires', authConfig.expiresAt
          ? new Date(authConfig.expiresAt).toLocaleString()
          : 'Never'],
      ]);
    }

    output.newline();
    output.log(output.colors.muted('  Next: ') + 'ltf project select');
    output.newline();

    // Exit successfully after login
    process.exit(0);
  } catch (error) {
    spin.stop();
    output.newline();
    if (error instanceof Error) {
      output.error('Authentication failed', error.message);
    } else {
      output.error('Authentication failed', 'An unexpected error occurred');
    }
    process.exit(1);
  }
}

/**
 * Create and return the login command
 */
export function createLoginCommand() {
  const loginCommand = new Command('login')
    .description('Authenticate with LTF')
    .option('-t, --token <token>', 'Authenticate using an API token instead of browser OAuth')
    .action(loginAction);

  return loginCommand;
}

export default createLoginCommand;
