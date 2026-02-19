import { useState, useEffect } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { FaGithub, FaCheckCircle, FaTimesCircle, FaExclamationCircle, FaSync } from 'react-icons/fa';
import { HiOutlineExternalLink, HiOutlineTrash } from 'react-icons/hi';
import BrutalButton from '@/components/ui/BrutalButton';
import BrutalCard from '@/components/ui/BrutalCard';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import SettingsSection from '../settings/SettingsSection';

interface GitHubSettingsProps {
  currentUser: any;
}

// --- Sub-components ---

interface ConnectionStatusCardProps {
  isConnected: boolean
  isConnecting: boolean
  isSyncing: boolean
  isStale: boolean | undefined
  githubStats: {
    username?: string
    lastSynced?: string
  } | null | undefined
  onConnect: () => void
  onSync: () => void
}

function ConnectionStatusCard({ isConnected, isConnecting, isSyncing, isStale, githubStats, onConnect, onSync }: ConnectionStatusCardProps) {
  return (
    <BrutalCard className="p-[16px]">
      <div className="flex items-center justify-between mb-[8px]">
        <h3 className="text-brutal-md font-bold flex items-center gap-[6px]">
          <FaGithub className="w-4 h-4" />
          CONNECTION STATUS
        </h3>

        {isConnected ? (
          <div className="flex items-center gap-[8px] text-brutal-success">
            <FaCheckCircle className="w-5 h-5" />
            <span className="font-mono text-brutal-sm">CONNECTED</span>
          </div>
        ) : (
          <div className="flex items-center gap-[8px] text-[var(--theme-foreground)]/40">
            <FaTimesCircle className="w-5 h-5" />
            <span className="font-mono text-brutal-sm">NOT CONNECTED</span>
          </div>
        )}
      </div>

      {!isConnected ? (
        <div className="space-y-[8px]">
          <p className="text-brutal-sm text-[var(--theme-foreground)]/60">
            Connect your GitHub account to track your contributions and enable advanced features.
          </p>
          <BrutalButton onClick={onConnect} disabled={isConnecting}>
            {isConnecting ? 'CONNECTING...' : 'CONNECT GITHUB ACCOUNT'}
          </BrutalButton>
        </div>
      ) : (
        <div className="space-y-[8px]">
          <div className="grid grid-cols-2 gap-[10px]">
            <div>
              <div className="text-brutal-xs uppercase text-[var(--theme-foreground)]/60 mb-4px">Username</div>
              <div className="font-mono font-bold">@{githubStats?.username}</div>
            </div>
            <div>
              <div className="text-brutal-xs uppercase text-[var(--theme-foreground)]/60 mb-4px">Last Synced</div>
              <div className="font-mono font-bold flex items-center gap-4px">
                {isStale && <FaExclamationCircle className="w-[12px] h-[12px] text-brutal-warning" />}
                {githubStats?.lastSynced
                  ? format(new Date(githubStats.lastSynced), 'MMM d, h:mm a')
                  : 'Never'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-[6px]">
            <BrutalButton
              size="sm"
              onClick={onSync}
              disabled={isSyncing}
            >
              <FaSync className={`w-4 h-4 mr-[8px] ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'SYNCING...' : 'SYNC NOW'}
            </BrutalButton>

            <a
              href={`https://github.com/${githubStats?.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-[8px] text-primary-brutalist hover:underline"
            >
              View Profile
              <HiOutlineExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </BrutalCard>
  )
}

interface ContributionStatsCardProps {
  githubStats: {
    totalPRs?: number
    totalReviews?: number
    avgReviewTime?: number
    languages?: string[]
  }
}

function ContributionStatsCard({ githubStats }: ContributionStatsCardProps) {
  return (
    <BrutalCard className="p-[16px]">
      <h3 className="text-brutal-md font-bold mb-[8px]">CONTRIBUTION STATISTICS</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-[10px]">
        <div className="p-[10px] bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] text-center">
          <div className="text-[20px] font-bold font-bold text-brutal-success">
            {githubStats.totalPRs || 0}
          </div>
          <div className="text-brutal-xs uppercase">Pull Requests</div>
        </div>
        <div className="p-[10px] bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] text-center">
          <div className="text-[20px] font-bold font-bold text-brutal-info">
            {githubStats.totalReviews || 0}
          </div>
          <div className="text-brutal-xs uppercase">Code Reviews</div>
        </div>
        <div className="p-[10px] bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] text-center">
          <div className="text-[20px] font-bold font-bold text-brutal-warning">
            {githubStats.avgReviewTime ? `${Math.round(githubStats.avgReviewTime)}h` : '--'}
          </div>
          <div className="text-brutal-xs uppercase">Avg Review Time</div>
        </div>
        <div className="p-[10px] bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] text-center">
          <div className="text-[20px] font-bold font-bold text-primary-brutalist">
            {githubStats.languages?.length || 0}
          </div>
          <div className="text-brutal-xs uppercase">Languages</div>
        </div>
      </div>
    </BrutalCard>
  )
}

// --- Main component ---

export function GitHubSettings({ currentUser }: GitHubSettingsProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Listen for GitHub App installation popup closing
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'github-app-installed') {
        toast.success('GitHub App installed successfully!');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Get GitHub stats
  const githubStats = useQuery(
    api.integrations.github.queries.getDeveloperGitHubStats,
    currentUser ? { userId: currentUser._id } : 'skip'
  );
  
  // Get user's GitHub installations
  const installations = useQuery(api.integrations.github.auth.getUserInstallations);
  
  // Mutations
  const linkGitHub = useMutation(api.integrations.github.auth.linkGitHubAccount);
  
  const handleConnectGitHub = async () => {
    try {
      setIsConnecting(true);
      
      // For MVP, we'll prompt for GitHub username
      const username = prompt('Enter your GitHub username:');
      if (!username) {
        setIsConnecting(false);
        return;
      }
      
      await linkGitHub({ githubUsername: username });
      toast.success('GitHub account linked successfully!');
    } catch (error) {
      console.error('Error linking GitHub:', error);
      toast.error('Failed to link GitHub account');
    } finally {
      setIsConnecting(false);
    }
  };
  
  const triggerSync = useMutation(api.integrations.github.sync.triggerManualStatsSync);

  const handleSyncStats = async () => {
    if (!currentUser) return;
    setIsSyncing(true);

    try {
      const result = await triggerSync();
      if (result.success) {
        toast.success('Stats sync started — results will appear shortly');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
      toast.error('Failed to start stats sync');
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleInstallApp = () => {
    const appSlug = import.meta.env.VITE_GITHUB_APP_SLUG || 'ltf1-integration';
    window.open(`https://github.com/apps/${appSlug}/installations/new`, 'github-install', 'width=800,height=600');
  };
  
  const isConnected = githubStats !== null;
  const isStale = githubStats?.isStale;
  
  return (
    <>
      <SettingsSection
        title="GitHub Integration"
        description="Connect your GitHub account to enable code tracking, PR management, and developer statistics."
      >
        <div className="space-y-[12px]">
          {/* Connection Status */}
          <ConnectionStatusCard
            isConnected={isConnected}
            isConnecting={isConnecting}
            isSyncing={isSyncing}
            isStale={isStale}
            githubStats={githubStats}
            onConnect={handleConnectGitHub}
            onSync={handleSyncStats}
          />
          
          {/* GitHub App Installation */}
          <BrutalCard className="p-[16px]">
            <h3 className="text-brutal-md font-bold mb-[8px]">GITHUB APP INSTALLATION</h3>
            
            {installations && installations.length > 0 ? (
              <div className="space-y-[8px]">
                <p className="text-brutal-sm text-[var(--theme-foreground)]/60">
                  GitHub App is installed and active for the following accounts:
                </p>
                
                {installations.map((installation) => (
                  <div 
                    key={installation._id}
                    className="p-[10px] bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold">{installation.accountName}</div>
                        <div className="text-brutal-xs text-[var(--theme-foreground)]/60">
                          {installation.accountType} • Installation #{installation.installationId}
                        </div>
                      </div>
                      <BrutalButton
                        size="sm"
                        variant="secondary"
                        onClick={() => window.open('https://github.com/settings/installations', '_blank')}
                      >
                        MANAGE
                      </BrutalButton>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-[8px]">
                <p className="text-brutal-sm text-[var(--theme-foreground)]/60">
                  Install the GitHub App to enable automatic repository syncing and advanced features.
                </p>
                
                <div className="space-y-[8px] text-brutal-sm">
                  <div className="flex items-center gap-[8px]">
                    <div className="w-4px h-4px bg-primary-brutalist" />
                    <span>Automatic commit and PR tracking</span>
                  </div>
                  <div className="flex items-center gap-[8px]">
                    <div className="w-4px h-4px bg-primary-brutalist" />
                    <span>Real-time webhook notifications</span>
                  </div>
                  <div className="flex items-center gap-[8px]">
                    <div className="w-4px h-4px bg-primary-brutalist" />
                    <span>Task-code linking</span>
                  </div>
                  <div className="flex items-center gap-[8px]">
                    <div className="w-4px h-4px bg-primary-brutalist" />
                    <span>Repository activity monitoring</span>
                  </div>
                </div>
                
                <BrutalButton onClick={handleInstallApp}>
                  INSTALL GITHUB APP
                </BrutalButton>
              </div>
            )}
          </BrutalCard>
          
          {/* Statistics */}
          {isConnected && githubStats && (
            <ContributionStatsCard githubStats={githubStats} />
          )}
        </div>
      </SettingsSection>
      
      <SettingsSection
        title="Privacy & Permissions"
        description="Control what GitHub data is synced and how it's used."
      >
        <div className="space-y-[8px]">
          <label htmlFor="github-sync-public-repos" aria-label="Sync public repositories" className="flex items-center justify-between p-[10px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)] cursor-pointer">
            <div>
              <div className="font-mono text-brutal-sm font-bold">SYNC PUBLIC REPOSITORIES</div>
              <div className="text-brutal-xs text-[var(--theme-foreground)]/60">
                Automatically sync activity from your public repositories
              </div>
            </div>
            <input id="github-sync-public-repos" type="checkbox" className="sr-only" defaultChecked />
            <div className="w-6 h-4 bg-basalt-border relative rounded-none">
              <div className="absolute top-0 left-0 w-4 h-4 bg-primary-brutalist transition-transform" />
            </div>
          </label>

          <label htmlFor="github-display-stats" aria-label="Display statistics publicly" className="flex items-center justify-between p-[10px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)] cursor-pointer">
            <div>
              <div className="font-mono text-brutal-sm font-bold">DISPLAY STATISTICS PUBLICLY</div>
              <div className="text-brutal-xs text-[var(--theme-foreground)]/60">
                Show your GitHub statistics on your public profile
              </div>
            </div>
            <input id="github-display-stats" type="checkbox" className="sr-only" defaultChecked />
            <div className="w-6 h-4 bg-basalt-border relative rounded-none">
              <div className="absolute top-0 left-0 w-4 h-4 bg-primary-brutalist transition-transform" />
            </div>
          </label>

          <label htmlFor="github-enable-notifications" aria-label="Enable notifications" className="flex items-center justify-between p-[10px] bg-[var(--theme-background)] border-2 border-[var(--theme-border)] cursor-pointer">
            <div>
              <div className="font-mono text-brutal-sm font-bold">ENABLE NOTIFICATIONS</div>
              <div className="text-brutal-xs text-[var(--theme-foreground)]/60">
                Receive notifications for GitHub events linked to your tasks
              </div>
            </div>
            <input id="github-enable-notifications" type="checkbox" className="sr-only" />
            <div className="w-6 h-4 bg-basalt-border relative rounded-none">
              <div className="absolute top-0 left-0 w-4 h-4 bg-basalt-border transition-transform" />
            </div>
          </label>
        </div>
      </SettingsSection>
    </>
  );
}