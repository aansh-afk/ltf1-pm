# Convex & Clerk Setup Guide for LTF1

## 1. Convex Setup

### Step 1: Initialize Convex
Open a terminal and run:
```bash
cd packages/backend
npx convex dev
```

When prompted:
1. **Create new project**: Yes
2. **Project name**: `ltf1-pm` (or your preference)
3. **Team**: Create new or select existing

This will create:
- `convex.json` in the backend package
- Generated types in `convex/_generated/`

### Step 2: Note Your Convex URL
After setup, you'll see:
```
✔ Deployed to https://xxxxx-xxxxx.convex.cloud
```
Save this URL - you'll need it for the `.env` file.

## 2. Clerk Setup

### Step 1: Create Clerk Application
1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Click **Create application**
3. Configure:
   - **Application name**: LTF1
   - **Sign-in options**: 
     - ✅ Email address
     - ✅ Google
   - **Theme**: Dark

### Step 2: Get API Keys
In Clerk Dashboard:
1. Go to **API Keys** (left sidebar)
2. Copy:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`

### Step 3: Configure Webhook
1. Go to **Webhooks** (left sidebar)
2. Click **Add Endpoint**
3. Configure:
   - **Endpoint URL**: `https://your-convex-url.convex.cloud/clerk-webhook`
   - **Message filtering**: Select all user events:
     - ✅ user.created
     - ✅ user.updated
     - ✅ user.deleted
4. After creation, copy the **Signing Secret**

## 3. Environment Configuration

### Create `.env` in project root:
```env
# Convex (from Convex setup)
VITE_CONVEX_URL=https://your-project.convex.cloud

# Clerk (from Clerk dashboard)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-key-here
CLERK_SECRET_KEY=sk_test_your-secret-here
CLERK_WEBHOOK_SECRET=whsec_your-webhook-secret

# Optional for future features
GITHUB_WEBHOOK_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OPENAI_API_KEY=
```

## 4. Install Dependencies

From the root directory:
```bash
pnpm install
```

## 5. Push Convex Functions

```bash
cd packages/backend
npx convex deploy
```

This will deploy all your Convex functions including the Clerk webhook.

## 6. Test the Setup

### Start the development server:
```bash
# From root directory
pnpm dev
```

### Test authentication:
1. Navigate to http://localhost:3000
2. Click "Sign Up"
3. Create an account
4. Check Convex dashboard to see if user was created

## Troubleshooting

### "Convex not configured"
- Make sure `convex.json` exists in `packages/backend/`
- Check that `VITE_CONVEX_URL` is set correctly

### "Clerk not working"
- Verify `VITE_CLERK_PUBLISHABLE_KEY` starts with `pk_`
- Check browser console for errors

### "User not syncing to Convex"
- Check webhook endpoint URL is correct
- Verify webhook secret is set
- Look at Clerk webhook logs for errors

## Next Steps

Once setup is complete:
1. ✅ Users can sign up/in
2. ✅ Users are synced to Convex
3. ✅ Real-time data sync works
4. 🚀 Ready to build features!