import ErrorBoundary from '@/components/common/ErrorBoundary'
import React, { useEffect, useRef, useReducer, type MutableRefObject } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { FaGithub, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import BrutalCard from '@/components/ui/BrutalCard';
import toast from 'react-hot-toast';
import posthog from 'posthog-js';

interface CallbackState {
  status: 'processing' | 'success' | 'error';
  error: string | null;
}

type CallbackAction =
  | { type: 'SUCCESS' }
  | { type: 'ERROR'; error: string };

function callbackReducer(state: CallbackState, action: CallbackAction): CallbackState {
  switch (action.type) {
    case 'SUCCESS':
      return { status: 'success', error: null };
    case 'ERROR':
      return { status: 'error', error: action.error };
    default:
      return state;
  }
}

interface OAuthResult {
  success: boolean;
  githubUsername?: string;
  returnUrl?: string | null;
}

async function runGitHubCallback(
  dispatch: React.Dispatch<CallbackAction>,
  navigate: (path: string) => void,
  handleCallback: (args: { code: string; state: string }) => Promise<OAuthResult>,
  searchParams: URLSearchParams,
  processedRef: MutableRefObject<boolean>
): Promise<void> {
  if (processedRef.current) return;
  processedRef.current = true;

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const paramError = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const setupAction = searchParams.get('setup_action');
  const installationId = searchParams.get('installation_id');

  if (setupAction === 'install' && installationId) {
    if (window.opener) {
      window.opener.postMessage({ type: 'github-app-installed', installationId }, window.location.origin);
      window.close();
      return;
    }
    dispatch({ type: 'SUCCESS' });
    posthog.capture('github_app_installed', { installationId });
    toast.success('GitHub App installed successfully! You can now link it to your workspace.');
    setTimeout(() => navigate('/settings'), 2000);
    return;
  }

  if (paramError) {
    dispatch({ type: 'ERROR', error: errorDescription || paramError });
    posthog.capture('github_connection_failed', { error: errorDescription || paramError });
    toast.error(`GitHub OAuth error: ${errorDescription || paramError}`);
    setTimeout(() => navigate('/profile'), 3000);
    return;
  }

  if (!code || !state) {
    dispatch({ type: 'ERROR', error: 'Missing authorization code or state' });
    toast.error('Invalid OAuth callback parameters');
    setTimeout(() => navigate('/profile'), 3000);
    return;
  }

  try {
    const result = await handleCallback({ code, state });
    if (result.success) {
      dispatch({ type: 'SUCCESS' });
      posthog.capture('github_account_connected', { username: result.githubUsername });
      toast.success(`Successfully connected GitHub account: @${result.githubUsername}`);
      setTimeout(() => { navigate(result.returnUrl || '/profile'); }, 2000);
    } else {
      throw new Error('Failed to connect GitHub account');
    }
  } catch (err) {
    console.error('Error handling GitHub callback:', err);
    const errorMsg = err instanceof Error ? err.message : 'Failed to connect GitHub account';
    dispatch({ type: 'ERROR', error: errorMsg });
    posthog.capture('github_connection_failed', { error: errorMsg });
    toast.error('Failed to connect GitHub account');
    setTimeout(() => navigate('/profile'), 3000);
  }
}

export default function GitHubCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [{ status, error }, dispatch] = useReducer(callbackReducer, {
    status: 'processing',
    error: null,
  });

  const handleCallback = useAction(api.integrations.github.actions.handleOAuthCallback);
  const processedRef = useRef(false);

  useEffect(() => {
    runGitHubCallback(dispatch, navigate, handleCallback, searchParams, processedRef);
  }, [searchParams, navigate, handleCallback]);

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}