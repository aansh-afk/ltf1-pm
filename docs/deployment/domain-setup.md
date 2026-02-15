# Domain Setup Guide: ltf1.dev

This guide covers how to configure your LTF1 application to work with your custom domain `ltf1.dev`.

## Overview

The application has been updated to support both development (localhost) and production (ltf1.dev) environments. The system automatically detects which environment you're in based on environment variables.

## Quick Setup

### Development Environment

For local development, no changes are needed. The app defaults to `http://localhost:3000`.

### Production Environment (ltf1.dev)

Set these environment variables in your production environment (e.g., Vercel):

```bash
# App URLs
NEXT_PUBLIC_APP_URL=https://ltf1.dev
LTF_WEB_URL=https://ltf1.dev

# Slack Integration
NEXT_PUBLIC_SLACK_REDIRECT_URI=https://ltf1.dev/api/slack/callback

# GitLab Integration
GITLAB_REDIRECT_URI=https://ltf1.dev/api/gitlab/callback
```

## Detailed Configuration

### 1. Environment Variables

Create or update your `.env` file with the following variables:

#### Required for Production

```bash
# Core App URLs
NEXT_PUBLIC_APP_URL=https://ltf1.dev
LTF_WEB_URL=https://ltf1.dev

# Convex (your production deployment URL)
VITE_CONVEX_URL=https://tangible-butterfly-366.convex.cloud

# Clerk Authentication (production keys)
VITE_CLERK_PUBLISHABLE_KEY=your_production_clerk_key
CLERK_SECRET_KEY=your_production_clerk_secret
```

#### OAuth Integrations

```bash
# Slack Integration
NEXT_PUBLIC_SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_secret
NEXT_PUBLIC_SLACK_REDIRECT_URI=https://ltf1.dev/api/slack/callback

# GitLab Integration
GITLAB_CLIENT_ID=your_gitlab_client_id
GITLAB_CLIENT_SECRET=your_gitlab_secret
GITLAB_REDIRECT_URI=https://ltf1.dev/api/gitlab/callback

# GitHub Integration
GITHUB_APP_ID=your_github_app_id
VITE_GITHUB_APP_SLUG=your_github_app_slug
VITE_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret
```

### 2. Vercel Deployment

If deploying to Vercel:

1. **Set Environment Variables**
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add all the production environment variables listed above

2. **Domain Configuration**
   - Add `ltf1.dev` as a custom domain in Vercel
   - Vercel will provide DNS records to add to your domain registrar

3. **DNS Configuration**
   At your domain registrar (where you bought ltf1.dev), add these DNS records:

   ```
   Type: A
   Name: @
   Value: 76.76.21.21 (Vercel's IP)

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### 3. Third-Party Service Configuration

After deploying to ltf1.dev, update the callback URLs in these services:

#### Clerk (Authentication)

1. Go to Clerk Dashboard
2. Navigate to your application
3. Under "Allowed redirect URLs", add:
   - `https://ltf1.dev/sign-in`
   - `https://ltf1.dev/cli-auth`
   - `https://ltf1.dev/*` (for catch-all)

#### Slack Integration

1. Go to Slack API Dashboard
2. Navigate to your app
3. Under "OAuth & Permissions", update "Redirect URLs":
   - Add `https://ltf1.dev/api/slack/callback`
   - Remove or keep localhost for development

#### GitLab Integration

1. Go to GitLab Application Settings
2. Update the "Redirect URI" to:
   - `https://ltf1.dev/api/gitlab/callback`

#### GitHub App

1. Go to GitHub App Settings
2. Update these URLs:
   - Homepage URL: `https://ltf1.dev`
   - Callback URL: `https://ltf1.dev/api/auth/github/callback`
   - Webhook URL: `https://ltf1.dev/api/github/webhook`

### 4. CLI Configuration

The CLI will automatically use the correct domain based on your `CONVEX_URL`:

- If `CONVEX_URL` contains your production Convex deployment, it uses `https://ltf1.dev`
- Otherwise, it defaults to `http://localhost:3000`

You can also manually override by setting:

```bash
export LTF_WEB_URL=https://ltf1.dev
```

## Automatic Domain Detection

The application includes smart domain detection:

### CLI (`apps/cli/src/lib/auth.ts`)

```typescript
// Auto-detects based on CONVEX_URL
const WEB_APP_URL = (() => {
  const raw = process.env.LTF_WEB_URL || process.env.WEB_APP_URL;

  if (raw) {
    return validateUrl(raw);
  }

  // If CONVEX_URL contains production deployment, use ltf1.dev
  const convexUrl = process.env.CONVEX_URL || "";
  if (convexUrl.includes("tangible-butterfly-366.convex.cloud")) {
    return "https://ltf1.dev";
  }

  // Default to localhost for development
  return "http://localhost:3000";
})();
```

### Web App (`apps/web/src/lib/integrations/slack.ts`)

```typescript
// Auto-detects from window.location.origin
export const SLACK_REDIRECT_URI =
  process.env.NEXT_PUBLIC_SLACK_REDIRECT_URI ||
  (typeof window !== "undefined" && window.location.origin
    ? `${window.location.origin}/api/slack/callback`
    : "http://localhost:3000/api/slack/callback");
```

## Security Considerations

### CLI Auth Callback Validation

The CLI auth page (`apps/web/src/pages/CLIAuthPage.tsx`) validates callback URLs to prevent security issues:

```typescript
const allowedHosts = ["localhost", "127.0.0.1", "ltf1.dev"];
```

Only these hosts are allowed for CLI authentication callbacks.

### HTTPS in Production

Always use HTTPS in production:

- `https://ltf1.dev` ✅
- `http://ltf1.dev` ❌

Vercel automatically provisions SSL certificates for custom domains.

## Testing the Setup

### 1. Test Web Application

```bash
# Visit your domain
open https://ltf1.dev

# Check that authentication works
# Check that integrations (Slack, GitLab, GitHub) work
```

### 2. Test CLI Authentication

```bash
# From your CLI
ltf auth login

# This should:
# 1. Open browser to https://ltf1.dev/cli-auth
# 2. Authenticate via Clerk
# 3. Redirect back to CLI with token
```

### 3. Test OAuth Flows

Test each integration:

1. **Slack**: Go to Settings → Integrations → Connect Slack
2. **GitLab**: Go to Settings → Integrations → Connect GitLab
3. **GitHub**: Go to Settings → Integrations → Connect GitHub

Each should redirect to the respective OAuth provider and back to `https://ltf1.dev`.

## Troubleshooting

### Issue: CLI still using localhost

**Solution**: Set the environment variable explicitly:

```bash
export LTF_WEB_URL=https://ltf1.dev
```

### Issue: OAuth redirects failing

**Solution**: Verify these settings:

1. Check environment variables are set correctly in Vercel
2. Verify callback URLs in third-party services (Slack, GitLab, GitHub, Clerk)
3. Check browser console for CORS errors

### Issue: Mixed content warnings

**Solution**: Ensure all URLs use HTTPS in production:

```bash
# Check your .env
grep -E "(URL|URI)" .env

# All should be https:// in production
```

### Issue: Domain not resolving

**Solution**: Verify DNS configuration:

```bash
# Check DNS records
dig ltf1.dev
dig www.ltf1.dev

# Should point to Vercel's servers
```

## Migration Checklist

Use this checklist when migrating from localhost to ltf1.dev:

- [ ] Domain purchased and DNS configured
- [ ] Vercel project created and domain added
- [ ] Environment variables set in Vercel
- [ ] Clerk redirect URLs updated
- [ ] Slack OAuth redirect URI updated
- [ ] GitLab OAuth redirect URI updated
- [ ] GitHub App URLs updated
- [ ] Test web application at https://ltf1.dev
- [ ] Test CLI authentication flow
- [ ] Test all OAuth integrations
- [ ] Monitor for errors in production logs

## Additional Resources

- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)
- [Clerk Production Setup](../setup/clerk-production-setup.md)
- [GitHub Integration Setup](../integrations/github-integration-complete.md)
- [Deployment Guide](./production-guide.md)

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify environment variables are set correctly
4. Ensure DNS propagation is complete (can take up to 48 hours)
