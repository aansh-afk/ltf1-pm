# Domain Update Checklist for ltf1.dev

This is your complete checklist of **all external services** that need to be updated with your new domain `ltf1.dev`.

## 🎯 Critical Services (Must Update)

### 1. ✅ Vercel (Hosting Platform)

**Where**: https://vercel.com/dashboard

**What to do**:

1. Go to your project settings
2. Navigate to "Domains"
3. Click "Add Domain"
4. Enter `ltf1.dev`
5. Add `www.ltf1.dev` (optional)
6. Follow Vercel's DNS configuration instructions

**Environment Variables** (Settings → Environment Variables):

```bash
NEXT_PUBLIC_APP_URL=https://ltf1.dev
LTF_WEB_URL=https://ltf1.dev
NEXT_PUBLIC_SLACK_REDIRECT_URI=https://ltf1.dev/api/slack/callback
GITLAB_REDIRECT_URI=https://ltf1.dev/api/gitlab/callback
```

**Verify**: Visit https://ltf1.dev after DNS propagates

---

### 2. ✅ Clerk (Authentication)

**Where**: https://dashboard.clerk.com

**What to do**:

1. Select your application
2. Go to "Paths" or "Settings"
3. Update **Allowed redirect URLs**:
   - Add: `https://ltf1.dev/*`
   - Add: `https://ltf1.dev/sign-in`
   - Add: `https://ltf1.dev/sign-up`
   - Add: `https://ltf1.dev/cli-auth`
   - Keep: `http://localhost:3000/*` (for development)
4. Update **Allowed origins** (CORS):
   - Add: `https://ltf1.dev`
   - Keep: `http://localhost:3000` (for development)

5. Update **Home URL**:
   - Change to: `https://ltf1.dev`

6. Check **JWT Templates** → Convex:
   - Verify the template exists
   - Update issuer if needed

**Verify**: Try signing in at https://ltf1.dev

---

### 3. ✅ GitHub App

**Where**: https://github.com/settings/apps/YOUR_APP_NAME

**What to do**:

1. Go to your GitHub App settings
2. Update these fields:
   - **Homepage URL**: `https://ltf1.dev`
   - **Callback URL**: `https://ltf1.dev/api/auth/github/callback`
   - **Webhook URL**: `https://ltf1.dev/api/github/webhook`
   - **Setup URL** (if used): `https://ltf1.dev/setup/github`

3. Keep localhost URLs for development:
   - `http://localhost:3000/api/auth/github/callback`
   - `http://localhost:3000/api/github/webhook`

**Verify**:

- Try GitHub OAuth flow
- Check webhook deliveries

---

### 4. ✅ Convex (Backend)

**Where**: https://dashboard.convex.dev

**What to do**:

1. Go to your production deployment
2. Navigate to "Settings"
3. Update **Environment Variables**:

   ```bash
   # Update any that reference your domain
   CLERK_WEBHOOK_URL=https://ltf1.dev/clerk-webhook
   ```

4. Update **CORS Origins** (if configured):
   - Add: `https://ltf1.dev`
   - Keep: `http://localhost:3000`

5. Check **Webhook URLs** (if you have any configured)

**Verify**: Check Convex dashboard logs for connections from ltf1.dev

---

## 🔌 Integration Services (If Enabled)

### 5. ✅ Slack Integration

**Where**: https://api.slack.com/apps

**What to do**:

1. Select your Slack app
2. Go to "OAuth & Permissions"
3. Update **Redirect URLs**:
   - Add: `https://ltf1.dev/api/slack/callback`
   - Keep: `http://localhost:3000/api/slack/callback` (for development)

4. Go to "Interactivity & Shortcuts"
5. Update **Request URL** (if used):
   - Change to: `https://ltf1.dev/api/slack/interactions`

6. Go to "Event Subscriptions"
7. Update **Request URL** (if used):
   - Change to: `https://ltf1.dev/api/slack/events`

**Verify**: Try connecting Slack integration

---

### 6. ✅ GitLab Integration

**Where**: https://gitlab.com/-/profile/applications

**What to do**:

1. Find your LTF1 application
2. Edit the application
3. Update **Redirect URI**:
   - Change to: `https://ltf1.dev/api/gitlab/callback`
   - Or add it (keep localhost for development)

**Verify**: Try connecting GitLab integration

---

### 7. ✅ Google OAuth / Calendar

**Where**: https://console.cloud.google.com

**What to do**:

1. Go to "APIs & Services" → "Credentials"
2. Find your OAuth 2.0 Client ID
3. Update **Authorized JavaScript origins**:
   - Add: `https://ltf1.dev`
   - Keep: `http://localhost:3000`

4. Update **Authorized redirect URIs**:
   - Add: `https://ltf1.dev/api/auth/google/callback`
   - Keep: `http://localhost:3000/api/auth/google/callback`

**Verify**: Try Google Calendar integration

---

## 📊 Analytics & Monitoring (Optional)

### 8. ✅ PostHog (Analytics)

**Where**: https://app.posthog.com

**What to do**:

1. Go to Project Settings
2. Update **Authorized URLs**:
   - Add: `https://ltf1.dev`
   - Keep: `http://localhost:3000`

3. Update **CORS origins** if restricted:
   - Add: `https://ltf1.dev`

4. No action needed if using `VITE_POSTHOG_HOST` and `VITE_POSTHOG_KEY` (already in Vercel env vars)

**Verify**: Check PostHog dashboard for events from ltf1.dev

---

## 🌐 DNS & Domain Registrar

### 9. ✅ Domain Registrar (Where you bought ltf1.dev)

**Where**: Your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)

**What to do**:

**Option A: Vercel Nameservers (Recommended)**

1. In Vercel, copy the nameserver addresses
2. Go to your domain registrar
3. Update nameservers to Vercel's

**Option B: DNS Records**

1. Add A record:

   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   TTL: 3600
   ```

2. Add CNAME record:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: 3600
   ```

**Verify**:

```bash
dig ltf1.dev
# Should point to Vercel's IP

nslookup ltf1.dev
```

---

## 📝 Documentation & Links

### 10. ✅ README & Documentation

**Where**: Your GitHub repository

**What to do**:

1. Update links in `README.md`
2. Update links in documentation
3. Update links in code comments
4. Update example URLs

**Files to check**:

```bash
# Search for localhost references
grep -r "localhost:3000" docs/
grep -r "localhost:3000" README.md

# Search for any hardcoded domains
grep -r "example.com" docs/
```

---

## 🔒 Security & API Keys

### 11. ✅ CORS & Security Headers

**Where**: Your application code

**What to do**:

1. Check `vercel.json` for CORS settings
2. Check any middleware for origin restrictions
3. Update Content Security Policy if used

**Example `vercel.json`**:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://ltf1.dev"
        }
      ]
    }
  ]
}
```

---

## 🧪 Testing Services

### 12. ✅ Stripe (If using payments)

**Where**: https://dashboard.stripe.com

**What to do**:

1. Go to "Developers" → "Webhooks"
2. Update webhook endpoint:
   - Change to: `https://ltf1.dev/api/stripe/webhook`

3. Go to "Settings" → "Branding"
4. Update **Business website**: `https://ltf1.dev`

---

### 13. ✅ Sentry (If using error tracking)

**Where**: https://sentry.io

**What to do**:

1. Go to Project Settings
2. Update **Allowed Domains**:
   - Add: `ltf1.dev`

---

## 📋 Complete Checklist

Use this to track your progress:

- [ ] **Vercel**: Domain added and environment variables updated
- [ ] **DNS**: Records configured and propagated (wait 24-48 hours)
- [ ] **Clerk**: Redirect URLs and origins updated
- [ ] **GitHub App**: All URLs updated
- [ ] **Convex**: Environment variables updated
- [ ] **Slack**: OAuth redirect URLs updated
- [ ] **GitLab**: OAuth redirect URI updated
- [ ] **Google OAuth**: Authorized origins and redirect URIs updated
- [ ] **PostHog**: Authorized URLs updated (if restricted)
- [ ] **README/Docs**: All documentation updated
- [ ] **Test Login**: Auth flow works at ltf1.dev
- [ ] **Test CLI Auth**: `ltf1 auth login` works
- [ ] **Test GitHub Integration**: OAuth and webhooks work
- [ ] **Test Slack Integration**: OAuth works
- [ ] **Test GitLab Integration**: OAuth works
- [ ] **Monitor Errors**: Check logs for any issues

---

## 🚀 Step-by-Step Deployment

### Phase 1: Setup (Do First)

1. ✅ Add domain in Vercel
2. ✅ Configure DNS at registrar
3. ✅ Wait for DNS propagation (use https://dnschecker.org)
4. ✅ Verify SSL certificate is active

### Phase 2: Update Services (After DNS Works)

5. ✅ Update Clerk
6. ✅ Update GitHub App
7. ✅ Update Slack
8. ✅ Update GitLab
9. ✅ Update Google OAuth
10. ✅ Update Convex environment variables

### Phase 3: Update Code (If Needed)

11. ✅ Update Vercel environment variables
12. ✅ Redeploy application

### Phase 4: Testing

13. ✅ Test authentication flow
14. ✅ Test CLI authentication
15. ✅ Test all integrations
16. ✅ Monitor error logs
17. ✅ Check analytics

---

## 🔍 Verification Commands

```bash
# Check DNS propagation
dig ltf1.dev
nslookup ltf1.dev

# Check SSL certificate
curl -I https://ltf1.dev

# Test authentication
curl https://ltf1.dev/api/health

# Test CLI
ltf1 auth login
ltf1 auth status

# Check all redirects work
curl -I https://ltf1.dev/sign-in
curl -I https://ltf1.dev/cli-auth
```

---

## ⚠️ Important Notes

1. **Keep localhost for development**
   - Don't remove `localhost:3000` URLs
   - Keep them for local development

2. **DNS propagation takes time**
   - Usually 15 minutes to 2 hours
   - Can take up to 48 hours globally
   - Use https://dnschecker.org to verify

3. **SSL certificate**
   - Vercel automatically provisions SSL
   - Takes a few minutes after domain is added
   - Must wait for DNS to propagate first

4. **Test before going live**
   - Test all flows in production
   - Check error monitoring
   - Have rollback plan ready

5. **Communication**
   - Notify users of domain change
   - Update any marketing materials
   - Update social media links

---

## 🆘 Troubleshooting

### Domain not accessible

- Check DNS with `dig ltf1.dev`
- Verify Vercel shows domain as active
- Wait longer for DNS propagation

### Authentication failing

- Check Clerk allowed redirect URLs
- Verify environment variables in Vercel
- Check browser console for CORS errors

### Integrations not working

- Verify callback URLs in each service
- Check webhook URLs
- Test each integration individually

### CLI not working

- Verify `LTF_WEB_URL` is set correctly in Vercel
- Test CLI with: `LTF_WEB_URL=https://ltf1.dev ltf1 auth login`
- Check CLIAuthPage callback validation

---

## 📞 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check Clerk dashboard logs
3. Check Convex function logs
4. Check browser console
5. Check network tab for failed requests

Most issues are due to:

- DNS not fully propagated
- Missing environment variables
- Callback URLs not updated
- CORS configuration
