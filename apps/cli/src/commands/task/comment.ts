/**
 * Task comment command
 * Adds a comment to a task
 */

import { Command } from 'commander';
import { requireAuth } from '../../lib/auth.js';
import { getAuthenticatedClient, query } from '../../lib/convex.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import output from '../../lib/output.js';
import { resolveTaskId } from './utils.js';
import { getErrorMessage } from '../../lib/errors.js';

interface TaskInfo {
  _id: string;
  number: number;
  title: string;
}

interface CommentOptions {
  json?: boolean;
}

export function commentTaskCommand(program: Command): void {
  program
    .command('comment <identifier> [message]')
    .description('Add a comment to a task')
    .option('--json', 'Output as JSON')
    .action(async (identifier: string, message: string | undefined, options: CommentOptions) => {
      requireAuth();

      const context = getContext();
      if (!hasProjectContext()) {
        output.error('No project selected', 'Run `ltf project select` to select a project');
        process.exit(1);
      }

      if (!message) {
        output.error('No comment message provided', 'Usage: ltf task comment <identifier> "Your comment here"');
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

        // Get task details for display
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

        spin.stop();

        const projectKey = context?.projectKey || 'TASK';
        const taskRef = output.formatTaskNumber(projectKey, task.number);

        // Comment mutation not yet available in the backend
        if (options.json) {
          output.json({
            taskId,
            number: task.number,
            message,
            status: 'pending',
            note: 'Comment functionality requires createComment mutation',
          });
          return;
        }

        output.info(`Comment for ${taskRef}: ${task.title}`);
        output.newline();
        output.log(`  ${output.colors.muted('Message:')} ${message}`);
        output.newline();
        output.warning('Comment functionality requires a createComment mutation on the backend.');
        output.log(output.colors.muted('  This command is ready and will work once the mutation is deployed.'));

      } catch (err) {
        spin.stop();
        output.error('Failed to add comment', getErrorMessage(err));
        process.exit(1);
      }
    });
}
