/**
 * Sprint create command
 * Creates a new sprint for the current project
 */

import { getAuthenticatedClient, mutation } from '../../lib/convex.js';
import output from '../../lib/output.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import { requireAuth } from '../../lib/auth.js';

interface CreateOptions {
  start?: string;
  end?: string;
  goal?: string;
  json?: boolean;
}

export async function createSprint(name: string, options: CreateOptions): Promise<void> {
  requireAuth();

  if (!hasProjectContext()) {
    output.error('No project selected', 'Run `ltf project select` to select a project');
    process.exit(1);
  }

  const context = getContext();
  const client = getAuthenticatedClient();

  // Default dates: start today, end in 2 weeks
  const now = new Date();
  const defaultStart = formatDateForApi(now);
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const defaultEnd = formatDateForApi(twoWeeksFromNow);

  const startDate = options.start || defaultStart;
  const endDate = options.end || defaultEnd;

  // Validate date formats
  if (!isValidDate(startDate)) {
    output.error('Invalid start date', 'Use format: YYYY-MM-DD');
    process.exit(1);
  }

  if (!isValidDate(endDate)) {
    output.error('Invalid end date', 'Use format: YYYY-MM-DD');
    process.exit(1);
  }

  // Validate date order
  if (new Date(endDate) <= new Date(startDate)) {
    output.error('Invalid date range', 'End date must be after start date');
    process.exit(1);
  }

  const spin = output.spinner('Creating sprint...');

  try {
    const sprintId = await mutation<string>(
      client,
      'sprints/mutations:createSprint',
      {
        projectId: context?.projectId,
        name,
        goal: options.goal,
        startDate,
        endDate,
      }
    );

    spin.stop();

    if (options.json) {
      output.json({
        success: true,
        sprintId,
        name,
        startDate,
        endDate,
        goal: options.goal,
      });
      return;
    }

    output.success(`Sprint "${name}" created`);
    output.newline();

    // Display sprint details
    output.keyValue([
      ['Sprint ID', output.colors.muted(sprintId)],
      ['Name', output.colors.primary(name)],
      ['Start Date', formatDisplayDate(startDate)],
      ['End Date', formatDisplayDate(endDate)],
      ['Duration', calculateDuration(startDate, endDate)],
      ['Goal', options.goal || output.colors.muted('Not set')],
      ['Status', output.colors.info('planning')],
    ]);

    output.newline();
    output.log(output.colors.muted('Next steps:'));
    output.log(output.colors.muted('  ltf sprint add <task>     Add tasks to the sprint'));
    output.log(output.colors.muted('  ltf sprint status         View sprint status'));

  } catch (err) {
    spin.stop();
    const error = err as Error;
    output.error('Failed to create sprint', error.message);
    process.exit(1);
  }
}

function formatDateForApi(date: Date): string {
  return date.toISOString().split('T')[0];
}

function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function calculateDuration(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 7) {
    return output.colors.info('1 week');
  } else if (diffDays === 14) {
    return output.colors.info('2 weeks');
  } else if (diffDays === 21) {
    return output.colors.info('3 weeks');
  } else if (diffDays >= 7) {
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    if (days === 0) {
      return output.colors.info(`${weeks} week${weeks > 1 ? 's' : ''}`);
    }
    return output.colors.info(`${weeks} week${weeks > 1 ? 's' : ''}, ${days} day${days > 1 ? 's' : ''}`);
  }
  return output.colors.info(`${diffDays} day${diffDays > 1 ? 's' : ''}`);
}
