/**
 * Git hooks management command
 *
 * Usage:
 *   ltf git hooks install     - Install LTF git hooks
 *   ltf git hooks uninstall   - Remove LTF git hooks
 *   ltf git hooks status      - Check hooks installation status
 */

import { Command } from 'commander';
import output from '../../lib/output.js';
import { getGitHooksConfig, setGitHooksConfig } from '../../lib/config.js';
import {
  isGitRepo,
  getRepoRoot,
  areHooksInstalled,
  installHooks,
  uninstallHooks,
  getHooksPath,
} from '../../lib/git.js';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Install git hooks for LTF integration
 */
async function installGitHooks(): Promise<void> {
  // Verify we're in a git repository
  const inGitRepo = await isGitRepo();
  if (!inGitRepo) {
    output.error('Not in a git repository', 'Run this command from within a git repository');
    process.exit(1);
  }

  const spin = output.spinner('Installing git hooks...');

  try {
    // Check if hooks are already installed
    const alreadyInstalled = await areHooksInstalled();
    if (alreadyInstalled) {
      spin.info('Git hooks are already installed');
      return;
    }

    // Install the hooks
    await installHooks();

    // Update config
    setGitHooksConfig({
      installed: true,
      installedAt: new Date().toISOString(),
    });

    spin.succeed('Git hooks installed successfully');

    const repoRoot = await getRepoRoot();
    const hooksPath = await getHooksPath();

    output.newline();
    output.keyValue([
      ['Repository', repoRoot || 'Unknown'],
      ['Hooks path', hooksPath || 'Unknown'],
    ]);

    output.newline();
    output.info('The following hooks have been installed:');
    output.list([
      'post-commit - Updates task status after commits',
      'post-checkout - Shows linked task info on branch switch',
      'pre-push - Validates task links before push',
      'post-merge - Syncs status after merges',
    ]);

    output.newline();
    output.log(output.colors.muted('Hooks will run silently in the background and won\'t block your workflow.'));

  } catch (err) {
    spin.fail('Failed to install hooks');
    const error = err as Error;
    output.error(error.message);
    process.exit(1);
  }
}

/**
 * Uninstall git hooks
 */
async function uninstallGitHooks(): Promise<void> {
  // Verify we're in a git repository
  const inGitRepo = await isGitRepo();
  if (!inGitRepo) {
    output.error('Not in a git repository', 'Run this command from within a git repository');
    process.exit(1);
  }

  const spin = output.spinner('Uninstalling git hooks...');

  try {
    // Check if hooks are installed
    const installed = await areHooksInstalled();
    if (!installed) {
      spin.info('LTF git hooks are not installed');
      return;
    }

    // Uninstall the hooks
    await uninstallHooks();

    // Update config
    setGitHooksConfig({
      installed: false,
      installedAt: undefined,
    });

    spin.succeed('Git hooks uninstalled successfully');

    output.newline();
    output.info('Any backed-up hooks have been restored.');

  } catch (err) {
    spin.fail('Failed to uninstall hooks');
    const error = err as Error;
    output.error(error.message);
    process.exit(1);
  }
}

/**
 * Show git hooks status
 */
async function showHooksStatus(): Promise<void> {
  // Verify we're in a git repository
  const inGitRepo = await isGitRepo();
  if (!inGitRepo) {
    output.error('Not in a git repository', 'Run this command from within a git repository');
    process.exit(1);
  }

  const spin = output.spinner('Checking hooks status...');

  try {
    const installed = await areHooksInstalled();
    const config = getGitHooksConfig();
    const repoRoot = await getRepoRoot();
    const hooksPath = await getHooksPath();

    spin.stop();

    output.header('Git Hooks Status');

    output.keyValue([
      ['Installed', installed ? output.colors.success('Yes') : output.colors.warning('No')],
      ['Repository', repoRoot || 'Unknown'],
      ['Hooks path', hooksPath || 'Unknown'],
    ]);

    if (config?.installedAt) {
      output.keyValue([
        ['Installed at', new Date(config.installedAt).toLocaleString()],
      ]);
    }

    if (installed && hooksPath) {
      output.newline();
      output.info('Installed hooks:');

      const hookFiles = ['post-commit', 'post-checkout', 'pre-push', 'post-merge'];
      const hookStatus: string[] = [];

      for (const hookName of hookFiles) {
        const hookPath = path.join(hooksPath, hookName);
        if (fs.existsSync(hookPath)) {
          const content = fs.readFileSync(hookPath, 'utf-8');
          if (content.includes('ltf git hook')) {
            hookStatus.push(`${output.icons.success} ${hookName}`);
          } else {
            hookStatus.push(`${output.icons.warning} ${hookName} (custom hook present)`);
          }
        } else {
          hookStatus.push(`${output.icons.error} ${hookName} (not found)`);
        }
      }

      output.list(hookStatus);
    }

    if (!installed) {
      output.newline();
      output.info('Run `ltf git hooks install` to enable git integration');
    }

  } catch (err) {
    spin.fail('Failed to check hooks status');
    const error = err as Error;
    output.error(error.message);
    process.exit(1);
  }
}

/**
 * Register the hooks command
 */
export function registerHooksCommand(parent: Command): void {
  const hooksCmd = parent
    .command('hooks')
    .description('Manage git hooks for LTF integration');

  hooksCmd
    .command('install')
    .description('Install LTF git hooks')
    .action(async () => {
      await installGitHooks();
    });

  hooksCmd
    .command('uninstall')
    .description('Remove LTF git hooks')
    .action(async () => {
      await uninstallGitHooks();
    });

  hooksCmd
    .command('status')
    .description('Check git hooks installation status')
    .action(async () => {
      await showHooksStatus();
    });

  // Default action shows status
  hooksCmd.action(async () => {
    await showHooksStatus();
  });
}

export default registerHooksCommand;
