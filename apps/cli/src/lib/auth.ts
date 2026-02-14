/**
 * Authentication helpers for the LTF CLI
 * Supports browser OAuth flow and API token authentication
 */

import crypto from 'node:crypto';
import http from 'node:http';
import { URL } from 'node:url';
import open from 'open';
import { setAuth, clearAuth, getAuth, type AuthConfig } from './config.js';
import output from './output.js';
import { resetClient } from './convex.js';

// Auth configuration
const AUTH_PORT = 9876;
const AUTH_CALLBACK_PATH = '/callback';
const MAX_CALLBACK_REQUESTS = 10;

/**
 * Validate a URL string - must be parseable and use http/https protocol
 */
function validateUrl(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Invalid URL protocol: ${parsed.protocol}`);
    }
    return parsed.toString().replace(/\/+$/, '');
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Invalid URL protocol')) {
      throw err;
    }
    throw new Error(`Invalid URL: ${urlStr}`);
  }
}

/**
 * Escape HTML special characters to prevent XSS in callback pages
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validate token format - JWT (3 base64url parts) or opaque (20+ alphanumeric)
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token) return false;
  // JWT format: three base64url-encoded segments separated by dots
  const jwtPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
  if (jwtPattern.test(token)) return true;
  // Opaque token: at least 20 alphanumeric characters
  const opaquePattern = /^[A-Za-z0-9_-]{20,}$/;
  return opaquePattern.test(token);
}

// Web app URL - defaults to localhost for development, can be overridden for production
const WEB_APP_URL = (() => {
  const raw = process.env.LTF_WEB_URL || process.env.WEB_APP_URL || 'http://localhost:3000';
  try {
    return validateUrl(raw);
  } catch {
    return 'http://localhost:3000';
  }
})();

/**
 * Start browser-based OAuth login flow
 * Opens browser to Clerk auth page, waits for callback
 */
export async function loginWithBrowser(): Promise<AuthConfig> {
  // Generate CSRF state parameter
  const csrfState = crypto.randomBytes(32).toString('hex');
  let requestCount = 0;

  return new Promise((resolve, reject) => {
    // Create callback server
    const server = http.createServer(async (req, res) => {
      // Rate limit: cap requests to prevent abuse
      requestCount++;
      if (requestCount > MAX_CALLBACK_REQUESTS) {
        res.writeHead(429, { 'Content-Type': 'text/plain' });
        res.end('Too many requests');
        return;
      }

      const url = new URL(req.url || '/', `http://localhost:${AUTH_PORT}`);

      if (url.pathname === AUTH_CALLBACK_PATH) {
        // Verify CSRF state parameter
        const returnedState = url.searchParams.get('state');
        if (returnedState !== csrfState) {
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          res.end('Invalid state parameter');
          return;
        }

        const token = url.searchParams.get('token');
        const userId = url.searchParams.get('userId');
        const email = url.searchParams.get('email');
        const sessionId = url.searchParams.get('sessionId');
        const error = url.searchParams.get('error');

        // Error page template
        const errorPage = (title: string, message: string) => `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>LTF1 — Error</title>
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
              <style>
                *{margin:0;padding:0;box-sizing:border-box}
                body{font-family:'Inter',system-ui,sans-serif;background:#050505;color:#F9FAFB;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem}
                .wrapper{max-width:400px;width:100%;animation:fadeIn .4s ease-out}
                .card{background:#0A0A0A;border:1px solid #2E2E35;border-radius:12px;padding:2.5rem 2rem;text-align:center}
                .icon-ring{width:56px;height:56px;border-radius:50%;background:rgba(239,68,68,.1);border:1.5px solid rgba(239,68,68,.25);display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem}
                .icon-ring svg{width:24px;height:24px;color:#EF4444}
                .brand{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.08em;color:#6B7280;margin-bottom:1.25rem}
                h1{font-size:1.125rem;font-weight:600;color:#F9FAFB;margin-bottom:.75rem}
                .message{color:#9CA3AF;font-size:.875rem;line-height:1.6;margin-bottom:1.5rem}
                .divider{height:1px;background:#1F1F23;margin-bottom:1rem}
                .hint{font-family:'IBM Plex Mono',monospace;color:#6B7280;font-size:.6875rem;letter-spacing:.04em}
                @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
              </style>
            </head>
            <body>
              <div class="wrapper">
                <div class="card">
                  <div class="icon-ring">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </div>
                  <p class="brand">LTF1 CLI</p>
                  <h1>${escapeHtml(title)}</h1>
                  <p class="message">${escapeHtml(message)}</p>
                  <div class="divider"></div>
                  <p class="hint">Close this window and try again</p>
                </div>
              </div>
            </body>
          </html>
        `;

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(errorPage('Authentication Failed', error));
          server.close();
          reject(new Error(error));
          return;
        }

        if (!token) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(errorPage('Missing Token', 'No authentication token received.'));
          server.close();
          reject(new Error('No token received'));
          return;
        }

        // Success response
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>LTF1 — Authenticated</title>
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
              <style>
                *{margin:0;padding:0;box-sizing:border-box}
                body{font-family:'Inter',system-ui,sans-serif;background:#050505;color:#F9FAFB;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem}
                .wrapper{max-width:400px;width:100%;animation:fadeIn .4s ease-out}
                .card{background:#0A0A0A;border:1px solid #2E2E35;border-radius:12px;padding:2.5rem 2rem;text-align:center}
                .icon-ring{width:56px;height:56px;border-radius:50%;background:rgba(34,197,94,.1);border:1.5px solid rgba(34,197,94,.25);display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;animation:scaleIn .35s ease-out .15s both}
                .icon-ring svg{width:24px;height:24px;color:#22C55E}
                .brand{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.08em;color:#6B7280;margin-bottom:1.25rem}
                h1{font-size:1.125rem;font-weight:600;color:#F9FAFB;margin-bottom:.75rem}
                .email{font-family:'IBM Plex Mono',monospace;color:#9CA3AF;font-size:.8125rem;background:#111111;border:1px solid #1F1F23;border-radius:6px;padding:.625rem 1rem;margin-bottom:1.25rem;word-break:break-all}
                .message{color:#6B7280;font-size:.8125rem;line-height:1.6;margin-bottom:1.5rem}
                .divider{height:1px;background:#1F1F23;margin-bottom:1rem}
                .countdown{font-family:'IBM Plex Mono',monospace;color:#6B7280;font-size:.6875rem;letter-spacing:.04em}
                .countdown span{color:#9CA3AF;font-variant-numeric:tabular-nums}
                @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
                @keyframes scaleIn{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
              </style>
            </head>
            <body>
              <div class="wrapper">
                <div class="card">
                  <div class="icon-ring">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                  <p class="brand">LTF1 CLI</p>
                  <h1>Authenticated</h1>
                  ${email ? `<div class="email">${escapeHtml(email)}</div>` : ''}
                  <p class="message">
                    Return to your terminal to continue.<br>
                    This window will close automatically.
                  </p>
                  <div class="divider"></div>
                  <p class="countdown">Closing in <span id="sec">3</span>s</p>
                </div>
              </div>
              <script>
                let t=3;const el=document.getElementById('sec');
                const iv=setInterval(()=>{t--;if(el)el.textContent=String(t);if(t<=0){clearInterval(iv);window.close()}},1000);
              </script>
            </body>
          </html>
        `);

        server.close();

        // Parse JWT exp claim for real expiry (fallback to 1 hour)
        let expiresAt = Date.now() + 60 * 60 * 1000;
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
            if (payload.exp) {
              expiresAt = payload.exp * 1000;
            }
          }
        } catch {
          // fallback already set
        }

        const authConfig: AuthConfig = {
          token,
          tokenType: 'clerk',
          userId: userId || undefined,
          email: email || undefined,
          expiresAt,
          sessionId: sessionId || undefined,
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
      const authUrl = `${WEB_APP_URL}/cli-auth?callback=${encodeURIComponent(callbackUrl)}&state=${csrfState}`;

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
  if (!token || !isValidTokenFormat(token)) {
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
 * Silently refresh the auth token using Clerk session ID.
 * Calls the Convex HTTP endpoint which uses Clerk Backend SDK
 * to mint a fresh JWT — no browser needed (works for ~7 days).
 * Returns true on success, false if browser re-auth is needed.
 */
export async function refreshToken(): Promise<boolean> {
  const auth = getAuth();
  if (!auth?.sessionId) {
    return false; // No session ID — need browser login
  }

  // Derive the Convex site URL from the cloud URL
  const convexUrl = process.env.CONVEX_URL || 'https://tangible-butterfly-366.convex.cloud';
  const siteUrl = convexUrl.replace('.convex.cloud', '.convex.site');

  try {
    const response = await fetch(`${siteUrl}/api/cli-refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: auth.sessionId }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json() as { token?: string; error?: string };
    if (!data.token) {
      return false;
    }

    // Parse JWT exp claim for real expiry
    let expiresAt = Date.now() + 60 * 60 * 1000;
    try {
      const parts = data.token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        if (payload.exp) {
          expiresAt = payload.exp * 1000;
        }
      }
    } catch {
      // fallback already set
    }

    // Update stored auth with fresh token (preserve sessionId)
    setAuth({
      ...auth,
      token: data.token,
      expiresAt,
    });

    // Reset the Convex client to pick up new token
    resetClient();

    return true;
  } catch {
    return false; // Network error — fall back to browser
  }
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
  refreshToken,
  logout,
  getAuthStatus,
  requireAuth,
};
