/**
 * Auth state hook for TUI
 * Reads authentication state from CLI config
 * Only triggers re-render when auth state actually changes
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAuth, isAuthenticated } from '../../lib/config.js';

// Refresh 5 minutes before expiry
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

export interface AuthState {
  isAuthenticated: boolean;
  token: string | undefined;
  userId: string | undefined;
  email: string | undefined;
  expired: boolean;
  /** True when token is valid but expires within 5 minutes */
  needsRefresh: boolean;
  /** Clerk session ID — enables silent refresh without browser */
  sessionId: string | undefined;
  /** Force re-read auth config immediately */
  refresh: () => void;
}

function readAuthState() {
  const auth = getAuth();
  const authed = isAuthenticated();
  const now = Date.now();
  const expired = !!(auth?.expiresAt && auth.expiresAt < now);
  const needsRefresh = authed && !!(auth?.expiresAt && auth.expiresAt - now < REFRESH_BUFFER_MS);
  return {
    isAuthenticated: authed,
    token: auth?.token,
    userId: auth?.userId,
    email: auth?.email,
    expired,
    needsRefresh,
    sessionId: auth?.sessionId,
  };
}

export function useAuth(): AuthState {
  const [state, setState] = useState(readAuthState);
  const keyRef = useRef('');

  const refresh = useCallback(() => {
    const next = readAuthState();
    const nextKey = `${next.isAuthenticated}:${next.userId}:${next.expired}:${next.needsRefresh}:${next.sessionId}`;
    if (nextKey !== keyRef.current) {
      keyRef.current = nextKey;
      setState(next);
    }
  }, []);

  useEffect(() => {
    keyRef.current = `${state.isAuthenticated}:${state.userId}:${state.expired}:${state.needsRefresh}:${state.sessionId}`;

    // Poll faster (5s) when nearing expiry, otherwise 30s
    const pollMs = state.needsRefresh ? 5000 : 30000;
    const interval = setInterval(refresh, pollMs);
    return () => clearInterval(interval);
  }, [state.needsRefresh]);

  return { ...state, refresh };
}
