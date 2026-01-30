/**
 * Auth state hook for TUI
 * Reads authentication state from CLI config
 * Only triggers re-render when auth state actually changes
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getAuth, isAuthenticated } from '../../lib/config.js';

export interface AuthState {
  isAuthenticated: boolean;
  token: string | undefined;
  userId: string | undefined;
  email: string | undefined;
  expired: boolean;
  /** Force re-read auth config immediately */
  refresh: () => void;
}

function readAuthState() {
  const auth = getAuth();
  const authed = isAuthenticated();
  return {
    isAuthenticated: authed,
    token: auth?.token,
    userId: auth?.userId,
    email: auth?.email,
    expired: !!(auth?.expiresAt && auth.expiresAt < Date.now()),
  };
}

export function useAuth(): AuthState {
  const [state, setState] = useState(readAuthState);
  const keyRef = useRef('');

  const refresh = useCallback(() => {
    const next = readAuthState();
    const nextKey = `${next.isAuthenticated}:${next.userId}:${next.expired}`;
    if (nextKey !== keyRef.current) {
      keyRef.current = nextKey;
      setState(next);
    }
  }, []);

  useEffect(() => {
    keyRef.current = `${state.isAuthenticated}:${state.userId}:${state.expired}`;

    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  return { ...state, refresh };
}
