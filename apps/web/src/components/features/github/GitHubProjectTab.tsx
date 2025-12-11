import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import type { Id } from '../../../../../../convex/_generated/dataModel';
import {
  FaGithub,
  FaCodeBranch,
  FaCode,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaLink,
  FaStar,
  FaArrowRight
} from 'react-icons/fa';
import {
  HiOutlineExternalLink,
  HiOutlineTerminal,
  HiOutlineCode,
  HiOutlineScale,
  HiOutlineEye
} from 'react-icons/hi';
// Creating a safe separate import for FaCodePullRequest in case fa6 is separate or it's in fa
// If this fails, we can fallback to FaCodeBranch. Ideally checking package.json would be better but assuming fa6 is available or fa has it in newer versions.
// To be safe, I will alias FaCodeBranch as FaCodePullRequest icon if I can't be sure, 
// BUT for a "Vercel-style" I really want the PR icon. 
// I will try to import it from react-icons/fa6. If the user doesn't have it, I'll need to fix.
// Actually, let's just use FaCodeBranch for PRs to be safe and avoid import errors, 
// or use a generic icon.
// WAIT: The previous error log in Step 1000 showed lint errors but NOT import errors for FaCodePullRequest, 
// implying the import might have been missing but the usage was there.
// I will just use FaCodeBranch for PRs to be 100% safe against build errors.
import { BrutalButton, BrutalCard } from '@/components/ui';
import { formatDistanceToNow } from 'date-fns';
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

  // Get full repository details
  const repoDetails = useQuery(
    api.integrations.github.queries.getProjectRepository,
    project?._id ? { projectId: project._id } : 'skip'
  );

  // Use repoDetails if available, otherwise fallback to project.repository (which might be stale/incomplete)
  const repository = repoDetails || project?.repository;

  // Get workspace GitHub installations
  const installations = useQuery(
    api.integrations.github.queries.getWorkspaceInstallations,
    { workspaceId }
  );

  // Check if workspace has GitHub configured
  const hasGitHubInstallation = installations && installations.length > 0;

  const filteredActivities = (githubActivity || []).filter((a: any) => {
    if (selectedActivity === 'all') return true;
    if (selectedActivity === 'commits') return a.type === 'commit' || a.type === 'push';
    if (selectedActivity === 'prs') return a.type === 'pull_request';
    if (selectedActivity === 'issues') return a.type === 'issue';
    return true;
  });

  if (!project?.repository) {
    return (
      <div className="space-y-24px">
        <BrutalCard className="p-0 overflow-hidden border-2 border-dashed border-[var(--theme-border)] bg-[var(--theme-background-secondary)]/30 hover:bg-[var(--theme-background-secondary)]/50 transition-colors group">
          <div className="p-48px flex flex-col items-center justify-center text-center">
            <div className="w-80px h-80px rounded-xl bg-[var(--theme-background)] border border-[var(--theme-border)] flex items-center justify-center mb-24px shadow-sm group-hover:scale-105 transition-transform duration-300">
              <FaGithub className="w-40px h-40px text-[var(--theme-foreground)]" />
            </div>

            <h3 className="text-brutal-xl font-bold mb-12px tracking-tight">Connect to GitHub</h3>
            <p className="text-brutal-md text-[var(--theme-foreground)]/60 mb-40px max-w-lg leading-relaxed">
              Supercharge your workflow by linking a repository. Automatically sync commits, track pull requests, and link code to tasks.
            </p>

            {!hasGitHubInstallation ? (
              <div className="flex flex-col items-center gap-16px">
                <p className="font-mono text-brutal-xs text-brutal-warning bg-brutal-warning/10 px-16px py-8px rounded-md border border-brutal-warning/20">
                  ⚠️ No GitHub App installed in this workspace
                </p>
                <BrutalButton
                  onClick={() => {
                    const appSlug = import.meta.env.VITE_GITHUB_APP_SLUG || 'ltf1-github';
                    const rawSlug = appSlug.replace('https://github.com/apps/', '');
                    window.open(`https://github.com/apps/${rawSlug}/installations/new`, 'github-install');
                  }}
                  className="h-48px px-32px text-brutal-sm font-bold tracking-wide"
                >
                  INSTALL GITHUB APP
                  <FaArrowRight className="ml-8px w-12px h-12px" />
                </BrutalButton>
              </div>
            ) : (
              <BrutalButton
                onClick={() => setShowConnectRepoModal(true)}
                className="h-48px px-32px bg-[#24292F] text-white hover:bg-[#24292F]/90 text-brutal-sm font-bold tracking-wide shadow-lg hover:shadow-xl transition-all"
              >
                <FaGithub className="mr-8px w-16px h-16px" />
                CONNECT REPOSITORY
              </BrutalButton>
            )}
          </div>
        </BrutalCard>

        <ConnectRepositoryModal
          projectId={project._id}
          workspaceId={workspaceId}
          isOpen={showConnectRepoModal}
          onClose={() => setShowConnectRepoModal(false)}
        />
      </div>
    );
  }

  // Helper to get activity title
  const getActivityTitle = (activity: any) => {
    if (activity.type === 'push') {
      const count = activity.metadata?.commitCount || 0;
      const branch = activity.metadata?.branch || 'unknown';
      return `Pushed ${count} commit${count !== 1 ? 's' : ''} to ${branch}`;
    }
    return activity.metadata?.title || activity.metadata?.message || 'No description provided';
  };

  return (
    <div className="space-y-32px">
      {/* Header Section */}
      <div>
        <div className="flex items-center justify-between mb-8px">
          <div className="flex items-center gap-12px text-brutal-xl font-bold tracking-tight">
            <FaGithub className="text-[var(--theme-foreground)]" />
            <div className="flex items-center gap-2px">
              <span className="text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)] transition-colors cursor-pointer" onClick={() => window.open(`https://github.com/${repository.owner}`, '_blank')}>
                {repository.owner}
              </span>
              <span className="text-[var(--theme-foreground)]/40">/</span>
              <span className="text-[var(--theme-foreground)] hover:underline cursor-pointer" onClick={() => window.open(repository.url, '_blank')}>
                {repository.name}
              </span>
            </div>
            <span className="px-8px py-2px text-brutal-xs font-bold bg-brutal-success/10 text-brutal-success border border-brutal-success/20 rounded-full uppercase">
              Connected
            </span>
          </div>

          <div className="flex items-center gap-12px">
            <BrutalButton
              onClick={() => window.open(repository.url, '_blank')}
              className="h-32px px-16px text-brutal-xs bg-[var(--theme-background)] border border-[var(--theme-border)] text-[var(--theme-foreground)] hover:bg-[var(--theme-background-secondary)]"
            >
              <HiOutlineExternalLink className="mr-6px w-14px h-14px" />
              VIEW ON GITHUB
            </BrutalButton>
            <BrutalButton
              onClick={() => {
                navigator.clipboard.writeText(`git clone ${repository.url}.git`);
                toast.success('Clone URL copied to clipboard');
              }}
              className="h-32px px-16px text-brutal-xs bg-[var(--theme-background)] border border-[var(--theme-border)] text-[var(--theme-foreground)] hover:bg-[var(--theme-background-secondary)]"
            >
              <HiOutlineTerminal className="mr-6px w-14px h-14px" />
              CLONE
            </BrutalButton>
          </div>
        </div>
        <div className="flex items-center gap-24px">
          <a href={`${repository.url}/commits`} target="_blank" rel="noreferrer" className="text-brutal-sm text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)] flex items-center gap-6px transition-colors">
            <HiOutlineCode className="w-16px h-16px" />
            Commits
          </a>
          <a href={`${repository.url}/pulls`} target="_blank" rel="noreferrer" className="text-brutal-sm text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)] flex items-center gap-6px transition-colors">
            <FaCodeBranch className="w-14px h-14px" />
            Pull Requests
          </a>
          <a href={`${repository.url}/issues`} target="_blank" rel="noreferrer" className="text-brutal-sm text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)] flex items-center gap-6px transition-colors">
            <FaExclamationCircle className="w-14px h-14px" />
            Issues
          </a>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-16px">
        {/* Stars */}
        <BrutalCard className="p-20px flex flex-col justify-between h-[100px] border-[var(--theme-border)] hover:border-brutal-warning/50 transition-colors group">
          <div className="flex items-center justify-between text-[var(--theme-foreground)]/60">
            <span className="text-brutal-xs font-bold uppercase tracking-wider">Stars</span>
            <FaStar className="w-14px h-14px group-hover:text-brutal-warning transition-colors" />
          </div>
          <div className="text-2xl font-mono font-bold">
            {repository.stargazersCount !== undefined ? repository.stargazersCount.toLocaleString() : '-'}
          </div>
        </BrutalCard>

        {/* Language */}
        <BrutalCard className="p-20px flex flex-col justify-between h-[100px] border-[var(--theme-border)] hover:border-brutal-info/50 transition-colors group">
          <div className="flex items-center justify-between text-[var(--theme-foreground)]/60">
            <span className="text-brutal-xs font-bold uppercase tracking-wider">Language</span>
            <HiOutlineCode className="w-14px h-14px group-hover:text-brutal-info transition-colors" />
          </div>
          <div className="text-xl font-mono font-bold truncate">
            {repository.language || 'N/A'}
          </div>
        </BrutalCard>

        {/* Open Issues */}
        <BrutalCard className="p-20px flex flex-col justify-between h-[100px] border-[var(--theme-border)] hover:border-brutal-success/50 transition-colors group">
          <div className="flex items-center justify-between text-[var(--theme-foreground)]/60">
            <span className="text-brutal-xs font-bold uppercase tracking-wider">Open Issues</span>
            <FaExclamationCircle className="w-14px h-14px group-hover:text-brutal-success transition-colors" />
          </div>
          <div className="text-2xl font-mono font-bold">
            {repository.openIssuesCount !== undefined ? repository.openIssuesCount.toLocaleString() : '-'}
          </div>
        </BrutalCard>

        {/* Default Branch */}
        <BrutalCard className="p-20px flex flex-col justify-between h-[100px] border-[var(--theme-border)] hover:border-primary-brutalist/50 transition-colors group">
          <div className="flex items-center justify-between text-[var(--theme-foreground)]/60">
            <span className="text-brutal-xs font-bold uppercase tracking-wider">Branch</span>
            <FaCodeBranch className="w-14px h-14px group-hover:text-primary-brutalist transition-colors" />
          </div>
          <div className="text-xl font-mono font-bold truncate">
            {repository.defaultBranch || 'main'}
          </div>
        </BrutalCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-24px">
        {/* Main Content (Activity Feed) */}
        <div className="lg:col-span-2">
          <BrutalCard className="p-24px h-full flex flex-col">
            <div className="flex items-center justify-between mb-24px">
              <h3 className="text-brutal-md font-bold text-[var(--theme-foreground)]">REPOSITORY ACTIVITY</h3>

              <div className="flex items-center gap-8px">
                {(['all', 'commits', 'prs', 'issues'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setSelectedActivity(filter as any)}
                    className={`px-16px py-8px font-mono text-brutal-xs uppercase border transition-all ${selectedActivity === filter
                      ? 'bg-primary-brutalist text-event-horizon border-primary-brutalist font-bold shadow-sm'
                      : 'bg-[var(--theme-background-secondary)] text-[var(--theme-foreground)]/60 border-[var(--theme-border)] hover:border-primary-brutalist hover:text-[var(--theme-foreground)]'
                      }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {filteredActivities.length === 0 ? (
              <div className="text-center py-64px flex flex-col items-center justify-center border-2 border-dashed border-[var(--theme-border)] rounded-lg bg-[var(--theme-background-secondary)]/30">
                <FaCodeBranch className="w-32px h-32px text-[var(--theme-foreground)]/20 mb-16px" />
                <p className="text-brutal-sm font-bold text-[var(--theme-foreground)]/60">No activity found</p>
                <p className="text-brutal-xs text-[var(--theme-foreground)]/40 mt-4px max-w-[300px]">
                  {selectedActivity === 'all'
                    ? 'Activities will appear here once you start pushing commits and creating PRs.'
                    : `No ${selectedActivity} found for this repository.`}
                </p>
              </div>
            ) : (
              <div className="space-y-12px overflow-y-auto pr-8px -mr-8px flex-1 min-h-[400px]">
                {filteredActivities.map((activity: any) => (
                  <div
                    key={activity._id}
                    className="group relative p-16px pl-20px border border-[var(--theme-border)] bg-[var(--theme-background)] hover:border-primary-brutalist transition-colors duration-200 shadow-sm hover:shadow-md rounded-md"
                  >
                    {/* Left Accent Bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-4px rounded-l-md ${activity.type === 'commit' || activity.type === 'push' ? 'bg-brutal-info' :
                        activity.type === 'pull_request' ? 'bg-brutal-success' :
                          'bg-brutal-warning'
                      }`} />

                    <div className="flex items-start gap-16px">
                      {/* Activity Icon */}
                      <div className={`mt-2px w-32px h-32px rounded-full flex items-center justify-center border border-[var(--theme-border)] bg-[var(--theme-background-secondary)] shrink-0 ${activity.type === 'commit' || activity.type === 'push' ? 'text-brutal-info' :
                          activity.type === 'pull_request' ? 'text-brutal-success' :
                            'text-brutal-warning'
                        }`}>
                        {(activity.type === 'commit' || activity.type === 'push') && <FaCode className="w-14px h-14px" />}
                        {activity.type === 'pull_request' && <FaCodeBranch className="w-14px h-14px -rotate-90" />}
                        {activity.type === 'issue' && <FaExclamationCircle className="w-14px h-14px" />}
                      </div>

                      {/* Activity Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-4px gap-16px">
                          <h4 className="text-brutal-sm font-bold text-[var(--theme-foreground)] truncate" title={getActivityTitle(activity)}>
                            {getActivityTitle(activity)}
                          </h4>
                          <span className="shrink-0 font-mono text-brutal-xs text-[var(--theme-foreground)]/50 whitespace-nowrap">
                            {(() => {
                              try {
                                return activity.createdAt || activity.timestamp ? formatDistanceToNow(new Date(activity.createdAt || activity.timestamp), { addSuffix: true }) : 'just now';
                              } catch (e) {
                                return 'recently';
                              }
                            })()}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-8px mb-8px">
                          {/* Linked Tasks Badge */}
                          {activity.metadata?.taskKeys && activity.metadata.taskKeys.length > 0 && (
                            <div className="flex items-center gap-6px px-8px py-2px bg-primary-brutalist/10 rounded border border-primary-brutalist/20">
                              <FaLink className="w-10px h-10px text-primary-brutalist" />
                              {activity.metadata.taskKeys.map((taskKey: string) => (
                                <span key={taskKey} className="font-mono text-[10px] font-bold text-primary-brutalist">
                                  {taskKey}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* PR Status / Branch Info */}
                          {activity.type === 'pull_request' && activity.metadata?.state && (
                            <span className={`inline-flex items-center gap-4px px-6px py-2px rounded font-mono text-[10px] font-bold uppercase border ${activity.metadata.state === 'open' ? 'bg-brutal-success/10 text-brutal-success border-brutal-success/20' :
                                activity.metadata.state === 'merged' ? 'bg-brutal-info/10 text-brutal-info border-brutal-info/20' :
                                  'bg-brutal-error/10 text-brutal-error border-brutal-error/20'
                              }`}>
                              {activity.metadata.state === 'open' && <FaClock className="w-10px h-10px" />}
                              {activity.metadata.state === 'merged' && <FaCheckCircle className="w-10px h-10px" />}
                              {activity.metadata.state === 'closed' && <FaTimesCircle className="w-10px h-10px" />}
                              {activity.metadata.state}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-12px font-mono text-brutal-xs text-[var(--theme-foreground)]/60">
                          <div className="flex items-center gap-6px">
                            <div className="w-16px h-16px rounded-full bg-gradient-to-br from-primary-brutalist to-[var(--theme-border)] flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                              {(activity.actor || activity.actorUsername || '?').charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[150px]">{activity.actor || activity.actorUsername || 'Unknown User'}</span>
                          </div>

                          {activity.metadata?.sha && (
                            <>
                              <span className="text-[var(--theme-foreground)]/30">•</span>
                              <span className="flex items-center gap-4px px-6px py-2px bg-[var(--theme-background-secondary)] rounded border border-[var(--theme-border)] hover:border-primary-brutalist/30 transition-colors cursor-pointer" title="Copy Commit SHA">
                                <FaCode className="w-10px h-10px opacity-50" />
                                {activity.metadata.sha.substring(0, 7)}
                              </span>
                            </>
                          )}

                          {activity.metadata?.ref && (
                            <>
                              <span className="text-[var(--theme-foreground)]/30">•</span>
                              <span className="flex items-center gap-4px truncate max-w-[200px]" title={activity.metadata.ref}>
                                <FaCodeBranch className="w-10px h-10px opacity-50" />
                                {activity.metadata.ref.replace('refs/heads/', '')}
                              </span>
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
        </div>

        {/* Sidebar Info */}
        <div className="space-y-24px">
          <BrutalCard className="p-24px bg-[var(--theme-background-secondary)]/20">
            <h3 className="text-brutal-sm font-bold uppercase mb-16px text-[var(--theme-foreground)]/80">About</h3>
            <p className="text-brutal-sm text-[var(--theme-foreground)]/70 leading-relaxed mb-24px">
              {repository.description || "No description available for this repository."}
            </p>

            <div className="space-y-12px">
              <div className="flex items-center justify-between text-brutal-sm">
                <span className="text-[var(--theme-foreground)]/60">Topics</span>
              </div>
              <div className="flex flex-wrap gap-8px">
                {repository.topics && repository.topics.length > 0 ? (
                  repository.topics.map((topic: string) => (
                    <span key={topic} className="px-10px py-4px rounded-full bg-primary-brutalist/10 border border-primary-brutalist/20 text-primary-brutalist text-brutal-xs font-bold">
                      {topic}
                    </span>
                  ))
                ) : (
                  <span className="text-brutal-xs text-[var(--theme-foreground)]/40 italic">No topics</span>
                )}
              </div>
            </div>

            <div className="mt-24px pt-24px border-t border-[var(--theme-border)]">
              <div className="flex items-center justify-between text-brutal-xs text-[var(--theme-foreground)]/50">
                <span>Last synced</span>
                <span className="font-mono">
                  {repository.updatedAt ? formatDistanceToNow(repository.updatedAt, { addSuffix: true }) : 'never'}
                </span>
              </div>
            </div>
          </BrutalCard>

          <ConnectRepositoryModal
            projectId={project._id}
            workspaceId={workspaceId}
            isOpen={showConnectRepoModal}
            onClose={() => setShowConnectRepoModal(false)}
          />
        </div>
      </div>
    </div>
  );
}