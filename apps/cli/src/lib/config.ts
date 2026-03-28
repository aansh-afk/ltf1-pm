/**
 * Configuration management for the LTF CLI
 * Stores auth tokens, active workspace/project, and user preferences
 */

import Conf from "conf";
// Type import not directly used but kept for reference
// import type { Id } from '../../../../convex/_generated/dataModel.js';

export interface AuthConfig {
  token?: string;
  tokenType: "clerk" | "api";
  userId?: string;
  email?: string;
  expiresAt?: number;
  /** Clerk session ID for server-side token refresh (avoids browser re-auth) */
  sessionId?: string;
}

export interface ProjectContext {
  workspaceId?: string;
  workspaceName?: string;
  projectId?: string;
  projectKey?: string;
  projectName?: string;
}

export interface CLIConfig {
  auth?: AuthConfig;
  context?: ProjectContext;
  preferences?: {
    defaultFormat?: "table" | "json" | "compact";
    colorOutput?: boolean;
    autoSync?: boolean;
  };
  server?: {
    /** Custom web app URL (defaults to https://ltf1.dev) */
    webUrl?: string;
    /** Custom Convex deployment URL */
    convexUrl?: string;
  };
  daemon?: {
    enabled?: boolean;
    pid?: number;
    logFile?: string;
  };
  gitHooks?: {
    installed?: boolean;
    installedAt?: string;
  };
}

const config = new Conf<CLIConfig>({
  projectName: "ltf",
  projectVersion: "0.1.0",
  schema: {
    auth: {
      type: "object",
      properties: {
        token: { type: "string" },
        tokenType: { type: "string", enum: ["clerk", "api"] },
        userId: { type: "string" },
        email: { type: "string" },
        expiresAt: { type: "number" },
        sessionId: { type: "string" },
      },
    },
    context: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        workspaceName: { type: "string" },
        projectId: { type: "string" },
        projectKey: { type: "string" },
        projectName: { type: "string" },
      },
    },
    preferences: {
      type: "object",
      properties: {
        defaultFormat: { type: "string", enum: ["table", "json", "compact"] },
        colorOutput: { type: "boolean" },
        autoSync: { type: "boolean" },
      },
    },
    server: {
      type: "object",
      properties: {
        webUrl: { type: "string" },
        convexUrl: { type: "string" },
      },
    },
    daemon: {
      type: "object",
      properties: {
        enabled: { type: "boolean" },
        pid: { type: "number" },
        logFile: { type: "string" },
      },
    },
    gitHooks: {
      type: "object",
      properties: {
        installed: { type: "boolean" },
        installedAt: { type: "string" },
      },
    },
  },
  defaults: {
    preferences: {
      defaultFormat: "table",
      colorOutput: true,
      autoSync: true,
    },
  },
});

// Auth helpers
export function getAuth(): AuthConfig | undefined {
  return config.get("auth");
}

export function setAuth(auth: AuthConfig): void {
  config.set("auth", auth);
}

export function clearAuth(): void {
  config.delete("auth");
}

export function isAuthenticated(): boolean {
  const auth = getAuth();
  if (!auth?.token) return false;
  // Don't clear auth on expiry — the session may still be refreshable
  // via sessionId. Let the caller (requireAuth) handle refresh logic.
  if (auth.expiresAt && auth.expiresAt < Date.now()) {
    // If there's a sessionId, the session is still potentially valid
    // (just needs a JWT refresh). Only consider truly unauthenticated
    // if there's no refresh path.
    return !!auth.sessionId;
  }
  return true;
}

// Context helpers
export function getContext(): ProjectContext | undefined {
  return config.get("context");
}

export function setContext(context: Partial<ProjectContext>): void {
  const current = getContext() || {};
  config.set("context", { ...current, ...context });
}

export function clearContext(): void {
  config.delete("context");
}

export function hasProjectContext(): boolean {
  const ctx = getContext();
  return !!(ctx?.workspaceId && ctx?.projectId);
}

// Preferences helpers
export function getPreferences() {
  return config.get("preferences");
}

export function setPreference<
  K extends keyof NonNullable<CLIConfig["preferences"]>,
>(key: K, value: NonNullable<CLIConfig["preferences"]>[K]): void {
  const prefs = getPreferences() || {};
  config.set("preferences", { ...prefs, [key]: value });
}

// Daemon helpers
export function getDaemonConfig() {
  return config.get("daemon");
}

export function setDaemonConfig(
  daemon: Partial<NonNullable<CLIConfig["daemon"]>>,
): void {
  const current = getDaemonConfig() || {};
  config.set("daemon", { ...current, ...daemon });
}

// Git hooks helpers
export function getGitHooksConfig() {
  return config.get("gitHooks");
}

export function setGitHooksConfig(
  hooks: Partial<NonNullable<CLIConfig["gitHooks"]>>,
): void {
  const current = getGitHooksConfig() || {};
  config.set("gitHooks", { ...current, ...hooks });
}

// Server configuration helpers
export function getServerConfig() {
  return config.get("server");
}

export function setServerConfig(
  server: Partial<NonNullable<CLIConfig["server"]>>,
): void {
  const current = getServerConfig() || {};
  config.set("server", { ...current, ...server });
}

export function getWebUrl(): string | undefined {
  return config.get("server")?.webUrl;
}

export function setWebUrl(url: string): void {
  setServerConfig({ webUrl: url });
}

export function getConvexUrl(): string | undefined {
  return config.get("server")?.convexUrl;
}

export function setConvexUrl(url: string): void {
  setServerConfig({ convexUrl: url });
}

// Full config access
export function getConfig(): CLIConfig {
  return config.store;
}

export function getConfigPath(): string {
  return config.path;
}

export function resetConfig(): void {
  config.clear();
}

export { config };
