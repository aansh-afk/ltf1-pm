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
import { BrutalButton, BrutalCard } from '@/components/ui';
import { GitHubConnectButton } from '../github/GitHubConnectButton';
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
      <BrutalCard className="p-24px relative">
        {!isProfileComplete && (
          <div className="absolute top-8px right-8px">
            <div className="flex items-center gap-4px text-brutal-warning">
              <FaExclamationTriangle className="w-12px h-12px" />
              <span className="text-brutal-xs font-mono uppercase">Required for profile completion</span>
            </div>
          </div>
        )}
        
        <h3 className="text-brutal-md font-bold mb-16px flex items-center gap-8px">
          <FaGithub className="w-20px h-20px" />
          GITHUB INTEGRATION
        </h3>
        
        <div className="text-center py-32px">
          <FaGithub className="w-48px h-48px text-cathode-white/20 mx-auto mb-16px" />
          <p className="text-brutal-sm text-cathode-white/60 mb-24px">
            Connect your GitHub account to showcase your contributions and coding activity
          </p>
          
          <div className="space-y-12px">
            <GitHubConnectButton 
              onConnect={onConnect}
              className="w-full max-w-xs mx-auto"
              size="lg"
            />
            
            {installations && installations.length > 0 && (
              <p className="text-brutal-xs text-cathode-white/40">
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
    <BrutalCard className="p-24px">
      <div className="flex items-center justify-between mb-16px">
        <h3 className="text-brutal-md font-bold flex items-center gap-8px">
          <FaGithub className="w-20px h-20px" />
          GITHUB STATISTICS
        </h3>
        
        <div className="flex items-center gap-16px">
          {githubStats.username && (
            <a
              href={`https://github.com/${githubStats.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4px text-brutal-sm text-primary-brutalist hover:underline"
            >
              @{githubStats.username}
              <HiOutlineExternalLink className="w-12px h-12px" />
            </a>
          )}
          
          {lastSyncedDate && (
            <span className="text-brutal-xs text-cathode-white/40">
              Last synced: {format(lastSyncedDate, 'MMM d, h:mm a')}
            </span>
          )}
        </div>
      </div>
      
      {isStale && (
        <div className="mb-16px p-12px bg-brutal-warning/10 border border-brutal-warning flex items-center gap-8px">
          <FaExclamationTriangle className="w-16px h-16px text-brutal-warning" />
          <span className="text-brutal-xs">
            GitHub data is outdated. Stats will refresh automatically soon.
          </span>
        </div>
      )}
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-16px mb-24px">
        <div className="text-center p-16px bg-event-horizon border border-basalt-border">
          <div className="text-brutal-2xl font-bold text-brutal-success">{githubStats.totalPRs || 0}</div>
          <div className="text-brutal-xs uppercase">Pull Requests</div>
        </div>
        <div className="text-center p-16px bg-event-horizon border border-basalt-border">
          <div className="text-brutal-2xl font-bold text-brutal-info">{githubStats.totalReviews || 0}</div>
          <div className="text-brutal-xs uppercase">Code Reviews</div>
        </div>
        <div className="text-center p-16px bg-event-horizon border border-basalt-border">
          <div className="text-brutal-2xl font-bold text-brutal-warning">
            {githubStats.avgReviewTime ? `${Math.round(githubStats.avgReviewTime)}h` : '--'}
          </div>
          <div className="text-brutal-xs uppercase">Avg Review Time</div>
        </div>
        <div className="text-center p-16px bg-event-horizon border border-basalt-border">
          <div className="text-brutal-2xl font-bold text-primary-brutalist">
            {githubStats.languages?.length || 0}
          </div>
          <div className="text-brutal-xs uppercase">Languages</div>
        </div>
      </div>
      
      {/* Languages */}
      {githubStats.languages && githubStats.languages.length > 0 && (
        <div>
          <h4 className="font-mono text-brutal-xs font-bold mb-12px flex items-center gap-4px">
            <FaCode className="w-12px h-12px" />
            TOP LANGUAGES
          </h4>
          <div className="space-y-8px">
            {githubStats.languages.slice(0, 5).map((lang) => (
              <div key={lang.name} className="flex items-center gap-12px">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4px">
                    <span className="font-mono text-brutal-xs">{lang.name}</span>
                    <span className="font-mono text-brutal-xs text-cathode-white/60">{lang.percentage}%</span>
                  </div>
                  <div className="h-8px bg-event-horizon border border-basalt-border overflow-hidden">
                    <div 
                      className="h-full bg-primary-brutalist"
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
        <div className="mt-24px pt-24px border-t border-basalt-border">
          <p className="text-brutal-xs text-cathode-white/60 mb-12px">
            Install the GitHub App for advanced features:
          </p>
          <ul className="text-brutal-xs text-cathode-white/40 space-y-4px mb-12px">
            <li>• Automatic commit and PR tracking</li>
            <li>• Real-time repository syncing</li>
            <li>• Task-code linking</li>
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