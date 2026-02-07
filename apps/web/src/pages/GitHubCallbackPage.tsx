import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { FaGithub, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import BrutalCard from '@/components/ui/BrutalCard';
import toast from 'react-hot-toast';

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

      if (error) {
        setStatus('error');
        setError(errorDescription || error);
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
        setError(error instanceof Error ? error.message : 'Failed to connect GitHub account');
        toast.error('Failed to connect GitHub account');
        setTimeout(() => navigate('/profile'), 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate, handleCallback]);

  return (
    <div className="min-h-screen bg-obsidian-black flex items-center justify-center p-24px">
      <BrutalCard className="max-w-md w-full p-48px text-center">
        <div className="mb-24px">
          <FaGithub className="w-64px h-64px mx-auto text-[var(--theme-foreground)]/20" />
        </div>

        {status === 'processing' && (
          <>
            <h1 className="text-brutal-xl font-bold mb-16px">
              CONNECTING GITHUB
            </h1>
            <div className="text-[var(--theme-foreground)]/60 mb-24px">
              <div className="inline-block animate-spin">⚙️</div>
              <p className="mt-16px">Processing authentication...</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-brutal-success mb-16px">
              <FaCheckCircle className="w-48px h-48px mx-auto" />
            </div>
            <h1 className="text-brutal-xl font-bold mb-16px">
              CONNECTED!
            </h1>
            <p className="text-[var(--theme-foreground)]/60">
              Your GitHub account has been successfully connected.
              Redirecting...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-brutal-error mb-16px">
              <FaTimesCircle className="w-48px h-48px mx-auto" />
            </div>
            <h1 className="text-brutal-xl font-bold mb-16px">
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