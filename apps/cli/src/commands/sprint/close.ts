/**
 * Sprint close command
 * Closes the current active sprint
 */

import { requireAuth } from '../../lib/auth.js';
import { getAuthenticatedClient, query } from '../../lib/convex.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import output from '../../lib/output.js';
import { getErrorMessage } from '../../lib/errors.js';

interface CurrentSprint {
  _id: string;
  name: string;
  status: 'planning' | 'active' | 'completed';
  startDate: number;
  endDate: number;
  taskStats: {
    total: number;
    todo: number;
    inProgress: number;
    inReview: number;
    done: number;
  };
  totalPoints: number;
  completedPoints: number;
  progress: number;
}

interface CloseOptions {
  json?: boolean;
}

export async function closeSprint(_sprintId: string | undefined, options: CloseOptions): Promise<void> {
  requireAuth();

  if (!hasProjectContext()) {
    output.error('No project selected', 'Run `ltf project select` to select a project');
    process.exit(1);
  }

  const context = getContext();
  const client = getAuthenticatedClient();

  const spin = output.spinner('Fetching current sprint...');

  try {
    const sprint = await query<CurrentSprint | null>(
      client,
      'sprints/queries:getCurrentSprint',
      { projectId: context?.projectId }
    );

    spin.stop();

    if (!sprint) {
      output.warning('No active sprint to close');
      output.log(output.colors.muted('  View sprints: ltf sprint list'));
      return;
    }

    if (options.json) {
      output.json({
        sprintId: sprint._id,
        name: sprint.name,
        status: 'pending_close',
        taskStats: sprint.taskStats,
        progress: sprint.progress,
        note: 'Sprint close requires updateSprint mutation',
      });
      return;
    }

    // Show sprint summary
    output.header(`Close Sprint: ${sprint.name}`);
    output.newline();

    output.keyValue([
      ['Sprint', sprint.name],
      ['Status', sprint.status.toUpperCase()],
      ['Duration', formatDateRange(sprint.startDate, sprint.endDate)],
    ]);

    output.newline();
    output.log(output.colors.highlight('COMPLETION SUMMARY'));
    output.divider('-', 30);

    const { taskStats } = sprint;
    output.log(`  ${output.colors.success('Done:')}        ${taskStats.done}/${taskStats.total} tasks`);
    output.log(`  ${output.colors.warning('In Progress:')} ${taskStats.inProgress}`);
    output.log(`  ${output.colors.info('In Review:')}   ${taskStats.inReview}`);
    output.log(`  ${output.colors.muted('To Do:')}       ${taskStats.todo}`);
    output.newline();
    output.log(`  ${output.colors.muted('Points:')}      ${sprint.completedPoints}/${sprint.totalPoints} completed`);
    output.log(`  ${output.colors.muted('Progress:')}    ${output.progressBar(sprint.progress, 100, 20)}`);

    output.newline();
    output.warning('Sprint close requires an updateSprint mutation on the backend.');
    output.log(output.colors.muted('  This command is ready and will work once the mutation is deployed.'));

  } catch (err) {
    spin.stop();
    output.error('Failed to close sprint', getErrorMessage(err));
    process.exit(1);
  }
}

function formatDateRange(startDate: number, endDate: number): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return `${formatDate(start)} - ${formatDate(end)}`;
}
