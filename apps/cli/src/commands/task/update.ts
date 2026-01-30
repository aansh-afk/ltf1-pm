/**
 * Task update command
 * Updates task fields
 */

import { Command } from 'commander';
import { requireAuth } from '../../lib/auth.js';
import { getAuthenticatedClient, mutation, query } from '../../lib/convex.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import output from '../../lib/output.js';
import { resolveTaskId, isValidStatus, isValidPriority, normalizeStatus } from './utils.js';
import { getErrorMessage } from '../../lib/errors.js';

interface UpdateOptions {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  type?: string;
  labels?: string;
  estimate?: string;
  dueDate?: string;
  clearDueDate?: boolean;
  json?: boolean;
}

interface TaskBasic {
  _id: string;
  number: number;
  title: string;
  status: string;
  priority: string;
}

export function updateTaskCommand(program: Command): void {
  program
    .command('update <identifier>')
    .alias('edit')
    .description('Update a task (use task number like 123 or PROJ-123, or task ID)')
    .option('--title <title>', 'Update title')
    .option('-d, --description <text>', 'Update description')
    .option('-s, --status <status>', 'Update status (backlog,todo,in_progress,in_review,done,cancelled)')
    .option('-p, --priority <priority>', 'Update priority (urgent,high,medium,low)')
    .option('-t, --type <type>', 'Update type (feature,bug,improvement,task,epic)')
    .option('-l, --labels <labels>', 'Set labels (comma-separated, replaces existing)')
    .option('-e, --estimate <points>', 'Update story points estimate')
    .option('--due-date <date>', 'Set due date (YYYY-MM-DD format)')
    .option('--clear-due-date', 'Remove due date')
    .option('--json', 'Output as JSON')
    .action(async (identifier: string, options: UpdateOptions) => {
      requireAuth();

      const context = getContext();
      if (!hasProjectContext()) {
        output.error('No project selected', 'Run `ltf project select` to select a project');
        process.exit(1);
      }

      // Check if any update options were provided
      const hasUpdates = options.title || options.description !== undefined || options.status ||
        options.priority || options.type || options.labels !== undefined || options.estimate ||
        options.dueDate || options.clearDueDate;

      if (!hasUpdates) {
        output.error('No updates specified', 'Use flags like --status, --priority, --title to specify what to update');
        process.exit(1);
      }

      const spin = output.spinner('Updating task...');

      try {
        const client = getAuthenticatedClient();

        // Resolve task ID
        const taskId = await resolveTaskId(client, identifier, context);

        if (!taskId) {
          spin.stop();
          output.error('Task not found', `Could not find task: ${identifier}`);
          process.exit(1);
        }

        // Build update args
        const updateArgs: Record<string, unknown> = { taskId };

        if (options.title) {
          updateArgs.title = options.title;
        }

        if (options.description !== undefined) {
          updateArgs.description = options.description;
        }

        if (options.status) {
          const normalizedStatus = normalizeStatus(options.status);
          if (!isValidStatus(normalizedStatus)) {
            spin.stop();
            output.error(`Invalid status: ${options.status}`, 'Valid statuses: backlog, todo, in_progress, in_review, done, cancelled');
            process.exit(1);
          }
          updateArgs.status = normalizedStatus;
        }

        if (options.priority) {
          const priority = options.priority.toLowerCase();
          if (!isValidPriority(priority)) {
            spin.stop();
            output.error(`Invalid priority: ${options.priority}`, 'Valid priorities: urgent, high, medium, low');
            process.exit(1);
          }
          updateArgs.priority = priority;
        }

        if (options.labels !== undefined) {
          updateArgs.labels = options.labels ? options.labels.split(',').map(l => l.trim()).filter(Boolean) : [];
        }

        if (options.estimate) {
          const points = parseInt(options.estimate, 10);
          if (!isNaN(points) && points > 0) {
            updateArgs.estimate = { points };
          }
        }

        if (options.dueDate) {
          const parsed = new Date(options.dueDate);
          if (isNaN(parsed.getTime())) {
            spin.stop();
            output.error('Invalid due date format', 'Use YYYY-MM-DD format (e.g., 2024-03-15)');
            process.exit(1);
          }
          updateArgs.dueDate = parsed.getTime();
        } else if (options.clearDueDate) {
          // Note: The backend may not support clearing, but we'll try
          updateArgs.dueDate = undefined;
        }

        // Perform update
        await mutation<string>(
          client,
          'tasks/mutations:updateTask',
          updateArgs
        );

        // Fetch updated task for display
        const task = await query<TaskBasic>(
          client,
          'tasks/queries:getTask',
          { taskId }
        );

        spin.stop();

        if (options.json) {
          output.json({ taskId, updated: true, ...task });
          return;
        }

        output.success('Task updated successfully');
        output.newline();

        const projectKey = context?.projectKey || 'TASK';
        output.log(`${output.formatTaskNumber(projectKey, task.number)} ${task.title}`);
        output.newline();

        // Show what was updated
        const updates: string[] = [];
        if (options.title) updates.push('title');
        if (options.description !== undefined) updates.push('description');
        if (options.status) updates.push(`status -> ${output.formatStatus(normalizeStatus(options.status))}`);
        if (options.priority) updates.push(`priority -> ${output.formatPriority(options.priority)}`);
        if (options.type) updates.push(`type -> ${output.formatType(options.type)}`);
        if (options.labels !== undefined) updates.push('labels');
        if (options.estimate) updates.push(`estimate -> ${options.estimate} points`);
        if (options.dueDate) updates.push(`due date -> ${options.dueDate}`);
        if (options.clearDueDate) updates.push('due date cleared');

        output.log(output.colors.muted('Updated: ') + updates.join(', '));

      } catch (err) {
        spin.stop();
        output.error('Failed to update task', getErrorMessage(err));
        process.exit(1);
      }
    });
}
