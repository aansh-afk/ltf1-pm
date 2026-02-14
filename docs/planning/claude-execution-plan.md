# 🎯 CLAUDE EXECUTION PLAN - LTF1 100% FEATURE COMPLETION

## 🧠 SELF-ALIGNMENT PROMPT
**When I deviate, remind me:** "Read CLAUDE_EXECUTION_PLAN.md - Stay on the path"

### My Core Directives
- I am implementing missing features to achieve 100% PRD completion
- I follow this plan systematically, phase by phase, task by task
- I do not create unnecessary files or documentation
- I test everything I implement
- I mark tasks complete only when verified working
- If I get distracted or go off-track, I return to this document
- This is my single source of truth for what needs to be done

### My Mental Model
```
Current Task = Find next unchecked [ ] in current phase
IF task_complete THEN check_off AND move_to_next
IF phase_complete THEN move_to_next_phase  
IF errors THEN check convex_rules.txt
IF deviation THEN return_to_plan
NEVER skip_ahead OR do_random_tasks
```

## 📋 EXECUTION PRINCIPLES
1. **NEVER** create new files unless absolutely necessary - always prefer editing existing files
2. **ALWAYS** test after implementation - run `npm run dev` and `npx convex dev`
3. **FOLLOW** existing patterns in the codebase - consistency over innovation
4. **VALIDATE** each feature works before marking complete
5. **USE** convex_rules.txt for any Convex schema/backend errors

## 🏗️ CURRENT STATE
- **Completion:** 56% → Target: 100%
- **Missing Features:** 44 major features
- **Non-functional Issues:** 15+ UI/UX/Performance issues
- **Timeline:** Execute systematically, one phase at a time

---

# PHASE 1: CRITICAL FIXES & FOUNDATION [PRIORITY: URGENT]

## 1.1 Fix Non-Functional Issues

### Accessibility Fixes
```bash
# Files to edit:
apps/web/src/components/ui/button.tsx
apps/web/src/components/ui/input.tsx
apps/web/src/components/ui/modal.tsx
apps/web/src/components/features/task/TaskCard.tsx
```
- [ ] Add ARIA labels to all interactive elements
- [ ] Implement keyboard navigation (Tab, Enter, Escape)
- [ ] Fix color contrast issues (minimum 4.5:1 ratio)
- [ ] Add focus indicators (outline, ring)
- [ ] Screen reader announcements for dynamic content

### Performance Optimizations
```bash
# Files to optimize:
apps/web/src/pages/ProjectManagementPage.tsx
apps/web/src/components/features/task/TaskBoard.tsx
convex/tasks.ts
```
- [ ] Implement virtual scrolling for large lists (react-window)
- [ ] Add pagination to Convex queries (limit: 50)
- [ ] Optimize real-time subscriptions (debounce)
- [ ] Lazy load heavy components (React.lazy)
- [ ] Implement image optimization (next/image)

### Security Enhancements
```bash
# Files to create/edit:
apps/web/src/middleware/rateLimit.ts (NEW - exception to rule)
apps/web/src/lib/sanitize.ts (NEW - exception to rule)
convex/helpers/validation.ts
```
- [ ] Add rate limiting middleware
- [ ] Implement input sanitization (DOMPurify)
- [ ] Add CSP headers in next.config.js
- [ ] Implement 2FA support via Clerk

## 1.2 Global Search Implementation

### Search Infrastructure
```bash
# Edit existing files:
apps/web/src/components/layout/Header.tsx
convex/search.ts
apps/web/src/lib/search.ts
```
```typescript
// convex/search.ts - Add to existing file
export const globalSearch = query({
  args: { 
    query: v.string(),
    filters: v.optional(v.object({
      type: v.optional(v.array(v.string())),
      workspace: v.optional(v.id("workspaces"))
    }))
  },
  handler: async (ctx, args) => {
    // Search across: tasks, projects, sprints, meetings, users
    // Use Convex text search indexes
    // Return unified results with type indicators
  }
})
```

### Search UI Component
```bash
# Edit existing:
apps/web/src/components/features/search/SearchModal.tsx
```
- [ ] Command palette style (Cmd+K)
- [ ] Real-time search results
- [ ] Search history
- [ ] Filter by type/date/user
- [ ] Keyboard navigation

---

# PHASE 2: PROJECT VISUALIZATION VIEWS [PRIORITY: HIGH]

## 2.1 Gantt Chart View

### Implementation Plan
```bash
# Install dependencies:
npm install @bryntum/gantt @bryntum/gantt-react

# Edit existing files:
apps/web/src/components/features/project/GanttView.tsx (likely exists)
apps/web/src/pages/ProjectManagementPage.tsx
convex/tasks.ts
```

### Data Model Extensions
```typescript
// convex/schema.ts - Add to tasks table
dependencies: v.array(v.id("tasks")),
startDate: v.optional(v.number()),
endDate: v.optional(v.number()),
progress: v.optional(v.number()), // 0-100
milestone: v.optional(v.boolean()),
criticalPath: v.optional(v.boolean())
```

### Component Structure
```typescript
// Features to implement:
- Task dependencies visualization
- Drag to reschedule
- Critical path highlighting
- Milestone markers
- Resource allocation view
- Export to PDF/PNG
- Zoom levels (day/week/month/quarter)
```

## 2.2 Calendar View

### Implementation
```bash
# Install:
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/interaction

# Edit:
apps/web/src/components/features/calendar/CalendarView.tsx
apps/web/src/pages/CalendarPage.tsx (might need to create)
```

### Features
- [ ] Task deadlines display
- [ ] Meeting events
- [ ] Sprint start/end dates
- [ ] Drag & drop rescheduling
- [ ] Multi-view (month/week/day)
- [ ] Recurring events
- [ ] Team member calendars

## 2.3 Timeline View

```bash
# Install:
npm install vis-timeline react-vis-timeline

# Edit:
apps/web/src/components/features/project/TimelineView.tsx
```
- [ ] Project timeline with phases
- [ ] Milestone tracking
- [ ] Team member swim lanes
- [ ] Zoom and pan
- [ ] Today indicator
- [ ] Export functionality

## 2.4 Roadmap View

```bash
# Edit:
apps/web/src/components/features/project/RoadmapView.tsx
```
- [ ] Quarter/month grouping
- [ ] Epic/feature hierarchy
- [ ] Progress indicators
- [ ] Dependency lines
- [ ] Strategic goals alignment
- [ ] Public sharing option

---

# PHASE 3: GIT INTEGRATIONS [PRIORITY: HIGH]

## 3.1 GitLab Integration

### OAuth Setup
```bash
# Edit:
apps/web/src/lib/integrations/gitlab.ts
convex/integrations/gitlab/webhooks.ts
convex/integrations/gitlab/sync.ts
```

### Implementation Checklist
- [ ] GitLab OAuth flow (use existing GitHub pattern)
- [ ] Webhook handlers for MR events
- [ ] Issue synchronization
- [ ] Pipeline status tracking
- [ ] Branch protection sync
- [ ] Comment bidirectional sync

## 3.2 Bitbucket Integration

```bash
# Edit:
apps/web/src/lib/integrations/bitbucket.ts
convex/integrations/bitbucket/webhooks.ts
convex/integrations/bitbucket/sync.ts
```
- [ ] Bitbucket OAuth/App passwords
- [ ] PR webhook handling
- [ ] Pipeline integration
- [ ] Code review sync
- [ ] Repository insights

## 3.3 Generic Git Support

```bash
# Edit:
apps/web/src/lib/integrations/git-generic.ts
```
- [ ] Git SSH/HTTPS support
- [ ] Self-hosted Git servers
- [ ] Gitea/Gogs support
- [ ] Basic commit tracking
- [ ] Branch management

---

# PHASE 4: EXPORT & REPORTING [PRIORITY: MEDIUM]

## 4.1 PDF Generation

### Implementation
```bash
# Install:
npm install @react-pdf/renderer

# Edit:
apps/web/src/lib/export/pdf.ts
apps/web/src/components/features/reports/PDFGenerator.tsx
```

### Report Types
- [ ] Sprint reports
- [ ] Project status reports
- [ ] Team performance reports
- [ ] Task lists
- [ ] Meeting minutes
- [ ] Gantt chart export

## 4.2 Excel Export

```bash
# Install:
npm install exceljs

# Edit:
apps/web/src/lib/export/excel.ts
```
- [ ] Task data export
- [ ] Time tracking sheets
- [ ] Resource allocation
- [ ] Budget reports
- [ ] Custom field export

## 4.3 Report Builder

```bash
# Edit:
apps/web/src/components/features/reports/ReportBuilder.tsx
apps/web/src/pages/ReportsPage.tsx
```
- [ ] Drag-drop report designer
- [ ] Widget library
- [ ] Data source selection
- [ ] Schedule reports
- [ ] Email delivery
- [ ] Report templates

---

# PHASE 5: TIME & RESOURCE MANAGEMENT [PRIORITY: HIGH]

## 5.1 Time Tracking

### Implementation
```bash
# Edit:
apps/web/src/components/features/time/TimeTracker.tsx
apps/web/src/components/features/time/TimeEntry.tsx
convex/timeEntries.ts
```

### Schema Addition
```typescript
// convex/schema.ts - New table
timeEntries: defineTable({
  taskId: v.id("tasks"),
  userId: v.id("users"),
  startTime: v.number(),
  endTime: v.optional(v.number()),
  duration: v.optional(v.number()),
  description: v.optional(v.string()),
  billable: v.optional(v.boolean()),
  approved: v.optional(v.boolean())
})
```

### Features
- [ ] Timer widget (start/stop/pause)
- [ ] Manual time entry
- [ ] Timesheet view
- [ ] Approval workflow
- [ ] Reports & analytics
- [ ] Integration with tasks

## 5.2 Resource Management

```bash
# Edit:
apps/web/src/components/features/resources/ResourcePlanner.tsx
apps/web/src/components/features/resources/CapacityView.tsx
convex/resources.ts
```
- [ ] Team capacity planning
- [ ] Skill matrix
- [ ] Availability calendar
- [ ] Workload balancing
- [ ] Resource allocation
- [ ] Utilization reports

---

# PHASE 6: INTEGRATIONS [PRIORITY: MEDIUM]

## 6.1 Slack Integration

```bash
# Edit:
apps/web/src/lib/integrations/slack.ts
convex/integrations/slack/events.ts
convex/integrations/slack/commands.ts
```
- [ ] OAuth flow
- [ ] Slash commands (/ltf1)
- [ ] Event notifications
- [ ] Channel sync
- [ ] DM notifications
- [ ] Rich message formatting

## 6.2 API Layer

```bash
# Edit:
apps/web/src/pages/api/v1/[...path].ts
apps/web/src/lib/api/handlers.ts
```
- [ ] REST endpoints
- [ ] GraphQL schema
- [ ] Authentication
- [ ] Rate limiting
- [ ] Documentation
- [ ] SDK generation

---

# PHASE 7: ENTERPRISE FEATURES [PRIORITY: LOW]

## 7.1 SSO/SAML

```bash
# Edit:
apps/web/src/lib/auth/sso.ts
apps/web/src/lib/auth/saml.ts
```
- [ ] SAML 2.0 support
- [ ] Identity provider config
- [ ] User provisioning
- [ ] SCIM support
- [ ] Directory sync

## 7.2 Audit Logs

```bash
# Edit:
convex/audit.ts
apps/web/src/components/features/admin/AuditLog.tsx
```
- [ ] Comprehensive logging
- [ ] Retention policies
- [ ] Export capabilities
- [ ] Compliance reports
- [ ] Search & filter

## 7.3 Custom Fields

```bash
# Edit:
apps/web/src/components/features/admin/CustomFields.tsx
convex/customFields.ts
```
- [ ] Field builder UI
- [ ] Multiple types (text, number, date, select)
- [ ] Validation rules
- [ ] Calculated fields
- [ ] Field permissions

## 7.4 Workflow Automation

```bash
# Edit:
apps/web/src/components/features/automation/WorkflowBuilder.tsx
convex/automation.ts
```
- [ ] Visual workflow designer
- [ ] Trigger conditions
- [ ] Action library
- [ ] Conditional logic
- [ ] Testing sandbox

---

# PHASE 8: MOBILE & COLLABORATION [PRIORITY: LOW]

## 8.1 Collaborative Features

### In-app Chat
```bash
# Edit:
apps/web/src/components/features/chat/ChatInterface.tsx
convex/messages.ts
```
- [ ] Direct messages
- [ ] Group channels
- [ ] File sharing
- [ ] Message search
- [ ] Reactions/threads

### Document Collaboration
```bash
# Install:
npm install @tiptap/react yjs y-prosemirror

# Edit:
apps/web/src/components/features/docs/CollaborativeEditor.tsx
```
- [ ] Real-time editing
- [ ] Cursor presence
- [ ] Comments
- [ ] Version history
- [ ] Export options

---

# 🔄 EXECUTION WORKFLOW

## Daily Process
1. **Check current phase** in this document
2. **Pick next unchecked item** from current phase
3. **Read existing implementation** before editing
4. **Follow existing patterns** in codebase
5. **Test thoroughly** after implementation
6. **Check off completed** items
7. **Commit with descriptive message**

## Testing Checklist (Per Feature)
- [ ] Functionality works as expected
- [ ] No console errors
- [ ] Responsive design maintained
- [ ] Accessibility requirements met
- [ ] Performance acceptable (<3s load)
- [ ] Real-time updates working
- [ ] Error states handled
- [ ] Loading states present

## Common Patterns to Follow

### Convex Queries
```typescript
// Always use this pattern
export const queryName = query({
  args: { /* validated args */ },
  handler: async (ctx, args) => {
    // Check auth
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthorized")
    
    // Execute query
    // Return data
  }
})
```

### Component Structure
```typescript
// Follow existing pattern
export default function ComponentName({ props }: Props) {
  // Hooks first
  // State management
  // Effects
  // Handlers
  // Render
}
```

### API Routes
```typescript
// Use existing middleware pattern
export async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Rate limit check
  // Auth check
  // Validation
  // Business logic
  // Response
}
```

---

# 📊 PROGRESS TRACKING

## Phase Completion Status
- [ ] Phase 1: Critical Fixes (0/15 tasks)
- [ ] Phase 2: Visualization Views (0/20 tasks)
- [ ] Phase 3: Git Integrations (0/15 tasks)
- [ ] Phase 4: Export & Reporting (0/12 tasks)
- [ ] Phase 5: Time & Resources (0/10 tasks)
- [ ] Phase 6: Integrations (0/8 tasks)
- [ ] Phase 7: Enterprise (0/15 tasks)
- [ ] Phase 8: Collaboration (0/5 tasks)

**Total: 0/100 tasks completed**

## Rules for Myself
1. **NO SHORTCUTS** - Implement properly or not at all
2. **TEST EVERYTHING** - If it's not tested, it's broken
3. **FOLLOW PATTERNS** - Consistency over creativity
4. **DOCUMENT NOTHING** - Code should be self-documenting
5. **EDIT > CREATE** - Modify existing files whenever possible
6. **ONE TASK AT A TIME** - Complete before moving on
7. **USE CONVEX_RULES.TXT** - For any Convex errors

## Next Action
**START WITH PHASE 1.1 - ACCESSIBILITY FIXES**
Begin by editing `apps/web/src/components/ui/button.tsx` to add ARIA labels.

---

*This plan is my bible. I will follow it systematically until 100% completion is achieved.*