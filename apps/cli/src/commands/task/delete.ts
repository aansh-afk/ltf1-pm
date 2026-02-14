/**
 * Task delete command
 * Cancels a task (soft delete via status change)
 */

import { Command } from 'commander';
import { requireAuth } from '../../lib/auth.js';
import { getAuthenticatedClient, mutation, query } from '../../lib/convex.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import output from '../../lib/output.js';
import { resolveTaskId } from './utils.js';
import { getErrorMessage } from '../../lib/errors.js';

interface TaskInfo {
  _id: string;
  number: number;
  title: string;
  status: string;
}

interface DeleteOptions {
  force?: boolean;
  json?: boolean;
}

export function deleteTaskCommand(program: Command): void {
  program
    .command('delete <identifier>')
    .alias('rm')
    .description('Delete (cancel) a task')
    .option('-f, --force', 'Skip confirmation warning')
    .option('--json', 'Output as JSON')
    .action(async (identifier: string, options: DeleteOptions) => {
      requireAuth();

      const context = getContext();
      if (!hasProjectContext()) {
        output.error('No project selected', 'Run `ltf project select` to select a project');
        process.exit(1);
      }

      const spin = output.spinner('Resolving task...');

      try {
        const client = getAuthenticatedClient();

        // Resolve task ID
        const taskId = await resolveTaskId(client, identifier, context);

        if (!taskId) {
          spin.stop();
          output.error('Task not found', `Could not find task: ${identifier}`);
          process.exit(1);
        }

        // Get task details
        const task = await query<TaskInfo>(
          client,
          'tasks/queries:getTask',
          { taskId }
        );

        if (!task) {
          spin.stop();
          output.error('Task not found', `Could not find task: ${identifier}`);
          process.exit(1);
        }

        const projectKey = context?.projectKey || 'TASK';
        const taskRef = output.formatTaskNumber(projectKey, task.number);

        // Check if already cancelled
        if (task.status === 'cancelled') {
          spin.stop();
          output.warning(`Task ${taskRef} is already cancelled`);
          return;
        }

        // Without --force, warn the user
        if (!options.force) {
          spin.stop();
          output.warning(`This will cancel task ${taskRef}: ${task.title}`);
          output.log(output.colors.muted('  Re-run with --force to confirm deletion'));
          return;
        }

        // Cancel the task
        spin.text = 'Cancelling task...';
        await mutation<string>(
          client,
          'tasks/mutations:updateTask',
          { taskId, status: 'cancelled' }
        );

        spin.stop();

        if (options.json) {
          output.json({ deleted: true, taskId, number: task.number, title: task.title });
          return;
        }

        output.success(`Task ${taskRef} deleted (cancelled)`);
        output.log(output.colors.muted(`  ${task.title}`));

      } catch (err) {
        spin.stop();
        output.error('Failed to delete task', getErrorMessage(err));
        process.exit(1);
      }
    });
}
