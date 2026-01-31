# LTF CLI

> Terminal interface for iceberg project management platform

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)

## Overview

The LTF CLI provides a powerful terminal interface for developers to interact with the iceberg project management platform. It enables:

- **Task Management**: Create, view, update, and complete tasks without leaving your terminal
- **Sprint Operations**: Monitor sprint progress, add tasks, view burndown charts
- **AI Features**: Get AI-powered task suggestions and sprint analysis
- **Git Integration**: Automatic task updates based on git activity
- **Background Daemon**: Watches git operations and triggers events automatically

## Quick Start

```bash
# Install dependencies
pnpm install

# Build the CLI
pnpm build

# Link globally for development
pnpm link

# Authenticate
ltf auth login

# Select a project
ltf project select

# List tasks
ltf task list
```

## Architecture

```
apps/cli/
├── src/
│   ├── bin/
│   │   └── ltf.ts           # Entry point - CLI initialization
│   ├── commands/            # Command modules (one per feature)
│   │   ├── auth/            # Authentication commands
│   │   ├── project/         # Project management
│   │   ├── task/            # Task CRUD operations
│   │   ├── sprint/          # Sprint management
│   │   ├── ai/              # AI-powered features
│   │   ├── git/             # Git integration
│   │   └── daemon/          # Background process
│   ├── lib/                 # Shared utilities
│   │   ├── config.ts        # Configuration management
│   │   ├── output.ts        # Terminal output formatting
│   │   ├── convex.ts        # Convex client setup
│   │   ├── auth.ts          # Auth helpers
│   │   └── git.ts           # Git utilities
│   └── types/               # TypeScript type definitions
└── templates/
    └── hooks/               # Git hook templates
```

## Core Modules

### 1. Configuration (`src/lib/config.ts`)

Manages persistent CLI configuration using the [conf](https://github.com/sindresorhus/conf) library.

**Storage Location**: `~/.config/ltf-nodejs/config.json` (Linux/macOS)

**Configuration Schema**:
```typescript
interface CLIConfig {
  auth?: {
    token: string;           // JWT or API token
    tokenType: 'clerk' | 'api';
    userId: string;
    email: string;
    expiresAt: number;       // Token expiration timestamp
  };
  context?: {
    workspaceId: string;     // Current active workspace
    workspaceName: string;
    projectId: string;       // Current active project
    projectKey: string;      // Project key (e.g., "PROJ")
    projectName: string;
  };
  preferences?: {
    defaultFormat: 'table' | 'json' | 'compact';
    colorOutput: boolean;
    autoSync: boolean;
  };
  daemon?: {
    enabled: boolean;
    pid: number;
    logFile: string;
  };
  gitHooks?: {
    installed: boolean;
    installedAt: string;
  };
}
```

**Key Functions**:
- `getAuth()` / `setAuth()` - Manage authentication tokens
- `getContext()` / `setContext()` - Manage workspace/project context
- `isAuthenticated()` - Check if user has valid auth
- `hasProjectContext()` - Check if a project is selected

### 2. Output (`src/lib/output.ts`)

Provides consistent, beautiful terminal output with colors, tables, and spinners.

**Color Palette** (matches iceberg brand):
- `primary` - Yellow (#FCD34D)
- `success` - Green
- `error` - Red
- `warning` - Yellow
- `muted` - Dim gray

**Key Functions**:
```typescript
// Status messages
output.success('Task created successfully');
output.error('Failed to connect', 'Check your internet connection');
output.warning('Sprint ends in 2 days');
output.info('Syncing with GitHub...');

// Spinners for async operations
const spin = output.spinner('Creating task...');
// ... async work ...
spin.succeed('Task created');

// Tables
output.table(tasks, [
  { header: 'ID', key: 'number' },
  { header: 'Title', key: 'title' },
  { header: 'Status', key: 'status', formatter: output.formatStatus },
]);

// Key-value pairs
output.keyValue([
  ['Status', formatStatus('in_progress')],
  ['Priority', formatPriority('high')],
  ['Assignee', 'John Doe'],
]);

// JSON output for scripting
output.json(data);
```

**Task Formatting Helpers**:
- `formatStatus(status)` - Color-coded status display
- `formatPriority(priority)` - Color-coded priority
- `formatType(type)` - Color-coded task type
- `formatTaskNumber(key, number)` - Format as "PROJ-123"
- `progressBar(current, total)` - Visual progress bar
- `miniChart(values)` - Sparkline chart for burndown

### 3. Convex Client (`src/lib/convex.ts`)

Handles authenticated communication with the Convex backend.

**Key Functions**:
```typescript
// Get authenticated client
const client = getAuthenticatedClient();

// Make queries with error handling
const tasks = await query(client, 'tasks/queries:getProjectTasks', {
  projectId: context.projectId,
});

// Make mutations
await mutation(client, 'tasks/mutations:createTask', {
  projectId: context.projectId,
  title: 'New task',
});

// Make actions (for AI features)
const suggestions = await action(client, 'ai/actions:generateTaskDetails', {
  description: 'Add user authentication',
});
```

**Error Handling**:
- Automatically detects expired tokens
- Prompts user to re-authenticate
- Provides clear error messages

## Commands Reference

### Authentication

```bash
# Login via browser OAuth (recommended)
ltf auth login

# Login with API token
ltf auth login --token <your-api-token>

# Check auth status
ltf auth status

# Logout
ltf auth logout
```

### Project Management

```bash
# List all projects in current workspace
ltf project list

# Select active project (interactive)
ltf project select

# Select project by key
ltf project select PROJ

# Show current project info
ltf project info

# Auto-detect project from git remote
ltf project detect
```

### Task Management

```bash
# List tasks (default: current sprint)
ltf task list

# List with filters
ltf task list --status in_progress
ltf task list --assignee me
ltf task list --priority high

# Create task (interactive)
ltf task create

# Create task with flags
ltf task create "Fix login bug" --type bug --priority high

# View task details
ltf task view 123
ltf task view PROJ-123

# Update task
ltf task update 123 --status in_progress
ltf task update 123 --assignee john@example.com

# Mark task as done
ltf task done 123

# Assign task
ltf task assign 123 --to me
ltf task assign 123 --to john@example.com
```

### Sprint Management

```bash
# List all sprints
ltf sprint list

# Show current sprint status
ltf sprint status

# Create new sprint
ltf sprint create "Sprint 5" --start 2024-01-15 --end 2024-01-29

# Add task to current sprint
ltf sprint add 123

# Start sprint
ltf sprint start

# Complete sprint
ltf sprint complete
```

### AI Features

```bash
# Get AI suggestions based on recent git activity
ltf ai suggest

# Analyze current sprint health
ltf ai analyze

# Generate task description from brief input
ltf ai describe "Add OAuth support"

# Break down epic into subtasks
ltf ai breakdown 45
```

### Git Integration

```bash
# Link current branch to a task (parses branch name)
ltf git link

# Link specific PR to task
ltf git link --pr 42 --task 123

# Sync GitHub data
ltf git sync

# Install git hooks
ltf git hooks install

# Uninstall git hooks
ltf git hooks uninstall

# Show git integration status
ltf git status
```

### Background Daemon

```bash
# Start the daemon
ltf daemon start

# Stop the daemon
ltf daemon stop

# Check daemon status
ltf daemon status

# View daemon logs
ltf daemon logs
ltf daemon logs --follow
```

## Development Guide

### Setting Up Development Environment

```bash
# Navigate to CLI directory
cd apps/cli

# Install dependencies
pnpm install

# Run in development mode (auto-reload)
pnpm dev

# In another terminal, test commands
pnpm dev -- task list
```

### Adding a New Command

1. **Create command file** in `src/commands/<category>/`:

```typescript
// src/commands/example/hello.ts
import { Command } from 'commander';
import output from '../../lib/output.js';
import { getAuthenticatedClient } from '../../lib/convex.js';
import { getContext } from '../../lib/config.js';

export function registerHelloCommand(program: Command): void {
  program
    .command('hello')
    .description('Say hello')
    .option('-n, --name <name>', 'Name to greet')
    .action(async (options) => {
      const spin = output.spinner('Processing...');

      try {
        // Get context and client
        const context = getContext();
        const client = getAuthenticatedClient();

        // Do something...

        spin.succeed(`Hello, ${options.name || 'World'}!`);
      } catch (error) {
        spin.fail('Failed');
        output.error('Something went wrong', (error as Error).message);
        process.exit(1);
      }
    });
}
```

2. **Register in parent command**:

```typescript
// src/commands/example/index.ts
import { Command } from 'commander';
import { registerHelloCommand } from './hello.js';

export function registerExampleCommands(program: Command): void {
  const example = program.command('example').description('Example commands');
  registerHelloCommand(example);
}
```

3. **Add to main program** in `src/bin/ltf.ts`

### Testing

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Build
pnpm build
```

### Building for Production

```bash
# Build
pnpm build

# The binary will be at dist/bin/ltf.js
node dist/bin/ltf.js --help
```

## Git Hook Integration

The CLI can install git hooks that automatically trigger events on git operations.

### Supported Hooks

| Hook | Trigger | Action |
|------|---------|--------|
| `post-commit` | After commit | Parse commit for task refs, update status |
| `post-checkout` | Branch switch | Detect task from branch name |
| `pre-push` | Before push | Validate linked tasks |
| `post-merge` | After merge | Sync task status |

### Hook Scripts

Hooks are installed to `.git/hooks/` and call the `ltf` CLI:

```bash
#!/bin/sh
# .git/hooks/post-commit
ltf git hook post-commit "$@"
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CONVEX_URL` | Convex deployment URL | Production URL |
| `LTF_CONFIG_PATH` | Custom config location | `~/.config/ltf-nodejs` |
| `LTF_NO_COLOR` | Disable colors | `false` |
| `LTF_DEBUG` | Enable debug logging | `false` |

## Troubleshooting

### "Not authenticated"
```bash
ltf auth login
```

### "No project selected"
```bash
ltf project select
```

### "Convex connection failed"
- Check internet connection
- Verify `CONVEX_URL` is correct
- Try `ltf auth login` to refresh token

### Daemon not starting
```bash
# Check for existing process
ltf daemon status

# Force stop and restart
ltf daemon stop
ltf daemon start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `pnpm typecheck && pnpm lint`
5. Submit a pull request

## License

MIT
