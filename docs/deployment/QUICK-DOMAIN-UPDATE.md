# Quick Reference: Domain Updates for ltf1.dev

## 🎯 The 5 Critical Services (Update These First!)

### 1. Vercel (Hosting)

- **Add domain**: `ltf1.dev`
- **Set env vars**: `NEXT_PUBLIC_APP_URL`, `LTF_WEB_URL`, redirect URIs
- URL: https://vercel.com/dashboard

### 2. Clerk (Authentication)

- **Add redirect URLs**: `https://ltf1.dev/*`, `https://ltf1.dev/cli-auth`
- **Update home URL**: `https://ltf1.dev`
- URL: https://dashboard.clerk.com

### 3. GitHub App

- **Homepage**: `https://ltf1.dev`
- **Callback**: `https://ltf1.dev/api/auth/github/callback`
- **Webhook**: `https://ltf1.dev/api/github/webhook`
- URL: https://github.com/settings/apps

### 4. DNS (Domain Registrar)

- **Add A record**: `@ → 76.76.21.21`
- **Add CNAME**: `www → cname.vercel-dns.com`
- Or use Vercel nameservers

### 5. Convex (Backend)

- **Update env vars** if any reference your domain
- URL: https://dashboard.convex.dev

---

## 🔌 Integration Services (If You Use Them)

### Slack

- **OAuth redirect**: `https://ltf1.dev/api/slack/callback`
- URL: https://api.slack.com/apps

### GitLab

- **Redirect URI**: `https://ltf1.dev/api/gitlab/callback`
- URL: https://gitlab.com/-/profile/applications

### Google OAuth

- **Authorized origins**: `https://ltf1.dev`
- **Redirect URI**: `https://ltf1.dev/api/auth/google/callback`
- URL: https://console.cloud.google.com

### PostHog

- **Authorized URLs**: `https://ltf1.dev`
- URL: https://app.posthog.com

---

## ✅ Quick Checklist

```
Critical (Must Do):
□ Vercel - domain added
□ Vercel - env vars updated
□ DNS - records configured
□ Clerk - redirect URLs updated
□ GitHub - all URLs updated

Integrations (If Enabled):
□ Slack - OAuth callback updated
□ GitLab - OAuth callback updated
□ Google - OAuth updated
□ PostHog - URLs updated

Testing:
□ DNS propagated (dig ltf1.dev)
□ SSL active (https://ltf1.dev)
□ Auth works (sign in)
□ CLI works (ltf1 auth login)
□ GitHub integration works
□ All other integrations work
```

---

## 🚀 Recommended Order

1. **Vercel** - Add domain and env vars
2. **DNS** - Configure records
3. **Wait** - 15 min to 2 hours for DNS
4. **Clerk** - Update redirect URLs
5. **GitHub** - Update app URLs
6. **Integrations** - Update Slack, GitLab, etc.
7. **Test** - Verify everything works
8. **Monitor** - Check logs for errors

---

## 📋 Environment Variables to Set in Vercel

```bash
NEXT_PUBLIC_APP_URL=https://ltf1.dev
LTF_WEB_URL=https://ltf1.dev
NEXT_PUBLIC_SLACK_REDIRECT_URI=https://ltf1.dev/api/slack/callback
GITLAB_REDIRECT_URI=https://ltf1.dev/api/gitlab/callback
```

Keep all other env vars the same!

---

## 🧪 Test Commands

```bash
# Check DNS
dig ltf1.dev

# Check SSL
curl -I https://ltf1.dev

# Test CLI
ltf1 auth login

# Check auth
open https://ltf1.dev/sign-in
```

---

See **[Full Checklist](./domain-update-checklist.md)** for detailed instructions!
