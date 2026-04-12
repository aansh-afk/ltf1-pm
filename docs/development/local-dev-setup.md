# Local Development Setup

## When You Run `npm run dev`

When you're developing the LTF1 app locally and run `npm run dev`, the web app starts on `http://localhost:3000`. The CLI needs to connect to this local instance, not to the production site at `https://ltf1.dev`.

## How the CLI Detects Local Development

The CLI automatically detects if you're working in a development environment using this priority order:

### 1. **User Config** (Highest Priority)

```bash
# Set once, persists forever
ltf1 config set-web-url http://localhost:3000
```

### 2. **Environment Variable**

```bash
# Set per-session
export LTF_WEB_URL=http://localhost:3000
ltf1 auth login

# Or inline
LTF_WEB_URL=http://localhost:3000 ltf1 auth login
```

### 3. **NODE_ENV**

```bash
# Automatically uses localhost:3000
NODE_ENV=development ltf1 auth login
```

### 4. **Monorepo Detection** (NEW! ✨)

The CLI automatically detects if it's running from a monorepo by looking for:

- `pnpm-workspace.yaml`
- `turbo.json`
- `lerna.json`

If found in your current directory or up to 3 levels up, it automatically uses `http://localhost:3000`.

**This means when you're working in the monorepo, it just works!**

### 5. **Default** (Lowest Priority)

If none of the above apply, defaults to `https://ltf1.dev` (for end users who installed from npm).

## Development Workflows

### Scenario 1: Working on the Web App

```bash
# Terminal 1: Start web app
cd /path/to/ltf1
npm run dev
# ✓ Web app running on http://localhost:3000

# Terminal 2: Use CLI
cd /path/to/ltf1
ltf1 auth login
# ✓ Automatically detects monorepo (pnpm-workspace.yaml)
# ✓ Opens http://localhost:3000/cli-auth
```

**No configuration needed!** The CLI detects the monorepo and uses localhost.

### Scenario 2: CLI Installed Globally (from npm link)

If you've installed the CLI globally for testing:

```bash
# Link the CLI globally
cd /path/to/ltf1/apps/cli
npm link

# Now from anywhere
cd ~/some-other-project
ltf1 auth login
# ✗ Not in monorepo anymore
# → Opens https://ltf1.dev/cli-auth (production)

# Solution: Set environment variable
export LTF_WEB_URL=http://localhost:3000
ltf1 auth login
# ✓ Opens http://localhost:3000/cli-auth
```

### Scenario 3: CLI Development (Working on CLI Code)

```bash
# Set NODE_ENV=development
cd /path/to/ltf1/apps/cli
NODE_ENV=development npm run dev

# Or add to your shell profile
echo 'export NODE_ENV=development' >> ~/.zshrc
source ~/.zshrc

ltf1 auth login
# ✓ Opens http://localhost:3000/cli-auth
```

### Scenario 4: Testing Against Production While Developing

```bash
# Explicitly override to use production
LTF_WEB_URL=https://ltf1.dev ltf1 auth login
# ✓ Opens https://ltf1.dev/cli-auth

# Or set config temporarily
ltf1 config set-web-url https://ltf1.dev
ltf1 auth login

# Reset back to auto-detection
ltf1 config set-web-url http://localhost:3000
```

## Quick Reference

| Scenario               | Command                                            | URL Used                   |
| ---------------------- | -------------------------------------------------- | -------------------------- |
| Working in monorepo    | `ltf1 auth login`                                   | `http://localhost:3000` ✅ |
| CLI installed globally | `ltf1 auth login`                                   | `https://ltf1.dev`         |
| With env variable      | `LTF_WEB_URL=http://localhost:3000 ltf1 auth login` | `http://localhost:3000` ✅ |
| With config set        | `ltf1 config set-web-url http://localhost:3000`     | `http://localhost:3000` ✅ |
| End user (npm install) | `ltf1 auth login`                                   | `https://ltf1.dev`         |

## Recommended Setup for Developers

### Option A: Per-Session (Recommended for Testing)

Add to your shell profile (`~/.zshrc`, `~/.bashrc`, etc.):

```bash
# Only when working on LTF1 project
alias ltf-dev='LTF_WEB_URL=http://localhost:3000 ltf'

# Use it
ltf-dev auth login
ltf-dev projects list
```

### Option B: Persistent Config (Recommended for Daily Work)

Set once and forget:

```bash
ltf1 config set-web-url http://localhost:3000
ltf1 config get-web-url  # Verify
# http://localhost:3000

# Now all commands use localhost
ltf1 auth login
ltf projects list
```

When you want to test production:

```bash
ltf1 config set-web-url https://ltf1.dev
# ... test ...
ltf1 config set-web-url http://localhost:3000  # Switch back
```

### Option C: Use Monorepo Detection (Easiest!)

Just work in the monorepo - no configuration needed!

```bash
cd /path/to/ltf1
ltf1 auth login
# ✓ Automatically uses localhost:3000
```

## Troubleshooting

### "Browser opens to ltf1.dev but I want localhost"

**Problem**: CLI is opening production site instead of local

**Check**:

```bash
# See what URL the CLI is using
ltf1 config get-web-url

# Check if you're in the monorepo
pwd
ls -la | grep -E '(pnpm-workspace|turbo)'
```

**Solution**:

```bash
# Option 1: Set config
ltf1 config set-web-url http://localhost:3000

# Option 2: Use environment variable
export LTF_WEB_URL=http://localhost:3000

# Option 3: Make sure you're in the monorepo directory
cd /path/to/ltf1
```

### "localhost:3000 not responding"

**Problem**: CLI opens localhost but web app isn't running

**Solution**:

```bash
# Start the web app first
npm run dev

# In another terminal
ltf1 auth login
```

### "I'm in the monorepo but it's still using ltf1.dev"

**Check**:

```bash
# Verify monorepo files exist
ls -la pnpm-workspace.yaml turbo.json
```

**If files are missing**:

```bash
# Manually set to localhost
ltf1 config set-web-url http://localhost:3000
```

## Summary

✅ **Working in monorepo**: Automatically uses `localhost:3000` (no config needed!)
✅ **CLI installed globally**: Can set `LTF_WEB_URL` or use config
✅ **End users** (npm install): Automatically uses `https://ltf1.dev`

The CLI is smart enough to detect your environment and do the right thing!
