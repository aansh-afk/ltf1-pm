/**
 * Task done command
 * Quick shortcut to mark a task as done
 */

import { Command } from 'commander';
import { requireAuth } from '../../lib/auth.js';
import { getAuthenticatedClient, mutation, query } from '../../lib/convex.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import output from '../../lib/output.js';
import { resolveTaskId } from './utils.js';
import { getErrorMessage } from '../../lib/errors.js';

interface TaskBasic {
  _id: string;
  number: number;
  title: string;
  status: string;
}

interface DoneOptions {
  json?: boolean;
}

export function doneTaskCommand(program: Command): void {
  program
    .command('done <identifier>')
    .alias('complete')
    .alias('finish')
    .description('Mark a task as done (use task number like 123 or PROJ-123, or task ID)')
    .option('--json', 'Output as JSON')
    .action(async (identifier: string, options: DoneOptions) => {
      requireAuth();

      const context = getContext();
      if (!hasProjectContext()) {
        output.error('No project selected', 'Run `ltf project select` to select a project');
        process.exit(1);
      }

      const spin = output.spinner('Marking task as done...');

      try {
        const client = getAuthenticatedClient();

        // Resolve task ID
        const taskId = await resolveTaskId(client, identifier, context);

        if (!taskId) {
          spin.stop();
          output.error('Task not found', `Could not find task: ${identifier}`);
          process.exit(1);
        }

        // Get current task to check status
        const task = await query<TaskBasic>(
          client,
          'tasks/queries:getTask',
          { taskId }
        );

        if (!task) {
          spin.stop();
          output.error('Task not found', `Could not find task: ${identifier}`);
          process.exit(1);
        }

        // Check if already done
        if (task.status === 'done') {
          spin.stop();
          if (options.json) {
            output.json({ taskId, status: 'done', message: 'Task is already marked as done' });
            return;
          }
          output.info('Task is already marked as done');
          return;
        }

        // Update status to done
        await mutation<string>(
          client,
          'tasks/mutations:updateTask',
          { taskId, status: 'done' }
        );

        spin.stop();

        if (options.json) {
          output.json({ taskId, status: 'done', previousStatus: task.status });
          return;
        }

        const projectKey = context?.projectKey || 'TASK';
        output.success(
          `${output.formatTaskNumber(projectKey, task.number)} marked as ${output.formatStatus('done')}`
        );
        output.log(output.colors.muted(`  ${task.title}`));

      } catch (err) {
        spin.stop();
        output.error('Failed to mark task as done', getErrorMessage(err));
        process.exit(1);
      }
    });
}
