/**
 * Status command for the LTF CLI
 * Shows current authentication status
 */

import { Command } from 'commander';
import { getAuthStatus } from '../../lib/auth.js';
import { getConfigPath, getContext } from '../../lib/config.js';
import output from '../../lib/output.js';

/**
 * Format expiry time for display
 */
function formatExpiry(expiresAt: Date | undefined): string {
  if (!expiresAt) {
    return output.colors.muted('Never');
  }

  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();

  if (diff < 0) {
    return output.colors.error('Expired');
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} (${expiresAt.toLocaleString()})`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m (${expiresAt.toLocaleString()})`;
  }

  return `${minutes} minute${minutes !== 1 ? 's' : ''} (${expiresAt.toLocaleString()})`;
}

/**
 * Execute the status command
 */
export async function statusAction(): Promise<void> {
  const status = getAuthStatus();
  const context = getContext();

  output.header('Authentication Status');

  if (status.authenticated) {
    output.keyValue([
      ['Status', output.colors.success('Authenticated')],
      ['Email', status.email || output.colors.muted('Not available')],
      ['User ID', status.userId || output.colors.muted('Not available')],
      ['Token type', status.type === 'clerk' ? 'Clerk OAuth' : 'API token'],
      ['Expires', formatExpiry(status.expiresAt)],
    ]);

    // Show warning if token is expiring soon (within 1 hour)
    if (status.expiresAt) {
      const timeLeft = status.expiresAt.getTime() - Date.now();
      if (timeLeft < 60 * 60 * 1000 && timeLeft > 0) {
        output.newline();
        output.warning('Your session will expire soon. Run `ltf auth login` to refresh.');
      }
    }

    // Show current project context if set
    if (context?.projectId) {
      output.newline();
      output.header('Active Context');
      output.keyValue([
        ['Workspace', context.workspaceName || context.workspaceId || output.colors.muted('None')],
        ['Project', context.projectName
          ? `${context.projectName} (${context.projectKey})`
          : context.projectId || output.colors.muted('None')],
      ]);
    }
  } else {
    output.keyValue([
      ['Status', output.colors.error('Not authenticated')],
    ]);
    output.newline();
    output.info('Run `ltf auth login` to authenticate');
  }

  // Show config file location
  output.newline();
  output.log(output.colors.muted(`Config file: ${getConfigPath()}`));
}

/**
 * Create and return the status command
 */
export function createStatusCommand() {
  const statusCommand = new Command('status')
    .description('Show current authentication status')
    .action(statusAction);

  return statusCommand;
}

export default createStatusCommand;
