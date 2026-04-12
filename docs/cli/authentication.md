# CLI Authentication Guide

This guide explains how authentication works in the LTF1 CLI and how it integrates with your domain `ltf1.dev`.

## How CLI Authentication Works

The LTF CLI uses a **browser-based OAuth flow** for authentication:

```
┌─────────┐                                      ┌──────────────┐
│   CLI   │                                      │  Web Browser │
│ (local) │                                      │              │
└────┬────┘                                      └──────┬───────┘
     │                                                   │
     │ 1. Start local server on port 9876               │
     │──────────────────────────────────────────────────│
     │                                                   │
     │ 2. Open browser → https://ltf1.dev/cli-auth      │
     │──────────────────────────────────────────────────▶
     │    ?callback=http://localhost:9876/callback      │
     │                                                   │
     │                                                   │ 3. User signs in via Clerk
     │                                                   │
     │                                                   │
     │ 4. Redirect with token                           │
     │◀──────────────────────────────────────────────────│
     │    http://localhost:9876/callback?token=...      │
     │                                                   │
     │ 5. Store token and close server                  │
     │                                                   │
     ▼                                                   ▼
```

### Key Points

1. **CLI starts a local HTTP server** on port `9876` to receive the authentication callback
2. **Opens your browser** to `https://ltf1.dev/cli-auth` with a callback URL
3. **You authenticate** via Clerk on the web app
4. **Web app redirects** back to `http://localhost:9876/callback` with your token
5. **CLI receives the token** and stores it securely in your local config

## Usage

### First Time Authentication

```bash
# Install the CLI
npm install -g @ltf1/cli

# Authenticate
ltf1 auth login
```

This will:

1. Open your browser to `https://ltf1.dev/cli-auth`
2. Prompt you to sign in (or sign up if you're new)
3. Redirect back to the CLI with your authentication token
4. Store your credentials locally

### Check Authentication Status

```bash
# See if you're logged in
ltf1 auth status

# Example output:
# ✓ Authenticated
# Email: user@example.com
# Token expires: 2024-12-25 15:30:00
```

### Logout

```bash
# Clear your stored credentials
ltf1 auth logout
```

### Re-authentication

If your token expires, the CLI will automatically prompt you to re-authenticate:

```bash
ltf projects list
# ✗ Token expired. Please login again.
# Run: ltf1 auth login
```

## Web App URL Configuration

The CLI needs to know where your web app is hosted. By default, it uses `https://ltf1.dev`.

### Priority Order

The CLI determines the web app URL in this order:

1. **User's saved config** (set via `ltf1 config set-web-url`)
2. **Environment variable** (`LTF_WEB_URL` or `WEB_APP_URL`)
3. **Development mode** (`NODE_ENV=development` → `http://localhost:3000`)
4. **Auto-detect** (based on `CONVEX_URL`)
5. **Default** → `https://ltf1.dev`

### For End Users (Default)

If you're a regular user installing the CLI from npm, **no configuration needed**! The CLI defaults to `https://ltf1.dev` and will work out of the box.

```bash
npm install -g @ltf1/cli
ltf1 auth login  # Opens https://ltf1.dev/cli-auth
```

### For Developers (Custom Setup)

#### Option 1: Persistent Configuration

```bash
# Set a custom web URL (persisted in ~/.config/ltf/config.json)
ltf1 config set-web-url https://my-custom-domain.com

# Verify
ltf1 config get-web-url
# https://my-custom-domain.com
```

#### Option 2: Environment Variable

```bash
# Set for current session
export LTF_WEB_URL=https://my-custom-domain.com
ltf1 auth login

# Or inline
LTF_WEB_URL=http://localhost:3000 ltf1 auth login
```

#### Option 3: Development Mode

```bash
# For CLI developers working on the CLI itself
NODE_ENV=development ltf1 auth login
# Opens http://localhost:3000/cli-auth
```

## Token Management

### Where Tokens Are Stored

Tokens are stored securely in your local configuration file:

```
~/.config/ltf/config.json
```

The config file contains:

- `token`: Your JWT authentication token
- `tokenType`: Either `clerk` (browser) or `api` (manual)
- `email`: Your email address
- `userId`: Your Clerk user ID
- `expiresAt`: Token expiration timestamp
- `sessionId`: Clerk session ID (for silent refresh)

### Token Refresh

The CLI supports **silent token refresh** to avoid frequent re-authentication:

- **Initial login**: Token valid for ~1 hour
- **Session refresh**: Can refresh token for up to ~7 days without browser
- **After 7 days**: Must re-authenticate via browser

```bash
# CLI automatically refreshes your token when needed
ltf projects list
# If token is about to expire, CLI refreshes it silently
# If refresh fails, prompts for re-authentication
```

### Manual Token Authentication (Advanced)

For CI/CD or automation, you can use API tokens:

```bash
# Login with an API token
ltf1 auth login --token your-api-token-here

# Or via environment variable
export LTF_AUTH_TOKEN=your-api-token-here
ltf projects list
```

> **Note**: API token support may not be implemented yet. Check with your team for availability.

## Security

### Callback URL Validation

The web app validates callback URLs to prevent security issues:

```typescript
// Only these hosts are allowed for callbacks
const allowedHosts = ["localhost", "127.0.0.1", "ltf1.dev"];
```

This means:

- ✅ `http://localhost:9876/callback` (CLI auth)
- ✅ `http://127.0.0.1:9876/callback` (CLI auth)
- ✅ `https://ltf1.dev/callback` (if needed)
- ❌ `http://malicious-site.com/callback` (blocked)

### CSRF Protection

The CLI uses CSRF tokens to prevent cross-site request forgery:

```bash
# When you run ltf1 auth login:
# 1. CLI generates a random CSRF state parameter
# 2. Passes it to the web app: ?state=abc123xyz
# 3. Web app returns it: ?state=abc123xyz&token=...
# 4. CLI verifies the state matches before accepting the token
```

### Token Expiration

- **Browser tokens** (Clerk): Expire after ~1 hour
- **Session refresh**: Works for up to ~7 days
- **API tokens**: Don't expire (unless revoked)

## Troubleshooting

### Issue: Browser doesn't open

**Problem**: CLI says "Opening browser" but nothing happens

**Solution**:

1. Manually visit the URL shown in the terminal
2. Or copy/paste the URL into your browser
3. Check that you have a default browser configured

### Issue: "Authentication timed out"

**Problem**: Waited too long or browser didn't redirect

**Solution**:

1. The CLI waits 5 minutes for authentication
2. If you see this error, just run `ltf1 auth login` again
3. Complete the flow within 5 minutes

### Issue: "Invalid callback URL"

**Problem**: Web app rejects the callback

**Solution**:

1. Ensure you're using an official LTF CLI build
2. Check that ltf1.dev is accessible (not blocked by firewall)
3. Try `ltf1 auth login --verbose` for more details

### Issue: "Port 9876 already in use"

**Problem**: Another process is using port 9876

**Solution**:

1. Find and stop the process: `lsof -i :9876`
2. Or wait a few seconds and try again
3. The CLI will retry with a different port if needed

### Issue: Token keeps expiring

**Problem**: CLI asks you to login frequently

**Solution**:

1. Check your system clock is accurate
2. Ensure your network connection is stable (for token refresh)
3. If session refresh fails, you'll need to re-authenticate

### Issue: Custom domain not working

**Problem**: Using custom domain but CLI still goes to ltf1.dev

**Solution**:

```bash
# Check current web URL
ltf1 config get-web-url

# Set your custom URL
ltf1 config set-web-url https://your-domain.com

# Or use environment variable
export LTF_WEB_URL=https://your-domain.com
```

## Configuration Commands

### View all config

```bash
ltf1 config list
# Shows all your CLI configuration
```

### Get web URL

```bash
ltf1 config get-web-url
# https://ltf1.dev
```

### Set web URL

```bash
ltf1 config set-web-url https://custom-domain.com
# ✓ Web URL updated
```

### Reset config

```bash
ltf1 config reset
# ⚠️  This will clear all settings, including authentication
# Continue? (y/n)
```

### Get config file location

```bash
ltf1 config path
# /Users/yourname/.config/ltf/config.json
```

## Examples

### Regular User Flow

```bash
# Install CLI
npm install -g @ltf1/cli

# Authenticate (defaults to ltf1.dev)
ltf1 auth login
# → Opens https://ltf1.dev/cli-auth
# → Sign in via Clerk
# → Returns to CLI with token
# ✓ Authenticated as user@example.com

# Use the CLI
ltf projects list
ltf issues list
ltf1 task create "New task"
```

### Developer Flow (Local Development)

```bash
# Clone the repo
git clone https://github.com/yourorg/ltf1
cd ltf1

# Run local web app
npm run dev  # Starts on localhost:3000

# In another terminal, use local CLI
cd apps/cli
export LTF_WEB_URL=http://localhost:3000
npm run build
npm link

# Authenticate against local instance
ltf1 auth login
# → Opens http://localhost:3000/cli-auth
```

### CI/CD Flow (Future)

```bash
# In your CI/CD pipeline
export LTF_AUTH_TOKEN=${{ secrets.LTF_API_TOKEN }}
export LTF_WEB_URL=https://ltf1.dev

# Run CLI commands
ltf sync --project=my-project
ltf1 task create "Automated task"
```

## Related Documentation

- [Domain Setup Guide](../deployment/domain-setup.md)
- [Clerk Production Setup](../setup/clerk-production-setup.md)
- [CLI Configuration](./configuration.md)
- [CLI Commands Reference](./commands.md)
