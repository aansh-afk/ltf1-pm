/**
 * Task assign command
 * Assigns a task to a user
 */

import { Command } from 'commander';
import { requireAuth } from '../../lib/auth.js';
import { getAuthenticatedClient, mutation, query } from '../../lib/convex.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import output from '../../lib/output.js';
import { resolveTaskId } from './utils.js';
import { getErrorMessage } from '../../lib/errors.js';

interface User {
  _id: string;
  name?: string;
  email: string;
}

interface TaskWithAssignees {
  _id: string;
  number: number;
  title: string;
  assignees?: User[];
  assigneeIds?: string[];
}


interface AssignOptions {
  to?: string;
  add?: boolean;
  remove?: boolean;
  clear?: boolean;
  json?: boolean;
}

export function assignTaskCommand(program: Command): void {
  program
    .command('assign <identifier>')
    .description('Assign a task to user(s) (use task number like 123 or PROJ-123, or task ID)')
    .option('--to <user>', 'User to assign (email, name, or user ID; use "me" for yourself)')
    .option('--add', 'Add to existing assignees instead of replacing')
    .option('--remove', 'Remove the specified user from assignees')
    .option('--clear', 'Clear all assignees')
    .option('--json', 'Output as JSON')
    .action(async (identifier: string, options: AssignOptions) => {
      requireAuth();

      const context = getContext();
      if (!hasProjectContext()) {
        output.error('No project selected', 'Run `ltf project select` to select a project');
        process.exit(1);
      }

      // Validate options
      if (!options.to && !options.clear) {
        output.error('No assignee specified', 'Use --to <user> to specify who to assign, or --clear to remove all assignees');
        process.exit(1);
      }

      if (options.clear && options.to) {
        output.error('Cannot use both --to and --clear', 'Choose one action');
        process.exit(1);
      }

      if (options.add && options.remove) {
        output.error('Cannot use both --add and --remove', 'Choose one action');
        process.exit(1);
      }

      const spin = output.spinner('Updating assignment...');

      try {
        const client = getAuthenticatedClient();

        // Resolve task ID
        const taskId = await resolveTaskId(client, identifier, context);

        if (!taskId) {
          spin.stop();
          output.error('Task not found', `Could not find task: ${identifier}`);
          process.exit(1);
        }

        // Get current task
        const task = await query<TaskWithAssignees>(
          client,
          'tasks/queries:getTask',
          { taskId }
        );

        if (!task) {
          spin.stop();
          output.error('Task not found', `Could not find task: ${identifier}`);
          process.exit(1);
        }

        // Handle clear
        if (options.clear) {
          await mutation<string>(
            client,
            'tasks/mutations:updateTask',
            { taskId, assigneeIds: [] }
          );

          spin.stop();

          if (options.json) {
            output.json({ taskId, assigneeIds: [], action: 'cleared' });
            return;
          }

          const projectKey = context?.projectKey || 'TASK';
          output.success(`Cleared all assignees from ${output.formatTaskNumber(projectKey, task.number)}`);
          return;
        }

        // Find user to assign
        let targetUserId: string | null = null;
        const targetUser = options.to!;

        // Handle "me" - assign to current user
        if (targetUser.toLowerCase() === 'me') {
          // We need to get the current user ID from a query
          // For now, we'll use a workaround - fetch workspace members and match by auth
          // This is a limitation - ideally we'd have a "getCurrentUser" query
          spin.text = 'Looking up your user ID...';

          // Fetch workspace members
          const members = await query<Array<{ userId: string; user?: User }>>(
            client,
            'workspaces/queries:getWorkspaceMembers',
            { workspaceId: context?.workspaceId }
          );

          // Get the authenticated user's email from the config if available
          // For now, we'll just assign to the first member if it's a small team
          // or error out asking for explicit user
          if (members.length === 1) {
            targetUserId = members[0].userId;
          } else {
            spin.stop();
            output.error(
              'Cannot determine current user',
              'Please specify the user explicitly with --to <email>'
            );
            process.exit(1);
          }
        } else {
          // Try to find user by email, name, or ID
          spin.text = 'Looking up user...';

          // Fetch workspace members to find the user
          const members = await query<Array<{ userId: string; user?: User }>>(
            client,
            'workspaces/queries:getWorkspaceMembers',
            { workspaceId: context?.workspaceId }
          );

          // Search by email, name, or ID
          const searchTerm = targetUser.toLowerCase();
          const match = members.find(m => {
            if (!m.user) return m.userId === targetUser;
            return (
              m.userId === targetUser ||
              m.user.email.toLowerCase() === searchTerm ||
              m.user.email.toLowerCase().startsWith(searchTerm) ||
              (m.user.name && m.user.name.toLowerCase().includes(searchTerm))
            );
          });

          if (!match) {
            spin.stop();
            output.error(`User not found: ${targetUser}`, 'Make sure the user is a member of this workspace');
            process.exit(1);
          }

          targetUserId = match.userId;
        }

        // Get current assignee IDs
        const currentAssigneeIds = task.assigneeIds || [];

        // Calculate new assignee list
        let newAssigneeIds: string[];

        if (options.remove) {
          newAssigneeIds = currentAssigneeIds.filter(id => id !== targetUserId);
        } else if (options.add) {
          // Add to existing if not already assigned
          if (currentAssigneeIds.includes(targetUserId!)) {
            spin.stop();
            if (options.json) {
              output.json({ taskId, message: 'User is already assigned', assigneeIds: currentAssigneeIds });
              return;
            }
            output.info('User is already assigned to this task');
            return;
          }
          newAssigneeIds = [...currentAssigneeIds, targetUserId!];
        } else {
          // Replace all assignees
          newAssigneeIds = [targetUserId!];
        }

        // Update task
        await mutation<string>(
          client,
          'tasks/mutations:updateTask',
          { taskId, assigneeIds: newAssigneeIds }
        );

        spin.stop();

        if (options.json) {
          output.json({ taskId, assigneeIds: newAssigneeIds, action: options.remove ? 'removed' : options.add ? 'added' : 'assigned' });
          return;
        }

        const projectKey = context?.projectKey || 'TASK';
        const taskRef = output.formatTaskNumber(projectKey, task.number);

        if (options.remove) {
          output.success(`Removed user from ${taskRef}`);
        } else if (options.add) {
          output.success(`Added assignee to ${taskRef}`);
        } else {
          output.success(`Assigned ${taskRef} to user`);
        }

        output.log(output.colors.muted(`  ${task.title}`));
        output.log(output.colors.muted(`  Assignees: ${newAssigneeIds.length > 0 ? newAssigneeIds.length : 'none'}`));

      } catch (err) {
        spin.stop();
        output.error('Failed to update assignment', getErrorMessage(err));
        process.exit(1);
      }
    });
}
