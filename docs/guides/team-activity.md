# Team Activity Tracking Guide

LTF1 provides comprehensive real-time team activity tracking and monitoring capabilities. This guide covers the activity feed, presence system, browser resource monitoring, and related features.

## Overview

Team activity tracking enables:
- Real-time visibility into what team members are doing
- Browser resource monitoring (CPU, memory, network)
- Team presence and status indicators
- Historical activity logs
- Performance insights and alerts

## Activity Feed

The activity feed is the central hub for team visibility, showing all actions across your workspace in real-time.

### Activity Types

Activities are automatically logged for:

#### Task Activities
- Task created/updated/deleted
- Status changes (todo → in_progress → done)
- Assignee changes
- Priority updates
- Comments added
- Time logged

#### Project Activities
- Project created/archived
- Team member added/removed
- Sprint created/started/completed
- Settings changed

#### Team Activities
- Member joined workspace
- Profile updated
- Status changed (active/busy/away)
- Skills added/updated

### Activity Structure

Each activity entry contains:
```typescript
{
  type: "task_status_changed",
  userId: "user_123",
  timestamp: Date.now(),
  metadata: {
    taskId: "task_456",
    projectId: "project_789",
    oldStatus: "todo",
    newStatus: "in_progress"
  }
}
```

### Filtering Activities

Filter the activity feed by:
- **Activity Type**: Show only specific types
- **User**: Activities by specific team members
- **Project**: Activities in certain projects
- **Time Range**: Today, This Week, Custom range

Example filter usage:
```typescript
const activities = useQuery(api.activity.queries.getActivities, {
  filters: {
    types: ["task_created", "task_completed"],
    userId: selectedUser,
    projectId: currentProject,
    since: startOfDay(new Date())
  }
})
```

## Browser Resource Monitoring

LTF1 monitors browser resource usage to help identify performance issues and optimize team productivity.

### Monitored Metrics

1. **CPU Usage**
   - Current utilization percentage
   - Historical trends
   - Spike detection

2. **Memory Usage**
   - RAM consumption
   - Memory pressure warnings
   - Garbage collection indicators

3. **Network Activity**
   - Active connections
   - Data transfer rates
   - Latency measurements

### Performance Indicators

The system displays performance status:
- 🟢 **Good**: All metrics within normal range
- 🟡 **Warning**: One or more metrics elevated
- 🔴 **Critical**: Performance impacted

### Resource Monitoring UI

```tsx
// Performance widget shows:
CPU: ████░░░░░░ 42%
RAM: ██████░░░░ 58%
NET: ██░░░░░░░░ 15ms
```

### Performance Alerts

Automatic alerts trigger when:
- CPU usage > 80% for 30 seconds
- Memory usage > 90%
- Network latency > 500ms
- Page becomes unresponsive

## Team Presence System

Real-time team presence shows who's online and what they're working on.

### Presence States

1. **Online** 🟢
   - Actively using the application
   - Last activity < 1 minute

2. **Away** 🟡
   - No activity for 5-15 minutes
   - Auto-away detection

3. **Offline** ⚫
   - No activity > 15 minutes
   - Manually set offline
   - Browser closed

### Current Activity Display

Shows what team members are currently doing:
```
John Doe 🟢 Viewing Task PROJ-123
Jane Smith 🟢 Editing Sprint "Q1 Goals"
Bob Wilson 🟡 Away (10 min)
```

### Presence API

```typescript
// Get online team members
const onlineMembers = useQuery(
  api.presence.queries.getOnlineMembers,
  { workspaceId }
)

// Update current activity
const updateActivity = useMutation(
  api.presence.mutations.updateActivity
)

await updateActivity({
  activity: "Reviewing PR #42",
  location: "/projects/web/pulls/42"
})
```

## Integration Features

### With Developer Profiles
- Status syncs with developer profile
- Shows user's local time
- Displays current workload

### With Task Management
- Shows who's working on what
- Task assignment considers availability
- Time tracking integration

### With Project Management
- Team capacity visualization
- Sprint participant tracking
- Resource allocation insights

## Activity Dashboard

The main activity dashboard (`/activity`) provides:

### Team Overview
- Currently online members
- Active tasks being worked on
- Recent completions
- Performance metrics

### Activity Timeline
- Chronological activity feed
- Grouped by time periods
- Expandable details
- Quick actions

### Performance Metrics
- Team productivity trends
- Resource usage patterns
- Bottleneck identification
- Historical comparisons

## Configuration

### Activity Settings

Configure activity tracking in workspace settings:

```typescript
{
  trackingEnabled: true,
  activityTypes: {
    tasks: true,
    projects: true,
    team: true,
    system: false
  },
  retentionDays: 90,
  performanceMonitoring: {
    enabled: true,
    cpuThreshold: 80,
    memoryThreshold: 90,
    alertsEnabled: true
  }
}
```

### Privacy Controls

- Users can hide specific activities
- Admins can configure what's tracked
- Option to anonymize certain data
- GDPR compliance features

## Best Practices

### For Users
1. **Update your status** when going away
2. **Review activity feed** daily for updates
3. **Monitor performance** indicators
4. **Use filters** to focus on relevant activities

### For Admins
1. **Configure appropriate** retention periods
2. **Set reasonable** performance thresholds
3. **Review activity patterns** for insights
4. **Use data for** capacity planning

### For Developers
1. **Log meaningful activities** with context
2. **Batch activity updates** when possible
3. **Include relevant metadata** in activities
4. **Handle performance data** responsibly

## Activity Analytics

### Team Insights
- Most active hours
- Collaboration patterns
- Task completion rates
- Performance trends

### Individual Metrics
- Personal activity history
- Productivity patterns
- Resource usage profile
- Skill utilization

### Project Analytics
- Activity by project phase
- Team engagement levels
- Bottleneck identification
- Sprint activity patterns

## Troubleshooting

### Missing Activities
- Check filter settings
- Verify tracking is enabled
- Ensure proper permissions
- Check date range

### Performance Issues
- Review resource monitor
- Check browser extensions
- Clear cache if needed
- Disable unused features

### Presence Not Updating
- Check WebSocket connection
- Verify browser permissions
- Review console for errors
- Try manual status update

## API Reference

### Activity Queries

```typescript
// Get recent activities
api.activity.queries.getActivities

// Get activity summary
api.activity.queries.getActivitySummary

// Get user activity
api.activity.queries.getUserActivity
```

### Presence Queries

```typescript
// Get online users
api.presence.queries.getOnlineMembers

// Get user presence
api.presence.queries.getUserPresence

// Get team status
api.presence.queries.getTeamStatus
```

### Monitoring Queries

```typescript
// Get performance metrics
api.monitoring.queries.getPerformanceMetrics

// Get resource usage
api.monitoring.queries.getResourceUsage

// Get alerts
api.monitoring.queries.getActiveAlerts
```

## Advanced Features

### Custom Activity Types
Define project-specific activities:
```typescript
await logActivity({
  type: "custom_code_review",
  metadata: {
    pullRequest: "42",
    reviewType: "security",
    findings: 3
  }
})
```

### Activity Webhooks
Send activities to external services:
- Slack notifications
- Email digests
- Analytics platforms
- Custom integrations

### Performance Optimization
- Activity batching
- Intelligent sampling
- Data compression
- Efficient queries

## Future Enhancements

### Planned Features
- AI-powered insights
- Predictive analytics
- Advanced filtering
- Mobile app support

### Integration Plans
- IDE activity tracking
- Git commit integration
- Calendar synchronization
- Third-party tool monitoring

## Related Documentation

- [Developer Profiles](./developer-profiles.md) - User status and presence
- [Task Management](./task-management.md) - Task activity tracking
- [Core Concepts](./core-concepts.md) - System architecture
- [API Documentation](../api/convex-functions.md) - Technical details