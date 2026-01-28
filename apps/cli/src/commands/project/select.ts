/**
 * Select active project (interactive or by key)
 * Stores the selected project in CLI config for subsequent commands
 */

// @ts-expect-error - inquirer types resolved from monorepo root
import inquirer from 'inquirer';
import { requireAuth } from '../../lib/auth.js';
import { getAuthenticatedClient, query } from '../../lib/convex.js';
import { getContext, setContext } from '../../lib/config.js';
import output from '../../lib/output.js';

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
  taskStats?: TaskStats;
}

interface SelectOptions {
  workspace?: string;
  json?: boolean;
}

export async function selectProject(
  projectKey: string | undefined,
  options: SelectOptions
): Promise<void> {
  requireAuth();

  const spin = output.spinner('Loading projects...');

  try {
    const client = getAuthenticatedClient();
    const context = getContext();

    // Get workspaces
    const workspaces = await query<Workspace[]>(
      client,
      'workspaces/queries:getUserWorkspaces'
    );

    if (workspaces.length === 0) {
      spin.stop();
      output.error('No workspaces found', 'Create or join a workspace at https://app.ltf1.dev');
      process.exit(1);
    }

    let targetWorkspace: Workspace | undefined;

    // If workspace specified, use it
    if (options.workspace) {
      targetWorkspace = workspaces.find(
        (w) => w._id === options.workspace || w.name.toLowerCase() === options.workspace?.toLowerCase()
      );
      if (!targetWorkspace) {
        spin.stop();
        output.error('Workspace not found', `Workspace "${options.workspace}" does not exist`);
        process.exit(1);
      }
    } else if (context?.workspaceId) {
      // Use current workspace from context
      targetWorkspace = workspaces.find((w) => w._id === context.workspaceId);
    }

    // If still no workspace and multiple available, prompt for selection
    if (!targetWorkspace) {
      if (workspaces.length === 1) {
        targetWorkspace = workspaces[0];
      } else {
        spin.stop();

        const { selectedWorkspace } = await inquirer.prompt<{ selectedWorkspace: string }>([
          {
            type: 'list',
            name: 'selectedWorkspace',
            message: 'Select a workspace:',
            choices: workspaces.map((w) => ({
              name: `${w.name} (${w.projectCount || 0} projects)`,
              value: w._id,
            })),
          },
        ]);

        targetWorkspace = workspaces.find((w) => w._id === selectedWorkspace);
        spin.start();
      }
    }

    if (!targetWorkspace) {
      spin.stop();
      output.error('No workspace selected');
      process.exit(1);
    }

    // Get projects for the workspace
    const projects = await query<Project[]>(
      client,
      'projects/queries:getWorkspaceProjects',
      { workspaceId: targetWorkspace._id }
    );

    spin.stop();

    if (projects.length === 0) {
      output.warning('No projects in this workspace');
      output.info('Create a project at https://app.ltf1.dev');
      return;
    }

    let selectedProject: Project | undefined;

    // If project key provided, find it
    if (projectKey) {
      selectedProject = projects.find(
        (p) => p.key.toLowerCase() === projectKey.toLowerCase()
      );

      if (!selectedProject) {
        output.error('Project not found', `No project with key "${projectKey}"`);
        output.newline();
        output.info('Available projects:');
        for (const p of projects) {
          output.log(`  ${output.colors.primary(p.key)} - ${p.name}`);
        }
        process.exit(1);
      }
    } else {
      // Interactive selection
      const { selectedProjectId } = await inquirer.prompt<{ selectedProjectId: string }>([
        {
          type: 'list',
          name: 'selectedProjectId',
          message: 'Select a project:',
          choices: projects.map((p) => ({
            name: formatProjectChoice(p, context?.projectId),
            value: p._id,
            short: p.key,
          })),
          pageSize: 15,
        },
      ]);

      selectedProject = projects.find((p) => p._id === selectedProjectId);
    }

    if (!selectedProject) {
      output.error('No project selected');
      process.exit(1);
    }

    // Save to context
    setContext({
      workspaceId: targetWorkspace._id,
      workspaceName: targetWorkspace.name,
      projectId: selectedProject._id,
      projectKey: selectedProject.key,
      projectName: selectedProject.name,
    });

    // Output result
    if (options.json) {
      output.json({
        workspace: {
          id: targetWorkspace._id,
          name: targetWorkspace.name,
        },
        project: {
          id: selectedProject._id,
          key: selectedProject.key,
          name: selectedProject.name,
        },
      });
    } else {
      output.success(
        `Selected project: ${output.colors.primary(selectedProject.key)} - ${selectedProject.name}`
      );
      output.log(
        output.colors.muted(`  Workspace: ${targetWorkspace.name}`)
      );
    }
  } catch (error) {
    spin.stop();
    const err = error as Error;
    output.error('Failed to select project', err.message);
    process.exit(1);
  }
}

function formatProjectChoice(project: Project, currentProjectId?: string): string {
  const isCurrent = project._id === currentProjectId;
  const indicator = isCurrent ? output.colors.success(' (current)') : '';
  const taskInfo = project.taskStats
    ? output.colors.muted(` [${project.taskStats.total} tasks]`)
    : '';
  const statusBadge = formatStatusBadge(project.status);

  return `${output.colors.primary(project.key)} ${project.name}${statusBadge}${taskInfo}${indicator}`;
}

function formatStatusBadge(status: string): string {
  const badges: Record<string, string> = {
    planning: output.colors.info(' [planning]'),
    active: '',
    on_hold: output.colors.warning(' [on hold]'),
    completed: output.colors.muted(' [completed]'),
    archived: output.colors.muted(' [archived]'),
  };
  return badges[status] || '';
}
