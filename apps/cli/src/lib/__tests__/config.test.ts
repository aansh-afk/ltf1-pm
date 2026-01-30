import { describe, it, expect, beforeEach } from 'vitest';
import {
  getAuth,
  setAuth,
  clearAuth,
  isAuthenticated,
  getContext,
  setContext,
  clearContext,
  hasProjectContext,
  getPreferences,
  setPreference,
  resetConfig,
  type AuthConfig,
} from '../config.js';

describe('config', () => {
  beforeEach(() => {
    resetConfig();
  });

  describe('auth', () => {
    it('returns undefined when no auth is set', () => {
      expect(getAuth()).toBeUndefined();
    });

    it('roundtrips setAuth / getAuth', () => {
      const auth: AuthConfig = {
        token: 'test-token-abcdef1234567890',
        tokenType: 'api',
        userId: 'user_123',
        email: 'test@example.com',
      };
      setAuth(auth);
      const result = getAuth();
      expect(result).toEqual(auth);
    });

    it('clearAuth removes stored auth', () => {
      setAuth({ token: 'tok', tokenType: 'api' });
      clearAuth();
      expect(getAuth()).toBeUndefined();
    });
  });

  describe('isAuthenticated', () => {
    it('returns false when no auth is stored', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('returns true when valid auth is stored', () => {
      setAuth({
        token: 'valid-token',
        tokenType: 'api',
      });
      expect(isAuthenticated()).toBe(true);
    });

    it('returns false when token is expired', () => {
      setAuth({
        token: 'expired-token',
        tokenType: 'clerk',
        expiresAt: Date.now() - 1000, // expired 1 second ago
      });
      expect(isAuthenticated()).toBe(false);
    });

    it('returns true when token has future expiry', () => {
      setAuth({
        token: 'future-token',
        tokenType: 'clerk',
        expiresAt: Date.now() + 60000, // expires in 60 seconds
      });
      expect(isAuthenticated()).toBe(true);
    });
  });

  describe('context', () => {
    it('returns undefined when no context is set', () => {
      expect(getContext()).toBeUndefined();
    });

    it('sets and gets context', () => {
      setContext({ workspaceId: 'ws_1', projectId: 'proj_1' });
      const ctx = getContext();
      expect(ctx?.workspaceId).toBe('ws_1');
      expect(ctx?.projectId).toBe('proj_1');
    });

    it('merges partial context updates', () => {
      setContext({ workspaceId: 'ws_1', workspaceName: 'My WS' });
      setContext({ projectId: 'proj_1' });
      const ctx = getContext();
      expect(ctx?.workspaceId).toBe('ws_1');
      expect(ctx?.workspaceName).toBe('My WS');
      expect(ctx?.projectId).toBe('proj_1');
    });

    it('clearContext removes stored context', () => {
      setContext({ workspaceId: 'ws_1' });
      clearContext();
      expect(getContext()).toBeUndefined();
    });

    it('hasProjectContext returns false with no context', () => {
      expect(hasProjectContext()).toBe(false);
    });

    it('hasProjectContext returns false with partial context', () => {
      setContext({ workspaceId: 'ws_1' });
      expect(hasProjectContext()).toBe(false);
    });

    it('hasProjectContext returns true with full context', () => {
      setContext({ workspaceId: 'ws_1', projectId: 'proj_1' });
      expect(hasProjectContext()).toBe(true);
    });
  });

  describe('preferences', () => {
    it('returns defaults', () => {
      const prefs = getPreferences();
      expect(prefs?.defaultFormat).toBe('table');
      expect(prefs?.colorOutput).toBe(true);
      expect(prefs?.autoSync).toBe(true);
    });

    it('setPreference updates a single preference', () => {
      setPreference('defaultFormat', 'json');
      const prefs = getPreferences();
      expect(prefs?.defaultFormat).toBe('json');
      // Other defaults preserved
      expect(prefs?.colorOutput).toBe(true);
    });
  });
});
