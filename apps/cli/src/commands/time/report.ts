/**
 * Time report command
 * Shows a summary of tracked time entries
 */

import { Command } from 'commander';
import { requireAuth } from '../../lib/auth.js';
import { config } from '../../lib/config.js';
import output from '../../lib/output.js';

interface TimeEntry {
  taskId: string;
  taskTitle: string;
  startTime: number;
  endTime: number;
  duration: number;
  description?: string;
}

interface ReportOptions {
  week?: boolean;
  all?: boolean;
  json?: boolean;
}

export function registerReportCommand(parent: Command): void {
  parent
    .command('report')
    .description('Show time tracking report')
    .option('-w, --week', 'Show current week (default)')
    .option('-a, --all', 'Show all entries')
    .option('--json', 'Output as JSON')
    .action(async (options: ReportOptions) => {
      requireAuth();

      const confAny = config as unknown as { get(key: string): unknown };
      const allEntries = (confAny.get('timeEntries') as TimeEntry[] | undefined) || [];

      if (allEntries.length === 0) {
        output.info('No time entries recorded');
        output.log(output.colors.muted('Start tracking with `ltf time start <taskId>` or `ltf time log <taskId> --duration <minutes>`'));
        return;
      }

      // Filter entries
      let entries: TimeEntry[];
      if (options.all) {
        entries = allEntries;
      } else {
        // Default: current week (Monday to Sunday)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        monday.setHours(0, 0, 0, 0);
        const weekStart = monday.getTime();

        entries = allEntries.filter(e => e.endTime >= weekStart);
      }

      if (entries.length === 0) {
        output.info('No time entries for this period');
        output.log(output.colors.muted('Use --all to see all entries'));
        return;
      }

      if (options.json) {
        output.json(entries);
        return;
      }

      // Group by date
      const grouped = new Map<string, TimeEntry[]>();
      for (const entry of entries) {
        const dateKey = new Date(entry.endTime).toLocaleDateString('en-CA'); // YYYY-MM-DD
        const existing = grouped.get(dateKey) || [];
        existing.push(entry);
        grouped.set(dateKey, existing);
      }

      // Sort dates descending
      const sortedDates = [...grouped.keys()].sort().reverse();

      output.header(options.all ? 'All Time Entries' : 'This Week');

      // Build table data
      const tableData: Array<Record<string, unknown>> = [];
      for (const date of sortedDates) {
        const dayEntries = grouped.get(date) || [];
        for (const entry of dayEntries) {
          tableData.push({
            date,
            task: `${entry.taskId}`,
            duration: formatDuration(entry.duration),
            description: entry.description || '',
          });
        }
      }

      output.table(tableData, [
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Task', key: 'task', width: 16 },
        { header: 'Duration', key: 'duration', width: 12 },
        {
          header: 'Description',
          key: 'description',
          width: 36,
          formatter: (value) => {
            const desc = String(value || '');
            return desc.length > 33 ? desc.substring(0, 33) + '...' : desc || output.colors.muted('-');
          },
        },
      ]);

      // Totals
      const totalMs = entries.reduce((sum, e) => sum + e.duration, 0);
      output.newline();
      output.log(`  ${output.colors.bold('Total')}: ${formatDuration(totalMs)} across ${entries.length} entries`);

      // Per-task totals
      const taskTotals = new Map<string, number>();
      for (const entry of entries) {
        const current = taskTotals.get(entry.taskId) || 0;
        taskTotals.set(entry.taskId, current + entry.duration);
      }

      if (taskTotals.size > 1) {
        output.newline();
        output.log(output.colors.muted('  By task:'));
        for (const [taskId, total] of taskTotals) {
          output.log(output.colors.muted(`    ${taskId}: ${formatDuration(total)}`));
        }
      }
    });
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
