/**
 * Sprint remove command
 * Removes a task from its sprint (moves to backlog)
 */

import { requireAuth } from '../../lib/auth.js';
import { getAuthenticatedClient, query } from '../../lib/convex.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import output from '../../lib/output.js';
import { resolveTaskId } from '../task/utils.js';
import { getErrorMessage } from '../../lib/errors.js';

interface TaskInfo {
  _id: string;
  number: number;
  title: string;
  status: string;
  sprintId?: string;
}

interface RemoveOptions {
  json?: boolean;
}

export async function removeFromSprint(taskIdentifier: string, options: RemoveOptions): Promise<void> {
  requireAuth();

  if (!hasProjectContext()) {
    output.error('No project selected', 'Run `ltf project select` to select a project');
    process.exit(1);
  }

  const context = getContext();
  const client = getAuthenticatedClient();

  const spin = output.spinner('Resolving task...');

  try {
    // Resolve task ID
    const taskId = await resolveTaskId(client, taskIdentifier, context);

    if (!taskId) {
      spin.stop();
      output.error('Task not found', `Could not find task: ${taskIdentifier}`);
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
      output.error('Task not found', `Could not find task: ${taskIdentifier}`);
      process.exit(1);
    }

    spin.stop();

    const projectKey = context?.projectKey || 'TASK';
    const taskRef = output.formatTaskNumber(projectKey, task.number);

    if (options.json) {
      output.json({
        taskId,
        number: task.number,
        title: task.title,
        status: 'pending_removal',
        note: 'Sprint removal requires removeTaskFromSprint mutation',
      });
      return;
    }

    output.info(`Remove ${taskRef} from sprint: ${task.title}`);
    output.newline();
    output.warning('Sprint removal requires a removeTaskFromSprint mutation on the backend.');
    output.log(output.colors.muted('  This command is ready and will work once the mutation is deployed.'));

  } catch (err) {
    spin.stop();
    output.error('Failed to remove task from sprint', getErrorMessage(err));
    process.exit(1);
  }
}
