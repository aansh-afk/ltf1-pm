/**
 * Task commands for the LTF CLI
 * Provides task management functionality
 */

import { Command } from 'commander';
import { listTasksCommand } from './list.js';
import { createTaskCommand } from './create.js';
import { viewTaskCommand } from './view.js';
import { updateTaskCommand } from './update.js';
import { doneTaskCommand } from './done.js';
import { assignTaskCommand } from './assign.js';

export function registerTaskCommands(program: Command): void {
  const taskCommand = program
    .command('task')
    .alias('t')
    .description('Task management commands');

  // Register subcommands
  listTasksCommand(taskCommand);
  createTaskCommand(taskCommand);
  viewTaskCommand(taskCommand);
  updateTaskCommand(taskCommand);
  doneTaskCommand(taskCommand);
  assignTaskCommand(taskCommand);

  // Default action (show list)
  taskCommand.action(async () => {
    // Run list by default when no subcommand provided
    await taskCommand.commands.find(cmd => cmd.name() === 'list')?.parseAsync(process.argv.slice(2));
  });
}
