# GitHub Integration Setup Guide

This guide walks you through setting up the GitHub App integration for LTF1.

## Overview

LTF1 uses a GitHub App to:
- Link commits and pull requests to tasks
- Track developer contributions
- Sync repository data with projects
- Display GitHub stats on developer profiles

## Prerequisites

- Admin access to your GitHub organization or personal account
- Deployed LTF1 instance with webhook URL
- Convex environment variables configured

## Step 1: Create a GitHub App

1. Go to **GitHub Settings**:
   - Personal: https://github.com/settings/apps
   - Organization: https://github.com/organizations/{org}/settings/apps

2. Click **"New GitHub App"**

3. Fill in the basic information:
   - **GitHub App name**: LTF1 Integration (or your custom name)
   - **Homepage URL**: Your LTF1 deployment URL
   - **Description**: Project management integration for LTF1

4. Configure webhooks:
   - **Webhook URL**: `https://your-convex-deployment.convex.site/api/github/webhook`
   - **Webhook secret**: Generate a secure random string and save it

5. Set permissions:
   
   **Repository permissions**:
   - Actions: Read
   - Checks: Write
   - Commit statuses: Write
   - Contents: Read
   - Issues: Write
   - Metadata: Read
   - Pull requests: Write
   
   **Organization permissions**:
   - Members: Read (optional)

6. Subscribe to events:
   - Commit comment
   - Create
   - Delete
   - Issue comment
   - Issues
   - Pull request
   - Pull request review
   - Pull request review comment
   - Push
   - Repository

7. Choose where the app can be installed:
   - **Any account** (recommended) or **Only on this account**

8. Click **"Create GitHub App"**

## Step 2: Generate Private Key

1. After creating the app, scroll to **"Private keys"**
2. Click **"Generate a private key"**
3. Save the downloaded `.pem` file securely

## Step 3: Configure Environment Variables

Add these to your Convex deployment:

```bash
# In Convex dashboard or using CLI
npx convex env set GITHUB_APP_ID "your-app-id"
npx convex env set GITHUB_WEBHOOK_SECRET "your-webhook-secret"
npx convex env set GITHUB_PRIVATE_KEY "$(cat path-to-your-private-key.pem)"
```

## Step 4: Install the GitHub App

1. Go to your GitHub App's public page:
   `https://github.com/apps/your-app-name`

2. Click **"Install"** or **"Configure"**

3. Select repositories:
   - **All repositories** or
   - **Only select repositories** (choose specific ones)

4. Click **"Install"**

## Step 5: Connect Repository to Project

In LTF1:

1. Navigate to your project settings
2. Click **"Connect GitHub Repository"**
3. Select the repository from the dropdown
4. Click **"Connect"**

## How It Works

### Task References

Reference tasks in commits and PRs using the format: `PROJECT-123`

Examples:
- Commit: `fix: resolve login issue WEB-123`
- PR title: `[WEB-456] Add user authentication`
- PR body: `Fixes WEB-789 and WEB-790`

### Automatic Linking

When you push commits or create PRs with task references:
1. LTF1 receives the webhook
2. Extracts task references from the text
3. Links the commit/PR to the task
4. Updates task status (PRs can auto-close tasks)
5. Shows activity in the task timeline

### Developer Stats

GitHub stats are synced to developer profiles:
- Total commits, PRs, and reviews
- Language distribution
- Top repositories
- Contribution calendar

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL in GitHub App settings
2. Verify webhook secret matches environment variable
3. Check Convex logs for errors
4. Test with GitHub's webhook delivery logs

### Installation Not Found

1. Ensure app is installed on the repository
2. Check repository permissions
3. Verify installation ID in database

### Stats Not Syncing

1. Check if user has linked their GitHub account
2. Verify GitHub username in developer profile
3. Check sync action logs in Convex

## Security Considerations

- Keep your private key secure
- Use a strong webhook secret
- Regularly rotate credentials
- Monitor webhook activity
- Review app permissions periodically

## API Rate Limits

GitHub Apps have higher rate limits than personal tokens:
- 5,000 requests per hour for installations
- 15,000 requests per hour for GitHub App

LTF1 implements smart caching to minimize API calls.

## Next Steps

- Configure branch protection rules
- Set up automated workflows
- Customize task-commit linking patterns
- Enable GitHub Actions integration