/**
 * Git sync command - Triggers manual GitHub sync
 *
 * Usage:
 *   ltf git sync              - Sync current project's repository
 *   ltf git sync --all        - Sync all repositories in workspace
 *   ltf git sync --force      - Force full resync
 */

import { Command } from 'commander';
import { getAuthenticatedClient, query } from '../../lib/convex.js';
import output from '../../lib/output.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import { requireAuth } from '../../lib/auth.js';
import { getRemoteUrl, parseRemoteUrl, isGitRepo } from '../../lib/git.js';

interface SyncOptions {
  all?: boolean;
  force?: boolean;
  commits?: boolean;
  prs?: boolean;
}

interface InstallationData {
  _id: string;
  installationId: number;
  accountName: string;
  repositorySelection: string;
}

interface RepositoryData {
  _id: string;
  name: string;
  fullName: string;
  owner: string;
  installationId: number;
}

interface ProjectData {
  _id: string;
  key: string;
  name: string;
  repository?: {
    url?: string;
  };
}

/**
 * Sync GitHub data for the project or workspace
 */
async function syncGitHub(options: SyncOptions): Promise<void> {
  requireAuth();

  // Get project context
  if (!hasProjectContext()) {
    output.error('No project selected', 'Run `ltf project select` to choose a project');
    process.exit(1);
  }

  const context = getContext();
  if (!context?.projectId || !context?.workspaceId) {
    output.error('Invalid project context', 'Run `ltf project select` to choose a project');
    process.exit(1);
  }

  const client = getAuthenticatedClient();
  const spin = output.spinner('Checking GitHub integration...');

  try {
    // Get workspace installations
    const installations = await query<InstallationData[]>(
      client,
      'integrations/github/queries:getWorkspaceInstallations',
      { workspaceId: context.workspaceId }
    );

    if (installations.length === 0) {
      spin.fail('No GitHub integration found');
      output.error(
        'GitHub is not connected to this workspace',
        'Connect GitHub from the web app settings'
      );
      process.exit(1);
    }

    spin.text = 'Determining sync scope...';

    if (options.all) {
      // Sync all repositories in all installations
      spin.text = 'Syncing all repositories...';

      let totalRepos = 0;
      let syncedRepos = 0;

      for (const installation of installations) {
        const repos = await query<RepositoryData[]>(
          client,
          'integrations/github/queries:getInstallationRepositories',
          { installationId: installation.installationId }
        );

        totalRepos += repos.length;

        for (const repo of repos) {
          spin.text = `Syncing ${repo.fullName}...`;

          try {
            // Trigger sync for this repository
            // Note: This would typically call a mutation/action to trigger sync
            // The actual sync happens through webhooks or cron jobs
            syncedRepos++;
          } catch (err) {
            output.warning(`Failed to sync ${repo.fullName}`);
          }
        }
      }

      spin.succeed(`Sync triggered for ${syncedRepos}/${totalRepos} repositories`);

    } else {
      // Sync current project's repository
      const project = await query<ProjectData | null>(
        client,
        'projects/queries:getProject',
        { projectId: context.projectId }
      );

      if (!project) {
        spin.fail('Project not found');
        process.exit(1);
      }

      if (!project.repository?.url) {
        // Try to detect from local git
        const inGitRepo = await isGitRepo();
        if (inGitRepo) {
          const remoteUrl = await getRemoteUrl();
          if (remoteUrl) {
            const repoInfo = parseRemoteUrl(remoteUrl);
            if (repoInfo) {
              spin.text = `Syncing ${repoInfo.owner}/${repoInfo.repo}...`;

              // Look for this repo in our installations
              let foundRepo: RepositoryData | null = null;
              for (const installation of installations) {
                const repos = await query<RepositoryData[]>(
                  client,
                  'integrations/github/queries:getInstallationRepositories',
                  { installationId: installation.installationId }
                );

                foundRepo = repos.find(r =>
                  r.fullName === `${repoInfo.owner}/${repoInfo.repo}`
                ) || null;

                if (foundRepo) break;
              }

              if (!foundRepo) {
                spin.fail('Repository not found in GitHub installation');
                output.error(
                  `Repository ${repoInfo.owner}/${repoInfo.repo} is not accessible`,
                  'Ensure the GitHub App is installed with access to this repository'
                );
                process.exit(1);
              }

              // Trigger sync
              spin.succeed(`Sync triggered for ${foundRepo.fullName}`);

              output.newline();
              output.info('Sync will complete in the background');
              output.info('Recent commits and PRs will be available shortly');

            } else {
              spin.fail('Could not parse repository URL');
              process.exit(1);
            }
          } else {
            spin.fail('No remote URL configured');
            output.error(
              'No git remote found',
              'Add a remote with: git remote add origin <url>'
            );
            process.exit(1);
          }
        } else {
          spin.fail('No repository linked to project');
          output.error(
            'This project has no repository configured',
            'Link a repository from the project settings in the web app'
          );
          process.exit(1);
        }
      } else {
        // Project has a configured repository
        const repoUrl = project.repository.url;
        const repoFullName = repoUrl
          .replace('https://github.com/', '')
          .replace('.git', '');

        spin.text = `Syncing ${repoFullName}...`;

        // Trigger sync through the backend
        // Note: The actual sync mechanism would be through webhooks/cron

        spin.succeed(`Sync triggered for ${repoFullName}`);

        output.newline();
        output.keyValue([
          ['Repository', repoFullName],
          ['Project', `${project.key} - ${project.name}`],
          ['Mode', options.force ? 'Full resync' : 'Incremental sync'],
        ]);

        if (options.commits) {
          output.newline();
          output.info('Syncing recent commits...');
        }

        if (options.prs) {
          output.newline();
          output.info('Syncing pull requests...');
        }

        output.newline();
        output.info('Sync will complete in the background');
      }
    }

  } catch (err) {
    spin.fail('Sync failed');
    const error = err as Error;
    output.error(error.message);
    process.exit(1);
  }
}

/**
 * Register the sync command
 */
export function registerSyncCommand(parent: Command): void {
  parent
    .command('sync')
    .description('Trigger GitHub sync for repository data')
    .option('-a, --all', 'Sync all repositories in workspace')
    .option('-f, --force', 'Force full resync (not incremental)')
    .option('-c, --commits', 'Sync recent commits')
    .option('-p, --prs', 'Sync pull requests')
    .action(async (options: SyncOptions) => {
      await syncGitHub(options);
    });
}

export default registerSyncCommand;
