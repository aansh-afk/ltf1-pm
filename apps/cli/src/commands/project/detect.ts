/**
 * Auto-detect project from git remote
 * Reads git remote URL and finds matching project in workspaces
 */

import { requireAuth } from '../../lib/auth.js';
import { getAuthenticatedClient, query } from '../../lib/convex.js';
import { getContext, setContext } from '../../lib/config.js';
import { getRemoteUrl, parseRemoteUrl, isGitRepo } from '../../lib/git.js';
import output from '../../lib/output.js';

interface Workspace {
  _id: string;
  name: string;
}

interface Repository {
  provider: string;
  url: string;
  name: string;
  owner: string;
}

interface Project {
  _id: string;
  name: string;
  key: string;
  description?: string;
  status: string;
  repository?: Repository | null;
}

interface DetectOptions {
  json?: boolean;
  set?: boolean;
}

export async function detectProject(options: DetectOptions): Promise<void> {
  requireAuth();

  // Check if we're in a git repository
  if (!(await isGitRepo())) {
    output.error('Not in a git repository', 'This command must be run from within a git repository');
    process.exit(1);
  }

  const spin = output.spinner('Detecting project from git remote...');

  try {
    // Get remote URL
    const remoteUrl = await getRemoteUrl();

    if (!remoteUrl) {
      spin.stop();
      output.error('No git remote found', 'This repository has no origin remote configured');
      output.info('Add a remote with: git remote add origin <url>');
      process.exit(1);
    }

    // Parse the remote URL
    const remoteInfo = parseRemoteUrl(remoteUrl);

    if (!remoteInfo) {
      spin.stop();
      output.error('Could not parse remote URL', `Unsupported URL format: ${remoteUrl}`);
      process.exit(1);
    }

    spin.text = 'Searching for matching project...';

    const client = getAuthenticatedClient();
    const context = getContext();

    // Get all workspaces
    const workspaces = await query<Workspace[]>(
      client,
      'workspaces/queries:getUserWorkspaces'
    );

    if (workspaces.length === 0) {
      spin.stop();
      output.error('No workspaces found', 'You need to be a member of at least one workspace');
      process.exit(1);
    }

    // Search all workspaces for a matching project
    let matchedProject: Project | null = null;
    let matchedWorkspace: Workspace | null = null;

    for (const workspace of workspaces) {
      const projects = await query<Project[]>(
        client,
        'projects/queries:getWorkspaceProjects',
        { workspaceId: workspace._id }
      );

      // Find project with matching repository
      for (const project of projects) {
        if (project.repository) {
          const projectRepoInfo = parseProjectRepoUrl(project.repository.url);

          if (
            projectRepoInfo &&
            projectRepoInfo.owner.toLowerCase() === remoteInfo.owner.toLowerCase() &&
            projectRepoInfo.repo.toLowerCase() === remoteInfo.repo.toLowerCase()
          ) {
            matchedProject = project;
            matchedWorkspace = workspace;
            break;
          }
        }
      }

      if (matchedProject) break;
    }

    spin.stop();

    if (!matchedProject || !matchedWorkspace) {
      output.warning('No matching project found');
      output.newline();
      output.log('Repository detected:');
      output.keyValue([
        ['Provider', remoteInfo.provider],
        ['Owner', remoteInfo.owner],
        ['Repository', remoteInfo.repo],
        ['URL', remoteUrl],
      ]);
      output.newline();
      output.info('To connect this repository to a project:');
      output.log(output.colors.muted('  1. Go to your project settings at https://app.ltf1.dev'));
      output.log(output.colors.muted('  2. Connect this repository to your project'));
      output.log(output.colors.muted('  3. Run this command again'));
      return;
    }

    // JSON output
    if (options.json) {
      output.json({
        detected: true,
        repository: {
          provider: remoteInfo.provider,
          owner: remoteInfo.owner,
          repo: remoteInfo.repo,
          url: remoteUrl,
        },
        workspace: {
          id: matchedWorkspace._id,
          name: matchedWorkspace.name,
        },
        project: {
          id: matchedProject._id,
          key: matchedProject.key,
          name: matchedProject.name,
        },
      });

      if (options.set) {
        setContext({
          workspaceId: matchedWorkspace._id,
          workspaceName: matchedWorkspace.name,
          projectId: matchedProject._id,
          projectKey: matchedProject.key,
          projectName: matchedProject.name,
        });
      }

      return;
    }

    // Display detected project
    output.success('Project detected!');
    output.newline();
    output.header('Repository');
    output.keyValue([
      ['Provider', capitalizeFirst(remoteInfo.provider)],
      ['Owner', remoteInfo.owner],
      ['Repository', remoteInfo.repo],
    ]);
    output.newline();
    output.header('Matched Project');
    output.keyValue([
      ['Workspace', matchedWorkspace.name],
      ['Project', `${output.colors.primary(matchedProject.key)} - ${matchedProject.name}`],
      ['Status', matchedProject.status],
    ]);

    // Check if this is already the current project
    if (context?.projectId === matchedProject._id) {
      output.newline();
      output.info('This is already your current project');
      return;
    }

    // Set as current project if --set flag or prompt
    if (options.set) {
      setContext({
        workspaceId: matchedWorkspace._id,
        workspaceName: matchedWorkspace.name,
        projectId: matchedProject._id,
        projectKey: matchedProject.key,
        projectName: matchedProject.name,
      });
      output.newline();
      output.success(`Set as current project: ${output.colors.primary(matchedProject.key)}`);
    } else {
      output.newline();
      output.info('To set this as your current project, run:');
      output.log(output.colors.muted(`  ltf project detect --set`));
      output.log(output.colors.muted(`  or: ltf project select ${matchedProject.key}`));
    }
  } catch (error) {
    spin.stop();
    const err = error as Error;
    output.error('Failed to detect project', err.message);
    process.exit(1);
  }
}

/**
 * Parse project repository URL to extract owner and repo
 */
function parseProjectRepoUrl(url: string): { owner: string; repo: string } | null {
  // Handle GitHub URLs
  // Format: https://github.com/owner/repo or https://github.com/owner/repo.git
  const httpsMatch = url.match(/github\.com\/([^/]+)\/([^/\s.]+)/);
  if (httpsMatch) {
    return {
      owner: httpsMatch[1],
      repo: httpsMatch[2].replace(/\.git$/, ''),
    };
  }

  // SSH format
  const sshMatch = url.match(/git@github\.com:([^/]+)\/([^/\s.]+)/);
  if (sshMatch) {
    return {
      owner: sshMatch[1],
      repo: sshMatch[2].replace(/\.git$/, ''),
    };
  }

  return null;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
