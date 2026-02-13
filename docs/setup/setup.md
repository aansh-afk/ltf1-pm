# LTF1 Setup Guide

## Prerequisites
- Node.js 18+
- pnpm 8+
- Convex account (free tier works)
- Clerk account (free tier works)

## Initial Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Set up Convex Backend

First, initialize Convex in the backend package:

```bash
cd packages/backend
npx convex dev --once --configure=new
```

This will:
- Create a new Convex project
- Generate the API types
- Give you a deployment URL

Keep the terminal open or note the deployment URL.

### 3. Set up Clerk Authentication

1. Go to [clerk.com](https://clerk.com) and create a new application
2. Choose "Email" and "Google" as sign-in methods
3. Get your publishable key from the API Keys section

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Convex (from step 2)
VITE_CONVEX_URL=https://your-project.convex.cloud

# Clerk (from step 3)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-key-here
```

### 5. Run the Development Server

From the root directory:

```bash
pnpm dev
```

This will start:
- Convex backend (if not already running)
- Vite dev server on http://localhost:3000

## What's Working

✅ **Authentication** - Sign up/in with Clerk
✅ **Workspaces** - Create and manage workspaces
✅ **Projects** - Create projects within workspaces
✅ **Tasks** - Kanban board with drag-and-drop
✅ **Real-time Updates** - All changes sync instantly
✅ **Dark Theme** - Beautiful dark red theme
✅ **Mobile Responsive** - Works on all devices

## Next Steps

1. **Create your first workspace** - Click "New Workspace" on the workspaces page
2. **Add a project** - Navigate to a workspace and create a project
3. **Create tasks** - Use the task board to add and manage tasks
4. **Invite team members** - Coming soon!

## Architecture

- **Frontend**: React + Vite + TypeScript + DaisyUI
- **Backend**: Convex (real-time database)
- **Auth**: Clerk
- **State**: Convex reactive queries + Zustand
- **Styling**: Tailwind CSS + DaisyUI

## Troubleshooting

### "Cannot find module '@ltf1/backend'"
Run `npx convex dev` in the `packages/backend` directory first.

### "Unauthorized" errors
Make sure you're signed in and that Clerk is properly configured.

### Build errors
Try running `pnpm install` again and ensure all dependencies are installed.