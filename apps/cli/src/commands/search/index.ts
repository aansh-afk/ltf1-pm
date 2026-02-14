/**
 * Search command for the LTF CLI
 * Searches tasks by title with optional type/limit filters
 */

import { Command } from 'commander';
import { requireAuth } from '../../lib/auth.js';
import { getAuthenticatedClient, query } from '../../lib/convex.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import output from '../../lib/output.js';
import { getErrorMessage } from '../../lib/errors.js';

interface SearchOptions {
  type?: string;
  limit?: string;
  json?: boolean;
}

interface TaskResult {
  _id: string;
  number: number;
  title: string;
  status: string;
  priority: string;
  type: string;
}

export function registerSearchCommands(program: Command): void {
  program
    .command('search <query>')
    .description('Search tasks by title')
    .option('-t, --type <type>', 'Filter by type (task, sprint)')
    .option('-l, --limit <n>', 'Max results to show', '20')
    .option('--json', 'Output as JSON')
    .action(async (searchQuery: string, options: SearchOptions) => {
      requireAuth();

      const context = getContext();
      if (!hasProjectContext()) {
        output.error('No project selected', 'Run `ltf project select` to select a project');
        process.exit(1);
      }

      const spin = output.spinner('Searching...');

      try {
        const client = getAuthenticatedClient();
        const limit = parseInt(options.limit || '20', 10);

        const rawTasks = await query(
          client,
          'tasks/queries:getProjectTasks' as never,
          { projectId: context?.projectId } as never,
        );
        const tasks = rawTasks as unknown as TaskResult[];

        spin.stop();

        // Client-side filter by search query
        const q = searchQuery.toLowerCase();
        let results = tasks.filter((t: TaskResult) => t.title.toLowerCase().includes(q));

        // Optional type filter
        if (options.type) {
          results = results.filter((t: TaskResult) => t.type === options.type);
        }

        // Limit results
        results = results.slice(0, limit);

        if (options.json) {
          output.json(results);
          return;
        }

        if (results.length === 0) {
          output.info(`No tasks found matching "${searchQuery}"`);
          return;
        }

        output.header(`Search results for "${searchQuery}"`);

        output.table(results as unknown as Record<string, unknown>[], [
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
            header: 'Status',
            key: 'status',
            width: 14,
            formatter: (value) => output.formatStatus(String(value)),
          },
          {
            header: 'Priority',
            key: 'priority',
            width: 10,
            formatter: (value) => output.formatPriority(String(value)),
          },
        ]);

        output.newline();
        output.log(output.colors.muted(`${results.length} result${results.length !== 1 ? 's' : ''} found`));

      } catch (err) {
        spin.stop();
        output.error('Search failed', getErrorMessage(err));
        process.exit(1);
      }
    });
}
