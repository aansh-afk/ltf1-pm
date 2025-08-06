import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { FaGithub, FaCheckCircle, FaTimesCircle, FaExclamationCircle, FaSync } from 'react-icons/fa';
import { HiOutlineExternalLink, HiOutlineTrash } from 'react-icons/hi';
import { BrutalButton, BrutalCard } from '@/components/ui';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import SettingsSection from '../settings/SettingsSection';

interface GitHubSettingsProps {
  currentUser: any;
}

export function GitHubSettings({ currentUser }: GitHubSettingsProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Get GitHub stats
  const githubStats = useQuery(
    api.integrations.github.queries.getDeveloperGitHubStats,
    currentUser ? { userId: currentUser._id } : 'skip'
  );
  
  // Get user's GitHub installations
  const installations = useQuery(api.integrations.github.auth.getUserInstallations);
  
  // Mutations
  const linkGitHub = useMutation(api.integrations.github.auth.linkGitHubAccount);
  const syncGitHubStats = useMutation(api.integrations.github.mutations.syncDeveloperGitHubStats);
  
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
  
  const handleSyncStats = async () => {
    if (!currentUser) return;
    
    try {
      setIsSyncing(true);
      await syncGitHubStats({ userId: currentUser._id });
      toast.success('GitHub stats synced successfully!');
    } catch (error) {
      console.error('Error syncing stats:', error);
      toast.error('Failed to sync GitHub stats');
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
        <div className="space-y-24px">
          {/* Connection Status */}
          <BrutalCard className="p-24px">
            <div className="flex items-center justify-between mb-16px">
              <h3 className="text-brutal-md font-bold flex items-center gap-12px">
                <FaGithub className="w-24px h-24px" />
                CONNECTION STATUS
              </h3>
              
              {isConnected ? (
                <div className="flex items-center gap-8px text-brutal-success">
                  <FaCheckCircle className="w-20px h-20px" />
                  <span className="font-mono text-brutal-sm">CONNECTED</span>
                </div>
              ) : (
                <div className="flex items-center gap-8px text-cathode-white/40">
                  <FaTimesCircle className="w-20px h-20px" />
                  <span className="font-mono text-brutal-sm">NOT CONNECTED</span>
                </div>
              )}
            </div>
            
            {!isConnected ? (
              <div className="space-y-16px">
                <p className="text-brutal-sm text-cathode-white/60">
                  Connect your GitHub account to track your contributions and enable advanced features.
                </p>
                <BrutalButton onClick={handleConnectGitHub} disabled={isConnecting}>
                  {isConnecting ? 'CONNECTING...' : 'CONNECT GITHUB ACCOUNT'}
                </BrutalButton>
              </div>
            ) : (
              <div className="space-y-16px">
                <div className="grid grid-cols-2 gap-16px">
                  <div>
                    <div className="text-brutal-xs uppercase text-cathode-white/60 mb-4px">Username</div>
                    <div className="font-mono font-bold">@{githubStats.username}</div>
                  </div>
                  <div>
                    <div className="text-brutal-xs uppercase text-cathode-white/60 mb-4px">Last Synced</div>
                    <div className="font-mono font-bold flex items-center gap-4px">
                      {isStale && <FaExclamationCircle className="w-12px h-12px text-brutal-warning" />}
                      {githubStats.lastSynced 
                        ? format(new Date(githubStats.lastSynced), 'MMM d, h:mm a')
                        : 'Never'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-12px">
                  <BrutalButton
                    size="sm"
                    onClick={handleSyncStats}
                    disabled={isSyncing}
                  >
                    <FaSync className={`w-16px h-16px mr-8px ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'SYNCING...' : 'SYNC NOW'}
                  </BrutalButton>
                  
                  <a
                    href={`https://github.com/${githubStats.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-8px text-primary-brutalist hover:underline"
                  >
                    View Profile
                    <HiOutlineExternalLink className="w-16px h-16px" />
                  </a>
                </div>
              </div>
            )}
          </BrutalCard>
          
          {/* GitHub App Installation */}
          <BrutalCard className="p-24px">
            <h3 className="text-brutal-md font-bold mb-16px">GITHUB APP INSTALLATION</h3>
            
            {installations && installations.length > 0 ? (
              <div className="space-y-16px">
                <p className="text-brutal-sm text-cathode-white/60">
                  GitHub App is installed and active for the following accounts:
                </p>
                
                {installations.map((installation) => (
                  <div 
                    key={installation._id}
                    className="p-16px bg-event-horizon border border-basalt-border"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold">{installation.accountName}</div>
                        <div className="text-brutal-xs text-cathode-white/60">
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
              <div className="space-y-16px">
                <p className="text-brutal-sm text-cathode-white/60">
                  Install the GitHub App to enable automatic repository syncing and advanced features.
                </p>
                
                <div className="space-y-8px text-brutal-sm">
                  <div className="flex items-center gap-8px">
                    <div className="w-4px h-4px bg-primary-brutalist" />
                    <span>Automatic commit and PR tracking</span>
                  </div>
                  <div className="flex items-center gap-8px">
                    <div className="w-4px h-4px bg-primary-brutalist" />
                    <span>Real-time webhook notifications</span>
                  </div>
                  <div className="flex items-center gap-8px">
                    <div className="w-4px h-4px bg-primary-brutalist" />
                    <span>Task-code linking</span>
                  </div>
                  <div className="flex items-center gap-8px">
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
            <BrutalCard className="p-24px">
              <h3 className="text-brutal-md font-bold mb-16px">CONTRIBUTION STATISTICS</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-16px">
                <div className="p-16px bg-event-horizon border border-basalt-border text-center">
                  <div className="text-brutal-2xl font-bold text-brutal-success">
                    {githubStats.totalPRs || 0}
                  </div>
                  <div className="text-brutal-xs uppercase">Pull Requests</div>
                </div>
                <div className="p-16px bg-event-horizon border border-basalt-border text-center">
                  <div className="text-brutal-2xl font-bold text-brutal-info">
                    {githubStats.totalReviews || 0}
                  </div>
                  <div className="text-brutal-xs uppercase">Code Reviews</div>
                </div>
                <div className="p-16px bg-event-horizon border border-basalt-border text-center">
                  <div className="text-brutal-2xl font-bold text-brutal-warning">
                    {githubStats.avgReviewTime ? `${Math.round(githubStats.avgReviewTime)}h` : '--'}
                  </div>
                  <div className="text-brutal-xs uppercase">Avg Review Time</div>
                </div>
                <div className="p-16px bg-event-horizon border border-basalt-border text-center">
                  <div className="text-brutal-2xl font-bold text-primary-brutalist">
                    {githubStats.languages?.length || 0}
                  </div>
                  <div className="text-brutal-xs uppercase">Languages</div>
                </div>
              </div>
            </BrutalCard>
          )}
        </div>
      </SettingsSection>
      
      <SettingsSection
        title="Privacy & Permissions"
        description="Control what GitHub data is synced and how it's used."
      >
        <div className="space-y-16px">
          <label className="flex items-center justify-between p-16px bg-carbon-plate border-2 border-basalt-border cursor-pointer">
            <div>
              <div className="font-mono text-brutal-sm font-bold">SYNC PUBLIC REPOSITORIES</div>
              <div className="text-brutal-xs text-cathode-white/60">
                Automatically sync activity from your public repositories
              </div>
            </div>
            <input type="checkbox" className="sr-only" defaultChecked />
            <div className="w-48px h-24px bg-basalt-border relative rounded-none">
              <div className="absolute top-0 left-0 w-24px h-24px bg-primary-brutalist transition-transform" />
            </div>
          </label>
          
          <label className="flex items-center justify-between p-16px bg-carbon-plate border-2 border-basalt-border cursor-pointer">
            <div>
              <div className="font-mono text-brutal-sm font-bold">DISPLAY STATISTICS PUBLICLY</div>
              <div className="text-brutal-xs text-cathode-white/60">
                Show your GitHub statistics on your public profile
              </div>
            </div>
            <input type="checkbox" className="sr-only" defaultChecked />
            <div className="w-48px h-24px bg-basalt-border relative rounded-none">
              <div className="absolute top-0 left-0 w-24px h-24px bg-primary-brutalist transition-transform" />
            </div>
          </label>
          
          <label className="flex items-center justify-between p-16px bg-carbon-plate border-2 border-basalt-border cursor-pointer">
            <div>
              <div className="font-mono text-brutal-sm font-bold">ENABLE NOTIFICATIONS</div>
              <div className="text-brutal-xs text-cathode-white/60">
                Receive notifications for GitHub events linked to your tasks
              </div>
            </div>
            <input type="checkbox" className="sr-only" />
            <div className="w-48px h-24px bg-basalt-border relative rounded-none">
              <div className="absolute top-0 left-0 w-24px h-24px bg-basalt-border transition-transform" />
            </div>
          </label>
        </div>
      </SettingsSection>
    </>
  );
}