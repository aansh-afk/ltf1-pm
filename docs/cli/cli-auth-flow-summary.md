# CLI Authentication with ltf1.dev - Summary

## What Happens When Someone Uses the CLI?

### The Complete Flow

When an end user installs your CLI and runs `ltf auth login`, here's exactly what happens:

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User Installs CLI                                      │
└─────────────────────────────────────────────────────────────────┘

$ npm install -g @ltf1/cli
$ ltf auth login

┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: CLI Starts Local HTTP Server                           │
└─────────────────────────────────────────────────────────────────┘

- CLI starts server on http://localhost:9876
- Generates CSRF token for security: state=abc123xyz
- Prepares callback URL: http://localhost:9876/callback

┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: CLI Determines Web App URL                             │
└─────────────────────────────────────────────────────────────────┘

Priority order:
1. ✗ User config (not set for new users)
2. ✗ LTF_WEB_URL env var (not set for end users)
3. ✗ NODE_ENV=development (not set for end users)
4. ✗ CONVEX_URL (not set for end users)
5. ✓ DEFAULT: https://ltf1.dev ✅

Result: WEB_APP_URL = "https://ltf1.dev"

┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: CLI Opens Browser                                      │
└─────────────────────────────────────────────────────────────────┘

Opens:
https://ltf1.dev/cli-auth?
  callback=http://localhost:9876/callback&
  state=abc123xyz

Terminal shows:
  ℹ Opening browser for authentication...
  If browser doesn't open, visit: https://ltf1.dev/cli-auth?...

┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: User Authenticates on ltf1.dev                         │
└─────────────────────────────────────────────────────────────────┘

Browser loads: https://ltf1.dev/cli-auth

CLIAuthPage.tsx validates callback URL:
- Checks: localhost ✅, 127.0.0.1 ✅, ltf1.dev ✅
- http://localhost:9876/callback → VALID ✅

If not signed in:
- Redirects to /sign-in with Clerk
- User enters email/password or uses OAuth

If signed in:
- Gets Clerk session token with Convex template
- Prepares to redirect back to CLI

┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Web App Redirects Back to CLI                          │
└─────────────────────────────────────────────────────────────────┘

Redirect URL:
http://localhost:9876/callback?
  token=eyJhbGc...&
  state=abc123xyz&
  userId=user_123&
  email=user@example.com&
  sessionId=sess_456

┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: CLI Receives Token                                     │
└─────────────────────────────────────────────────────────────────┘

CLI's local server receives the request:
1. Verifies state=abc123xyz matches CSRF token ✅
2. Extracts authentication data:
   - token: JWT from Clerk
   - userId: Clerk user ID
   - email: user's email
   - sessionId: for token refresh
3. Parses JWT to get expiration time
4. Closes the local HTTP server

┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: CLI Stores Credentials                                 │
└─────────────────────────────────────────────────────────────────┘

Saves to: ~/.config/ltf/config.json

{
  "auth": {
    "token": "eyJhbGc...",
    "tokenType": "clerk",
    "userId": "user_123",
    "email": "user@example.com",
    "expiresAt": 1703693400000,
    "sessionId": "sess_456"
  }
}

Terminal shows:
  ✓ Authenticated as user@example.com

┌─────────────────────────────────────────────────────────────────┐
│ STEP 9: User Can Now Use CLI                                   │
└─────────────────────────────────────────────────────────────────┘

$ ltf projects list
$ ltf issues create "New issue"
$ ltf task list --status open

All commands now include auth header:
Authorization: Bearer eyJhbGc...
```

## Key Implementation Details

### 1. **Default to ltf1.dev for End Users**

```typescript
// apps/cli/src/lib/auth.ts
const WEB_APP_URL = (() => {
  const savedUrl = getWebUrl(); // User config
  if (savedUrl) return savedUrl;

  const envUrl = process.env.LTF_WEB_URL;
  if (envUrl) return envUrl;

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000"; // CLI developers
  }

  const convexUrl = process.env.CONVEX_URL || "";
  if (convexUrl.includes("your-deployment.convex.cloud")) {
    return "https://ltf1.dev"; // Replace with your deployment URL
  }

  return "https://ltf1.dev"; // 👈 End users (DEFAULT)
})();
```

### 2. **Callback Always Goes to Localhost**

```typescript
// The CLI's local callback server
const callbackUrl = `http://localhost:${AUTH_PORT}${AUTH_CALLBACK_PATH}`;
// = http://localhost:9876/callback

// But the web app that handles auth is on ltf1.dev
const authUrl = `${WEB_APP_URL}/cli-auth?callback=${encodeURIComponent(callbackUrl)}`;
// = https://ltf1.dev/cli-auth?callback=http://localhost:9876/callback
```

### 3. **Security Validation**

```typescript
// apps/web/src/pages/CLIAuthPage.tsx
const allowedHosts = ["localhost", "127.0.0.1", "ltf1.dev"];

// Validates that callback URL is safe:
// ✅ http://localhost:9876/callback
// ✅ http://127.0.0.1:9876/callback
// ✅ https://ltf1.dev/callback
// ❌ http://malicious-site.com/callback
```

### 4. **Token Refresh (No Browser Needed)**

```typescript
// After initial login, CLI can refresh token silently for ~7 days
async function refreshToken(): Promise<boolean> {
  const auth = getAuth();
  if (!auth?.sessionId) return false;

  // Call Convex HTTP endpoint
  const response = await fetch(`${CONVEX_SITE_URL}/api/cli-refresh`, {
    method: "POST",
    body: JSON.stringify({ sessionId: auth.sessionId }),
  });

  if (response.ok) {
    const { token } = await response.json();
    setAuth({ ...auth, token }); // Update token
    return true;
  }

  return false; // Need to re-authenticate via browser
}
```

## For Different User Types

### End Users (Published npm Package)

```bash
# Install from npm
npm install -g @ltf1/cli

# Just works - no configuration needed
ltf auth login
# ✓ Opens https://ltf1.dev/cli-auth automatically
```

**No environment variables needed!** The CLI defaults to `https://ltf1.dev`.

### App Developers (Working on the App)

```bash
# Clone repo and work on app
git clone https://github.com/yourorg/ltf1
npm run dev  # Web app on localhost:3000

# In another terminal
cd apps/cli
export LTF_WEB_URL=http://localhost:3000
ltf auth login
# ✓ Opens http://localhost:3000/cli-auth
```

### CLI Developers (Working on the CLI)

```bash
# Clone repo and work on CLI
cd apps/cli
npm run dev

# Test against local web app
NODE_ENV=development ltf auth login
# ✓ Opens http://localhost:3000/cli-auth

# Or test against production
ltf auth login
# ✓ Opens https://ltf1.dev/cli-auth
```

### CI/CD Pipelines (Automation)

```bash
# In GitHub Actions, GitLab CI, etc.
export LTF_AUTH_TOKEN=${{ secrets.LTF_API_TOKEN }}
export LTF_WEB_URL=https://ltf1.dev

# Run CLI commands non-interactively
ltf sync --project=my-project
ltf task create "Automated task"
```

## Configuration Options

Users can customize the web URL if needed:

```bash
# View current web URL
ltf config get-web-url
# https://ltf1.dev (default)

# Set custom domain (persists in ~/.config/ltf/config.json)
ltf config set-web-url https://custom-domain.com

# Verify
ltf auth login
# Opens https://custom-domain.com/cli-auth

# Reset to default
ltf config set-web-url https://ltf1.dev
```

## Summary

✅ **End users**: Just run `ltf auth login` - it works out of the box with ltf1.dev
✅ **Security**: Only localhost and ltf1.dev callbacks are allowed
✅ **Flexibility**: Can be configured for custom domains if needed
✅ **Token refresh**: Silent refresh for up to 7 days without browser
✅ **Developer-friendly**: Auto-detects dev vs production environments

The authentication flow is **seamless** for end users while remaining **flexible** for developers! 🎉
