# Developer Profiles Guide

Developer profiles are a central feature in LTF1, enabling team collaboration, skill tracking, and intelligent task assignment. This guide covers all aspects of the developer profile system.

## Overview

Each user in LTF1 has a developer profile that includes:
- Personal information and bio
- Technical skills and expertise levels
- Working hours and availability
- Real-time status indicators
- GitHub statistics (coming soon)
- Contribution metrics

## Profile Components

### Basic Information
- **Name**: Display name for the user
- **Email**: Primary contact email
- **Role**: Current role in the organization
- **Bio**: Personal introduction/about section
- **Avatar**: Profile picture (via Clerk)

### Professional Details

#### Skills and Expertise
Skills are categorized by proficiency level:
- **Expert**: Deep knowledge, can mentor others
- **Proficient**: Solid working knowledge
- **Learning**: Currently developing this skill

Example structure:
```typescript
technologies: [
  { name: "React", level: "expert" },
  { name: "TypeScript", level: "proficient" },
  { name: "Rust", level: "learning" }
]
```

#### Working Preferences
- **Timezone**: User's local timezone
- **Working Hours**: Preferred work schedule
- **Availability**: Full-time, Part-time, Contract
- **Work Style**: Description of working preferences

### Status System

Developer status is shown throughout the application:

#### Status Types
1. **Active** 🟢 - Currently working
2. **Busy** 🟡 - In deep focus/meeting
3. **Away** 🟠 - Temporarily away
4. **Offline** ⚫ - Not available

#### Automatic Status Updates
- Status changes to "Away" after 5 minutes of inactivity
- Returns to previous status on activity
- Can be manually overridden

## Creating and Editing Profiles

### First-Time Setup
1. Navigate to `/profile` or click your avatar
2. Click "EDIT PROFILE" button
3. Fill in required fields:
   - Role
   - Timezone
   - At least one skill

### Profile Completion Tracking
The system tracks profile completeness:
- **Complete**: Has role, timezone, skills, bio, availability, and interests
- **Incomplete**: Missing required fields
- Visual indicator shows completion status

### Editing Your Profile

```typescript
// Profile update structure
{
  role: "Senior Developer",
  bio: "Full-stack developer passionate about React and TypeScript",
  timezone: "America/New_York",
  workingHours: {
    start: "09:00",
    end: "17:00"
  },
  availability: "full-time",
  technologies: [
    { name: "React", level: "expert" },
    { name: "Node.js", level: "proficient" }
  ],
  skills: ["Frontend", "Backend", "DevOps"],
  interests: ["Machine Learning", "Open Source"],
  careerGoals: "Lead a engineering team",
  workStyle: "Prefer async communication"
}
```

## Team Features

### Expertise Matrix
View your team's collective skills:
- Grid view of all team members and their skills
- Filter by skill to find experts
- Identify skill gaps in the team

### Smart Reviewer Suggestions
When creating pull requests or needing code review:
- System suggests reviewers based on:
  - Expertise in relevant technologies
  - Current availability
  - Past review history
  - Workload balance

### Skill-Based Task Assignment
Tasks can be auto-suggested to developers based on:
- Required skills matching developer expertise
- Current workload
- Availability status

## UI Components

### DeveloperProfileCard
Displays summary information:
```tsx
<DeveloperProfileCard 
  userId={userId}
  showStatus={true}
  showSkills={true}
  onClick={handleProfileClick}
/>
```

### DeveloperStatusIndicator
Shows real-time status:
```tsx
<DeveloperStatusIndicator 
  userId={userId}
  size="sm" // xs, sm, md, lg
  showLabel={true}
/>
```

### UserDisplay
Compact user representation:
```tsx
<UserDisplay
  userId={userId}
  size="sm"
  showName={true}
  showStatus={true}
  compact={false}
/>
```

## Integration Points

### Task Assignment
- View developer profiles when assigning tasks
- See current workload and expertise
- Check availability before assignment

### Team Page
- Browse all team members' profiles
- View expertise distribution
- Identify team strengths and gaps

### Activity Tracking
- Profile updates logged in activity feed
- Status changes tracked
- Skill additions notified to team

## API Reference

### Queries

```typescript
// Get a developer profile
const profile = useQuery(
  api.developers.queries.getDeveloperProfile,
  { userId }
)

// Search developers by skill
const developers = useQuery(
  api.developers.queries.searchDevelopers,
  { skills: ["React", "TypeScript"] }
)

// Get team expertise matrix
const matrix = useQuery(
  api.developers.queries.getTeamExpertiseMatrix,
  { workspaceId }
)
```

### Mutations

```typescript
// Update profile
const updateProfile = useMutation(
  api.developers.mutations.updateDeveloperProfile
)

// Update status
const updateStatus = useMutation(
  api.developers.mutations.updateStatus
)

// Update tech stack
const updateTechStack = useMutation(
  api.developers.mutations.updateTechStack
)
```

## Best Practices

### For Users
1. **Keep profile updated**: Accurate skills help with task assignment
2. **Set realistic availability**: Helps with workload management
3. **Update status**: Let team know when you're busy
4. **Add all relevant skills**: Better matching for tasks

### For Developers
1. **Use proper components**: Don't access profile data directly
2. **Handle loading states**: Profiles may take time to load
3. **Respect privacy**: Only show appropriate information
4. **Cache when possible**: Reduce unnecessary queries

## Common Use Cases

### Finding an Expert
1. Go to Team page
2. Use skill filter or search
3. View matching developers
4. Check their availability
5. Reach out or assign task

### Updating Your Status
1. Click status indicator (top bar)
2. Select new status
3. Optionally add status message
4. Status updates across all views

### Building a Team
1. Review expertise matrix
2. Identify missing skills
3. Use data for hiring decisions
4. Balance workload based on expertise

## Troubleshooting

### Profile Not Saving
- Check browser console for errors
- Ensure all required fields are filled
- Verify Convex connection is active
- Try refreshing the page

### Status Not Updating
- Check if AFK detection is interfering
- Manually set status to override
- Verify WebSocket connection
- Clear browser cache if needed

### Missing Skills/Data
- Ensure profile was saved successfully
- Check if data migration is needed
- Verify user permissions
- Contact admin if issues persist

## Future Features

### GitHub Integration (Coming Soon)
- Automatic stats synchronization
- Contribution graphs
- Language statistics
- Pull request metrics

### AI-Powered Suggestions
- Smart skill recommendations
- Learning path suggestions
- Team composition optimization

### Advanced Analytics
- Skill development tracking
- Performance metrics
- Team capability reports

## Related Documentation

- [Team Activity Tracking](./team-activity.md) - How profiles integrate with activity
- [Task Management](./task-management.md) - Using profiles for task assignment
- [API Documentation](../api/convex-functions.md) - Technical API details