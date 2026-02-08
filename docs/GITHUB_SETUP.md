# GitHub App Setup Guide for LTF1

Everything runs through **one GitHub App** — it handles OAuth (user login), webhooks (push/PR events), and API access (stats syncing). No separate OAuth App needed.

---

## Step 1: Create the GitHub App

1. Go to **https://github.com/settings/apps/new**
2. Fill in the form:

| Field | Value |
|-------|-------|
| **GitHub App name** | `ltf1-github` (or any unique name) |
| **Homepage URL** | `https://your-domain.com` (or `http://localhost:5173` for dev) |
| **Callback URL** | `http://localhost:5173/api/auth/github/callback` |
| **Setup URL** (optional) | leave blank |
| **Webhook URL** | `https://tangible-butterfly-366.convex.site/api/github/webhook` |
| **Webhook secret** | Generate one (see step 2) |

3. **Permissions** (Repository):

| Permission | Access |
|------------|--------|
| Contents | Read-only |
| Issues | Read & write |
| Metadata | Read-only |
| Pull requests | Read & write |

4. **Permissions** (Account):

| Permission | Access |
|------------|--------|
| Email addresses | Read-only |

5. **Subscribe to events** (check these boxes):

- [x] Issues
- [x] Issue comment
- [x] Pull request
- [x] Push

6. **Where can this GitHub App be installed?** → "Any account" (or "Only on this account" for testing)

7. Click **Create GitHub App**

---

## Step 2: Generate a Webhook Secret

Run this in your terminal to generate a random secret:

```bash
openssl rand -hex 32
```

Copy the output. You'll use this as `GITHUB_WEBHOOK_SECRET` and also paste it into the GitHub App's "Webhook secret" field.

---

## Step 3: Collect Your Credentials

After creating the app, you'll be on the app settings page. Collect these values:

### From the app settings page (General tab):

| What to find | Where it is | Env variable |
|--------------|-------------|--------------|
| **App ID** | Near the top, under "About" | `GITHUB_APP_ID` |
| **App slug** | In the URL: `github.com/settings/apps/YOUR-SLUG` | `VITE_GITHUB_APP_SLUG` |
| **Client ID** | Under "About", labeled "Client ID" (starts with `Iv`) | `VITE_GITHUB_CLIENT_ID` |

### Generate a Client Secret:

1. Scroll to **"Client secrets"** section
2. Click **"Generate a new client secret"**
3. Copy it immediately (you won't see it again)
4. This is your `GITHUB_CLIENT_SECRET`

### Generate a Private Key:

1. Scroll to the bottom — **"Private keys"** section
2. Click **"Generate a private key"**
3. A `.pem` file will download
4. Open the `.pem` file in a text editor
5. Copy the entire contents (including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`)
6. This is your `GITHUB_APP_PRIVATE_KEY`

---

## Step 4: Fill In Your Environment Variables

Open `.env.local` and fill in the GitHub section:

```bash
GITHUB_APP_ID=<number from About section>
VITE_GITHUB_APP_SLUG=<slug from URL>
VITE_GITHUB_CLIENT_ID=<Client ID starting with Iv>
GITHUB_CLIENT_SECRET=<the secret you generated>
GITHUB_WEBHOOK_SECRET=<the hex string from step 2>
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
<paste your entire private key content here>
-----END RSA PRIVATE KEY-----"
```

**Important**: The private key MUST be wrapped in double quotes in the `.env.local` file.

---

## Step 5: Set Convex Environment Variables

The backend runs on Convex servers, so these same values need to be set there too.

### Option A: Via Convex Dashboard
1. Go to https://dashboard.convex.dev
2. Select your project (`iceberg-l`)
3. Go to **Settings** > **Environment Variables**
4. Add each of these:

| Key | Value |
|-----|-------|
| `GITHUB_APP_ID` | Same as .env.local |
| `GITHUB_APP_PRIVATE_KEY` | Full private key including BEGIN/END lines |
| `GITHUB_CLIENT_SECRET` | Same as .env.local |
| `GITHUB_WEBHOOK_SECRET` | Same as .env.local |

**Note**: `VITE_*` variables are frontend-only (bundled by Vite) — they do NOT need to be in Convex.

### Option B: Via CLI
```bash
npx convex env set GITHUB_APP_ID <value>
npx convex env set GITHUB_CLIENT_SECRET <value>
npx convex env set GITHUB_WEBHOOK_SECRET <value>
npx convex env set GITHUB_APP_PRIVATE_KEY -- "$(cat path/to/your-private-key.pem)"
```

---

## Step 6: Install the App on Your Repos

1. Go to `https://github.com/apps/YOUR-APP-SLUG/installations/new`
2. Choose the GitHub account/org where your repos live
3. Select **"All repositories"** or pick specific ones
4. Click **Install**

This creates an "installation" that gives LTF1 webhook access and API tokens for those repos.

---

## Step 7: Verify It Works

1. Start the app: `cd apps/web && pnpm dev`
2. Go to your profile page and click **Connect GitHub**
3. Authorize the OAuth flow
4. Go to Settings > GitHub — you should see "CONNECTED"
5. Push a commit to a connected repo — check the Convex dashboard logs for webhook activity

---

## Checklist

- [ ] GitHub App created
- [ ] Webhook secret generated and set in both GitHub App settings AND env vars
- [ ] Client secret generated
- [ ] Private key generated and downloaded
- [ ] All 6 env vars filled in `.env.local`
- [ ] 4 server-side env vars set in Convex dashboard
- [ ] App installed on at least one GitHub account/org
- [ ] OAuth flow tested (Connect GitHub button works)
- [ ] Webhook verified (push event shows in Convex logs)

---

## Env Variable Quick Reference

| Variable | Where it's used | Example format |
|----------|----------------|----------------|
| `GITHUB_APP_ID` | Convex backend (installation tokens) | `123456` |
| `VITE_GITHUB_APP_SLUG` | Frontend (install URLs) | `ltf1-github` |
| `VITE_GITHUB_CLIENT_ID` | Frontend + backend (OAuth) | `Iv23liABCDEF...` |
| `GITHUB_CLIENT_SECRET` | Convex backend (OAuth token exchange) | `abc123def456...` |
| `GITHUB_WEBHOOK_SECRET` | Convex backend (verify webhook signatures) | `64-char hex string` |
| `GITHUB_APP_PRIVATE_KEY` | Convex backend (JWT for installation tokens) | Full PEM file content |
