/**
 * Project commands registration
 * Registers all project-related subcommands with Commander
 */

import { Command } from 'commander';
import { listProjects } from './list.js';
import { selectProject } from './select.js';
import { showProjectInfo } from './info.js';
import { detectProject } from './detect.js';

export function registerProjectCommands(program: Command): void {
  const projectCommand = program
    .command('project')
    .alias('p')
    .description('Manage projects');

  // ltf project list
  projectCommand
    .command('list')
    .alias('ls')
    .description('List all projects in workspace(s)')
    .option('-w, --workspace <id>', 'Filter by workspace ID or name')
    .option('-a, --all', 'Show projects from all workspaces')
    .option('--json', 'Output in JSON format')
    .option('--quiet', 'Compact output without headers')
    .option('--ids-only', 'Output only project IDs (for piping)')
    .action(async (options) => {
      await listProjects(options);
    });

  // ltf project select [key]
  projectCommand
    .command('select [key]')
    .alias('use')
    .description('Select active project (interactive or by key)')
    .option('-w, --workspace <id>', 'Specify workspace ID or name')
    .option('--json', 'Output in JSON format')
    .action(async (key, options) => {
      await selectProject(key, options);
    });

  // ltf project info
  projectCommand
    .command('info')
    .alias('show')
    .description('Show current project info')
    .option('--json', 'Output in JSON format')
    .option('--quiet', 'Compact single-line output')
    .action(async (options) => {
      await showProjectInfo(options);
    });

  // ltf project detect
  projectCommand
    .command('detect')
    .description('Auto-detect project from git remote')
    .option('--set', 'Automatically set as current project if found')
    .option('--json', 'Output in JSON format')
    .action(async (options) => {
      await detectProject(options);
    });

  // ltf project (no subcommand) - show current project or help
  projectCommand.action(async () => {
    const { hasProjectContext } = await import('../../lib/config.js');

    if (hasProjectContext()) {
      // Show current project info
      await showProjectInfo({});
    } else {
      // Show help
      projectCommand.help();
    }
  });
}
