# Sprint Management Guide

Sprint management in LTF1 enables agile teams to plan, track, and deliver work in time-boxed iterations. This guide covers everything you need to know about managing sprints effectively.

## Sprint Overview

Sprints are fixed-length iterations (typically 1-4 weeks) where teams commit to completing a set of tasks. LTF1's sprint management includes:
- Sprint planning and capacity management
- Real-time progress tracking
- Burndown charts and velocity metrics
- Sprint retrospectives
- Historical sprint analytics

## Sprint Lifecycle

### 1. Sprint Planning
**Status: `planning`**
- Create sprint with name and dates
- Set sprint goals and objectives
- Add tasks from backlog
- Estimate team capacity
- Assign work to team members

### 2. Sprint Execution
**Status: `active`**
- Only one active sprint per project
- Track daily progress
- Monitor burndown
- Handle scope changes
- Update task statuses

### 3. Sprint Review
**Status: `review`**
- Review completed work
- Gather stakeholder feedback
- Document achievements
- Identify incomplete items

### 4. Sprint Closure
**Status: `closed`**
- Archive sprint data
- Calculate final velocity
- Move incomplete tasks
- Generate reports

## Creating a Sprint

### Via UI
1. Navigate to Project → Sprints
2. Click "NEW SPRINT" button
3. Fill in sprint details:
   ```
   Name: Sprint 2024-W01
   Start Date: Jan 1, 2024
   End Date: Jan 14, 2024
   Goal: Complete user authentication
   ```
4. Click "CREATE SPRINT"

### Via CLI
```bash
ltf1 sprint create \
  --name "Sprint 2024-W01" \
  --start "2024-01-01" \
  --end "2024-01-14" \
  --goal "Complete user authentication"
```

### Sprint Properties

| Property | Description | Required |
|----------|-------------|----------|
| **Name** | Sprint identifier | Yes |
| **Start Date** | Sprint start date | Yes |
| **End Date** | Sprint end date | Yes |
| **Goal** | Sprint objective | No |
| **Capacity** | Team hours available | No |

## Sprint Planning

### Adding Tasks to Sprint

#### From Backlog View
1. Switch to Backlog view
2. Select tasks (checkbox)
3. Click "Add to Sprint"
4. Choose target sprint

#### Drag and Drop
- Drag tasks from backlog column
- Drop into sprint swimlane
- Automatic story point tallying

#### Capacity Planning
```typescript
// Sprint capacity calculation
Total Capacity = Team Members × Working Days × Hours per Day
Story Points Capacity = Total Capacity ÷ Hours per Point

Example:
5 developers × 10 days × 6 hours = 300 hours
300 hours ÷ 4 hours per point = 75 story points
```

### Sprint Board

The sprint board shows tasks organized by status:

```
┌─────────────────────────────────────────────┐
│ SPRINT 2024-W01 (Day 5 of 14)             │
├─────────┬─────────┬───────────┬────────────┤
│ TODO    │ IN PROG │ REVIEW    │ DONE       │
├─────────┼─────────┼───────────┼────────────┤
│ TASK-42 │ TASK-38 │ TASK-35   │ TASK-31    │
│ TASK-43 │ TASK-40 │           │ TASK-32    │
│ TASK-44 │         │           │ TASK-34    │
└─────────┴─────────┴───────────┴────────────┘
```

## Progress Tracking

### Sprint Metrics

#### Burndown Chart
Shows remaining work over time:
- Ideal burndown line
- Actual progress line
- Scope change indicators
- Predicted completion

#### Velocity Tracking
- Story points completed per sprint
- Rolling average velocity
- Velocity trends
- Capacity utilization

#### Sprint Health Indicators
- 🟢 **On Track**: >90% of ideal progress
- 🟡 **At Risk**: 70-90% of ideal progress
- 🔴 **Behind**: <70% of ideal progress

### Daily Standup View

Quick overview for daily meetings:
```
YESTERDAY COMPLETED:
- [TASK-31] Implement login form
- [TASK-32] Create API endpoints

TODAY IN PROGRESS:
- [TASK-38] Add validation - @john
- [TASK-40] Write tests - @jane

BLOCKERS:
- [TASK-38] Waiting for design approval
```

## Managing Active Sprints

### Scope Management

#### Adding Tasks Mid-Sprint
1. Justify the addition
2. Remove equivalent points
3. Update sprint goal if needed
4. Log scope change

#### Removing Tasks
1. Move task back to backlog
2. Document reason
3. Update capacity calculations
4. Communicate to team

### Sprint Actions

#### Extend Sprint
When deadline needs adjustment:
```typescript
await extendSprint({
  sprintId,
  newEndDate: "2024-01-21",
  reason: "Public holiday not accounted"
})
```

#### Close Sprint Early
For completed or cancelled sprints:
```typescript
await closeSprint({
  sprintId,
  moveIncompleteTo: "backlog", // or "nextSprint"
  reason: "All goals achieved"
})
```

## Sprint Reports

### Velocity Report
```
Sprint Velocity History:
Sprint 1: ████████████ 45 points
Sprint 2: ██████████ 38 points
Sprint 3: ████████████████ 52 points
Sprint 4: █████████████ 48 points
Average: 45.75 points
```

### Completion Report
- Tasks completed vs planned
- Story points delivered
- Bugs fixed
- Technical debt addressed

### Team Performance
- Individual contributions
- Task type distribution
- Time tracking summary
- Collaboration metrics

## Sprint Retrospectives

### Retrospective Template
Built-in retro board with sections:
- **What went well** ✅
- **What didn't go well** ❌
- **Action items** 🎯
- **Appreciation** 🙏

### Running a Retrospective
1. Create retro from sprint
2. Team adds cards to sections
3. Group similar items
4. Vote on priorities
5. Create action items
6. Assign owners

### Tracking Improvements
- Link action items to tasks
- Review in next retro
- Measure impact
- Celebrate successes

## API Usage

### Sprint Queries

```typescript
// Get project sprints
const sprints = useQuery(
  api.sprints.queries.getProjectSprints,
  { projectId }
)

// Get active sprint
const activeSprint = useQuery(
  api.sprints.queries.getActiveSprint,
  { projectId }
)

// Get sprint metrics
const metrics = useQuery(
  api.sprints.queries.getSprintMetrics,
  { sprintId }
)
```

### Sprint Mutations

```typescript
// Create sprint
const createSprint = useMutation(
  api.sprints.mutations.create
)

// Start sprint
const startSprint = useMutation(
  api.sprints.mutations.start
)

// Update sprint
const updateSprint = useMutation(
  api.sprints.mutations.update
)
```

## Best Practices

### Sprint Planning
1. **Keep sprints consistent** length
2. **Leave buffer** for unexpected work
3. **Consider holidays** and time off
4. **Involve whole team** in planning
5. **Define clear** sprint goals

### During Sprint
1. **Update daily** task progress
2. **Communicate blockers** immediately
3. **Avoid scope creep** without discussion
4. **Track time** accurately
5. **Keep board** up to date

### Sprint Review
1. **Demo completed** work
2. **Gather feedback** from stakeholders
3. **Celebrate** achievements
4. **Document** lessons learned
5. **Plan improvements** for next sprint

## Advanced Features

### Sprint Templates
Create reusable sprint configurations:
```typescript
{
  name: "Sprint {YEAR}-W{WEEK}",
  duration: 14, // days
  ceremonies: {
    planning: { day: 1, duration: 4 },
    daily: { time: "09:00", duration: 0.25 },
    review: { day: -1, duration: 2 },
    retro: { day: -1, duration: 1.5 }
  }
}
```

### Automation Rules
- Auto-start next sprint
- Move incomplete tasks
- Send sprint reports
- Create retro boards
- Update team calendars

### Cross-Project Sprints
For teams working on multiple projects:
- Unified sprint view
- Combined velocity
- Resource allocation
- Dependency tracking

## Common Issues

### Sprint Won't Start
- Check no active sprint exists
- Verify start date is today/past
- Ensure you have permissions
- Must have at least one task

### Burndown Looks Wrong
- Check all tasks have estimates
- Verify task status updates
- Review scope changes
- Recalculate if needed

### Can't Add Tasks
- Sprint might be closed
- Check task isn't in another sprint
- Verify project membership
- Task might be completed

## Integration Points

### With Task Management
- Tasks belong to one sprint
- Status changes affect burndown
- Time tracking feeds metrics

### With Team Activity
- Sprint events in activity feed
- Daily progress updates
- Team participation tracking

### With Developer Profiles
- Individual velocity tracking
- Skill-based task assignment
- Capacity based on availability

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `S` | Open sprint panel |
| `P` | Start sprint planning |
| `B` | Toggle burndown chart |
| `R` | Create retrospective |
| `Shift+S` | Quick add to sprint |

## CLI Commands

```bash
# List sprints
ltf1 sprint list

# Show sprint details
ltf1 sprint show <sprint-id>

# Start sprint
ltf1 sprint start <sprint-id>

# Close sprint
ltf1 sprint close <sprint-id> --move-to backlog

# Sprint report
ltf1 sprint report <sprint-id> --format pdf
```

## Future Enhancements

- AI-powered sprint planning
- Predictive completion dates
- Risk assessment
- Cross-team dependencies
- Advanced analytics

## Related Documentation

- [Task Management](./task-management.md) - Managing sprint tasks
- [Team Activity](./team-activity.md) - Sprint activity tracking
- [Core Concepts](./core-concepts.md) - Sprint methodology
- [API Documentation](../api/convex-functions.md) - Technical details