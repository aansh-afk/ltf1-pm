/**
 * Sprint add command
 * Add a task to the current active sprint
 */

import { getAuthenticatedClient, query, mutation } from '../../lib/convex.js';
import output from '../../lib/output.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import { requireAuth } from '../../lib/auth.js';

interface Task {
  _id: string;
  number: number;
  title: string;
  status: string;
  sprintId?: string;
}

interface Sprint {
  _id: string;
  name: string;
  status: string;
}

interface AddOptions {
  sprint?: string;
  json?: boolean;
}

export async function addTaskToSprint(taskRef: string, options: AddOptions): Promise<void> {
  requireAuth();

  if (!hasProjectContext()) {
    output.error('No project selected', 'Run `ltf project select` to select a project');
    process.exit(1);
  }

  const context = getContext();
  const client = getAuthenticatedClient();

  const spin = output.spinner('Adding task to sprint...');

  try {
    // Parse task reference (could be task number like "ICE-123" or just "123")
    const taskNumber = parseTaskNumber(taskRef, context?.projectKey);

    if (!taskNumber) {
      spin.stop();
      output.error('Invalid task reference', 'Use task number (e.g., "123" or "ICE-123")');
      process.exit(1);
    }

    // Find the task by number
    const tasks = await query<Task[]>(
      client,
      'tasks/queries:getProjectTasks',
      { projectId: context?.projectId }
    );

    const task = tasks.find(t => t.number === taskNumber);

    if (!task) {
      spin.stop();
      output.error('Task not found', `No task found with number ${taskNumber}`);
      process.exit(1);
    }

    // Get target sprint
    let targetSprintId: string;
    let targetSprintName: string;

    if (options.sprint) {
      // Use specified sprint
      targetSprintId = options.sprint;
      const sprints = await query<Sprint[]>(
        client,
        'sprints/queries:getProjectSprints',
        { projectId: context?.projectId }
      );
      const targetSprint = sprints.find(s => s._id === options.sprint);
      if (!targetSprint) {
        spin.stop();
        output.error('Sprint not found', 'The specified sprint does not exist');
        process.exit(1);
      }
      targetSprintName = targetSprint.name;
    } else {
      // Get current active sprint
      const currentSprint = await query<Sprint | null>(
        client,
        'sprints/queries:getCurrentSprint',
        { projectId: context?.projectId }
      );

      if (!currentSprint) {
        spin.stop();
        output.error('No active sprint', 'Create and start a sprint first, or use --sprint to specify one');
        output.log('');
        output.log(output.colors.muted('Create a sprint: ltf sprint create "Sprint Name"'));
        process.exit(1);
      }

      targetSprintId = currentSprint._id;
      targetSprintName = currentSprint.name;
    }

    // Check if task is already in a sprint
    if (task.sprintId) {
      if (task.sprintId === targetSprintId) {
        spin.stop();
        output.warning('Task is already in this sprint');
        return;
      }
      // Task is in a different sprint - we'll move it
    }

    // Add task to sprint
    await mutation<number>(
      client,
      'sprints/mutations:addTasksToSprint',
      {
        sprintId: targetSprintId,
        taskIds: [task._id],
      }
    );

    spin.stop();

    if (options.json) {
      output.json({
        success: true,
        taskId: task._id,
        taskNumber: task.number,
        taskTitle: task.title,
        sprintId: targetSprintId,
        sprintName: targetSprintName,
      });
      return;
    }

    const taskKey = `${context?.projectKey}-${task.number}`;
    output.success(`Added ${output.colors.primary(taskKey)} to sprint "${targetSprintName}"`);

    // Show task details
    output.newline();
    output.keyValue([
      ['Task', output.colors.primary(taskKey)],
      ['Title', task.title],
      ['Status', output.formatStatus(task.status)],
      ['Sprint', output.colors.info(targetSprintName)],
    ]);

    output.newline();
    output.log(output.colors.muted('View sprint status: ltf sprint status'));

  } catch (err) {
    spin.stop();
    const error = err as Error;
    output.error('Failed to add task to sprint', error.message);
    process.exit(1);
  }
}

function parseTaskNumber(taskRef: string, projectKey?: string): number | null {
  // Handle formats: "123", "ICE-123", "ice-123"
  const trimmed = taskRef.trim();

  // If it's just a number
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }

  // If it has a project key prefix
  const match = trimmed.match(/^([A-Za-z]+)-(\d+)$/);
  if (match) {
    const [, prefix, number] = match;
    // Optionally validate the prefix matches current project
    if (projectKey && prefix.toUpperCase() !== projectKey.toUpperCase()) {
      return null; // Wrong project
    }
    return parseInt(number, 10);
  }

  return null;
}
