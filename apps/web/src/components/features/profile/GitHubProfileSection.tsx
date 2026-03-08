import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import type { Id } from '../../../../../../convex/_generated/dataModel';
import {
  FaGithub,
  FaCodeBranch,
  FaCodeBranch as FaCodePullRequest,
  FaCode,
  FaStar,
  FaExclamationTriangle
} from 'react-icons/fa';
import { HiOutlineExternalLink, HiOutlineTrash } from 'react-icons/hi';
import BrutalButton from '@/components/ui/BrutalButton';
import BrutalCard from '@/components/ui/BrutalCard';
import { GitHubConnectButton } from '@/components/features/github/GitHubConnectButton';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface GitHubProfileSectionProps {
  userId: Id<"users">;
  isProfileComplete: boolean;
  onConnect?: () => void;
}

export function GitHubProfileSection({ userId, isProfileComplete, onConnect }: GitHubProfileSectionProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  // Get GitHub stats
  const githubStats = useQuery(api.integrations.github.queries.getDeveloperGitHubStats, { userId });

  // Get GitHub connection info
  const connectionInfo = useQuery(api.integrations.github.oauth.getGitHubConnectionInfo);

  // Get user's GitHub installations
  const installations = useQuery(api.integrations.github.auth.getUserInstallations);

  // Disconnect mutation
  const disconnectGitHub = useMutation(api.integrations.github.oauth.disconnectGitHub);

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your GitHub account?')) {
      return;
    }

    try {
      await disconnectGitHub();
      toast.success('GitHub account disconnected');
      if (onConnect) {
        onConnect();
      }
    } catch (error) {
      console.error('Error disconnecting GitHub:', error);
      toast.error('Failed to disconnect GitHub account');
    }
  };

  const handleInstallApp = () => {
    const appSlug = import.meta.env.VITE_GITHUB_APP_SLUG || 'ltf1-integration';
    window.open(`https://github.com/apps/${appSlug}/installations/new`, 'github-install', 'width=800,height=600');
  };

  // Not connected state
  if (!githubStats) {
    return (
      <BrutalCard className="relative">
        {!isProfileComplete && (
          <div className="absolute top-3 right-3">
            <div className="flex items-center gap-1 text-[var(--theme-warning)]">
              <FaExclamationTriangle className="w-3 h-3" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Required</span>
            </div>
          </div>
        )}

        <h3 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 text-[var(--theme-foreground)]">
          <FaGithub className="w-4 h-4" />
          GITHUB INTEGRATION
        </h3>

        <div className="text-center py-6">
          <FaGithub className="w-6 h-6 text-[var(--theme-foreground)]/20 mx-auto mb-2" />
          <p className="text-xs text-[var(--theme-foreground)]/50 mb-3">
            Connect your GitHub account to showcase your contributions
          </p>

          <div className="space-y-1.5">
            <GitHubConnectButton
              onConnect={onConnect}
              className="w-full max-w-xs mx-auto"
              size="lg"
            />

            {installations && installations.length > 0 && (
              <p className="text-[10px] text-[var(--theme-foreground)]/30">
                Or <button onClick={handleInstallApp} className="underline">install GitHub App</button> for advanced features
              </p>
            )}
          </div>
        </div>
      </BrutalCard>
    );
  }

  const lastSyncedDate = githubStats.lastSynced ? new Date(githubStats.lastSynced) : null;
  const isStale = githubStats.isStale;

  return (
    <BrutalCard>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-[var(--theme-foreground)]">
          <FaGithub className="w-4 h-4" />
          GITHUB STATISTICS
        </h3>

        <div className="flex items-center gap-2">
          {githubStats.username && (
            <a
              href={`https://github.com/${githubStats.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-[var(--theme-primary)] hover:underline"
            >
              @{githubStats.username}
              <HiOutlineExternalLink className="w-3 h-3" />
            </a>
          )}

          {lastSyncedDate && (
            <span className="text-[10px] text-[var(--theme-foreground)]/30">
              Last synced: {format(lastSyncedDate, 'MMM d, h:mm a')}
            </span>
          )}
        </div>
      </div>

      {isStale && (
        <div className="mb-2 p-2 bg-[var(--theme-warning)]/10 border border-[var(--theme-warning)] flex items-center gap-1">
          <FaExclamationTriangle className="w-3 h-3 text-[var(--theme-warning)]" />
          <span className="text-[10px] text-[var(--theme-foreground)]/60">
            GitHub data is outdated. Stats will refresh automatically soon.
          </span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <div className="text-center p-2.5 bg-[var(--theme-background)] border border-[var(--theme-border)]">
          <div className="text-lg font-bold text-[var(--theme-success)]">{githubStats.totalPRs || 0}</div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-foreground)]/50">Pull Requests</div>
        </div>
        <div className="text-center p-2.5 bg-[var(--theme-background)] border border-[var(--theme-border)]">
          <div className="text-lg font-bold text-[var(--theme-info)]">{githubStats.totalReviews || 0}</div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-foreground)]/50">Code Reviews</div>
        </div>
        <div className="text-center p-2.5 bg-[var(--theme-background)] border border-[var(--theme-border)]">
          <div className="text-lg font-bold text-[var(--theme-warning)]">
            {githubStats.avgReviewTime ? `${Math.round(githubStats.avgReviewTime)}h` : '--'}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-foreground)]/50">Avg Review Time</div>
        </div>
        <div className="text-center p-2.5 bg-[var(--theme-background)] border border-[var(--theme-border)]">
          <div className="text-lg font-bold text-[var(--theme-primary)]">
            {githubStats.languages?.length || 0}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--theme-foreground)]/50">Languages</div>
        </div>
      </div>

      {/* Languages */}
      {githubStats.languages && githubStats.languages.length > 0 && (
        <div>
          <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1 text-[var(--theme-foreground)]/50">
            <FaCode className="w-3 h-3" />
            TOP LANGUAGES
          </h4>
          <div className="space-y-1">
            {githubStats.languages.slice(0, 5).map((lang) => (
              <div key={lang.name} className="flex items-center gap-1.5">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-mono text-[10px] text-[var(--theme-foreground)]/70">{lang.name}</span>
                    <span className="font-mono text-[10px] text-[var(--theme-foreground)]/40">{lang.percentage}%</span>
                  </div>
                  <div className="h-1.5 bg-[var(--theme-background)] border border-[var(--theme-border)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--theme-primary)]"
                      style={{ width: `${lang.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Features */}
      {installations && installations.length === 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--theme-border)]">
          <p className="text-[10px] text-[var(--theme-foreground)]/50 mb-1.5">
            Install the GitHub App for advanced features:
          </p>
          <ul className="text-[10px] text-[var(--theme-foreground)]/30 space-y-0.5 mb-2">
            <li>+ Automatic commit and PR tracking</li>
            <li>+ Real-time repository syncing</li>
            <li>+ Task-code linking</li>
          </ul>
          <BrutalButton
            onClick={handleInstallApp}
            variant="secondary"
            size="sm"
          >
            INSTALL GITHUB APP
          </BrutalButton>
        </div>
      )}
    </BrutalCard>
  );
}
