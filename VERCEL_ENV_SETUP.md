# Vercel Environment Variables Setup

## Required Environment Variables

To fix the "No address provided to ConvexReactClient" error on Vercel, you need to add the following environment variables to your Vercel project:

### 1. Navigate to Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project: `ltf1-pm`
3. Click on "Settings" tab
4. Navigate to "Environment Variables" in the left sidebar

### 2. Add the Following Environment Variables

Add these variables for **Production**, **Preview**, and **Development** environments:

#### Convex Configuration
```
Name: VITE_CONVEX_URL
Value: https://tangible-butterfly-366.convex.cloud
```

#### Clerk Authentication
```
Name: VITE_CLERK_PUBLISHABLE_KEY
Value: pk_test_ZmxlZXQtdGFkcG9sZS05Mi5jbGVyay5hY2NvdW50cy5kZXYk
```

#### Optional: Gemini AI (if using AI features)
```
Name: VITE_GEMINI_API_KEY
Value: [Your Gemini API key from https://makersuite.google.com/app/apikey]
```

### 3. Important Notes

- **VITE_ Prefix**: Vite requires environment variables to be prefixed with `VITE_` to be exposed to the client-side code
- **Apply to All Environments**: Make sure to add these variables to Production, Preview, and Development environments
- **Redeploy**: After adding the environment variables, trigger a new deployment by pushing a commit or clicking "Redeploy" in Vercel

### 4. Production Deployment (Future)

When you're ready to deploy to production with a production Convex instance:
1. Run `npx convex deploy` to create a production Convex deployment
2. Update the `VITE_CONVEX_URL` with the production URL
3. Create production Clerk keys at https://clerk.dev
4. Update `VITE_CLERK_PUBLISHABLE_KEY` with production key

### 5. Verify Setup

After adding environment variables and redeploying:
1. Visit your deployment URL
2. Open browser console (F12)
3. Check that there are no Convex connection errors
4. The app should load without the "No address provided" error

## Quick Copy-Paste for Vercel

Copy these exactly as shown:

```
VITE_CONVEX_URL=https://tangible-butterfly-366.convex.cloud
VITE_CLERK_PUBLISHABLE_KEY=pk_test_ZmxlZXQtdGFkcG9sZS05Mi5jbGVyay5hY2NvdW50cy5kZXYk
```

## Troubleshooting

If you still see errors after adding these variables:
1. Make sure you clicked "Save" after adding each variable
2. Trigger a new deployment (push any small change or use "Redeploy")
3. Clear your browser cache and hard refresh (Ctrl+Shift+R)
4. Check that the variables are visible in Vercel's deployment logs