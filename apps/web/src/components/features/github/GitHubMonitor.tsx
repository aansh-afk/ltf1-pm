import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { FaGithub, FaSync, FaExclamationTriangle } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface GitHubMonitorProps {
  isExpanded: boolean;
  compact?: boolean;
}

export function GitHubMonitor({ isExpanded, compact = false }: GitHubMonitorProps) {
  // Get current user
  const currentUser = useQuery(api.auth.users.getCurrentUser);
  
  // Get GitHub stats
  const githubStats = useQuery(
    api.integrations.github.queries.getDeveloperGitHubStats,
    currentUser ? { userId: currentUser._id } : 'skip'
  );
  
  // Get user's GitHub installations
  const installations = useQuery(api.integrations.github.auth.getUserInstallations);
  
  const hasGitHub = githubStats !== null;
  const isStale = githubStats?.isStale;
  
  if (compact) {
    // Compact mode for status bar
    return (
      <span className="flex items-center gap-8px">
        <FaGithub className={clsx(
          "w-12px h-12px transition-colors duration-300",
          hasGitHub ? "text-[#00FF00]" : "text-cathode-white/40"
        )} />
        <span className="text-[#00FFFF]">GIT:</span>
        <span className={clsx(
          "transition-colors duration-300",
          hasGitHub ? (isStale ? "text-[#FFFF00]" : "text-[#00FF00]") : "text-cathode-white/40"
        )}>
          {hasGitHub ? (isStale ? "STALE" : "SYNCED") : "OFFLINE"}
        </span>
      </span>
    );
  }
  
  if (!isExpanded) {
    // Icon-only mode
    return (
      <div className="flex justify-center py-16px border-t-2 border-basalt-border">
        <FaGithub className={clsx(
          "w-20px h-20px transition-colors duration-300",
          hasGitHub ? "text-primary-brutalist" : "text-cathode-white/20"
        )} />
      </div>
    );
  }
  
  // Full expanded mode
  return (
    <div className="px-24px py-16px border-t-2 border-basalt-border">
      <h3 className="text-brutal-xs font-bold mb-12px flex items-center gap-8px">
        <FaGithub className="w-16px h-16px" />
        GITHUB STATUS
      </h3>
      
      {!hasGitHub ? (
        <div className="text-brutal-xs text-cathode-white/40">
          <p>Not connected</p>
          <a href="/profile" className="text-primary-brutalist hover:underline">
            Connect account →
          </a>
        </div>
      ) : (
        <div className="space-y-8px text-brutal-xs">
          {githubStats.username && (
            <div className="flex items-center justify-between">
              <span className="text-cathode-white/60">USER:</span>
              <span className="font-mono">@{githubStats.username}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-cathode-white/60">SYNC:</span>
            <span className={clsx(
              "font-mono flex items-center gap-4px",
              isStale ? "text-brutal-warning" : "text-brutal-success"
            )}>
              {isStale && <FaExclamationTriangle className="w-10px h-10px" />}
              {githubStats.lastSynced 
                ? formatDistanceToNow(new Date(githubStats.lastSynced), { addSuffix: true })
                : 'Never'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-cathode-white/60">PRS:</span>
            <span className="font-mono">{githubStats.totalPRs || 0}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-cathode-white/60">REVIEWS:</span>
            <span className="font-mono">{githubStats.totalReviews || 0}</span>
          </div>
          
          {installations && installations.length > 0 && (
            <div className="pt-8px border-t border-basalt-border">
              <div className="flex items-center justify-between">
                <span className="text-cathode-white/60">APPS:</span>
                <span className="font-mono text-brutal-success">{installations.length}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}