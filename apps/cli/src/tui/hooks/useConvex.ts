/**
 * Convex polling hook for TUI
 * Wraps ConvexHttpClient with useState + setInterval for periodic data fetching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ConvexHttpClient } from 'convex/browser';
import type { FunctionReference, FunctionArgs, FunctionReturnType } from 'convex/server';
import { getClient } from '../../lib/convex.js';
import { getAuth, isAuthenticated } from '../../lib/config.js';
import type { ConnectionStatus } from '../types.js';

export interface ConvexQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  connectionStatus: ConnectionStatus;
  refetch: () => void;
}

/**
 * Poll a Convex query at a given interval
 * Returns { data, loading, error, connectionStatus, refetch }
 */
export function useConvexQuery<Q extends FunctionReference<'query'>>(
  queryRef: Q,
  args: FunctionArgs<Q> | null,
  intervalMs = 10000,
): ConvexQueryResult<FunctionReturnType<Q>> {
  type T = FunctionReturnType<Q>;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const clientRef = useRef<ConvexHttpClient | null>(null);
  const retryCount = useRef(0);

  // Stabilize args by serializing — prevents re-fetch on every render
  const argsKey = args === null ? null : JSON.stringify(args);

  const fetchData = useCallback(async () => {
    if (argsKey === null) {
      setLoading(false);
      return;
    }

    if (!isAuthenticated()) {
      setError('Not authenticated');
      setConnectionStatus('disconnected');
      setLoading(false);
      return;
    }

    const parsedArgs = JSON.parse(argsKey) as FunctionArgs<Q>;

    try {
      if (!clientRef.current) {
        clientRef.current = getClient();
        const auth = getAuth();
        if (auth?.token) {
          clientRef.current.setAuth(auth.token);
        }
      }

      const result = await clientRef.current.query(queryRef, parsedArgs);
      setData(result as T);
      setError(null);
      setConnectionStatus('connected');
      retryCount.current = 0;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg.includes('Unauthenticated') || msg.includes('auth')) {
        setError('Authentication expired');
        setConnectionStatus('error');
      } else {
        setError(msg);
        setConnectionStatus('error');
        retryCount.current += 1;
      }
    } finally {
      setLoading(false);
    }
  }, [queryRef, argsKey]);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, intervalMs);
    return () => clearInterval(interval);
  }, [fetchData, intervalMs]);

  return { data, loading, error, connectionStatus, refetch };
}
