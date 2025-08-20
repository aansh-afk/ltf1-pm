import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import type { Id } from '../../../../../../convex/_generated/dataModel';
import { 
  FaGithub,
  FaSlack,
  FaJira,
  FaTrello,
  FaDiscord,
  FaPlug,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaCog,
  FaSync
} from 'react-icons/fa';
import { 
  HiOutlineLink,
  HiOutlineExternalLink,
  HiOutlineTrash,
  HiOutlinePlus
} from 'react-icons/hi';
import { BrutalButton, BrutalCard } from '@/components/ui';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface WorkspaceIntegrationsTabProps {
  workspace: any;
}

interface Integration {
  id: string;
  name: string;
  icon: any;
  color: string;
  status: 'connected' | 'not_connected' | 'coming_soon';
  description: string;
  features?: string[];
}

export function WorkspaceIntegrationsTab({ workspace }: WorkspaceIntegrationsTabProps) {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  
  // Get GitHub installations for this workspace
  const installations = useQuery(
    api.integrations.github.queries.getWorkspaceInstallations,
    workspace?._id ? { workspaceId: workspace._id } : 'skip'
  );
  
  // Mutations
  const updateWorkspaceSettings = useMutation(api.workspaces.mutations.updateWorkspaceSettings);
  
  const integrations: Integration[] = [
    {
      id: 'github',
      name: 'GitHub',
      icon: FaGithub,
      color: '#333333',
      status: installations && installations.length > 0 ? 'connected' : 'not_connected',
      description: 'Connect GitHub repositories to track commits, PRs, and link code to tasks.',
      features: [
        'Automatic task-code linking',
        'Pull request tracking',
        'Commit history',
        'Developer activity sync',
        'Webhook notifications'
      ]
    },
    {
      id: 'slack',
      name: 'Slack',
      icon: FaSlack,
      color: '#4A154B',
      status: 'coming_soon',
      description: 'Get notifications and updates directly in your Slack channels.',
      features: [
        'Task notifications',
        'Sprint updates',
        'Daily standups',
        'Custom alerts'
      ]
    },
    {
      id: 'jira',
      name: 'Jira',
      icon: FaJira,
      color: '#0052CC',
      status: 'coming_soon',
      description: 'Sync tasks and projects between LTF1 and Jira.',
      features: [
        'Two-way task sync',
        'Status mapping',
        'Custom field mapping',
        'Bulk import/export'
      ]
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: FaDiscord,
      color: '#5865F2',
      status: 'coming_soon',
      description: 'Connect Discord for team communications and notifications.',
      features: [
        'Bot commands',
        'Voice channel integration',
        'Activity notifications',
        'Custom webhooks'
      ]
    }
  ];
  
  const handleGitHubConnect = () => {
    const appSlug = import.meta.env.VITE_GITHUB_APP_SLUG || 'ltf1-integration';
    window.open(`https://github.com/apps/${appSlug}/installations/new`, 'github-install', 'width=800,height=600');
  };
  
  const handleGitHubDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect GitHub? This will stop syncing repository data.')) {
      return;
    }
    
    try {
      await updateWorkspaceSettings({
        workspaceId: workspace._id,
        settings: {
          ...workspace.settings,
          integrations: {
            ...workspace.settings?.integrations,
            githubInstallationId: null
          }
        }
      });
      toast.success('GitHub disconnected successfully');
    } catch (error) {
      toast.error('Failed to disconnect GitHub');
    }
  };
  
  const renderIntegrationDetail = (integration: Integration) => {
    if (integration.id === 'github' && installations && installations.length > 0) {
      const installation = installations[0];
      
      return (
        <div className="space-y-24px">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-brutal-lg font-bold mb-8px">GitHub Integration</h3>
              <p className="text-brutal-sm text-[var(--theme-foreground)]/60">
                Connected to {installation.accountName} ({installation.accountType})
              </p>
            </div>
            <div className="flex items-center gap-12px">
              <BrutalButton
                variant="secondary"
                size="sm"
                onClick={() => window.open(`https://github.com/settings/installations`, '_blank')}
              >
                <HiOutlineExternalLink className="w-16px h-16px mr-8px" />
                MANAGE IN GITHUB
              </BrutalButton>
              <BrutalButton
                variant="danger"
                size="sm"
                onClick={handleGitHubDisconnect}
              >
                <HiOutlineTrash className="w-16px h-16px mr-8px" />
                DISCONNECT
              </BrutalButton>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-16px">
            <div className="p-16px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
              <div className="text-brutal-xs uppercase text-[var(--theme-foreground)]/60 mb-4px">Installation ID</div>
              <div className="font-mono font-bold">#{installation.installationId}</div>
            </div>
            <div className="p-16px bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
              <div className="text-brutal-xs uppercase text-[var(--theme-foreground)]/60 mb-4px">Connected Since</div>
              <div className="font-mono font-bold">
                {format(new Date(installation.createdAt), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-mono text-brutal-sm font-bold mb-12px">ENABLED FEATURES</h4>
            <div className="space-y-8px">
              {integration.features?.map((feature) => (
                <div key={feature} className="flex items-center gap-8px">
                  <FaCheckCircle className="w-16px h-16px text-brutal-success" />
                  <span className="text-brutal-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-16px bg-brutal-warning/10 border border-brutal-warning">
            <p className="text-brutal-sm">
              <strong>Note:</strong> Repository data syncs automatically via webhooks. 
              Manual sync can be triggered from individual project settings.
            </p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="text-center py-48px">
        <integration.icon className="w-64px h-64px mx-auto mb-24px" style={{ color: integration.color }} />
        <h3 className="text-brutal-lg font-bold mb-16px">{integration.name}</h3>
        <p className="text-brutal-sm text-[var(--theme-foreground)]/60 mb-24px max-w-md mx-auto">
          {integration.description}
        </p>
        
        {integration.features && (
          <div className="mb-32px">
            <h4 className="font-mono text-brutal-xs font-bold mb-12px uppercase">Key Features</h4>
            <div className="space-y-8px max-w-sm mx-auto text-left">
              {integration.features.map((feature) => (
                <div key={feature} className="flex items-center gap-8px">
                  <div className="w-4px h-4px bg-primary-brutalist" />
                  <span className="text-brutal-sm text-[var(--theme-foreground)]/80">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {integration.status === 'not_connected' ? (
          <BrutalButton onClick={integration.id === 'github' ? handleGitHubConnect : undefined}>
            CONNECT {integration.name.toUpperCase()}
          </BrutalButton>
        ) : integration.status === 'coming_soon' ? (
          <div className="inline-flex items-center gap-8px px-24px py-12px bg-basalt-border/50 text-[var(--theme-foreground)]/60">
            <FaClock className="w-16px h-16px" />
            <span className="font-mono text-brutal-sm uppercase">Coming Soon</span>
          </div>
        ) : null}
      </div>
    );
  };
  
  return (
    <div className="p-32px">
      <div className="mb-32px">
        <h1 className="text-brutal-xl font-bold uppercase mb-8px">WORKSPACE INTEGRATIONS</h1>
        <p className="text-brutal-sm text-[var(--theme-foreground)]/60">
          Connect external services to enhance your workflow and automate tasks.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-24px">
        {/* Integration List */}
        <div className="lg:col-span-1 space-y-16px">
          {integrations.map((integration) => (
            <button
              key={integration.id}
              onClick={() => setSelectedIntegration(integration.id)}
              className={`w-full p-24px border-2 transition-all text-left ${
                selectedIntegration === integration.id
                  ? 'bg-[var(--theme-background-secondary)] border-primary-brutalist'
                  : 'bg-[var(--theme-background)] border-[var(--theme-border)] hover:border-primary-brutalist'
              }`}
            >
              <div className="flex items-center justify-between mb-12px">
                <div className="flex items-center gap-16px">
                  <integration.icon 
                    className="w-32px h-32px" 
                    style={{ color: integration.status === 'connected' ? integration.color : undefined }}
                  />
                  <div>
                    <h3 className="font-bold text-brutal-md">{integration.name}</h3>
                    <p className="text-brutal-xs text-[var(--theme-foreground)]/60">
                      {integration.status === 'connected' ? 'Connected' : 
                       integration.status === 'coming_soon' ? 'Coming Soon' : 'Not Connected'}
                    </p>
                  </div>
                </div>
                {integration.status === 'connected' && (
                  <FaCheckCircle className="w-20px h-20px text-brutal-success" />
                )}
              </div>
              <p className="text-brutal-xs text-[var(--theme-foreground)]/60">
                {integration.description}
              </p>
            </button>
          ))}
        </div>
        
        {/* Integration Details */}
        <div className="lg:col-span-2">
          <BrutalCard className="p-32px min-h-[400px]">
            {selectedIntegration ? (
              renderIntegrationDetail(integrations.find(i => i.id === selectedIntegration)!)
            ) : (
              <div className="text-center py-48px">
                <HiOutlineLink className="w-64px h-64px mx-auto mb-24px text-[var(--theme-foreground)]/20" />
                <p className="text-brutal-sm text-[var(--theme-foreground)]/60">
                  Select an integration to view details and configure settings.
                </p>
              </div>
            )}
          </BrutalCard>
        </div>
      </div>
      
      {/* Webhooks Section */}
      <div className="mt-48px">
        <BrutalCard className="p-32px">
          <div className="flex items-center justify-between mb-24px">
            <div>
              <h2 className="text-brutal-lg font-bold flex items-center gap-12px">
                <FaPlug className="w-24px h-24px" />
                CUSTOM WEBHOOKS
              </h2>
              <p className="text-brutal-sm text-[var(--theme-foreground)]/60 mt-8px">
                Configure custom webhooks to integrate with any service.
              </p>
            </div>
            <BrutalButton size="sm" disabled>
              <HiOutlinePlus className="w-16px h-16px mr-8px" />
              ADD WEBHOOK
            </BrutalButton>
          </div>
          
          <div className="text-center py-32px border-2 border-dashed border-[var(--theme-border)]">
            <p className="text-brutal-sm text-[var(--theme-foreground)]/40">
              Custom webhooks coming soon. You'll be able to send events to your own endpoints.
            </p>
          </div>
        </BrutalCard>
      </div>
    </div>
  );
}