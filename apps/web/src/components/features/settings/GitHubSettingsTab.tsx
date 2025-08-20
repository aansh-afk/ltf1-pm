import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import type { Id } from '../../../../../../convex/_generated/dataModel';
import { 
  FaGithub,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaSync,
  FaLink
} from 'react-icons/fa';
import { HiOutlineExternalLink, HiOutlineTrash } from 'react-icons/hi';
import { BrutalButton } from '@/components/ui';
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
  const unlinkGitHubAccount = useMutation(api.integrations.github.auth.unlinkGitHubAccount);
  const syncGitHubData = useMutation(api.integrations.github.sync.syncUserGitHubData);
  
  const isConnected = githubStats !== null;
  const hasInstallations = installations && installations.length > 0;
  
  const handleConnect = async () => {
    try {
      // For MVP, we'll prompt for GitHub username
      const username = prompt('Enter your GitHub username:');
      if (!username) return;
      
      await linkGitHubAccount({ githubUsername: username });
      toast.success('GitHub account linked successfully!');
    } catch (error) {
      console.error('Error linking GitHub:', error);
      toast.error('Failed to link GitHub account');
    }
  };
  
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your GitHub account? This will stop syncing your GitHub data.')) {
      return;
    }
    
    try {
      await unlinkGitHubAccount();
      toast.success('GitHub account disconnected');
    } catch (error) {
      console.error('Error unlinking GitHub:', error);
      toast.error('Failed to disconnect GitHub account');
    }
  };
  
  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await syncGitHubData();
      toast.success('GitHub data synced successfully!');
    } catch (error) {
      console.error('Error syncing GitHub data:', error);
      toast.error('Failed to sync GitHub data');
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleInstallApp = () => {
    const appSlug = import.meta.env.VITE_GITHUB_APP_SLUG || 'ltf1-integration';
    window.open(`https://github.com/apps/${appSlug}/installations/new`, 'github-install', 'width=800,height=600');
  };
  
  return (
    <>
      <SettingsSection
        title="GitHub Integration"
        description="Connect your GitHub account to sync commits, PRs, and link code to tasks."
      >
        <div className="space-y-24px">
          {/* Connection Status */}
          <div className="p-24px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)]">
            <div className="flex items-center justify-between mb-16px">
              <div className="flex items-center gap-16px">
                <FaGithub className="w-32px h-32px" />
                <div>
                  <h4 className="text-brutal-md font-bold">
                    {isConnected ? 'GitHub Connected' : 'GitHub Not Connected'}
                  </h4>
                  {githubStats?.username && (
                    <p className="text-brutal-sm text-[var(--theme-foreground)]/60">
                      @{githubStats.username}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-12px">
                {isConnected ? (
                  <>
                    <BrutalButton
                      variant="secondary"
                      size="sm"
                      onClick={handleSync}
                      disabled={isSyncing}
                    >
                      {isSyncing ? (
                        <FaSync className="w-16px h-16px animate-spin" />
                      ) : (
                        <>
                          <FaSync className="w-16px h-16px mr-8px" />
                          SYNC NOW
                        </>
                      )}
                    </BrutalButton>
                    <BrutalButton
                      variant="danger"
                      size="sm"
                      onClick={handleDisconnect}
                    >
                      <HiOutlineTrash className="w-16px h-16px mr-8px" />
                      DISCONNECT
                    </BrutalButton>
                  </>
                ) : (
                  <BrutalButton onClick={handleConnect}>
                    <FaLink className="w-16px h-16px mr-8px" />
                    CONNECT GITHUB
                  </BrutalButton>
                )}
              </div>
            </div>
            
            {isConnected && githubStats && (
              <div className="grid grid-cols-3 gap-16px">
                <div className="text-center p-16px bg-[var(--theme-background)] border border-[var(--theme-border)]">
                  <div className="text-brutal-xl font-bold text-brutal-info">{githubStats.totalPRs || 0}</div>
                  <div className="text-brutal-xs uppercase">Pull Requests</div>
                </div>
                <div className="text-center p-16px bg-[var(--theme-background)] border border-[var(--theme-border)]">
                  <div className="text-brutal-xl font-bold text-brutal-success">{githubStats.totalReviews || 0}</div>
                  <div className="text-brutal-xs uppercase">Code Reviews</div>
                </div>
                <div className="text-center p-16px bg-[var(--theme-background)] border border-[var(--theme-border)]">
                  <div className="text-brutal-xl font-bold text-brutal-warning">
                    {githubStats.languages?.length || 0}
                  </div>
                  <div className="text-brutal-xs uppercase">Languages</div>
                </div>
              </div>
            )}
            
            {isConnected && githubStats?.lastSynced && (
              <p className="text-brutal-xs text-[var(--theme-foreground)]/60 mt-12px">
                Last synced: {format(new Date(githubStats.lastSynced), 'MMM d, yyyy h:mm a')}
                {githubStats.isStale && (
                  <span className="text-brutal-warning ml-8px">
                    <FaExclamationCircle className="inline w-12px h-12px mr-4px" />
                    Data is outdated
                  </span>
                )}
              </p>
            )}
          </div>
          
          {/* GitHub App Installation */}
          <div className="p-24px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)]">
            <div className="flex items-center justify-between mb-16px">
              <div>
                <h4 className="text-brutal-md font-bold mb-8px">GitHub App Installation</h4>
                <p className="text-brutal-sm text-[var(--theme-foreground)]/60">
                  Install the LTF1 GitHub App for advanced features like automatic syncing and webhooks.
                </p>
              </div>
              
              {hasInstallations ? (
                <div className="flex items-center gap-8px text-brutal-success">
                  <FaCheckCircle className="w-20px h-20px" />
                  <span className="font-mono text-brutal-sm">INSTALLED</span>
                </div>
              ) : (
                <FaTimesCircle className="w-20px h-20px text-[var(--theme-foreground)]/40" />
              )}
            </div>
            
            {!hasInstallations ? (
              <BrutalButton onClick={handleInstallApp} variant="secondary">
                INSTALL GITHUB APP
              </BrutalButton>
            ) : (
              <div className="space-y-12px">
                {installations.map((installation: any) => (
                  <div key={installation._id} className="flex items-center justify-between p-12px bg-[var(--theme-background)] border border-[var(--theme-border)]">
                    <div>
                      <p className="font-mono text-brutal-sm">{installation.accountName}</p>
                      <p className="text-brutal-xs text-[var(--theme-foreground)]/60">
                        {installation.accountType} • ID: {installation.installationId}
                      </p>
                    </div>
                    <a
                      href={`https://github.com/settings/installations`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-brutalist hover:underline flex items-center gap-4px"
                    >
                      <span className="text-brutal-xs">MANAGE</span>
                      <HiOutlineExternalLink className="w-12px h-12px" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SettingsSection>
      
      <SettingsSection
        title="Features & Permissions"
        description="What the GitHub integration enables in your workspace."
      >
        <div className="space-y-12px">
          <div className="flex items-start gap-12px">
            <FaCheckCircle className="w-16px h-16px text-brutal-success mt-2px" />
            <div>
              <p className="font-mono text-brutal-sm font-bold">Automatic Task-Code Linking</p>
              <p className="text-brutal-xs text-[var(--theme-foreground)]/60">
                Commits and PRs mentioning task keys (e.g., WEB-123) are automatically linked
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-12px">
            <FaCheckCircle className="w-16px h-16px text-brutal-success mt-2px" />
            <div>
              <p className="font-mono text-brutal-sm font-bold">Pull Request Tracking</p>
              <p className="text-brutal-xs text-[var(--theme-foreground)]/60">
                See PR status, reviews, and merge state directly in your projects
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-12px">
            <FaCheckCircle className="w-16px h-16px text-brutal-success mt-2px" />
            <div>
              <p className="font-mono text-brutal-sm font-bold">Developer Activity Sync</p>
              <p className="text-brutal-xs text-[var(--theme-foreground)]/60">
                Your GitHub stats and contributions are synced to your developer profile
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-12px">
            <FaCheckCircle className="w-16px h-16px text-brutal-success mt-2px" />
            <div>
              <p className="font-mono text-brutal-sm font-bold">Real-time Webhooks</p>
              <p className="text-brutal-xs text-[var(--theme-foreground)]/60">
                Get instant updates when commits are pushed or PRs are opened/merged
              </p>
            </div>
          </div>
        </div>
      </SettingsSection>
      
      <SettingsSection
        title="Privacy & Data"
        description="How we handle your GitHub data."
      >
        <div className="p-16px bg-brutal-warning/10 border border-brutal-warning">
          <p className="text-brutal-sm">
            <strong>Important:</strong> LTF1 only accesses repositories you've explicitly granted access to. 
            We store minimal data locally for performance and never access your private code without permission.
          </p>
        </div>
        
        <div className="mt-16px space-y-8px text-brutal-sm">
          <p>• We sync public profile information and contribution stats</p>
          <p>• Repository data is only accessed when you connect a project</p>
          <p>• All data is encrypted and stored securely</p>
          <p>• You can disconnect and delete your data at any time</p>
        </div>
      </SettingsSection>
    </>
  );
}