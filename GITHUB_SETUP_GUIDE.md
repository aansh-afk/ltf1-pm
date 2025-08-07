# GitHub Integration Setup Guide

## Current Status (January 2025)
The GitHub integration is **not currently working** because:
1. ❌ No GitHub OAuth App is configured
2. ❌ No GitHub App is created and configured
3. ❌ Environment variables are missing
4. ❌ OAuth flow is not implemented (using simple prompt instead)
5. ❌ No proper authentication endpoints

## Required Setup Steps

### Option 1: GitHub OAuth App (Simpler, Recommended for MVP)

#### Step 1: Create GitHub OAuth App
1. Go to https://github.com/settings/developers
2. Click "OAuth Apps" → "New OAuth App"
3. Fill in:
   - **Application name**: LTF1 Project Manager
   - **Homepage URL**: http://localhost:3000 (or your production URL)
   - **Authorization callback URL**: http://localhost:3000/api/auth/github/callback
   - **Application description**: Task and project management system with GitHub integration
4. Click "Register application"
5. Save the **Client ID** and generate a **Client Secret**

#### Step 2: Configure Environment Variables
Add to `.env`:
```bash
# GitHub OAuth
VITE_GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
VITE_GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/github/callback
```

### Option 2: GitHub App (More Complex, Better for Production)

#### Step 1: Create GitHub App
1. Go to https://github.com/settings/apps
2. Click "New GitHub App"
3. Fill in:
   - **GitHub App name**: LTF1-Integration
   - **Homepage URL**: http://localhost:3000
   - **Callback URL**: http://localhost:3000/api/auth/github/callback
   - **Setup URL**: http://localhost:3000/github/setup (optional)
   - **Webhook URL**: https://your-domain.com/api/webhooks/github
   - **Webhook secret**: Generate a secure random string

#### Permissions Required:
- **Repository permissions**:
  - Contents: Read
  - Issues: Read & Write
  - Pull requests: Read & Write
  - Actions: Read
  - Commit statuses: Read & Write
  - Metadata: Read

- **Account permissions**:
  - Email addresses: Read
  - Profile: Read

#### Events to Subscribe:
- Pull request
- Push
- Issues
- Issue comment
- Pull request review
- Pull request review comment

#### Step 2: Generate Private Key
1. After creating the app, scroll to "Private keys"
2. Click "Generate a private key"
3. Save the downloaded `.pem` file

#### Step 3: Configure Environment Variables
```bash
# GitHub App
GITHUB_APP_ID=your_app_id
GITHUB_APP_SLUG=ltf1-integration
GITHUB_WEBHOOK_SECRET=your_webhook_secret
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
...your private key content...
-----END RSA PRIVATE KEY-----"
VITE_GITHUB_APP_SLUG=ltf1-integration
```

## Implementation Requirements

### Backend (Convex)

1. **OAuth Flow Handler** (`convex/integrations/github/oauth.ts`):
```typescript
// Handle OAuth redirect
export const handleOAuthCallback = internalMutation({
  args: {
    code: v.string(),
    state: v.string(),
  },
  handler: async (ctx, args) => {
    // Exchange code for access token
    // Store token securely
    // Link GitHub account to user
  }
});
```

2. **Token Management**:
- Store access tokens securely
- Implement token refresh if using GitHub App
- Handle token expiration

### Frontend

1. **OAuth Initiation Component**:
```typescript
const initiateGitHubOAuth = () => {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI;
  const scope = 'read:user user:email repo';
  
  window.location.href = 
    `https://github.com/login/oauth/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `scope=${scope}&` +
    `state=${generateSecureState()}`;
};
```

2. **Callback Handler Route**:
- Create `/api/auth/github/callback` route
- Handle OAuth callback
- Exchange code for token
- Store user data

## Testing Checklist

### Basic Authentication
- [ ] User can click "Connect GitHub" button
- [ ] User is redirected to GitHub OAuth page
- [ ] User can authorize the app
- [ ] User is redirected back with token
- [ ] GitHub username is displayed
- [ ] Token is stored securely

### Data Fetching
- [ ] User's repositories are fetched
- [ ] Pull requests are displayed
- [ ] Commits are tracked
- [ ] Issues are synced
- [ ] Activity timeline works

### Webhooks (GitHub App only)
- [ ] Webhook endpoint receives events
- [ ] Events are verified with secret
- [ ] Data updates in real-time
- [ ] Activity feed updates

## Current Code Issues to Fix

1. **GitHubProfileSection.tsx**:
   - Replace `prompt()` with proper OAuth flow
   - Add loading states
   - Handle errors properly

2. **GitHubSettings.tsx**:
   - Implement disconnect functionality
   - Show connection status
   - Display scopes/permissions

3. **Backend Integration**:
   - Implement OAuth callback handler
   - Add token storage
   - Create API proxy for GitHub requests

## Security Considerations

1. **Never expose**:
   - Client Secret
   - Private Keys
   - Access Tokens
   - Webhook Secrets

2. **Always validate**:
   - OAuth state parameter
   - Webhook signatures
   - Token scopes
   - User permissions

3. **Rate Limiting**:
   - GitHub API has rate limits
   - Authenticated: 5,000 requests/hour
   - Unauthenticated: 60 requests/hour

## Troubleshooting

### Common Issues

1. **"Not Found" on callback**:
   - Check redirect URI matches exactly
   - Ensure route is configured

2. **"Bad credentials"**:
   - Verify Client ID and Secret
   - Check token hasn't expired

3. **No data showing**:
   - Verify token has required scopes
   - Check API rate limits
   - Ensure user has repository access

4. **Webhooks not working**:
   - Verify webhook secret
   - Check webhook URL is accessible
   - Ensure signature verification works

## Next Steps

1. **Immediate (MVP)**:
   - Implement OAuth flow with GitHub OAuth App
   - Store tokens in Convex
   - Basic repository fetching

2. **Short-term**:
   - Add webhook support
   - Implement activity tracking
   - Add error handling

3. **Long-term**:
   - Migrate to GitHub App
   - Add fine-grained permissions
   - Implement GitHub Actions integration