# Getting Started with LTF1

Welcome to LTF1 - a brutalist project management system built with modern web technologies. This guide will help you set up your development environment and understand the basics.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ and npm/pnpm
- Git
- A Convex account (free tier works)
- A Clerk account for authentication

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/aansh-afk/ltf1-pm.git
cd ltf1-pm
```

### 2. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 3. Environment Setup

Create a `.env` file in the `apps/web` directory:

```env
# Convex
VITE_CONVEX_URL=your_convex_deployment_url

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### 4. Set up Convex

```bash
# Install Convex CLI globally
npm install -g convex

# Deploy to development
npx convex dev
```

### 5. Start the Development Server

```bash
# From the root directory
npm run dev
```

The application will be available at `http://localhost:3000`

## First Steps

### Creating Your First Workspace

1. Sign in using your preferred authentication method
2. You'll be prompted to create a workspace
3. Enter a workspace name (e.g., "My Company")
4. Choose your role (typically "owner" for the first user)

### Creating Your First Project

1. Navigate to the Projects page
2. Click "NEW PROJECT" button
3. Fill in:
   - Project Name
   - Project Key (3-5 letter abbreviation)
   - Description (optional)
   - Workflow Type (Kanban recommended for starters)

### Understanding the UI

The LTF1 interface follows a brutalist design philosophy:
- **High contrast** black and yellow color scheme
- **Monospace fonts** for technical feel
- **Sharp edges** and no rounded corners
- **Brutal shadows** for depth
- **Uppercase text** for headers

### Navigation

- **Dashboard**: Overview of all activities
- **Workspaces**: Manage workspace settings and members
- **Projects**: View and manage all projects
- **Tasks**: Global task view across projects
- **Team**: Developer profiles and team management
- **Sprints**: Sprint planning and tracking
- **Meetings**: Meeting scheduling and notes
- **Settings**: Personal and workspace settings

## Key Features to Explore

### 1. Task Management
- Create tasks with different types (feature, bug, improvement, task, epic)
- Assign priorities and team members
- Track time spent on tasks
- Use different view modes (Kanban, List, Table, Calendar)

### 2. Team Collaboration
- Real-time activity tracking
- Developer profiles with skills and expertise
- Team workload distribution
- Presence indicators

### 3. Sprint Planning
- Create and manage sprints
- Drag-and-drop task assignment
- Sprint velocity tracking
- Retrospective tools

### 4. Developer Profiles
- Complete your profile in `/profile`
- Add skills, bio, and work preferences
- Set your working hours and timezone
- Track your contributions

## Common Commands

### Using the CLI Tool
```bash
# Authenticate
ltf1 auth login

# Create a workspace
ltf1 workspace create "My Workspace"

# Create a project
ltf1 project create -n "My Project" -k "PROJ"

# Create a task
ltf1 task create -t "Implement feature X" -p high
```

## Troubleshooting

### Convex Connection Issues
- Ensure `VITE_CONVEX_URL` is correct
- Check if `npx convex dev` is running
- Try clearing browser cache

### Authentication Problems
- Verify Clerk keys are correct
- Check if user exists in Convex database
- Look for console errors

### Performance Issues
- Check the footer for real-time resource usage
- Monitor browser console for errors
- Ensure you're not running too many background tasks

## Next Steps

1. Complete your developer profile
2. Invite team members to your workspace
3. Create your first project and tasks
4. Explore the different view modes
5. Set up your first sprint

## Getting Help

- Check the [Core Concepts](./core-concepts.md) guide
- Review [Troubleshooting](./troubleshooting.md) for common issues
- Explore the codebase - it's well-organized and commented

Happy coding with LTF1! 🚀