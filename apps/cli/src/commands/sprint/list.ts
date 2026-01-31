/**
 * Sprint list command
 * Lists all sprints for the current project with task counts and progress
 */

import { getAuthenticatedClient, query } from '../../lib/convex.js';
import output from '../../lib/output.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import { requireAuth } from '../../lib/auth.js';
import { getErrorMessage } from '../../lib/errors.js';

interface SprintWithStats {
  _id: string;
  name: string;
  goal?: string;
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

interface ListOptions {
  status?: string;
  json?: boolean;
}

export async function listSprints(options: ListOptions): Promise<void> {
  requireAuth();

  if (!hasProjectContext()) {
    output.error('No project selected', 'Run `ltf project select` to select a project');
    process.exit(1);
  }

  const context = getContext();
  const client = getAuthenticatedClient();

  const spin = output.spinner('Fetching sprints...');

  try {
    const sprints = await query<SprintWithStats[]>(
      client,
      'sprints/queries:getProjectSprints',
      { projectId: context?.projectId }
    );

    spin.stop();

    // Filter by status if specified
    let filteredSprints = sprints;
    if (options.status) {
      filteredSprints = sprints.filter(s => s.status === options.status);
    }

    if (options.json) {
      output.json(filteredSprints);
      return;
    }

    if (filteredSprints.length === 0) {
      output.info(options.status
        ? `No ${options.status} sprints found`
        : 'No sprints found');
      output.log('');
      output.log(output.colors.muted('Create a sprint with: ltf sprint create "Sprint Name"'));
      return;
    }

    output.header(`Sprints - ${context?.projectName || 'Project'}`);

    // Transform data to include pre-computed date range
    const tableData = filteredSprints.map(sprint => ({
      ...sprint,
      dateRange: formatDateRange(sprint.startDate, sprint.endDate),
    })) as Array<Record<string, unknown>>;

    output.table(tableData, [
      {
        header: 'Name',
        key: 'name',
        width: 25,
        formatter: (value) => {
          const name = String(value);
          return name.length > 22 ? name.substring(0, 22) + '...' : name;
        },
      },
      {
        header: 'Status',
        key: 'status',
        width: 12,
        formatter: (value) => formatSprintStatus(String(value)),
      },
      {
        header: 'Dates',
        key: 'dateRange',
        width: 24,
      },
      {
        header: 'Tasks',
        key: 'taskStats',
        width: 12,
        formatter: (value) => {
          const stats = value as SprintWithStats['taskStats'];
          return `${stats.done}/${stats.total}`;
        },
      },
      {
        header: 'Progress',
        key: 'progress',
        width: 28,
        formatter: (value) => {
          const progress = Number(value);
          return output.progressBar(progress, 100, 15);
        },
      },
    ]);

    // Summary
    output.newline();
    const active = sprints.filter(s => s.status === 'active').length;
    const planning = sprints.filter(s => s.status === 'planning').length;
    const completed = sprints.filter(s => s.status === 'completed').length;

    output.log(output.colors.muted(
      `Total: ${sprints.length} sprints (${active} active, ${planning} planning, ${completed} completed)`
    ));
  } catch (err) {
    spin.stop();
    output.error('Failed to fetch sprints', getErrorMessage(err));
    process.exit(1);
  }
}

function formatSprintStatus(status: string): string {
  const statusMap: Record<string, (text: string) => string> = {
    planning: output.colors.info,
    active: output.colors.success,
    completed: output.colors.muted,
  };
  const formatter = statusMap[status] || output.colors.muted;
  return formatter(status);
}

function formatDateRange(startDate: number, endDate: number): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = Date.now();

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const dateStr = `${formatDate(start)} - ${formatDate(end)}`;

  if (now >= startDate && now <= endDate) {
    return output.colors.success(dateStr);
  } else if (now > endDate) {
    return output.colors.muted(dateStr);
  }
  return dateStr;
}
