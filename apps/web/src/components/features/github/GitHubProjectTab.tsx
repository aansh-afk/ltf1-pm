import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import type { Id } from '../../../../../../convex/_generated/dataModel';
import {
  FaGithub,
  FaCodeBranch,
  FaCodeBranch as FaCodePullRequest,
  FaCode,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaSync,
  FaLink
} from 'react-icons/fa';
import { HiOutlineExternalLink } from 'react-icons/hi';
import { BrutalButton, BrutalCard } from '@/components/ui';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import ConnectRepositoryModal from './ConnectRepositoryModal';

interface GitHubProjectTabProps {
  project: any;
  workspaceId: Id<"workspaces">;
}

export function GitHubProjectTab({ project, workspaceId }: GitHubProjectTabProps) {
  const [showConnectRepoModal, setShowConnectRepoModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<'all' | 'commits' | 'prs' | 'issues'>('all');

  // Get GitHub activity for the project
  const githubActivity = useQuery(
    api.integrations.github.queries.getProjectGitHubActivity,
    project?._id ? { projectId: project._id, limit: 50 } : 'skip'
  );

  // Get workspace GitHub installations
  const installations = useQuery(
    api.integrations.github.queries.getWorkspaceInstallations,
    { workspaceId }
  );

  // Check if workspace has GitHub configured
  const hasGitHubInstallation = installations && installations.length > 0;

  if (!project?.repository) {
    return (
      <div className="space-y-24px">
        <BrutalCard className="p-0 overflow-hidden border-2 border-dashed border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/50 hover:bg-[var(--theme-background-secondary)] transition-colors group">
          <div className="p-32px flex flex-col items-center justify-center text-center">
            <div className="w-64px h-64px rounded-full bg-[var(--theme-background)] border-2 border-[var(--theme-border)] flex items-center justify-center mb-24px group-hover:scale-110 transition-transform">
              <FaGithub className="w-32px h-32px text-[var(--theme-foreground)]" />
            </div>

            <h3 className="text-brutal-lg font-bold mb-8px uppercase">Link Repository</h3>
            <p className="text-brutal-sm text-[var(--theme-foreground)]/60 mb-32px max-w-md">
              Link this project to a GitHub repository to automatically sync commits, pull requests, and enable task linking.
            </p>

            {!hasGitHubInstallation ? (
              <div className="flex flex-col items-center gap-16px">
                <p className="text-brutal-xs font-mono text-brutal-warning bg-brutal-warning/10 px-12px py-6px border border-brutal-warning/20">
                  ⚠️ Workspace not connected to GitHub
                </p>
                <BrutalButton
                  onClick={() => {
                    console.log('Opening GitHub App installation...');
                    const appSlug = import.meta.env.VITE_GITHUB_APP_SLUG || 'ltf1-github';
                    const rawSlug = appSlug.replace('https://github.com/apps/', '');
                    window.open(`https://github.com/apps/${rawSlug}/installations/new`, 'github-install');
                  }}
                  className="flex items-center gap-12px"
                >
                  <FaLink className="w-16px h-16px" />
                  INSTALL GITHUB APP
                </BrutalButton>
              </div>
            ) : (
              <BrutalButton
                onClick={() => {
                  console.log('Connect Repository button clicked');
                  setShowConnectRepoModal(true);
                }}
                className="flex items-center gap-12px bg-primary-brutalist text-event-horizon hover:opacity-90"
              >
                <FaLink className="w-16px h-16px" />
                CONNECT REPOSITORY
              </BrutalButton>
            )}
          </div>
        </BrutalCard>

        <ConnectRepositoryModal
          projectId={project._id}
          workspaceId={workspaceId}
          isOpen={showConnectRepoModal}
          onClose={() => {
            console.log('Closing Connect Repository modal');
            setShowConnectRepoModal(false);
          }}
        />
      </div>
    );
  }

  const repository = project.repository;
  const repoUrl = repository.url;
  const repoName = repoUrl.replace('https://github.com/', '').replace('.git', '');

  // Filter activities based on selection
  const filteredActivities = githubActivity?.filter(activity => {
    if (selectedActivity === 'all') return true;
    if (selectedActivity === 'commits') return activity.type === 'commit';
    if (selectedActivity === 'prs') return activity.type === 'pull_request';
    if (selectedActivity === 'issues') return activity.type === 'issue';
    return false;
  }) || [];

  // Group activities by task
  const activitiesByTask = filteredActivities.reduce((acc, activity) => {
    if (activity.metadata?.taskKeys) {
      activity.metadata.taskKeys.forEach((taskKey: string) => {
        if (!acc[taskKey]) acc[taskKey] = [];
        acc[taskKey].push(activity);
      });
    }
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-24px">
      {/* Repository Overview */}
      <BrutalCard className="p-24px">
        <div className="flex items-center justify-between mb-24px">
          <div className="flex items-center gap-16px">
            <FaGithub className="w-32px h-32px" />
            <div>
              <h2 className="text-brutal-lg font-bold">GITHUB REPOSITORY</h2>
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-brutal-sm text-primary-brutalist hover:underline flex items-center gap-4px"
              >
                {repoName}
                <HiOutlineExternalLink className="w-12px h-12px" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-12px">
            <BrutalButton
              variant="secondary"
              size="sm"
              onClick={() => {
                const cloneUrl = repoUrl.endsWith('.git') ? repoUrl : `${repoUrl}.git`;
                navigator.clipboard.writeText(cloneUrl);
                toast.success('Clone URL copied!');
              }}
            >
              COPY CLONE URL
            </BrutalButton>
            <BrutalButton
              size="sm"
              onClick={() => window.open(repoUrl, '_blank')}
            >
              OPEN IN GITHUB
            </BrutalButton>
          </div>
        </div>

        {/* Repository Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-16px">
          <div className="p-16px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
            <div className="text-brutal-xs uppercase text-[var(--theme-foreground)]/60 mb-4px">Default Branch</div>
            <div className="font-mono font-bold">{repository.defaultBranch}</div>
          </div>
          <div className="p-16px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
            <div className="text-brutal-xs uppercase text-[var(--theme-foreground)]/60 mb-4px">Total Commits</div>
            <div className="font-mono font-bold text-brutal-info">
              {filteredActivities.filter(a => a.type === 'commit').length}
            </div>
          </div>
          <div className="p-16px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
            <div className="text-brutal-xs uppercase text-[var(--theme-foreground)]/60 mb-4px">Open PRs</div>
            <div className="font-mono font-bold text-brutal-success">
              {filteredActivities.filter(a => a.type === 'pull_request' && a.metadata?.state === 'open').length}
            </div>
          </div>
          <div className="p-16px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
            <div className="text-brutal-xs uppercase text-[var(--theme-foreground)]/60 mb-4px">Linked Tasks</div>
            <div className="font-mono font-bold text-primary-brutalist">
              {Object.keys(activitiesByTask).length}
            </div>
          </div>
        </div>
      </BrutalCard>

      {/* Activity Feed */}
      <BrutalCard className="p-24px">
        <div className="flex items-center justify-between mb-24px">
          <h3 className="text-brutal-md font-bold">REPOSITORY ACTIVITY</h3>

          <div className="flex items-center gap-8px">
            {(['all', 'commits', 'prs', 'issues'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setSelectedActivity(filter)}
                className={`px-16px py-8px font-mono text-brutal-xs uppercase border ${selectedActivity === filter
                  ? 'bg-primary-brutalist text-event-horizon border-primary-brutalist'
                  : 'bg-[var(--theme-background-secondary)] border-[var(--theme-border)] hover:border-primary-brutalist'
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {filteredActivities.length === 0 ? (
          <div className="text-center py-32px">
            <p className="text-brutal-sm text-[var(--theme-foreground)]/60">
              No GitHub activity found. Activities will appear here once you start pushing commits and creating PRs.
            </p>
          </div>
        ) : (
          <div className="space-y-12px max-h-[600px] overflow-y-auto">
            {filteredActivities.map((activity) => (
              <div
                key={activity._id}
                className="p-16px border border-[var(--theme-border)] hover:border-primary-brutalist transition-colors"
              >
                <div className="flex items-start gap-16px">
                  {/* Activity Icon */}
                  <div className="mt-4px">
                    {activity.type === 'commit' && <FaCode className="w-16px h-16px text-brutal-info" />}
                    {activity.type === 'pull_request' && <FaCodePullRequest className="w-16px h-16px text-brutal-success" />}
                    {activity.type === 'issue' && <FaExclamationCircle className="w-16px h-16px text-brutal-warning" />}
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-8px">
                      <div>
                        <h4 className="font-mono text-brutal-sm font-bold">
                          {activity.type === 'commit' && `Commit: ${activity.title}`}
                          {activity.type === 'pull_request' && `PR #${activity.metadata?.number}: ${activity.title}`}
                          {activity.type === 'issue' && `Issue #${activity.metadata?.number}: ${activity.title}`}
                        </h4>

                        {/* Linked Tasks */}
                        {activity.metadata?.taskKeys && activity.metadata.taskKeys.length > 0 && (
                          <div className="flex items-center gap-8px mt-4px">
                            <FaLink className="w-12px h-12px text-[var(--theme-foreground)]/40" />
                            {activity.metadata.taskKeys.map((taskKey: string) => (
                              <span key={taskKey} className="font-mono text-brutal-xs text-primary-brutalist">
                                {taskKey}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Activity Metadata */}
                      <div className="text-right">
                        {activity.type === 'pull_request' && activity.metadata?.state && (
                          <span className={`inline-flex items-center gap-4px font-mono text-brutal-xs ${activity.metadata.state === 'open' ? 'text-brutal-success' :
                            activity.metadata.state === 'merged' ? 'text-brutal-info' :
                              'text-brutal-error'
                            }`}>
                            {activity.metadata.state === 'open' && <FaClock className="w-12px h-12px" />}
                            {activity.metadata.state === 'merged' && <FaCheckCircle className="w-12px h-12px" />}
                            {activity.metadata.state === 'closed' && <FaTimesCircle className="w-12px h-12px" />}
                            {activity.metadata.state.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-16px font-mono text-brutal-xs text-[var(--theme-foreground)]/60">
                      <span>by {activity.actorUsername}</span>
                      <span>•</span>
                      <span>
                        {(() => {
                          try {
                            return activity.createdAt ? formatDistanceToNow(new Date(activity.createdAt)) : 'just now';
                          } catch (e) {
                            return 'recently';
                          }
                        })()} ago
                      </span>
                      {activity.metadata?.sha && (
                        <>
                          <span>•</span>
                          <span>{activity.metadata.sha.substring(0, 7)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </BrutalCard>

      {/* Task-Code Linking */}
      {Object.keys(activitiesByTask).length > 0 && (
        <BrutalCard className="p-24px">
          <h3 className="text-brutal-md font-bold mb-16px">TASK-CODE LINKAGE</h3>
          <div className="space-y-12px">
            {Object.entries(activitiesByTask).map(([taskKey, activities]) => (
              <div key={taskKey} className="p-16px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
                <div className="flex items-center justify-between mb-8px">
                  <h4 className="font-mono font-bold text-primary-brutalist">{taskKey}</h4>
                  <span className="font-mono text-brutal-xs text-[var(--theme-foreground)]/60">
                    {activities.length} linked {activities.length === 1 ? 'activity' : 'activities'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-8px text-brutal-xs">
                  <div>
                    <span className="text-[var(--theme-foreground)]/60">Commits:</span>{' '}
                    <span className="font-mono font-bold">
                      {activities.filter(a => a.type === 'commit').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--theme-foreground)]/60">PRs:</span>{' '}
                    <span className="font-mono font-bold">
                      {activities.filter(a => a.type === 'pull_request').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--theme-foreground)]/60">Last Activity:</span>{' '}
                    <span className="font-mono">
                      {formatDistanceToNow(new Date(Math.max(...activities.map(a => new Date(a.createdAt).getTime()))))} ago
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </BrutalCard>
      )}

      <ConnectRepositoryModal
        projectId={project._id}
        workspaceId={workspaceId}
        isOpen={showConnectRepoModal}
        onClose={() => setShowConnectRepoModal(false)}
      />
    </div>
  );
}