import { useState } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import {
  FaGithub,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaSync,
  FaLink
} from 'react-icons/fa';
import { HiOutlineExternalLink, HiOutlineTrash } from 'react-icons/hi';
import BrutalButton from '@/components/ui/BrutalButton';
import BrutalCard from '@/components/ui/BrutalCard';
import BrutalBadge from '@/components/ui/BrutalBadge';
import SettingsSection from './SettingsSection';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface GitHubSettingsTabProps {
  currentUser: any;
}

export function GitHubSettingsTab({ currentUser }: GitHubSettingsTabProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  // Get GitHub stats
  const githubStats = useQuery(
    api.integrations.github.queries.getDeveloperGitHubStats,
    currentUser ? { userId: currentUser._id } : 'skip'
  );

  // Get user's GitHub installations
  const installations = useQuery(api.integrations.github.auth.getUserInstallations);

  // Mutations
  const linkGitHubAccount = useMutation(api.integrations.github.auth.linkGitHubAccount);
  const disconnectGitHub = useMutation(api.integrations.github.oauth.disconnectGitHub);

  // Actions
  const syncRepositories = useAction(api.integrations.github.actions.syncRepositories);

  const isConnected = githubStats !== null;
  const hasInstallations = installations && installations.length > 0;

  const handleConnect = async () => {
    try {
      // For MVP, we'll prompt for GitHub username
      const username = prompt('ENTER_GITHUB_USERNAME:');
      if (!username) return;

      await linkGitHubAccount({ githubUsername: username });
      toast.success('GITHUB_LINKED');
    } catch (error) {
      console.error('Error linking GitHub:', error);
      toast.error('LINK_FAILED');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('DISCONNECT GITHUB? SYNC WILL STOP.')) {
      return;
    }

    try {
      await disconnectGitHub({});
      toast.success('GITHUB_DISCONNECTED');
    } catch (error) {
      console.error('Error unlinking GitHub:', error);
      toast.error('DISCONNECT_FAILED');
    }
  };

  const handleSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      const result = await syncRepositories({});
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error syncing repositories:', error);
      toast.error('Failed to sync repositories');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleInstallApp = () => {
    const appSlug = import.meta.env.VITE_GITHUB_APP_SLUG || 'ltf1-integration';
    window.open(`https://github.com/apps/${appSlug}/installations/new`, 'github-install', 'width=800,height=600');
  };

  return (
    <div className="space-y-8">
      <SettingsSection
        title="GitHub Integration"
        description="Connect your GitHub account to sync commits, PRs, and link code to tasks."
      >
        <div className="space-y-6">
          {/* Connection Status */}
          <BrutalCard className="p-6 border-l-4 border-l-[#24292e]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#24292e] text-white border-2 border-[#24292e]">
                  <FaGithub className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold uppercase">
                    {isConnected ? 'GITHUB_CONNECTED' : 'GITHUB_DISCONNECTED'}
                  </h4>
                  {githubStats?.username && (
                    <p className="text-sm text-[var(--theme-foreground)]/60 font-mono">
                      @{githubStats.username}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isConnected ? (
                  <>
                    <BrutalButton
                      variant="secondary"
                      size="sm"
                      onClick={handleSync}
                      disabled={isSyncing}
                      className="flex items-center gap-2"
                    >
                      <FaSync className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? 'SYNCING...' : 'SYNC_NOW'}
                    </BrutalButton>
                    <BrutalButton
                      variant="destructive"
                      size="sm"
                      onClick={handleDisconnect}
                      className="flex items-center gap-2"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                      DISCONNECT
                    </BrutalButton>
                  </>
                ) : (
                  <BrutalButton
                    onClick={handleConnect}
                    className="flex items-center gap-2 bg-[#24292e] border-[#24292e] text-white hover:bg-[#24292e]/80"
                  >
                    <FaLink className="w-4 h-4" />
                    CONNECT_GITHUB
                  </BrutalButton>
                )}
              </div>
            </div>

            {isConnected && githubStats && (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-[var(--theme-background)] border-2 border-[var(--theme-border)]">
                  <div className="text-2xl font-bold text-brutal-info">{githubStats.totalPRs || 0}</div>
                  <div className="text-xs uppercase font-bold text-[var(--theme-foreground)]/60">PULL_REQUESTS</div>
                </div>
                <div className="text-center p-4 bg-[var(--theme-background)] border-2 border-[var(--theme-border)]">
                  <div className="text-2xl font-bold text-brutal-success">{githubStats.totalReviews || 0}</div>
                  <div className="text-xs uppercase font-bold text-[var(--theme-foreground)]/60">CODE_REVIEWS</div>
                </div>
                <div className="text-center p-4 bg-[var(--theme-background)] border-2 border-[var(--theme-border)]">
                  <div className="text-2xl font-bold text-brutal-warning">
                    {githubStats.languages?.length || 0}
                  </div>
                  <div className="text-xs uppercase font-bold text-[var(--theme-foreground)]/60">LANGUAGES</div>
                </div>
              </div>
            )}

            {isConnected && githubStats?.lastSynced && (
              <div className="mt-4 pt-4 border-t-2 border-[var(--theme-border)] flex items-center justify-between">
                <p className="text-xs text-[var(--theme-foreground)]/60 font-mono uppercase">
                  LAST_SYNC: {format(new Date(githubStats.lastSynced), 'MMM d, yyyy HH:mm')}
                </p>
                {githubStats.isStale && (
                  <BrutalBadge variant="warning" className="flex items-center gap-1">
                    <FaExclamationCircle className="w-3 h-3" />
                    DATA_STALE
                  </BrutalBadge>
                )}
              </div>
            )}
          </BrutalCard>

          {/* GitHub App Installation */}
          <BrutalCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-bold uppercase mb-1">APP_INSTALLATION</h4>
                <p className="text-sm text-[var(--theme-foreground)]/60 font-mono">
                  Install the LTF1 GitHub App for webhooks and auto-sync.
                </p>
              </div>

              {hasInstallations ? (
                <BrutalBadge variant="success" className="flex items-center gap-2">
                  <FaCheckCircle className="w-4 h-4" />
                  INSTALLED
                </BrutalBadge>
              ) : (
                <BrutalBadge variant="outline" className="flex items-center gap-2 opacity-50">
                  <FaTimesCircle className="w-4 h-4" />
                  NOT_INSTALLED
                </BrutalBadge>
              )}
            </div>

            {!hasInstallations ? (
              <BrutalButton
                onClick={handleInstallApp}
                variant="secondary"
                className="w-full flex items-center justify-center gap-2"
              >
                INSTALL_GITHUB_APP
              </BrutalButton>
            ) : (
              <div className="space-y-3">
                {installations.map((installation: any) => (
                  <div key={installation._id} className="flex items-center justify-between p-3 bg-[var(--theme-background)] border-2 border-[var(--theme-border)]">
                    <div>
                      <p className="font-mono text-sm font-bold">{installation.accountName}</p>
                      <p className="text-xs text-[var(--theme-foreground)]/60 uppercase">
                        {installation.accountType} • ID: {installation.installationId}
                      </p>
                    </div>
                    <a
                      href={`https://github.com/settings/installations`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--theme-primary)] hover:underline flex items-center gap-1 text-xs font-bold uppercase"
                    >
                      MANAGE
                      <HiOutlineExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </BrutalCard>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Features & Permissions"
        description="Capabilities enabled by GitHub integration."
      >
        <BrutalCard className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <FaCheckCircle className="w-5 h-5 text-brutal-success mt-1" />
              <div>
                <p className="font-bold uppercase text-sm">Task Linking</p>
                <p className="text-xs text-[var(--theme-foreground)]/60 font-mono mt-1">
                  Commits referencing task IDs (WEB-123) are auto-linked.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FaCheckCircle className="w-5 h-5 text-brutal-success mt-1" />
              <div>
                <p className="font-bold uppercase text-sm">PR Tracking</p>
                <p className="text-xs text-[var(--theme-foreground)]/60 font-mono mt-1">
                  Monitor PR status and reviews directly in projects.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FaCheckCircle className="w-5 h-5 text-brutal-success mt-1" />
              <div>
                <p className="font-bold uppercase text-sm">Activity Sync</p>
                <p className="text-xs text-[var(--theme-foreground)]/60 font-mono mt-1">
                  Sync contribution stats to your developer profile.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FaCheckCircle className="w-5 h-5 text-brutal-success mt-1" />
              <div>
                <p className="font-bold uppercase text-sm">Webhooks</p>
                <p className="text-xs text-[var(--theme-foreground)]/60 font-mono mt-1">
                  Real-time updates for pushes and PR changes.
                </p>
              </div>
            </div>
          </div>
        </BrutalCard>
      </SettingsSection>

      <SettingsSection
        title="Privacy Protocol"
        description="Data handling and security measures."
      >
        <BrutalCard className="p-6 border-brutal-warning bg-brutal-warning/5">
          <div className="flex items-start gap-4">
            <FaExclamationCircle className="w-6 h-6 text-brutal-warning flex-shrink-0" />
            <div>
              <p className="text-sm font-bold uppercase mb-2">SECURITY_NOTICE</p>
              <p className="text-sm mb-4 font-mono">
                LTF1 accesses only explicitly granted repositories. Private code is never read without permission.
              </p>
              <ul className="text-xs space-y-1 font-mono text-[var(--theme-foreground)]/80 list-disc list-inside">
                <li>Public profile info & stats are synced</li>
                <li>Repo data accessed only on project connection</li>
                <li>Data encrypted at rest</li>
                <li>Revoke access anytime via GitHub</li>
              </ul>
            </div>
          </div>
        </BrutalCard>
      </SettingsSection>
    </div>
  );
}