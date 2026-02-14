/**
 * Sprint backlog command
 * Shows tasks not assigned to any sprint
 */

import { requireAuth } from '../../lib/auth.js';
import { getAuthenticatedClient, query } from '../../lib/convex.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import output from '../../lib/output.js';
import { getErrorMessage } from '../../lib/errors.js';

interface BacklogTask {
  _id: string;
  number: number;
  title: string;
  priority: string;
  type: string;
  status: string;
  _creationTime: number;
}

interface BacklogOptions {
  json?: boolean;
}

export async function showBacklog(options: BacklogOptions): Promise<void> {
  requireAuth();

  if (!hasProjectContext()) {
    output.error('No project selected', 'Run `ltf project select` to select a project');
    process.exit(1);
  }

  const context = getContext();
  const client = getAuthenticatedClient();

  const spin = output.spinner('Fetching backlog tasks...');

  try {
    const tasks = await query<BacklogTask[]>(
      client,
      'sprints/queries:getBacklogTasks',
      { projectId: context?.projectId }
    );

    spin.stop();

    if (options.json) {
      output.json(tasks);
      return;
    }

    if (tasks.length === 0) {
      output.info('No backlog tasks found');
      output.log(output.colors.muted('  All tasks are assigned to sprints, or no tasks exist.'));
      return;
    }

    output.header(`Backlog - ${context?.projectName || context?.projectKey || 'Project'}`);

    output.table(tasks as unknown as Record<string, unknown>[], [
      {
        header: 'ID',
        key: 'number',
        width: 12,
        formatter: (value) => output.formatTaskNumber(context?.projectKey || 'PROJ', value as number),
      },
      {
        header: 'Title',
        key: 'title',
        width: 40,
        formatter: (value) => {
          const title = String(value || '');
          return title.length > 37 ? title.substring(0, 37) + '...' : title;
        },
      },
      {
        header: 'Priority',
        key: 'priority',
        width: 10,
        formatter: (value) => output.formatPriority(String(value)),
      },
      {
        header: 'Created',
        key: '_creationTime',
        width: 14,
        formatter: (value) => {
          const date = new Date(value as number);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        },
      },
    ]);

    output.newline();
    output.log(output.colors.muted(`${tasks.length} tasks in backlog`));
    output.log(output.colors.muted('  Add to sprint: ltf sprint add <task>'));

  } catch (err) {
    spin.stop();
    output.error('Failed to fetch backlog', getErrorMessage(err));
    process.exit(1);
  }
}
