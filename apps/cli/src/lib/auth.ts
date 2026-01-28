/**
 * Authentication helpers for the LTF CLI
 * Supports browser OAuth flow and API token authentication
 */

import http from 'node:http';
import { URL } from 'node:url';
import open from 'open';
import { setAuth, clearAuth, getAuth, type AuthConfig } from './config.js';
import output from './output.js';
import { resetClient } from './convex.js';

// Auth configuration
const AUTH_PORT = 9876;
const AUTH_CALLBACK_PATH = '/callback';

// Web app URL - defaults to localhost for development, can be overridden for production
const WEB_APP_URL = process.env.LTF_WEB_URL || process.env.WEB_APP_URL || 'http://localhost:3000';

/**
 * Start browser-based OAuth login flow
 * Opens browser to Clerk auth page, waits for callback
 */
export async function loginWithBrowser(): Promise<AuthConfig> {
  return new Promise((resolve, reject) => {
    // Create callback server
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url || '/', `http://localhost:${AUTH_PORT}`);

      if (url.pathname === AUTH_CALLBACK_PATH) {
        const token = url.searchParams.get('token');
        const userId = url.searchParams.get('userId');
        const email = url.searchParams.get('email');
        const error = url.searchParams.get('error');

        // Error page template
        const errorPage = (title: string, message: string) => `
          <!DOCTYPE html>
          <html>
            <head>
              <title>LTF CLI - Error</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                  font-family: 'JetBrains Mono', 'Fira Code', monospace;
                  background: #0a0a0a;
                  color: #fafafa;
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 2rem;
                }
                .card {
                  background: #141414;
                  border: 3px solid #ef4444;
                  padding: 3rem;
                  max-width: 480px;
                  width: 100%;
                  text-align: center;
                }
                .icon { font-size: 4rem; margin-bottom: 1.5rem; }
                h1 {
                  color: #ef4444;
                  font-size: 1.5rem;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  margin-bottom: 1rem;
                }
                .message {
                  color: #a1a1aa;
                  font-size: 0.875rem;
                  line-height: 1.6;
                  margin-bottom: 1.5rem;
                }
                .hint {
                  color: #52525b;
                  font-size: 0.75rem;
                  text-transform: uppercase;
                  letter-spacing: 0.1em;
                }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="icon">✕</div>
                <h1>${title}</h1>
                <p class="message">${message}</p>
                <p class="hint">Close this window and try again</p>
              </div>
            </body>
          </html>
        `;

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(errorPage('Authentication Failed', error));
          server.close();
          reject(new Error(error));
          return;
        }

        if (!token) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(errorPage('Missing Token', 'No authentication token received.'));
          server.close();
          reject(new Error('No token received'));
          return;
        }

        // Success response - brutalist style matching the web app
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>LTF CLI - Authenticated</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                  font-family: 'JetBrains Mono', 'Fira Code', monospace;
                  background: #0a0a0a;
                  color: #fafafa;
                  min-height: 100vh;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 2rem;
                }
                .card {
                  background: #141414;
                  border: 3px solid #fcd34d;
                  padding: 3rem;
                  max-width: 480px;
                  width: 100%;
                  text-align: center;
                }
                .icon {
                  font-size: 4rem;
                  margin-bottom: 1.5rem;
                }
                h1 {
                  color: #fcd34d;
                  font-size: 1.5rem;
                  font-weight: 700;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  margin-bottom: 1rem;
                }
                .email {
                  color: #a1a1aa;
                  font-size: 0.875rem;
                  margin-bottom: 1.5rem;
                  padding: 0.75rem;
                  background: #0a0a0a;
                  border: 1px solid #27272a;
                }
                .message {
                  color: #71717a;
                  font-size: 0.875rem;
                  line-height: 1.6;
                }
                .closing {
                  margin-top: 1.5rem;
                  padding-top: 1.5rem;
                  border-top: 1px solid #27272a;
                  color: #52525b;
                  font-size: 0.75rem;
                  text-transform: uppercase;
                  letter-spacing: 0.1em;
                }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="icon">✓</div>
                <h1>Authenticated</h1>
                ${email ? `<div class="email">${email}</div>` : ''}
                <p class="message">
                  Return to your terminal to continue.<br>
                  This window will close automatically.
                </p>
                <p class="closing">Closing in 3 seconds...</p>
              </div>
              <script>setTimeout(() => window.close(), 3000);</script>
            </body>
          </html>
        `);

        server.close();

        const authConfig: AuthConfig = {
          token,
          tokenType: 'clerk',
          userId: userId || undefined,
          email: email || undefined,
          // Token expires in 24 hours (we'll refresh before that)
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        };

        resolve(authConfig);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(AUTH_PORT, () => {
      // Build auth URL with callback
      const callbackUrl = `http://localhost:${AUTH_PORT}${AUTH_CALLBACK_PATH}`;
      const authUrl = `${WEB_APP_URL}/cli-auth?callback=${encodeURIComponent(callbackUrl)}`;

      output.info(`Opening browser for authentication...`);
      output.log(output.colors.muted(`If browser doesn't open, visit: ${authUrl}`));

      // Open browser
      open(authUrl).catch(() => {
        output.warning('Could not open browser automatically');
        output.log(`Please visit: ${output.colors.link(authUrl)}`);
      });
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('Authentication timed out'));
    }, 5 * 60 * 1000);

    server.on('error', (err) => {
      reject(new Error(`Failed to start auth server: ${err.message}`));
    });
  });
}

/**
 * Login with an API token
 */
export async function loginWithToken(token: string): Promise<AuthConfig> {
  // Validate token format
  if (!token || token.length < 10) {
    throw new Error('Invalid token format');
  }

  // TODO: Validate token by making a test API call
  // For now, just store it

  const authConfig: AuthConfig = {
    token,
    tokenType: 'api',
    // API tokens don't expire (unless revoked)
    expiresAt: undefined,
  };

  return authConfig;
}

/**
 * Perform login and store credentials
 */
export async function login(options: { token?: string } = {}): Promise<void> {
  let authConfig: AuthConfig;

  if (options.token) {
    authConfig = await loginWithToken(options.token);
  } else {
    authConfig = await loginWithBrowser();
  }

  // Store auth config
  setAuth(authConfig);

  // Reset the Convex client to use new credentials
  resetClient();
}

/**
 * Logout and clear stored credentials
 */
export function logout(): void {
  clearAuth();
  resetClient();
}

/**
 * Get current auth status
 */
export function getAuthStatus(): {
  authenticated: boolean;
  type?: 'clerk' | 'api';
  email?: string;
  userId?: string;
  expiresAt?: Date;
} {
  const auth = getAuth();

  if (!auth?.token) {
    return { authenticated: false };
  }

  // Check expiration
  if (auth.expiresAt && auth.expiresAt < Date.now()) {
    clearAuth();
    return { authenticated: false };
  }

  return {
    authenticated: true,
    type: auth.tokenType,
    email: auth.email,
    userId: auth.userId,
    expiresAt: auth.expiresAt ? new Date(auth.expiresAt) : undefined,
  };
}

/**
 * Ensure user is authenticated, exit if not
 */
export function requireAuth(): void {
  const status = getAuthStatus();
  if (!status.authenticated) {
    output.error('Not authenticated', 'Run `ltf auth login` to authenticate');
    process.exit(1);
  }
}

export default {
  login,
  loginWithBrowser,
  loginWithToken,
  logout,
  getAuthStatus,
  requireAuth,
};
