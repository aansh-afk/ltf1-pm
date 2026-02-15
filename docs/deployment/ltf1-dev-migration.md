# ltf1.dev Domain Migration - Quick Reference

## Summary of Changes

All localhost references have been updated to support your new domain `ltf1.dev`. The app now automatically detects whether to use localhost (development) or ltf1.dev (production) based on environment variables.

## Files Modified

1. **`.env.example`** - Added new environment variables for domain configuration
2. **`apps/cli/src/lib/auth.ts`** - Smart domain detection for CLI authentication
3. **`apps/web/src/lib/integrations/slack.ts`** - Dynamic Slack redirect URI
4. **`convex/integrations/gitlab/oauth.ts`** - Configurable GitLab redirect URI
5. **`apps/web/src/pages/CLIAuthPage.tsx`** - Added ltf1.dev to allowed callback hosts

## Quick Setup for Production

### 1. Set Environment Variables

In Vercel (or your deployment platform), set:

```bash
NEXT_PUBLIC_APP_URL=https://ltf1.dev
LTF_WEB_URL=https://ltf1.dev
NEXT_PUBLIC_SLACK_REDIRECT_URI=https://ltf1.dev/api/slack/callback
GITLAB_REDIRECT_URI=https://ltf1.dev/api/gitlab/callback
```

### 2. Update OAuth Callback URLs

Update these URLs in the respective service dashboards:

**Clerk**

- Add `https://ltf1.dev/*` to allowed redirect URLs

**Slack**

- OAuth Redirect URL: `https://ltf1.dev/api/slack/callback`

**GitLab**

- Redirect URI: `https://ltf1.dev/api/gitlab/callback`

**GitHub**

- Homepage URL: `https://ltf1.dev`
- Callback URL: `https://ltf1.dev/api/auth/github/callback`
- Webhook URL: `https://ltf1.dev/api/github/webhook`

### 3. Configure DNS

At your domain registrar, point ltf1.dev to Vercel:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## How It Works

### Automatic Detection

**CLI**: Detects production environment based on `CONVEX_URL`:

```typescript
if (convexUrl.includes("tangible-butterfly-366.convex.cloud")) {
  return "https://ltf1.dev";
}
```

**Web App**: Uses `window.location.origin` to auto-detect the current domain.

### Fallback Behavior

- **Development**: Defaults to `http://localhost:3000`
- **Production**: Uses `https://ltf1.dev`
- **Override**: Set `LTF_WEB_URL` or `NEXT_PUBLIC_APP_URL` to force a specific URL

## Testing

1. **Local Development** - No changes needed, works as before
2. **Production** - Deploy to Vercel with environment variables set
3. **CLI** - Run `ltf auth login` to test authentication flow

## Documentation

See full setup guide: `docs/deployment/domain-setup.md`

## Changes by Component

| Component          | What Changed                              | Impact                                  |
| ------------------ | ----------------------------------------- | --------------------------------------- |
| CLI Auth           | Auto-detects domain based on CONVEX_URL   | No manual configuration needed          |
| Slack Integration  | Dynamic redirect URI from window.location | Works in any environment                |
| GitLab OAuth       | Uses GITLAB_REDIRECT_URI env variable     | Set in production env vars              |
| CLI Auth Page      | Whitelists ltf1.dev for callbacks         | Allows CLI to authenticate via ltf1.dev |
| Environment Config | Added domain-specific variables           | Clear separation of dev/prod            |

## Verification Checklist

- [ ] Environment variables set in Vercel
- [ ] DNS configured and propagated
- [ ] Clerk redirect URLs updated
- [ ] Slack OAuth callback updated
- [ ] GitLab OAuth callback updated
- [ ] GitHub App URLs updated
- [ ] Test login at https://ltf1.dev
- [ ] Test CLI authentication
- [ ] Test OAuth flows (Slack, GitLab, GitHub)

## Next Steps

1. Deploy your app to Vercel
2. Add ltf1.dev as a custom domain in Vercel
3. Set all environment variables in Vercel dashboard
4. Update OAuth callbacks in third-party services
5. Configure DNS at your domain registrar
6. Wait for DNS propagation (up to 48 hours)
7. Test all flows

---

**Note**: The changes maintain backward compatibility with localhost for development. Your local development environment will continue to work without any configuration changes.
