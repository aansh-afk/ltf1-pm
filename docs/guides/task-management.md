# Task Management Guide

Task management is the core functionality of LTF1. This guide covers everything from creating tasks to advanced filtering and time tracking.

## Task Overview

Tasks in LTF1 represent units of work with rich metadata:
- Unique project-based numbering (e.g., PROJ-123)
- Multiple view modes (Kanban, List, Table, Calendar)
- Real-time updates across all users
- Comprehensive activity tracking
- Time tracking capabilities

## Task Properties

### Core Fields

| Field | Description | Options |
|-------|-------------|---------|
| **Title** | Brief description of the task | Text (required) |
| **Description** | Detailed information, acceptance criteria | Rich text |
| **Type** | Category of work | feature, bug, improvement, task, epic |
| **Priority** | Urgency level | low, medium, high, urgent |
| **Status** | Current state | backlog, todo, in_progress, review, done, cancelled |
| **Assignee** | Person responsible | Team member |
| **Story Points** | Effort estimation | 1, 2, 3, 5, 8, 13, 21 |
| **Sprint** | Associated sprint | Active sprints |
| **Labels** | Custom tags | User-defined |

### Advanced Fields
- **Blockers**: Other tasks blocking this one
- **Attachments**: Files and documents
- **Comments**: Discussion thread
- **Time Tracking**: Logged work hours
- **Activity Log**: Automatic history

## Creating Tasks

### Quick Create (Keyboard Shortcut: `C`)
1. Press `C` from any page
2. Enter task title
3. Press Enter to create with defaults
4. Task created in backlog

### Full Create Form
1. Click "NEW TASK" button
2. Fill in all required fields:
   ```
   Title: Implement user authentication
   Type: Feature
   Priority: High
   Description: Add OAuth2 authentication...
   Assignee: Select team member
   Story Points: 5
   ```
3. Click "CREATE TASK"

### CLI Creation
```bash
ltf1 task create -t "Implement authentication" -p high --type feature
```

### Bulk Import
For migrating from other systems:
1. Prepare CSV with columns: title, type, priority, description
2. Go to Project Settings → Import
3. Upload CSV file
4. Map columns and import

## Task Views

### Kanban Board (Default)
Visual board with columns for each status:
```
BACKLOG | TODO | IN PROGRESS | REVIEW | DONE
  □         □         ▣           ◈       ✓
```

**Features:**
- Drag and drop between columns
- Quick status updates
- Visual workload indicators
- Swimlanes by assignee/priority

### List View
Traditional list with sorting and grouping:
- Sort by: Priority, Created, Updated, Assignee
- Group by: Status, Type, Assignee, Sprint
- Inline editing capabilities
- Bulk operations

### Table View  
Spreadsheet-like view for data analysis:
- All fields visible
- Column customization
- Export to CSV
- Advanced filtering

### Calendar View
Timeline visualization:
- Tasks positioned by due date
- Drag to reschedule
- Sprint boundaries shown
- Workload heatmap

## Task Workflows

### Standard Development Flow
```
1. BACKLOG → Task created, not yet planned
2. TODO → Added to sprint, ready for work  
3. IN PROGRESS → Developer starts work
4. REVIEW → Code complete, needs review
5. DONE → Reviewed and merged
```

### Bug Fix Flow
```
1. Bug reported → BACKLOG with 'bug' type
2. Triaged → Priority set, moved to TODO
3. Investigation → IN PROGRESS
4. Fix implemented → REVIEW
5. Verified → DONE
```

## Filtering and Search

### Quick Filters (Presets)
- **My Tasks**: Assigned to you
- **Unassigned**: No assignee
- **High Priority**: Priority = high/urgent
- **Blocked**: Has blockers
- **This Sprint**: In current sprint

### Advanced Filtering

Build complex queries:
```typescript
// Example filter configuration
{
  status: ["todo", "in_progress"],
  assignee: currentUser.id,
  priority: ["high", "urgent"],
  type: ["bug"],
  hasBlockers: false
}
```

### Search Syntax
- `title:authentication` - Search in title
- `assignee:john` - Find John's tasks  
- `status:done created:>7d` - Done in last week
- `#urgent #backend` - With specific labels

## Time Tracking

### Starting Time Tracking
1. Change task status to "IN PROGRESS"
2. Click the timer icon or press `T`
3. Timer starts automatically
4. Shows elapsed time in real-time

### Logging Time Manually
1. Click "Log Time" in task details
2. Enter hours worked
3. Add optional description
4. Time added to task total

### Time Reports
View time tracking data:
- By developer
- By project
- By sprint
- By date range

## Task Relationships

### Blockers and Dependencies
- Add blockers to indicate dependencies
- Blocked tasks show warning icon
- Can't move to DONE if blockers exist
- Automatic notifications when blockers cleared

### Subtasks
- Break large tasks into smaller pieces
- Progress rolls up to parent
- Complete all subtasks to complete parent
- Maintain separate assignees

### Related Tasks
- Link related but not dependent tasks
- Cross-reference bugs and features
- Track duplicate reports

## Bulk Operations

### Multi-Select Mode
1. Click checkbox on any task
2. Select multiple tasks
3. Available operations:
   - Change status
   - Assign to user
   - Add to sprint
   - Delete tasks
   - Export selection

### Keyboard Shortcuts
- `Shift + Click`: Select range
- `Cmd/Ctrl + A`: Select all visible
- `Delete`: Delete selected
- `M`: Move to sprint

## Activity and Comments

### Automatic Activity Tracking
Every action is logged:
- Status changes
- Assignee updates  
- Time logged
- Comments added
- Priority changes

### Commenting System
- Markdown support
- @mentions for notifications
- File attachments
- Edit/delete own comments
- Thread discussions

## Advanced Features

### Task Templates
Create reusable templates:
1. Go to Project Settings → Templates
2. Define template with preset fields
3. Use template when creating tasks
4. Saves time for common task types

### Automation Rules
Set up automatic actions:
- Move to DONE when PR merged
- Assign to reviewer when IN REVIEW
- Add label based on title keywords
- Send notifications on status change

### Custom Fields
Add project-specific fields:
- Customer name
- Version affected
- Revenue impact
- Compliance requirements

## Best Practices

### Task Creation
- **Clear titles**: "Fix login bug" not "Bug"
- **Acceptance criteria**: Define "done"
- **Right-size tasks**: 1-3 days of work
- **Add context**: Links, screenshots

### Status Management
- Update status promptly
- Use BLOCKED when stuck
- Move to REVIEW before merging
- Close tasks you won't do

### Time Tracking
- Start timer when beginning work
- Log time same day
- Include break time
- Add notes for unusual time

## Troubleshooting

### Task Not Updating
- Check internet connection
- Verify Convex is connected
- Refresh page
- Check browser console

### Can't Drag Tasks
- Verify you have permission
- Check if task is locked
- Ensure valid status transition
- Try different browser

### Missing Tasks
- Check active filters
- Verify correct project
- Look in other statuses
- Search by task number

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `C` | Create new task |
| `F` | Focus search |
| `1-4` | Switch views |
| `G + T` | Go to tasks |
| `?` | Show all shortcuts |

## Integration Points

### With Developer Profiles
- See assignee expertise
- Check workload before assigning
- View developer availability

### With Sprints
- Drag tasks into sprints
- Track sprint progress
- Velocity calculations

### With Activity Feed
- All changes logged
- Team visibility
- Audit trail

## API Usage

### Creating a Task
```typescript
const createTask = useMutation(api.tasks.mutations.create)

await createTask({
  projectId,
  title: "Implement feature",
  type: "feature",
  priority: "high",
  description: "...",
  assigneeId: userId
})
```

### Querying Tasks
```typescript
const tasks = useQuery(api.tasks.queries.getProjectTasks, {
  projectId,
  filters: {
    status: ["todo", "in_progress"],
    assignee: userId
  }
})
```

### Updating a Task
```typescript
const updateTask = useMutation(api.tasks.mutations.update)

await updateTask({
  taskId,
  status: "in_progress",
  assigneeId: newAssigneeId
})
```

## Next Steps

- Learn about [Sprint Management](./sprint-management.md)
- Explore [Team Activity Tracking](./team-activity.md)
- Review [Keyboard Shortcuts](./keyboard-shortcuts.md)
- Check [API Documentation](../api/convex-functions.md)