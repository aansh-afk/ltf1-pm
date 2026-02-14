/**
 * List all projects in the current workspace
 * Displays projects with their name, key, status, and task counts
 */

import { requireAuth } from '../../lib/auth.js';
import { getAuthenticatedClient, query, api } from '../../lib/convex.js';
import { getContext } from '../../lib/config.js';
import output from '../../lib/output.js';
import { getErrorMessage } from '../../lib/errors.js';

interface Workspace {
  _id: string;
  name: string;
  projectCount?: number;
}

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
}

interface Project {
  _id: string;
  name: string;
  key: string;
  description?: string;
  status: string;
  visibility: string;
  taskStats?: TaskStats;
  lead?: {
    name: string;
  } | null;
}

interface ListOptions {
  workspace?: string;
  json?: boolean;
  all?: boolean;
  quiet?: boolean;
  idsOnly?: boolean;
}

export async function listProjects(options: ListOptions): Promise<void> {
  requireAuth();

  const spin = output.spinner('Fetching projects...');

  try {
    const client = getAuthenticatedClient();
    const context = getContext();

    // Get workspaces first
    const workspaces = await query(
      client,
      api.workspaces.queries.getUserWorkspaces,
      {}
    ) as Workspace[];

    if (workspaces.length === 0) {
      spin.stop();
      output.warning('You are not a member of any workspaces');
      output.info('Create or join a workspace at https://app.ltf1.dev');
      return;
    }

    // Determine which workspace to use
    let targetWorkspaceId = options.workspace || context?.workspaceId;

    // If not specified and not in context, list all workspaces' projects
    if (!targetWorkspaceId && !options.all) {
      if (workspaces.length === 1) {
        targetWorkspaceId = workspaces[0]._id;
      } else {
        spin.stop();
        output.warning('Multiple workspaces available. Use --workspace or select one:');
        output.newline();
        for (const ws of workspaces) {
          output.log(`  ${output.colors.primary(ws.name)} (${ws.projectCount || 0} projects)`);
        }
        output.newline();
        output.info('Run `ltf project list --workspace <id>` or `ltf project list --all`');
        return;
      }
    }

    // Collect projects from workspace(s)
    const allProjects: Array<Project & { workspaceName?: string }> = [];

    const workspacesToFetch = targetWorkspaceId
      ? workspaces.filter((w) => w._id === targetWorkspaceId)
      : workspaces;

    for (const workspace of workspacesToFetch) {
      const projects = await query(
        client,
        api.projects.queries.getWorkspaceProjects,
        { workspaceId: workspace._id }
      ) as Project[];

      for (const project of projects) {
        allProjects.push({
          ...project,
          workspaceName: workspaces.length > 1 ? workspace.name : undefined,
        });
      }
    }

    spin.stop();

    if (allProjects.length === 0) {
      output.info('No projects found');
      output.log(output.colors.muted('Create a project at https://app.ltf1.dev'));
      return;
    }

    // JSON output
    if (options.json) {
      output.json(allProjects);
      return;
    }

    if (options.idsOnly) {
      for (const project of allProjects) {
        console.log(project._id);
      }
      return;
    }

    if (options.quiet) {
      for (const project of allProjects) {
        console.log(`${project.key}\t${project.name}\t${project.status}`);
      }
      return;
    }

    // Table output
    output.header('Projects');

    const columns = [
      { header: 'KEY', key: 'key', width: 10 },
      { header: 'NAME', key: 'name', width: 25 },
      { header: 'STATUS', key: 'status', width: 12, formatter: formatStatus },
      { header: 'TASKS', key: 'taskStats', width: 15, formatter: formatTaskStats },
      { header: 'LEAD', key: 'lead', width: 15, formatter: formatLead },
    ];

    // Add workspace column if showing multiple
    if (workspacesToFetch.length > 1) {
      columns.splice(2, 0, {
        header: 'WORKSPACE',
        key: 'workspaceName',
        width: 15,
        formatter: (v: unknown) => String(v || ''),
      });
    }

    // Highlight the current project if set
    const currentProjectId = context?.projectId;

    const tableData = allProjects.map((project) => ({
      ...project,
      key:
        project._id === currentProjectId
          ? `${output.icons.project} ${output.colors.primary(project.key)}`
          : project.key,
    }));

    output.table(tableData, columns);

    // Show current project indicator
    if (currentProjectId) {
      const current = allProjects.find((p) => p._id === currentProjectId);
      if (current) {
        output.newline();
        output.info(`Current project: ${output.colors.primary(current.key)} - ${current.name}`);
      }
    }
  } catch (error) {
    spin.stop();
    output.error('Failed to fetch projects', getErrorMessage(error));
    process.exit(1);
  }
}

function formatStatus(value: unknown): string {
  const status = String(value || 'unknown');
  const statusColors: Record<string, (text: string) => string> = {
    planning: output.colors.info,
    active: output.colors.success,
    on_hold: output.colors.warning,
    completed: output.colors.muted,
    archived: output.colors.muted,
  };
  const formatter = statusColors[status] || output.colors.muted;
  return formatter(status.replace(/_/g, ' '));
}

function formatTaskStats(value: unknown): string {
  if (!value || typeof value !== 'object') return '-';
  const stats = value as TaskStats;
  const done = stats.completed || 0;
  const total = stats.total || 0;
  const inProgress = stats.inProgress || 0;

  if (total === 0) return output.colors.muted('no tasks');

  return `${output.colors.success(String(done))}/${total} (${output.colors.warning(String(inProgress))} active)`;
}

function formatLead(value: unknown): string {
  if (!value || typeof value !== 'object') return output.colors.muted('unassigned');
  const lead = value as { name: string };
  return lead.name || output.colors.muted('unassigned');
}
