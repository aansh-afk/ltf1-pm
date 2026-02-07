import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { FaGithub } from 'react-icons/fa';
import BrutalButton from '@/components/ui/BrutalButton';
import toast from 'react-hot-toast';

interface GitHubConnectButtonProps {
  onConnect?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export function GitHubConnectButton({ 
  onConnect, 
  className = '', 
  variant = 'primary',
  size = 'md'
}: GitHubConnectButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const createOAuthState = useMutation(api.integrations.github.oauth.createOAuthState);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // Create OAuth state for CSRF protection
      const { state } = await createOAuthState({ 
        returnUrl: window.location.pathname 
      });
      
      // Get GitHub OAuth URL
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI || 
                         `${window.location.origin}/api/auth/github/callback`;
      
      if (!clientId) {
        toast.error('GitHub OAuth is not configured. Please set up VITE_GITHUB_CLIENT_ID in your environment.');
        setIsConnecting(false);
        return;
      }
      
      // Define the scopes we need
      const scopes = [
        'read:user',
        'user:email',
        'repo',
        'read:org',
        'workflow'
      ].join(' ');
      
      // Build OAuth URL
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scopes,
        state: state,
        allow_signup: 'true'
      });
      
      // Redirect to GitHub OAuth
      window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
      
    } catch (error) {
      console.error('Error initiating GitHub OAuth:', error);
      toast.error('Failed to connect to GitHub. Please try again.');
      setIsConnecting(false);
    }
  };

  const sizeClasses = {
    sm: 'px-12px py-6px text-brutal-xs',
    md: 'px-16px py-8px text-brutal-sm',
    lg: 'px-24px py-12px text-brutal-md'
  };

  return (
    <BrutalButton
      onClick={handleConnect}
      disabled={isConnecting}
      variant={variant}
      className={`${sizeClasses[size]} ${className} flex items-center gap-8px`}
    >
      <FaGithub className={size === 'sm' ? 'w-14px h-14px' : size === 'md' ? 'w-16px h-16px' : 'w-20px h-20px'} />
      {isConnecting ? 'Connecting...' : 'Connect GitHub'}
    </BrutalButton>
  );
}