/**
 * LTF CLI - Library exports
 *
 * This file exports the library components for programmatic usage
 */

// Config management (exclude getConvexUrl to avoid conflict with convex.js)
export {
  getAuth, setAuth, clearAuth, isAuthenticated,
  getContext, setContext, clearContext, hasProjectContext,
  getPreferences, setPreference,
  getDaemonConfig, setDaemonConfig,
  getGitHooksConfig, setGitHooksConfig,
  getServerConfig, setServerConfig,
  getWebUrl, setWebUrl,
  setConvexUrl,
  getConfig, getConfigPath, resetConfig,
} from './lib/config.js';
export type { AuthConfig, ProjectContext, CLIConfig } from './lib/config.js';

// Output utilities
export { default as output } from './lib/output.js';

// Convex client
export * from './lib/convex.js';

// Authentication
export * from './lib/auth.js';

// Git utilities
export * from './lib/git.js';
