import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { FaGithub, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import BrutalCard from '@/components/ui/BrutalCard';
import toast from 'react-hot-toast';
import posthog from 'posthog-js';

export default function GitHubCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  const handleCallback = useAction(api.integrations.github.actions.handleOAuthCallback);
  const processedRef = useRef(false);

  useEffect(() => {
    const processCallback = async () => {
      // Prevent double-invocation (React Strict Mode / re-renders)
      if (processedRef.current) return;
      processedRef.current = true;

      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      const setupAction = searchParams.get('setup_action');
      const installationId = searchParams.get('installation_id');

      // GitHub App installation callback (not OAuth)
      // Installation data is processed via webhooks — notify parent and close if popup
      if (setupAction === 'install' && installationId) {
        if (window.opener) {
          window.opener.postMessage(
            { type: 'github-app-installed', installationId },
            window.location.origin
          );
          window.close();
          return;
        }
        // Not a popup — show success and redirect
        setStatus('success');
        posthog.capture('github_app_installed', { installationId });
        toast.success('GitHub App installed successfully! You can now link it to your workspace.');
        setTimeout(() => navigate('/settings'), 2000);
        return;
      }

      if (error) {
        setStatus('error');
        setError(errorDescription || error);
        posthog.capture('github_connection_failed', { error: errorDescription || error });
        toast.error(`GitHub OAuth error: ${errorDescription || error}`);
        setTimeout(() => navigate('/profile'), 3000);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setError('Missing authorization code or state');
        toast.error('Invalid OAuth callback parameters');
        setTimeout(() => navigate('/profile'), 3000);
        return;
      }

      try {
        const result = await handleCallback({ code, state });

        if (result.success) {
          setStatus('success');
          posthog.capture('github_account_connected', { username: result.githubUsername });
          toast.success(`Successfully connected GitHub account: @${result.githubUsername}`);

          // Redirect to the return URL or profile
          setTimeout(() => {
            navigate(result.returnUrl || '/profile');
          }, 2000);
        } else {
          throw new Error('Failed to connect GitHub account');
        }
      } catch (error) {
        console.error('Error handling GitHub callback:', error);
        setStatus('error');
        const errorMsg = error instanceof Error ? error.message : 'Failed to connect GitHub account';
        setError(errorMsg);
        posthog.capture('github_connection_failed', { error: errorMsg });
        toast.error('Failed to connect GitHub account');
        setTimeout(() => navigate('/profile'), 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate, handleCallback]);

  return (
    <div className="min-h-screen bg-obsidian-black flex items-center justify-center p-[16px]">
      <BrutalCard className="max-w-md w-full p-[24px] text-center">
        <div className="mb-[12px]">
          <FaGithub className="w-8 h-8 mx-auto text-[var(--theme-foreground)]/20" />
        </div>

        {status === 'processing' && (
          <>
            <h1 className="text-[16px] font-bold mb-[8px]">
              CONNECTING GITHUB
            </h1>
            <div className="text-[var(--theme-foreground)]/60 mb-[12px]">
              <div className="inline-block animate-spin">⚙️</div>
              <p className="mt-[8px]">Processing authentication...</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-brutal-success mb-[8px]">
              <FaCheckCircle className="w-6 h-6 mx-auto" />
            </div>
            <h1 className="text-[16px] font-bold mb-[8px]">
              {searchParams.get('setup_action') === 'install' ? 'INSTALLED!' : 'CONNECTED!'}
            </h1>
            <p className="text-[var(--theme-foreground)]/60">
              {searchParams.get('setup_action') === 'install'
                ? 'GitHub App installed successfully. Redirecting to settings...'
                : 'Your GitHub account has been successfully connected. Redirecting...'}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-brutal-error mb-[8px]">
              <FaTimesCircle className="w-6 h-6 mx-auto" />
            </div>
            <h1 className="text-[16px] font-bold mb-[8px]">
              CONNECTION FAILED
            </h1>
            <p className="text-[var(--theme-foreground)]/60 mb-8px">
              {error || 'An error occurred while connecting your GitHub account.'}
            </p>
            <p className="text-[var(--theme-foreground)]/40 text-brutal-xs">
              Redirecting to profile...
            </p>
          </>
        )}
      </BrutalCard>
    </div>
  );
}