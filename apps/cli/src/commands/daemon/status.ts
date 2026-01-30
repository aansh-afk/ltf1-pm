/**
 * Daemon status command
 * Shows the current status of the daemon
 */

import fs from 'node:fs';
import { warning, info, log, newline, keyValue, colors, header } from '../../lib/output.js';
import { getDaemonConfig } from '../../lib/config.js';
import { getRepoRoot, getCurrentBranch } from '../../lib/git.js';
import { readPidFile, isProcessRunning, PID_FILE } from './start.js';
import { getLogFilePath, readRecentLogs } from './watcher.js';

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}m ${secs}s`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  } else {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  }
}

/**
 * Get process start time (Unix timestamp in seconds)
 */
function getProcessStartTime(pid: number): number | null {
  try {
    // On Linux, read /proc/[pid]/stat
    const statPath = `/proc/${pid}/stat`;
    if (fs.existsSync(statPath)) {
      const content = fs.readFileSync(statPath, 'utf-8');
      // Field 22 is starttime (in clock ticks since boot)
      const fields = content.split(' ');
      if (fields.length >= 22) {
        const startTicks = parseInt(fields[21], 10);
        // Get system uptime
        const uptimeContent = fs.readFileSync('/proc/uptime', 'utf-8');
        const systemUptime = parseFloat(uptimeContent.split(' ')[0]);
        // Calculate process start time
        const clockTicksPerSecond = 100; // Usually 100 on Linux (sysconf(_SC_CLK_TCK))
        const processAgeSeconds = systemUptime - (startTicks / clockTicksPerSecond);
        return Date.now() / 1000 - processAgeSeconds;
      }
    }
  } catch {
    // Fall through to null
  }

  // Fallback: use PID file mtime as approximate start time
  try {
    const stats = fs.statSync(PID_FILE);
    return stats.mtimeMs / 1000;
  } catch {
    return null;
  }
}

/**
 * Get process memory usage
 */
function getProcessMemoryUsage(pid: number): string | null {
  try {
    // On Linux, read /proc/[pid]/status
    const statusPath = `/proc/${pid}/status`;
    if (fs.existsSync(statusPath)) {
      const content = fs.readFileSync(statusPath, 'utf-8');
      const match = content.match(/VmRSS:\s*(\d+)\s*kB/);
      if (match) {
        const kb = parseInt(match[1], 10);
        if (kb >= 1024) {
          return `${(kb / 1024).toFixed(1)} MB`;
        }
        return `${kb} KB`;
      }
    }
  } catch {
    // Fall through to null
  }

  return null;
}

/**
 * Show daemon status
 */
export async function showDaemonStatus(): Promise<void> {
  header('Daemon Status');

  const daemonConfig = getDaemonConfig();
  const storedPid = daemonConfig?.pid;
  const filePid = readPidFile();
  const pid = filePid || storedPid;

  // Check if daemon is running
  const isRunning = pid ? isProcessRunning(pid) : false;

  // Status display
  const statusData: Array<[string, string | undefined]> = [];

  if (isRunning && pid) {
    statusData.push(['Status', colors.success('RUNNING')]);
    statusData.push(['PID', pid.toString()]);

    // Get uptime
    const startTime = getProcessStartTime(pid);
    if (startTime) {
      const uptimeSeconds = Date.now() / 1000 - startTime;
      statusData.push(['Uptime', formatUptime(uptimeSeconds)]);
    }

    // Get memory usage
    const memoryUsage = getProcessMemoryUsage(pid);
    if (memoryUsage) {
      statusData.push(['Memory', memoryUsage]);
    }
  } else {
    statusData.push(['Status', colors.error('STOPPED')]);

    if (pid) {
      statusData.push(['Last PID', colors.muted(pid.toString())]);
    }
  }

  // Add configuration info
  statusData.push(['', '']); // Spacer
  statusData.push(['Log file', getLogFilePath()]);

  // Repository info
  const repoRoot = await getRepoRoot();
  if (repoRoot) {
    statusData.push(['Repository', repoRoot]);

    const currentBranch = await getCurrentBranch();
    if (currentBranch) {
      statusData.push(['Branch', currentBranch]);
    }
  } else {
    statusData.push(['Repository', colors.muted('Not in a git repository')]);
  }

  keyValue(statusData);

  // Show recent activity if running
  if (isRunning) {
    const recentLogs = readRecentLogs(5);
    if (recentLogs.length > 0) {
      newline();
      header('Recent Activity');

      for (const logLine of recentLogs) {
        // Color-code log levels
        const coloredLog = logLine
          .replace(/\[INFO\]/g, colors.info('[INFO]'))
          .replace(/\[WARN\]/g, colors.warning('[WARN]'))
          .replace(/\[ERROR\]/g, colors.error('[ERROR]'))
          .replace(/\[DEBUG\]/g, colors.muted('[DEBUG]'));
        log(`  ${coloredLog}`);
      }
    }
  }

  // Show helpful commands
  newline();
  if (isRunning) {
    info('Commands:');
    log(`  ${colors.muted('ltf daemon stop')}     Stop the daemon`);
    log(`  ${colors.muted('ltf daemon logs -f')} Follow live logs`);
  } else {
    info('Commands:');
    log(`  ${colors.muted('ltf daemon start')}   Start the daemon`);

    // Check for stale PID file
    if (filePid && !isRunning) {
      newline();
      warning('Stale PID file detected. Running `ltf daemon stop` will clean it up.');
    }
  }
}

export default showDaemonStatus;
