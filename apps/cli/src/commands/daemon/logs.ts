/**
 * Daemon logs command
 * View and manage daemon log files
 */

import fs from 'node:fs';
import path from 'node:path';
import { info, colors, header, success } from '../../lib/output.js';
import { getLogFilePath, clearLogFile, readRecentLogs } from './watcher.js';

export interface LogsOptions {
  follow?: boolean;
  lines?: number;
  clear?: boolean;
}

/**
 * Format a log line with colors
 */
function formatLogLine(line: string): string {
  return line
    .replace(/\[INFO\]/g, colors.info('[INFO]'))
    .replace(/\[WARN\]/g, colors.warning('[WARN]'))
    .replace(/\[ERROR\]/g, colors.error('[ERROR]'))
    .replace(/\[DEBUG\]/g, colors.muted('[DEBUG]'))
    // Highlight timestamps
    .replace(/\[(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\]/g, (_match, timestamp) => {
      return colors.muted(`[${timestamp}]`);
    });
}

/**
 * Follow log file in real-time (like tail -f)
 */
async function followLogs(logFile: string): Promise<void> {
  info(`Following ${logFile}`);
  info('Press Ctrl+C to stop');
  console.log('');

  // First, show recent lines
  const recentLines = readRecentLogs(10);
  for (const line of recentLines) {
    console.log(formatLogLine(line));
  }

  // Track file position
  let filePosition = 0;
  try {
    const stats = fs.statSync(logFile);
    filePosition = stats.size;
  } catch {
    // File doesn't exist yet, start from 0
  }

  // Watch for changes
  const watcher = fs.watch(logFile, (eventType) => {
    if (eventType === 'change') {
      try {
        const stats = fs.statSync(logFile);
        const newSize = stats.size;

        if (newSize > filePosition) {
          // Read new content
          const fd = fs.openSync(logFile, 'r');
          const buffer = Buffer.alloc(newSize - filePosition);
          fs.readSync(fd, buffer, 0, buffer.length, filePosition);
          fs.closeSync(fd);

          // Output new lines
          const newContent = buffer.toString('utf-8');
          const lines = newContent.split('\n').filter(line => line.trim());
          for (const line of lines) {
            console.log(formatLogLine(line));
          }

          filePosition = newSize;
        } else if (newSize < filePosition) {
          // File was truncated (cleared)
          filePosition = newSize;
          info('Log file was cleared');
        }
      } catch (err) {
        // Ignore errors during following
      }
    }
  });

  // Also use polling as a backup (some systems don't fire fs.watch reliably)
  const pollInterval = setInterval(() => {
    try {
      const stats = fs.statSync(logFile);
      const newSize = stats.size;

      if (newSize > filePosition) {
        const fd = fs.openSync(logFile, 'r');
        const buffer = Buffer.alloc(newSize - filePosition);
        fs.readSync(fd, buffer, 0, buffer.length, filePosition);
        fs.closeSync(fd);

        const newContent = buffer.toString('utf-8');
        const lines = newContent.split('\n').filter(line => line.trim());
        for (const line of lines) {
          console.log(formatLogLine(line));
        }

        filePosition = newSize;
      }
    } catch {
      // Ignore errors
    }
  }, 1000);

  // Handle cleanup on exit
  const cleanup = (): void => {
    watcher.close();
    clearInterval(pollInterval);
    console.log('');
    info('Stopped following logs');
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });

  // Keep the process running
  await new Promise(() => {}); // Never resolves
}

/**
 * Show recent logs
 */
function showRecentLogs(lines: number): void {
  const logFile = getLogFilePath();

  if (!fs.existsSync(logFile)) {
    info('No log file found');
    info('The daemon may not have been started yet');
    return;
  }

  const recentLines = readRecentLogs(lines);

  if (recentLines.length === 0) {
    info('Log file is empty');
    return;
  }

  header(`Daemon Logs (last ${recentLines.length} entries)`);
  console.log('');

  for (const line of recentLines) {
    console.log(formatLogLine(line));
  }

  console.log('');
  info(`Log file: ${logFile}`);
  info('Use `ltf daemon logs -f` to follow in real-time');
}

/**
 * Clear the log file
 */
function clearLogs(): void {
  const logFile = getLogFilePath();

  if (!fs.existsSync(logFile)) {
    info('No log file to clear');
    return;
  }

  clearLogFile();
  success('Log file cleared');
}

/**
 * Show daemon logs
 */
export async function showDaemonLogs(options: LogsOptions = {}): Promise<void> {
  const { follow = false, lines = 50, clear = false } = options;

  if (clear) {
    clearLogs();
    return;
  }

  const logFile = getLogFilePath();

  if (follow) {
    // Ensure log file exists for following
    if (!fs.existsSync(logFile)) {
      const logDir = path.dirname(logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      fs.writeFileSync(logFile, '');
    }

    await followLogs(logFile);
  } else {
    showRecentLogs(lines);
  }
}

export default showDaemonLogs;
