# LTF1 CLI Documentation

The LTF1 Command Line Interface (CLI) provides powerful tools for managing projects, tasks, and team collaboration directly from your terminal.

## Installation

### Global Installation
```bash
npm install -g @ltf1/cli
# or
pnpm add -g @ltf1/cli
```

### Local Project Installation
```bash
npm install --save-dev @ltf1/cli
# or
pnpm add -D @ltf1/cli
```

### Verify Installation
```bash
ltf1 --version
# Output: ltf1 version 1.0.0
```

## Configuration

### Initial Setup
```bash
ltf1 init
```

This command will:
1. Create `.ltf1/config.json` in your home directory
2. Prompt for Convex URL and API key
3. Set up default workspace
4. Configure user preferences

### Configuration File
```json
// ~/.ltf1/config.json
{
  "convexUrl": "https://your-instance.convex.cloud",
  "apiKey": "your-api-key",
  "defaultWorkspace": "my-team",
  "preferences": {
    "editor": "code",
    "format": "table",
    "color": true,
    "timezone": "America/New_York"
  }
}
```

### Environment Variables
```bash
export LTF1_CONVEX_URL="https://your-instance.convex.cloud"
export LTF1_API_KEY="your-api-key"
export LTF1_WORKSPACE="my-team"
```

## Authentication

### Login
```bash
ltf1 auth login
# Opens browser for authentication
# Or use --token flag
ltf1 auth login --token <auth-token>
```

### Logout
```bash
ltf1 auth logout
```

### Check Status
```bash
ltf1 auth status
# Output: Logged in as john@example.com
```

## Core Commands

### Workspace Management

#### List Workspaces
```bash
ltf1 workspace list
# or shorthand
ltf1 ws ls

# Output:
# NAME          SLUG         ROLE    PROJECTS  MEMBERS
# My Team       my-team      owner   5         12
# Client Work   client-work  admin   3         8
```

#### Switch Workspace
```bash
ltf1 workspace use my-team
# or
ltf1 ws use my-team
```

#### Create Workspace
```bash
ltf1 workspace create --name "New Team" --slug "new-team"
```

### Project Management

#### List Projects
```bash
ltf1 project list
# or
ltf1 p ls

# Output:
# KEY   NAME            TYPE    STATUS   TASKS  SPRINT
# WEB   Web Platform    scrum   active   45     Sprint 2024-W01
# API   Backend API     kanban  active   23     -
# MOB   Mobile App      scrum   on_hold  12     -
```

#### Create Project
```bash
ltf1 project create \
  --name "New Project" \
  --key "PROJ" \
  --type scrum \
  --description "Project description"
```

#### View Project Details
```bash
ltf1 project show WEB
# Shows detailed project information
```

#### Set Current Project
```bash
ltf1 project use WEB
# Sets WEB as the default project for commands
```

### Task Management

#### Create Task
```bash
# Quick create
ltf1 task create "Implement user authentication"

# With options
ltf1 task create \
  --title "Implement OAuth2 authentication" \
  --type feature \
  --priority high \
  --assignee @john \
  --points 5 \
  --description "Add Google and GitHub OAuth"
```

#### List Tasks
```bash
# List all tasks in current project
ltf1 task list

# With filters
ltf1 task list --status todo,in_progress --assignee @me

# Different formats
ltf1 task list --format table  # Default
ltf1 task list --format json
ltf1 task list --format csv
```

#### View Task Details
```bash
ltf1 task show WEB-123
# Shows full task details including comments and activity
```

#### Update Task
```bash
# Update status
ltf1 task update WEB-123 --status in_progress

# Update multiple fields
ltf1 task update WEB-123 \
  --status review \
  --assignee @jane \
  --priority urgent
```

#### Task Workflow Commands
```bash
# Start working on a task
ltf1 task start WEB-123
# Sets status to in_progress and starts time tracking

# Complete a task
ltf1 task done WEB-123

# Add comment
ltf1 task comment WEB-123 "Started implementation"

# Log time
ltf1 task log WEB-123 --hours 2.5 --description "Implemented login form"
```

### Sprint Management

#### Create Sprint
```bash
ltf1 sprint create \
  --name "Sprint 2024-W02" \
  --start 2024-01-15 \
  --end 2024-01-28 \
  --goal "Complete authentication and user profiles"
```

#### Start Sprint
```bash
ltf1 sprint start SPRINT-5
```

#### View Sprint Status
```bash
ltf1 sprint status
# Shows active sprint with burndown chart
```

#### Sprint Planning
```bash
# Add tasks to sprint
ltf1 sprint add SPRINT-5 WEB-123 WEB-124 WEB-125

# Remove task from sprint
ltf1 sprint remove SPRINT-5 WEB-125
```

### Team Commands

#### List Team Members
```bash
ltf1 team list
# Shows all team members with status and current tasks
```

#### View Developer Profile
```bash
ltf1 team show @john
# Shows detailed developer profile
```

#### Update Your Profile
```bash
ltf1 profile update \
  --role "Senior Developer" \
  --skills "React,TypeScript,Node.js" \
  --status busy \
  --message "In sprint planning"
```

### Activity Tracking

#### View Activity Feed
```bash
# Recent activity
ltf1 activity

# Filter by user
ltf1 activity --user @john

# Filter by type
ltf1 activity --type task_created,task_completed

# Last 24 hours
ltf1 activity --since 24h
```

#### View Performance Metrics
```bash
ltf1 performance
# Shows team resource usage and performance metrics
```

## Advanced Usage

### Batch Operations

#### Import Tasks from CSV
```bash
ltf1 task import tasks.csv --project WEB
```

CSV Format:
```csv
title,type,priority,description,assignee,points
"Implement login",feature,high,"OAuth2 login",john@example.com,5
"Fix navigation bug",bug,medium,"Menu not closing",jane@example.com,2
```

#### Export Tasks
```bash
# Export to CSV
ltf1 task export --format csv > tasks.csv

# Export sprint tasks
ltf1 task export --sprint current --format json
```

### Automation and Scripting

#### JSON Output for Scripts
```bash
# Get task data as JSON
ltf1 task show WEB-123 --json | jq '.status'

# List tasks and process
ltf1 task list --json | jq '.[] | select(.priority == "high")'
```

#### Batch Updates
```bash
# Update all unassigned high-priority tasks
ltf1 task list --priority high --assignee none --json | \
  jq -r '.[].id' | \
  xargs -I {} ltf1 task update {} --assignee @me
```

### Configuration Profiles

#### Create Profile
```bash
ltf1 config profile create production \
  --convex-url "https://prod.convex.cloud" \
  --workspace "production-team"
```

#### Switch Profile
```bash
ltf1 config profile use production
```

#### List Profiles
```bash
ltf1 config profile list
```

## Command Options

### Global Options
- `--workspace, -w` - Specify workspace
- `--project, -p` - Specify project
- `--format, -f` - Output format (table, json, csv)
- `--no-color` - Disable colored output
- `--quiet, -q` - Minimal output
- `--verbose, -v` - Detailed output
- `--help, -h` - Show help

### Filter Options
Most list commands support:
- `--status` - Filter by status
- `--type` - Filter by type
- `--priority` - Filter by priority
- `--assignee` - Filter by assignee (@me, @none, @username)
- `--since` - Filter by time (24h, 7d, 2024-01-01)
- `--search` - Search in titles/descriptions

## Interactive Mode

Start interactive mode:
```bash
ltf1 interactive
# or
ltf1 i
```

Interactive commands:
```
ltf1> task create "New task"
ltf1> task list --assignee @me
ltf1> sprint status
ltf1> exit
```

## Aliases and Shortcuts

### Built-in Aliases
- `ws` → `workspace`
- `p` → `project`  
- `t` → `task`
- `s` → `sprint`
- `ls` → `list`
- `rm` → `delete`

### Custom Aliases
Add to `~/.ltf1/config.json`:
```json
{
  "aliases": {
    "my-tasks": "task list --assignee @me --status todo,in_progress",
    "standup": "activity --since 24h --user @me"
  }
}
```

Usage:
```bash
ltf1 my-tasks
ltf1 standup
```

## Shell Completion

### Bash
```bash
ltf1 completion bash > /etc/bash_completion.d/ltf1
```

### Zsh
```bash
ltf1 completion zsh > "${fpath[1]}/_ltf1"
```

### Fish
```bash
ltf1 completion fish > ~/.config/fish/completions/ltf1.fish
```

## Troubleshooting

### Connection Issues
```bash
# Test connection
ltf1 doctor

# Check configuration
ltf1 config show

# Verify API access
ltf1 auth test
```

### Debug Mode
```bash
# Enable debug output
LTF1_DEBUG=1 ltf1 task list

# Verbose logging
ltf1 task list -vvv
```

### Common Issues

#### "Unauthorized" Error
```bash
# Re-authenticate
ltf1 auth logout
ltf1 auth login
```

#### "Project not found"
```bash
# Check current project
ltf1 project current

# Set project
ltf1 project use WEB
```

#### Slow Performance
```bash
# Clear cache
ltf1 cache clear

# Check connection
ltf1 doctor --check-latency
```

## CLI Configuration Reference

### Config File Structure
```json
{
  "convexUrl": "string",
  "apiKey": "string", 
  "defaultWorkspace": "string",
  "defaultProject": "string",
  "preferences": {
    "editor": "code|vim|nano",
    "format": "table|json|csv",
    "color": true|false,
    "timezone": "timezone-string",
    "pageSize": 20,
    "confirmDelete": true|false
  },
  "aliases": {
    "alias-name": "command"
  },
  "profiles": {
    "profile-name": {
      "convexUrl": "string",
      "workspace": "string"
    }
  }
}
```

## Best Practices

1. **Use aliases** for common workflows
2. **Set default project** to avoid repetition
3. **Use JSON output** for scripting
4. **Enable shell completion** for efficiency
5. **Create profiles** for different environments
6. **Use filters** to narrow results
7. **Batch operations** for bulk updates

## Examples

### Daily Workflow
```bash
# Morning standup
ltf1 activity --since yesterday --user @me
ltf1 task list --assignee @me --status in_progress

# Start new task
ltf1 task list --status todo --assignee @me
ltf1 task start WEB-125

# Update progress
ltf1 task comment WEB-125 "Completed frontend implementation"
ltf1 task update WEB-125 --status review

# End of day
ltf1 task log WEB-125 --hours 6 --description "Frontend complete"
ltf1 performance --user @me
```

### Sprint Management
```bash
# Sprint planning
ltf1 sprint create --name "Sprint $(date +%Y-W%V)"
ltf1 task list --status backlog --sort priority
ltf1 sprint add SPRINT-6 WEB-130 WEB-131 WEB-132

# Daily sprint status
ltf1 sprint status
ltf1 sprint burndown

# Sprint review
ltf1 sprint report SPRINT-6
ltf1 sprint close SPRINT-6 --move-incomplete backlog
```

## Related Documentation

- [Getting Started](./getting-started.md) - Initial setup
- [Task Management](./task-management.md) - Task workflows
- [Sprint Management](./sprint-management.md) - Sprint commands
- [API Documentation](../api/convex-functions.md) - API reference