# GitHub App Setup Guide

## Step 1: Create a GitHub App

1. Go to GitHub Settings:
   - Personal account: https://github.com/settings/apps/new
   - Organization: https://github.com/organizations/{org}/settings/apps/new

2. Fill in the following information:

### Basic Information
- **GitHub App name**: `iceberg-l-dev` (or your preferred name)
- **Homepage URL**: `http://localhost:3000`
- **Description**: "Project management and collaboration tool with GitHub integration"

### Webhook Configuration
- **Webhook URL**: `https://tangible-butterfly-366.convex.site/github-webhook`
- **Webhook secret**: Generate a random string (save this for your .env.local)
  ```bash
  openssl rand -hex 32
  ```

### Permissions & Events

#### Repository Permissions:
- **Actions**: Read
- **Administration**: Read
- **Checks**: Write
- **Contents**: Read
- **Deployments**: Read
- **Issues**: Write
- **Metadata**: Read (mandatory)
- **Pull requests**: Write
- **Commit statuses**: Write

#### Organization Permissions:
- **Members**: Read
- **Projects**: Read

#### Account Permissions:
- **Email addresses**: Read
- **Profile**: Read

### Subscribe to Events:
- ✅ Commit comment
- ✅ Create (branch/tag)
- ✅ Delete (branch/tag)
- ✅ Fork
- ✅ Issue comment
- ✅ Issues
- ✅ Member
- ✅ Project
- ✅ Pull request
- ✅ Pull request review
- ✅ Pull request review comment
- ✅ Push
- ✅ Release
- ✅ Repository
- ✅ Star
- ✅ Watch
- ✅ Workflow job
- ✅ Workflow run

### Where can this GitHub App be installed?
- Select: **Only on this account** (for development)
- For production: **Any account**

## Step 2: After Creating the App

1. **Note down the App ID** (displayed at the top of the app settings page)

2. **Generate a Private Key**:
   - Scroll to "Private keys" section
   - Click "Generate a private key"
   - A .pem file will download - save this securely

3. **Get the App Slug**:
   - It's in the URL: `https://github.com/apps/{your-app-slug}`

## Step 3: Configure Environment Variables

Update your `.env.local`:

```bash
# GitHub OAuth (keep existing)
VITE_GITHUB_CLIENT_ID=your_oauth_client_id
GITHUB_CLIENT_SECRET=your_oauth_client_secret
VITE_GITHUB_REDIRECT_URI=http://localhost:3000/api/auth/github/callback

# GitHub App (new)
VITE_GITHUB_APP_SLUG=your-app-slug
GITHUB_WEBHOOK_SECRET=your_webhook_secret_from_step_1
GITHUB_APP_ID=your_app_id_from_step_2
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
your_private_key_content_here
-----END RSA PRIVATE KEY-----"
```

**Important**: For the private key, you can either:
- Store the entire key in the env variable (with quotes and newlines)
- Store it in a file and reference the path
- Use base64 encoding: `base64 -i your-app.private-key.pem`

## Step 4: Install the GitHub App

1. Go to your app's public page: `https://github.com/apps/{your-app-slug}`
2. Click "Install" or "Configure"
3. Select the repositories you want to give access to
4. Complete the installation

## Step 5: Get Installation ID

After installation, you'll be redirected to:
`https://github.com/settings/installations/{installation_id}`

Note down the installation ID - you'll need this for API calls.

## Step 6: Test the Installation

1. The webhook endpoint should start receiving events
2. Check Convex logs: `npx convex logs`
3. Verify webhook delivery in GitHub:
   - Go to your app settings
   - Click "Advanced" tab
   - Check "Recent Deliveries"

## Step 7: Using the GitHub App

### Authentication
GitHub Apps use JWT for app authentication and installation tokens for API calls:

```javascript
// App authentication (JWT)
const jwt = createAppJWT(appId, privateKey);

// Installation authentication (for API calls)
const installationToken = await getInstallationToken(jwt, installationId);
```

### Making API Calls
```javascript
const response = await fetch('https://api.github.com/repos/{owner}/{repo}/issues', {
  headers: {
    'Authorization': `Bearer ${installationToken}`,
    'Accept': 'application/vnd.github.v3+json'
  }
});
```

## Differences from OAuth App

| Feature | OAuth App | GitHub App |
|---------|-----------|------------|
| Authentication | User tokens only | App + Installation tokens |
| Permissions | Broad, user-scoped | Fine-grained, repo-scoped |
| Webhooks | Requires separate setup | Built-in |
| Rate Limits | 5,000/hour per user | 5,000/hour per app |
| Repository Access | Via user permissions | Direct installation |
| Multiple Repos | Each user authorizes | Single installation |
| Bot Identity | Uses user identity | Has its own identity |

## Common Use Cases

1. **Automated PR Reviews**: Comment on PRs, set status checks
2. **Issue Management**: Auto-label, assign, close issues
3. **CI/CD Integration**: Trigger workflows, update deployment status
4. **Project Automation**: Sync with project boards, update tasks
5. **Security Scanning**: Check for vulnerabilities, enforce policies

## Troubleshooting

### Webhook Not Receiving Events
- Check webhook URL is accessible (not localhost for production)
- Verify webhook secret matches
- Check GitHub App permissions
- Review webhook delivery logs in GitHub

### Authentication Errors
- Verify private key format (including headers)
- Check App ID is correct
- Ensure installation ID is valid
- Verify JWT expiration (max 10 minutes)

### Rate Limiting
- Use conditional requests with ETags
- Cache responses when possible
- Use webhook events instead of polling
- Check `X-RateLimit-*` headers

## Next Steps

1. Implement webhook handlers for your use cases
2. Set up proper error handling and retry logic
3. Add monitoring and logging
4. Consider using GitHub's GraphQL API for complex queries
5. Implement proper secret rotation