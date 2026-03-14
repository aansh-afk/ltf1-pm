/**
 * Release notes generation command
 *
 * Usage:
 *   ltf release notes                              - Generate notes from recent commits
 *   ltf release notes --sprint <id>                - Generate notes for a sprint
 *   ltf release notes --from 2026-03-10 --to 2026-03-15  - Notes for date range
 *   ltf release notes --format md                  - Output as markdown (default)
 *   ltf release notes --format json                - Output as JSON
 *   ltf release notes --output release.md          - Write to file
 */

import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import output from '../../lib/output.js';
import { getErrorMessage } from '../../lib/errors.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import {
  isGitRepo,
  getCommitsInRange,
  getRecentCommits,
  parseConventionalCommit,
  conventionalTypeToLabel,
} from '../../lib/git.js';

interface NotesOptions {
  sprint?: string;
  from?: string;
  to?: string;
  format?: 'md' | 'json';
  output?: string;
}

interface GroupedCommit {
  hash: string;
  message: string;
  author: string;
  date: Date;
  description: string;
}

interface ReleaseNotesData {
  title: string;
  dateRange: { from: string; to: string };
  sections: Record<string, GroupedCommit[]>;
  stats: {
    contributors: number;
    commits: number;
    types: Record<string, number>;
  };
}

/**
 * Group commits by conventional commit type
 */
function groupCommits(
  commits: Array<{ hash: string; message: string; author: string; date: Date }>
): { grouped: Record<string, GroupedCommit[]>; ungrouped: GroupedCommit[] } {
  const grouped: Record<string, GroupedCommit[]> = {};
  const ungrouped: GroupedCommit[] = [];

  for (const commit of commits) {
    const conventional = parseConventionalCommit(commit.message);

    if (conventional) {
      const label = conventionalTypeToLabel(conventional.type);
      if (!grouped[label]) {
        grouped[label] = [];
      }
      grouped[label].push({
        hash: commit.hash,
        message: commit.message,
        author: commit.author,
        date: commit.date,
        description: conventional.description,
      });
    } else {
      ungrouped.push({
        hash: commit.hash,
        message: commit.message,
        author: commit.author,
        date: commit.date,
        description: commit.message.split('\n')[0],
      });
    }
  }

  return { grouped, ungrouped };
}

/**
 * Format release notes as markdown
 */
function formatMarkdown(data: ReleaseNotesData): string {
  const lines: string[] = [];

  lines.push(`## ${data.title}`);
  lines.push('');

  // Section order for consistent output
  const sectionOrder = [
    'Feature', 'Bug Fix', 'Performance', 'Refactor',
    'Documentation', 'Test', 'Build', 'CI/CD', 'Style', 'Chore',
  ];

  const sortedSections = Object.entries(data.sections).sort(([a], [b]) => {
    const aIdx = sectionOrder.indexOf(a);
    const bIdx = sectionOrder.indexOf(b);
    if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  // Map section names to display headers
  const sectionHeaders: Record<string, string> = {
    'Feature': 'New Features',
    'Bug Fix': 'Bug Fixes',
    'Performance': 'Performance Improvements',
    'Refactor': 'Refactoring',
    'Documentation': 'Documentation',
    'Test': 'Tests',
    'Build': 'Build System',
    'CI/CD': 'CI/CD',
    'Style': 'Style Changes',
    'Chore': 'Maintenance',
    'Other Changes': 'Other Changes',
  };

  for (const [section, commits] of sortedSections) {
    const header = sectionHeaders[section] || section;
    lines.push(`### ${header}`);
    for (const commit of commits) {
      const shortHash = commit.hash.substring(0, 7);
      lines.push(`- ${commit.description} (${shortHash}) — @${commit.author}`);
    }
    lines.push('');
  }

  // Stats footer
  lines.push('---');
  const typeCounts = Object.entries(data.stats.types)
    .map(([type, count]) => `${count} ${type.toLowerCase()}`)
    .join(' · ');
  lines.push(`${data.stats.contributors} contributor${data.stats.contributors !== 1 ? 's' : ''} · ${data.stats.commits} commit${data.stats.commits !== 1 ? 's' : ''} · ${typeCounts}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Generate release notes
 */
async function generateReleaseNotes(options: NotesOptions): Promise<void> {
  // Verify we're in a git repository
  const inGitRepo = await isGitRepo();
  if (!inGitRepo) {
    output.error('Not in a git repository', 'Run this command from within a git repository');
    process.exit(1);
  }

  const spin = output.spinner('Generating release notes...');

  try {
    const context = hasProjectContext() ? getContext() : undefined;
    const projectName = context?.projectName || context?.projectKey || 'Project';

    // Determine date range
    let fromDate = options.from;
    let toDate = options.to || new Date().toISOString().split('T')[0];

    if (!fromDate && !options.sprint) {
      // Default to last 14 days
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      fromDate = twoWeeksAgo.toISOString().split('T')[0];
    }

    // Get commits
    let commits: Array<{ hash: string; message: string; author: string; date: Date }>;

    if (fromDate) {
      spin.text = `Getting commits from ${fromDate} to ${toDate}...`;
      commits = await getCommitsInRange({
        fromDate,
        toDate,
      });
    } else {
      spin.text = 'Getting recent commits...';
      commits = await getRecentCommits(100);
    }

    if (commits.length === 0) {
      spin.info('No commits found in the specified range');
      return;
    }

    spin.text = `Processing ${commits.length} commits...`;

    // Group commits by type
    const { grouped, ungrouped } = groupCommits(commits);

    // Build sections
    const sections: Record<string, GroupedCommit[]> = { ...grouped };
    if (ungrouped.length > 0) {
      sections['Other Changes'] = ungrouped;
    }

    // Calculate stats
    const authors = new Set(commits.map(c => c.author));
    const typeCounts: Record<string, number> = {};
    for (const [section, sectionCommits] of Object.entries(sections)) {
      typeCounts[section] = sectionCommits.length;
    }

    // Build title
    const sprintLabel = options.sprint ? `Sprint ${options.sprint}` : '';
    const dateLabel = `${fromDate || 'start'} → ${toDate}`;
    const title = sprintLabel
      ? `Release Notes — ${sprintLabel} (${dateLabel})`
      : `Release Notes — ${projectName} (${dateLabel})`;

    const data: ReleaseNotesData = {
      title,
      dateRange: { from: fromDate || 'start', to: toDate },
      sections,
      stats: {
        contributors: authors.size,
        commits: commits.length,
        types: typeCounts,
      },
    };

    spin.stop();

    const format = options.format || 'md';

    if (format === 'json') {
      const jsonOutput = JSON.stringify(data, null, 2);

      if (options.output) {
        const outputPath = path.resolve(process.cwd(), options.output);
        fs.writeFileSync(outputPath, jsonOutput, 'utf-8');
        output.success(`Release notes written to ${outputPath}`);
      } else {
        output.json(data);
      }
    } else {
      const markdown = formatMarkdown(data);

      if (options.output) {
        const outputPath = path.resolve(process.cwd(), options.output);
        fs.writeFileSync(outputPath, markdown, 'utf-8');
        output.success(`Release notes written to ${outputPath}`);
      } else {
        output.log(markdown);
      }
    }

  } catch (err) {
    spin.fail('Failed to generate release notes');
    output.error(getErrorMessage(err));
    process.exit(1);
  }
}

/**
 * Register the notes subcommand
 */
export function registerNotesCommand(parent: Command): void {
  parent
    .command('notes')
    .description('Generate release notes from git history')
    .option('-s, --sprint <id>', 'Sprint ID to generate notes for')
    .option('--from <date>', 'Start date (YYYY-MM-DD)')
    .option('--to <date>', 'End date (YYYY-MM-DD)')
    .option('-f, --format <format>', 'Output format: md or json', 'md')
    .option('-o, --output <file>', 'Write output to file')
    .action(async (options: NotesOptions) => {
      await generateReleaseNotes(options);
    });
}

export default registerNotesCommand;
