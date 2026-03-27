/**
 * Rich terminal output utilities for the LTF CLI
 * Provides consistent styling, tables, spinners, and formatted output
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import ora, { type Ora } from 'ora';
import boxen from 'boxen';
import figures from 'figures';

// Color palette matching the LTF1 brand
export const colors = {
  primary: chalk.yellow,
  secondary: chalk.gray,
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  muted: chalk.dim,
  highlight: chalk.bold.white,
  link: chalk.cyan.underline,
  bold: chalk.bold,
};

// Status colors for tasks
export const statusColors: Record<string, (text: string) => string> = {
  backlog: chalk.gray,
  todo: chalk.blue,
  in_progress: chalk.yellow,
  in_review: chalk.magenta,
  done: chalk.green,
  cancelled: chalk.red.strikethrough,
};

// Priority colors
export const priorityColors: Record<string, (text: string) => string> = {
  urgent: chalk.red.bold,
  high: chalk.red,
  medium: chalk.yellow,
  low: chalk.gray,
};

// Type colors
export const typeColors: Record<string, (text: string) => string> = {
  feature: chalk.green,
  bug: chalk.red,
  improvement: chalk.blue,
  task: chalk.gray,
  epic: chalk.magenta,
};

// Icons
export const icons = {
  success: chalk.green(figures.tick),
  error: chalk.red(figures.cross),
  warning: chalk.yellow(figures.warning),
  info: chalk.blue(figures.info),
  task: chalk.gray(figures.checkboxOn),
  taskDone: chalk.green(figures.checkboxOn),
  sprint: chalk.yellow(figures.play),
  project: chalk.blue(figures.pointer),
  user: chalk.gray(figures.smiley),
  git: chalk.gray(figures.arrowRight),
  ai: chalk.magenta('✨'),
  bullet: figures.bullet,
  arrow: figures.arrowRight,
  line: figures.line,
};

// Spinner management
let currentSpinner: Ora | null = null;

export function spinner(text: string): Ora {
  // Stop any existing spinner
  if (currentSpinner) {
    currentSpinner.stop();
  }
  currentSpinner = ora({
    text,
    color: 'yellow',
    spinner: 'dots',
  }).start();
  return currentSpinner;
}

export function stopSpinner(): void {
  if (currentSpinner) {
    currentSpinner.stop();
    currentSpinner = null;
  }
}

// Output functions
export function success(message: string): void {
  stopSpinner();
  console.log(`${icons.success} ${message}`);
}

export function error(message: string, details?: string): void {
  stopSpinner();
  console.error(`${icons.error} ${colors.error(message)}`);
  if (details) {
    console.error(colors.muted(`   ${details}`));
  }
}

export function warning(message: string): void {
  stopSpinner();
  console.log(`${icons.warning} ${colors.warning(message)}`);
}

export function info(message: string): void {
  stopSpinner();
  console.log(`${icons.info} ${message}`);
}

export function log(message: string): void {
  stopSpinner();
  console.log(message);
}

export function newline(): void {
  console.log();
}

// Header for sections
export function header(title: string): void {
  stopSpinner();
  console.log();
  console.log(colors.highlight(title.toUpperCase()));
  console.log(colors.muted('─'.repeat(title.length + 4)));
}

// Box for important messages
export function box(content: string, title?: string): void {
  stopSpinner();
  console.log(
    boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'yellow',
      title: title ? colors.primary(title) : undefined,
      titleAlignment: 'center',
    })
  );
}

// Create a table
export interface TableColumn {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  formatter?: (value: unknown) => string;
}

export function table<T extends Record<string, unknown>>(
  data: T[],
  columns: TableColumn[]
): void {
  stopSpinner();

  if (data.length === 0) {
    info('No data to display');
    return;
  }

  const tableInstance = new Table({
    head: columns.map((col) => colors.highlight(col.header)),
    colWidths: columns.map((col) => col.width ?? null),
    colAligns: columns.map((col) => col.align || 'left'),
    style: {
      head: [],
      border: ['gray'],
    },
    chars: {
      top: '─',
      'top-mid': '┬',
      'top-left': '┌',
      'top-right': '┐',
      bottom: '─',
      'bottom-mid': '┴',
      'bottom-left': '└',
      'bottom-right': '┘',
      left: '│',
      'left-mid': '├',
      mid: '─',
      'mid-mid': '┼',
      right: '│',
      'right-mid': '┤',
      middle: '│',
    },
  });

  for (const row of data) {
    tableInstance.push(
      columns.map((col) => {
        const value = row[col.key];
        if (col.formatter) {
          return col.formatter(value);
        }
        return String(value ?? '');
      })
    );
  }

  console.log(tableInstance.toString());
}

// Key-value display
export function keyValue(pairs: Array<[string, string | undefined]>): void {
  stopSpinner();
  const maxKeyLength = Math.max(...pairs.map(([key]) => key.length));

  for (const [key, value] of pairs) {
    const paddedKey = key.padEnd(maxKeyLength);
    console.log(`  ${colors.muted(paddedKey)}  ${value ?? colors.muted('—')}`);
  }
}

// Task display helpers
export function formatStatus(status: string): string {
  const formatter = statusColors[status] || chalk.gray;
  const displayStatus = status.replace(/_/g, ' ');
  return formatter(displayStatus);
}

export function formatPriority(priority: string): string {
  const formatter = priorityColors[priority] || chalk.gray;
  return formatter(priority);
}

export function formatType(type: string): string {
  const formatter = typeColors[type] || chalk.gray;
  return formatter(type);
}

export function formatTaskNumber(projectKey: string, number: number): string {
  return colors.primary(`${projectKey}-${number}`);
}

// Progress bar
export function progressBar(current: number, total: number, width = 20): string {
  const percent = total > 0 ? current / total : 0;
  const filled = Math.round(width * percent);
  const empty = width - filled;
  const bar = colors.success('█'.repeat(filled)) + colors.muted('░'.repeat(empty));
  const percentText = colors.muted(`${Math.round(percent * 100)}%`);
  return `${bar} ${percentText}`;
}

// Sprint burndown mini chart
export function miniChart(values: number[], width = 10): string {
  if (values.length === 0) return '';
  const max = Math.max(...values);
  const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

  return values
    .slice(-width)
    .map((v) => {
      const idx = max > 0 ? Math.floor((v / max) * (chars.length - 1)) : 0;
      return chars[idx];
    })
    .join('');
}

// JSON output for scripting
export function json(data: unknown): void {
  stopSpinner();
  console.log(JSON.stringify(data, null, 2));
}

// Compact list output
export function list(items: string[], bullet = icons.bullet): void {
  stopSpinner();
  for (const item of items) {
    console.log(`  ${bullet} ${item}`);
  }
}

// Confirm output styling
export function divider(char = '─', length = 40): void {
  console.log(colors.muted(char.repeat(length)));
}

// Export default output object
export default {
  colors,
  icons,
  spinner,
  stopSpinner,
  success,
  error,
  warning,
  info,
  log,
  newline,
  header,
  box,
  table,
  keyValue,
  formatStatus,
  formatPriority,
  formatType,
  formatTaskNumber,
  progressBar,
  miniChart,
  json,
  list,
  divider,
};
