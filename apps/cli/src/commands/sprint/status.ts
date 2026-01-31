/**
 * Sprint status command
 * Shows detailed status of the current active sprint
 */

import { getAuthenticatedClient, query } from '../../lib/convex.js';
import output from '../../lib/output.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import { requireAuth } from '../../lib/auth.js';
import { getErrorMessage } from '../../lib/errors.js';

interface Task {
  _id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  assigneeNames?: string[];
  estimate?: { points?: number };
}

interface CurrentSprint {
  _id: string;
  name: string;
  goal?: string;
  status: 'planning' | 'active' | 'completed';
  startDate: number;
  endDate: number;
  tasks: Task[];
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
  daysRemaining: number;
  percentComplete: number;
}

interface StatusOptions {
  json?: boolean;
}

export async function sprintStatus(options: StatusOptions): Promise<void> {
  requireAuth();

  if (!hasProjectContext()) {
    output.error('No project selected', 'Run `ltf project select` to select a project');
    process.exit(1);
  }

  const context = getContext();
  const client = getAuthenticatedClient();

  const spin = output.spinner('Fetching sprint status...');

  try {
    const sprint = await query<CurrentSprint | null>(
      client,
      'sprints/queries:getCurrentSprint',
      { projectId: context?.projectId }
    );

    spin.stop();

    if (!sprint) {
      output.warning('No active sprint');
      output.log('');
      output.log(output.colors.muted('Create and start a sprint:'));
      output.log(output.colors.muted('  ltf sprint create "Sprint Name" --start 2024-01-15 --end 2024-01-29'));
      return;
    }

    if (options.json) {
      output.json(sprint);
      return;
    }

    // Header
    output.header(sprint.name);

    // Sprint overview
    output.newline();
    output.log(output.colors.highlight('SPRINT OVERVIEW'));
    output.divider('-', 40);

    output.keyValue([
      ['Status', formatSprintStatus(sprint.status)],
      ['Goal', sprint.goal || output.colors.muted('No goal set')],
      ['Duration', formatDateRange(sprint.startDate, sprint.endDate)],
      ['Days Left', formatDaysRemaining(sprint.daysRemaining)],
    ]);

    // Progress
    output.newline();
    output.log(output.colors.highlight('PROGRESS'));
    output.divider('-', 40);

    // Time progress
    output.log(`  ${output.colors.muted('Time:')}     ${output.progressBar(sprint.percentComplete, 100, 20)}`);

    // Work progress
    output.log(`  ${output.colors.muted('Work:')}     ${output.progressBar(sprint.progress, 100, 20)}`);

    // Points
    output.log(`  ${output.colors.muted('Points:')}   ${sprint.completedPoints}/${sprint.totalPoints} pts completed`);

    // Burndown mini-chart
    const burndownValues = generateBurndownValues(sprint);
    if (burndownValues.length > 0) {
      output.log(`  ${output.colors.muted('Burndown:')} ${output.colors.primary(output.miniChart(burndownValues, 14))}`);
    }

    // Task breakdown
    output.newline();
    output.log(output.colors.highlight('TASK BREAKDOWN'));
    output.divider('-', 40);

    const { taskStats } = sprint;
    output.log(`  ${output.icons.task} ${output.colors.info('To Do:')}       ${taskStats.todo}`);
    output.log(`  ${output.colors.warning('In Progress:')} ${taskStats.inProgress}`);
    output.log(`  ${output.colors.info('In Review:')}   ${taskStats.inReview}`);
    output.log(`  ${output.icons.taskDone} ${output.colors.success('Done:')}        ${taskStats.done}`);
    output.log(output.colors.muted(`  ${'─'.repeat(20)}`));
    output.log(`  ${output.colors.highlight('Total:')}       ${taskStats.total}`);

    // Task status distribution bar
    output.newline();
    output.log(output.colors.muted('  Status distribution:'));
    output.log(`  ${renderStatusBar(taskStats)}`);

    // Active tasks (in progress or in review)
    const activeTasks = sprint.tasks.filter(
      t => t.status === 'in_progress' || t.status === 'in_review'
    );

    if (activeTasks.length > 0) {
      output.newline();
      output.log(output.colors.highlight('ACTIVE WORK'));
      output.divider('-', 40);

      for (const task of activeTasks.slice(0, 5)) {
        const assignee = task.assigneeNames?.length
          ? output.colors.muted(` (${task.assigneeNames[0]})`)
          : '';
        const statusIcon = task.status === 'in_progress'
          ? output.colors.warning('>')
          : output.colors.info('?');
        output.log(`  ${statusIcon} ${output.colors.primary(task.key)} ${task.title}${assignee}`);
      }

      if (activeTasks.length > 5) {
        output.log(output.colors.muted(`  ... and ${activeTasks.length - 5} more`));
      }
    }

    // Quick actions hint
    output.newline();
    output.log(output.colors.muted('Quick actions:'));
    output.log(output.colors.muted('  ltf sprint add <task>   Add task to sprint'));
    output.log(output.colors.muted('  ltf task list           View all sprint tasks'));

  } catch (err) {
    spin.stop();
    output.error('Failed to fetch sprint status', getErrorMessage(err));
    process.exit(1);
  }
}

function formatSprintStatus(status: string): string {
  const statusMap: Record<string, string> = {
    planning: output.colors.info('PLANNING'),
    active: output.colors.success('ACTIVE'),
    completed: output.colors.muted('COMPLETED'),
  };
  return statusMap[status] || status;
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

function formatDaysRemaining(days: number): string {
  if (days === 0) {
    return output.colors.error('Last day!');
  } else if (days === 1) {
    return output.colors.warning('1 day');
  } else if (days <= 3) {
    return output.colors.warning(`${days} days`);
  }
  return output.colors.success(`${days} days`);
}

function generateBurndownValues(sprint: CurrentSprint): number[] {
  // Generate a simple burndown representation based on current state
  // This creates a visual showing ideal burndown vs actual progress
  const totalTasks = sprint.taskStats.total;
  const doneTasks = sprint.taskStats.done;
  const remainingTasks = totalTasks - doneTasks;

  const now = Date.now();
  const duration = sprint.endDate - sprint.startDate;
  const elapsed = Math.min(now - sprint.startDate, duration);
  const progress = elapsed / duration;

  // Create values showing remaining work over time (simulated)
  const values: number[] = [];
  const points = 10;

  for (let i = 0; i <= points; i++) {
    const timeProgress = i / points;
    if (timeProgress <= progress) {
      // Historical data point - simulate gradual completion
      const expectedDone = Math.floor((doneTasks / progress) * timeProgress);
      values.push(Math.max(0, totalTasks - expectedDone));
    } else {
      // Future projection - remaining work
      values.push(remainingTasks);
    }
  }

  return values;
}

function renderStatusBar(taskStats: CurrentSprint['taskStats']): string {
  const total = taskStats.total;
  if (total === 0) return output.colors.muted('No tasks');

  const width = 30;
  const doneWidth = Math.round((taskStats.done / total) * width);
  const reviewWidth = Math.round((taskStats.inReview / total) * width);
  const progressWidth = Math.round((taskStats.inProgress / total) * width);
  const todoWidth = width - doneWidth - reviewWidth - progressWidth;

  const done = output.colors.success('█'.repeat(doneWidth));
  const review = output.colors.info('█'.repeat(reviewWidth));
  const progress = output.colors.warning('█'.repeat(progressWidth));
  const todo = output.colors.muted('░'.repeat(Math.max(0, todoWidth)));

  return `${done}${review}${progress}${todo}`;
}
