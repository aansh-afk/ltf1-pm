# GitHub Integration - Complete Setup Guide (2025)

## ✅ What's Been Implemented

### 1. **OAuth Authentication Flow**
- ✅ Proper "Connect to GitHub" button component
- ✅ OAuth state management for CSRF protection
- ✅ OAuth callback handler page
- ✅ Secure token storage in Convex
- ✅ User profile integration

### 2. **Backend Components**
- ✅ `convex/integrations/github/oauth.ts` - OAuth flow management
- ✅ `convex/integrations/github/actions.ts` - GitHub API actions
- ✅ `convex/schema.ts` - Database tables for GitHub data
- ✅ Token encryption and secure storage

### 3. **Frontend Components**
- ✅ `GitHubConnectButton.tsx` - Reusable OAuth button
- ✅ `GitHubCallbackPage.tsx` - OAuth callback handler
- ✅ `GitHubProfileSection.tsx` - Profile integration
- ✅ Routing configuration in `App.tsx`

## 🚀 Quick Setup Instructions

### Step 1: Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **"OAuth Apps"** → **"New OAuth App"**
3. Fill in the following:

```
Application name: LTF1 Project Manager
Homepage URL: http://localhost:3000
Authorization callback URL: http://localhost:3000/api/auth/github/callback
Description: Modern project management with GitHub integration
```

4. Click **"Register application"**
5. Save your **Client ID**
6. Click **"Generate a new client secret"**
7. Save your **Client Secret** (you won't see it again!)

### Step 2: Configure Environment Variables

Add these to your `.env` file:

```bash
# GitHub OAuth (REQUIRED)
VITE_GITHUB_CLIENT_ID=Ov23li...your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
VITE_GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/github/callback
```

For production, update the redirect URI:
```bash
VITE_GITHUB_REDIRECT_URI=https://yourdomain.com/api/auth/github/callback
```

### Step 3: Deploy Convex Schema

Run the following to update your Convex database:

```bash
npx convex dev
```

This will create the required tables:
- `githubOAuthStates` - OAuth state management
- `githubConnections` - User GitHub connections

### Step 4: Test the Integration

1. Start your development server:
```bash
npm run dev
```

2. Navigate to your profile page
3. Click the **"Connect GitHub"** button
4. Authorize the app on GitHub
5. You'll be redirected back and see your GitHub username

## 🔧 How It Works

### OAuth Flow

1. **User clicks "Connect GitHub"**
   - Creates secure state token in database
   - Redirects to GitHub OAuth page

2. **GitHub Authorization**
   - User authorizes your app
   - GitHub redirects to `/api/auth/github/callback`

3. **Callback Processing**
   - Verifies state token (CSRF protection)
   - Exchanges code for access token
   - Fetches user GitHub profile
   - Stores connection in database

4. **API Access**
   - Access token stored securely in Convex
   - Can make authenticated API calls
   - Token never exposed to frontend

### Security Features

- ✅ CSRF protection via state tokens
- ✅ Tokens expire after 10 minutes
- ✅ Access tokens encrypted in database
- ✅ Tokens never sent to client
- ✅ Secure HTTP-only session management

## 📊 Available Features

### Currently Working
- ✅ OAuth authentication flow
- ✅ User profile connection
- ✅ GitHub username display
- ✅ Connection/disconnection
- ✅ Basic GitHub stats

### Ready to Implement
With the OAuth flow working, you can now:

1. **Fetch Repositories**
```typescript
const repos = await fetchGitHubRepositories();
```

2. **Get User Activity**
```typescript
const activity = await fetchGitHubActivity({ username });
```

3. **Access GitHub API**
```typescript
// Any GitHub API endpoint
const response = await fetch('https://api.github.com/user/repos', {
  headers: {
    Authorization: `Bearer ${connection.accessToken}`,
  }
});
```

## 🐛 Troubleshooting

### "GitHub OAuth is not configured"
- Make sure `VITE_GITHUB_CLIENT_ID` is set in `.env`
- Restart the dev server after adding env variables

### "Invalid OAuth state"
- OAuth states expire after 10 minutes
- Try connecting again

### "Failed to exchange code for token"
- Check `GITHUB_CLIENT_SECRET` is correct
- Ensure callback URL matches exactly

### "User not found"
- Make sure you're logged in with Clerk
- Check that user sync completed

## 🎯 Next Steps

### Immediate Enhancements
1. **Add Repository Fetching**
   - Display user's repositories
   - Show language statistics
   - Track stars and forks

2. **Activity Timeline**
   - Show recent commits
   - Display pull requests
   - Track issues

3. **Project Integration**
   - Link repositories to projects
   - Auto-sync commits to tasks
   - Track PR reviews

### Advanced Features
1. **GitHub App** (optional)
   - Webhooks for real-time updates
   - Fine-grained permissions
   - Organization support

2. **GitHub Actions Integration**
   - Monitor CI/CD status
   - Deploy tracking
   - Build notifications

## 📝 Environment Variables Reference

```bash
# Required for basic GitHub integration
VITE_GITHUB_CLIENT_ID=        # Your OAuth App Client ID
GITHUB_CLIENT_SECRET=          # Your OAuth App Client Secret  
VITE_GITHUB_REDIRECT_URI=     # OAuth callback URL

# Optional for GitHub App
VITE_GITHUB_APP_SLUG=         # GitHub App slug (e.g., 'ltf1-integration')
GITHUB_APP_ID=                # GitHub App ID
GITHUB_WEBHOOK_SECRET=        # Webhook secret for verification
GITHUB_PRIVATE_KEY=           # GitHub App private key (.pem contents)
```

## 🔒 Production Checklist

Before deploying to production:

- [ ] Update OAuth callback URL in GitHub settings
- [ ] Update `VITE_GITHUB_REDIRECT_URI` to production URL
- [ ] Use environment variables service (Vercel, Netlify, etc.)
- [ ] Enable HTTPS for OAuth redirect
- [ ] Set up proper error logging
- [ ] Implement rate limiting
- [ ] Add token refresh logic
- [ ] Monitor API usage

## 💡 Tips

1. **Rate Limits**
   - Authenticated: 5,000 requests/hour
   - Use conditional requests when possible
   - Cache API responses

2. **Scopes**
   - Start with minimal scopes
   - Current: `read:user`, `user:email`, `repo`
   - Add more as needed

3. **Testing**
   - Use GitHub's OAuth test mode
   - Create separate dev OAuth app
   - Test with multiple accounts

---

**Status**: ✅ GitHub OAuth integration is fully implemented and ready to use!

**Note**: The app currently uses the simpler OAuth App approach. For production with multiple users, consider upgrading to a GitHub App for better security and features.