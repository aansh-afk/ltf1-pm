// BlockNote-compatible document templates

export interface PageTemplate {
  id: string
  name: string
  icon: string
  description: string
  category: "general" | "engineering" | "product" | "meetings" | "personal"
  content: any[]
}

function b(type: string, text: string | any[], props?: any): any {
  const content = typeof text === "string"
    ? [{ type: "text" as const, text, styles: {} }]
    : text
  const block: any = { type, content }
  if (props && Object.keys(props).length > 0) block.props = props
  return block
}

function bold(text: string): any {
  return { type: "text", text, styles: { bold: true } }
}

function italic(text: string): any {
  return { type: "text", text, styles: { italic: true } }
}

function code(text: string): any {
  return { type: "text", text, styles: { code: true } }
}

function plain(text: string): any {
  return { type: "text", text, styles: {} }
}

// ── Welcome Page (auto-created for new users) ──────────

export const WELCOME_PAGE_CONTENT: any[] = [
  b("heading", "Welcome to Pages", { level: 1 }),
  b("paragraph", [plain("Your workspace for "), bold("thinking, planning, and building"), plain(". Pages is a block-based editor built for speed — type "), code("/"), plain(" to insert blocks, drag to reorder, and let your ideas flow.")]),

  b("heading", "Quick Start", { level: 2 }),
  b("checkListItem", "Type / to open the slash menu and insert any block type", { checked: false }),
  b("checkListItem", "Drag the ⠿ handle on the left to reorder blocks", { checked: false }),
  b("checkListItem", "Select text to see the formatting toolbar (bold, italic, code, link)", { checked: false }),
  b("checkListItem", "Click the page icon above to pick an emoji", { checked: false }),
  b("checkListItem", "Click the title to rename your page", { checked: false }),

  b("heading", "Block Types", { level: 2 }),
  b("paragraph", [plain("Pages supports "), bold("10 block types"), plain(" — all insertable via the "), code("/"), plain(" slash menu:")]),
  b("numberedListItem", [bold("Paragraph"), plain(" — regular text, the default block")]),
  b("numberedListItem", [bold("Heading"), plain(" — h1, h2, h3 for document structure (type "), code("# "), code("## "), code("### "), plain(")")]),
  b("numberedListItem", [bold("Bullet List"), plain(" — unordered lists (type "), code("- "), plain("or "), code("* "), plain(")")]),
  b("numberedListItem", [bold("Numbered List"), plain(" — ordered lists (type "), code("1. "), plain(")")]),
  b("numberedListItem", [bold("To-Do / Checkbox"), plain(" — trackable tasks (type "), code("[] "), plain(")")]),
  b("numberedListItem", [bold("Quote"), plain(" — callouts and highlights (type "), code("> "), plain(")")]),
  b("numberedListItem", [bold("Code Block"), plain(" — syntax-highlighted code (type "), code("``` "), plain(")")]),
  b("numberedListItem", [bold("Divider"), plain(" — horizontal rule (type "), code("--- "), plain(")")]),
  b("numberedListItem", [bold("Toggle List"), plain(" — collapsible sections")]),
  b("numberedListItem", [bold("Callout"), plain(" — highlighted information boxes")]),

  b("heading", "Markdown Shortcuts", { level: 2 }),
  b("paragraph", [plain("Type these at the start of a new line — they auto-convert just like Obsidian:")]),
  b("bulletListItem", [code("**text**"), plain(" → "), bold("Bold")]),
  b("bulletListItem", [code("*text*"), plain(" → "), italic("Italic")]),
  b("bulletListItem", [code("`text`"), plain(" → "), code("Inline Code")]),
  b("bulletListItem", [code("~~text~~"), plain(" → Strikethrough")]),
  b("bulletListItem", [code("Cmd+B"), plain(" Bold, "), code("Cmd+I"), plain(" Italic, "), code("Cmd+K"), plain(" Link")]),

  b("heading", "Templates", { level: 2 }),
  b("paragraph", [plain("Start fast with "), bold("built-in templates"), plain(" or generate custom ones with "), bold("AI"), plain(". Click "), code("FROM TEMPLATE"), plain(" on the pages list to browse meeting notes, sprint plans, PRDs, and more.")]),
  b("paragraph", [plain("Or describe what you need and let AI create a template for you — perfect for speedy automation.")]),

  b("heading", "Features", { level: 2 }),
  b("bulletListItem", [bold("Auto-Save"), plain(" — changes save automatically after 1.5 seconds")]),
  b("bulletListItem", [bold("Nested Pages"), plain(" — create sub-pages for deep organization")]),
  b("bulletListItem", [bold("Page Icons"), plain(" — emoji icons for visual organization")]),
  b("bulletListItem", [bold("Archive & Restore"), plain(" — soft-delete with trash recovery")]),
  b("bulletListItem", [bold("Collaboration"), plain(" — see who else is editing in real-time")]),
  b("bulletListItem", [bold("Page Sidebar"), plain(" — navigate your page tree while editing")]),
  b("bulletListItem", [bold("Search"), plain(" — find any page instantly")]),

  b("heading", "Keyboard Shortcuts", { level: 2 }),
  b("bulletListItem", [code("Tab"), plain(" — indent block")]),
  b("bulletListItem", [code("Shift+Tab"), plain(" — outdent block")]),
  b("bulletListItem", [code("Enter"), plain(" — new block below")]),
  b("bulletListItem", [code("Backspace"), plain(" on empty block — delete and merge up")]),
  b("bulletListItem", [code("/"), plain(" — open slash command menu")]),

  b("paragraph", [italic("Pro tip: "), plain("combine Pages with Tasks and Sprints for a full project management workflow. Link your docs to sprints, embed code snippets, and track progress — all in one place.")]),
]

// ── LTF1 Tutorial ──────────────────────────────────────

export const LTF1_TUTORIAL_CONTENT: any[] = [
  b("heading", "LTF1 — Getting Started", { level: 1 }),
  b("paragraph", [plain("LTF1 is a "), bold("developer-first project management platform"), plain(" with workspaces, tasks, sprints, teams, and now Pages. Here's how everything connects.")]),

  b("heading", "1. Workspaces", { level: 2 }),
  b("paragraph", "A workspace is your team's home base. Everything — projects, tasks, sprints, pages — lives inside a workspace."),
  b("checkListItem", "Go to WORKSPACES in the sidebar to create or switch workspaces", { checked: false }),
  b("checkListItem", "Invite teammates via email from workspace settings", { checked: false }),

  b("heading", "2. Projects", { level: 2 }),
  b("paragraph", "Projects group related work. Each project has its own tasks, sprints, and settings."),
  b("checkListItem", "Go to PROJECTS to create a new project", { checked: false }),
  b("checkListItem", "Set up custom fields for your project's needs", { checked: false }),

  b("heading", "3. Tasks", { level: 2 }),
  b("paragraph", [plain("Tasks are the atomic unit of work. Each task has a "), bold("status"), plain(", "), bold("priority"), plain(", "), bold("assignee"), plain(", "), bold("story points"), plain(", and "), bold("labels"), plain(".")]),
  b("bulletListItem", [plain("Create tasks from the "), bold("TASKS"), plain(" page or the sprint board")]),
  b("bulletListItem", "Drag tasks between columns to update status"),
  b("bulletListItem", [plain("Use "), code("Cmd+K"), plain(" command palette for quick task creation")]),

  b("heading", "4. Sprints", { level: 2 }),
  b("paragraph", "Run agile sprints with backlog management, burndown charts, and velocity tracking."),
  b("checkListItem", "Move tasks from the backlog into an active sprint", { checked: false }),
  b("checkListItem", "Track progress with the burndown chart", { checked: false }),
  b("checkListItem", "Complete sprints to see velocity trends", { checked: false }),

  b("heading", "5. Pages", { level: 2 }),
  b("paragraph", [plain("You're reading one right now! Pages are "), bold("rich documents"), plain(" for meeting notes, PRDs, design docs, and anything that needs more than a task description.")]),
  b("bulletListItem", [plain("Use "), bold("templates"), plain(" to start fast")]),
  b("bulletListItem", [plain("Generate custom templates with "), bold("AI")]),
  b("bulletListItem", "Nest pages for deep organization"),

  b("heading", "6. Teams & Collaboration", { level: 2 }),
  b("paragraph", "The TEAM page shows your workspace members, their skills, and GitHub connections."),
  b("bulletListItem", "Link your GitHub account in settings for PR tracking"),
  b("bulletListItem", "@mention teammates in task comments"),
  b("bulletListItem", "Set up Slack integration for notifications"),

  b("heading", "7. Keyboard Shortcuts", { level: 2 }),
  b("paragraph", [plain("LTF1 is built for keyboard-first workflows. Press "), code("?"), plain(" anywhere to see all shortcuts.")]),
  b("bulletListItem", [code("Cmd+K"), plain(" — Command palette (create tasks, search, navigate)")]),
  b("bulletListItem", [code("Cmd+B"), plain(" — Toggle sidebar")]),
  b("bulletListItem", [code("Cmd+/"), plain(" — Search")]),

  b("paragraph", [bold("You're all set!"), plain(" Start by creating a project, adding tasks to a sprint, and writing your first doc. LTF1 grows with your team.")]),
]

// ── Built-in Templates ─────────────────────────────────

export const TEMPLATES: PageTemplate[] = [
  {
    id: "meeting-notes",
    name: "Meeting Notes",
    icon: "📋",
    description: "Structured meeting notes with attendees, agenda, action items",
    category: "meetings",
    content: [
      b("heading", "Meeting Notes", { level: 1 }),
      b("paragraph", [bold("Date: "), plain("YYYY-MM-DD  |  "), bold("Time: "), plain("HH:MM")]),
      b("paragraph", [bold("Attendees: "), plain("@name, @name")]),
      b("heading", "Agenda", { level: 2 }),
      b("numberedListItem", "Topic 1"),
      b("numberedListItem", "Topic 2"),
      b("numberedListItem", "Topic 3"),
      b("heading", "Discussion Notes", { level: 2 }),
      b("paragraph", ""),
      b("heading", "Decisions", { level: 2 }),
      b("bulletListItem", "Decision 1 — rationale"),
      b("heading", "Action Items", { level: 2 }),
      b("checkListItem", "Action item — @owner — due date", { checked: false }),
      b("checkListItem", "Action item — @owner — due date", { checked: false }),
      b("checkListItem", "Action item — @owner — due date", { checked: false }),
      b("heading", "Next Meeting", { level: 2 }),
      b("paragraph", [bold("Date: "), plain("TBD  |  "), bold("Topics: "), plain("TBD")]),
    ],
  },
  {
    id: "sprint-planning",
    name: "Sprint Planning",
    icon: "🏃",
    description: "Sprint goals, capacity planning, and task breakdown",
    category: "engineering",
    content: [
      b("heading", "Sprint Planning", { level: 1 }),
      b("paragraph", [bold("Sprint: "), plain("#XX  |  "), bold("Duration: "), plain("2 weeks  |  "), bold("Start: "), plain("YYYY-MM-DD")]),
      b("heading", "Sprint Goal", { level: 2 }),
      b("paragraph", "What is the single most important outcome for this sprint?"),
      b("heading", "Team Capacity", { level: 2 }),
      b("bulletListItem", [plain("Team member 1 — "), bold("8 pts"), plain(" (out 1 day)")]),
      b("bulletListItem", [plain("Team member 2 — "), bold("10 pts"), plain(" (full capacity)")]),
      b("bulletListItem", [plain("Team member 3 — "), bold("6 pts"), plain(" (out 2 days)")]),
      b("paragraph", [bold("Total Capacity: "), plain("24 story points")]),
      b("heading", "Committed Stories", { level: 2 }),
      b("checkListItem", "Story title — X pts — @owner", { checked: false }),
      b("checkListItem", "Story title — X pts — @owner", { checked: false }),
      b("checkListItem", "Story title — X pts — @owner", { checked: false }),
      b("heading", "Risks & Dependencies", { level: 2 }),
      b("bulletListItem", "Risk 1 — mitigation plan"),
      b("bulletListItem", "Dependency on team X — status"),
      b("heading", "Definition of Done", { level: 2 }),
      b("checkListItem", "Code reviewed and merged", { checked: false }),
      b("checkListItem", "Tests passing (unit + integration)", { checked: false }),
      b("checkListItem", "Deployed to staging", { checked: false }),
      b("checkListItem", "Product sign-off", { checked: false }),
    ],
  },
  {
    id: "prd",
    name: "Product Requirements Doc",
    icon: "📐",
    description: "PRD template with problem, solution, scope, and success metrics",
    category: "product",
    content: [
      b("heading", "PRD: Feature Name", { level: 1 }),
      b("paragraph", [bold("Author: "), plain("@name  |  "), bold("Status: "), plain("Draft  |  "), bold("Last Updated: "), plain("YYYY-MM-DD")]),
      b("heading", "Problem Statement", { level: 2 }),
      b("paragraph", "What problem are we solving? Who is affected? What's the impact of not solving it?"),
      b("heading", "Proposed Solution", { level: 2 }),
      b("paragraph", "High-level description of the solution approach."),
      b("heading", "User Stories", { level: 2 }),
      b("bulletListItem", [bold("As a "), plain("[persona], "), bold("I want to "), plain("[action], "), bold("so that "), plain("[benefit]")]),
      b("bulletListItem", [bold("As a "), plain("[persona], "), bold("I want to "), plain("[action], "), bold("so that "), plain("[benefit]")]),
      b("heading", "Scope", { level: 2 }),
      b("heading", "In Scope", { level: 3 }),
      b("checkListItem", "Feature 1", { checked: false }),
      b("checkListItem", "Feature 2", { checked: false }),
      b("heading", "Out of Scope", { level: 3 }),
      b("bulletListItem", "Not included in this iteration"),
      b("heading", "Success Metrics", { level: 2 }),
      b("numberedListItem", "Metric 1 — target value — measurement method"),
      b("numberedListItem", "Metric 2 — target value — measurement method"),
      b("heading", "Technical Considerations", { level: 2 }),
      b("paragraph", "Architecture changes, API contracts, performance requirements, security considerations."),
      b("heading", "Timeline", { level: 2 }),
      b("bulletListItem", [bold("Phase 1: "), plain("MVP — 2 weeks")]),
      b("bulletListItem", [bold("Phase 2: "), plain("Polish — 1 week")]),
      b("bulletListItem", [bold("Phase 3: "), plain("Launch — 1 week")]),
    ],
  },
  {
    id: "bug-report",
    name: "Bug Report",
    icon: "🐛",
    description: "Structured bug report with repro steps and expected behavior",
    category: "engineering",
    content: [
      b("heading", "Bug Report: Title", { level: 1 }),
      b("paragraph", [bold("Severity: "), plain("P0/P1/P2/P3  |  "), bold("Reporter: "), plain("@name  |  "), bold("Date: "), plain("YYYY-MM-DD")]),
      b("heading", "Summary", { level: 2 }),
      b("paragraph", "One-sentence description of the bug."),
      b("heading", "Steps to Reproduce", { level: 2 }),
      b("numberedListItem", "Step 1"),
      b("numberedListItem", "Step 2"),
      b("numberedListItem", "Step 3"),
      b("heading", "Expected Behavior", { level: 2 }),
      b("paragraph", "What should happen."),
      b("heading", "Actual Behavior", { level: 2 }),
      b("paragraph", "What actually happens."),
      b("heading", "Environment", { level: 2 }),
      b("bulletListItem", [bold("Browser: "), plain("Chrome 120")]),
      b("bulletListItem", [bold("OS: "), plain("macOS 14")]),
      b("bulletListItem", [bold("App Version: "), plain("v0.5.0")]),
      b("heading", "Screenshots / Logs", { level: 2 }),
      b("paragraph", "Attach screenshots or paste relevant console logs here."),
      b("heading", "Root Cause Analysis", { level: 2 }),
      b("paragraph", [italic("(To be filled after investigation)")]),
    ],
  },
  {
    id: "standup",
    name: "Daily Standup",
    icon: "☀️",
    description: "Quick daily standup template — yesterday, today, blockers",
    category: "meetings",
    content: [
      b("heading", "Daily Standup", { level: 1 }),
      b("paragraph", [bold("Date: "), plain("YYYY-MM-DD")]),
      b("heading", "Yesterday", { level: 2 }),
      b("checkListItem", "Completed task 1", { checked: true }),
      b("checkListItem", "Completed task 2", { checked: true }),
      b("heading", "Today", { level: 2 }),
      b("checkListItem", "Planned task 1", { checked: false }),
      b("checkListItem", "Planned task 2", { checked: false }),
      b("heading", "Blockers", { level: 2 }),
      b("bulletListItem", "None / Blocker description"),
    ],
  },
  {
    id: "retro",
    name: "Sprint Retrospective",
    icon: "🔄",
    description: "What went well, what didn't, action items for improvement",
    category: "meetings",
    content: [
      b("heading", "Sprint Retrospective", { level: 1 }),
      b("paragraph", [bold("Sprint: "), plain("#XX  |  "), bold("Date: "), plain("YYYY-MM-DD")]),
      b("heading", "What Went Well ✅", { level: 2 }),
      b("bulletListItem", ""),
      b("heading", "What Didn't Go Well ❌", { level: 2 }),
      b("bulletListItem", ""),
      b("heading", "What Can We Improve 🔧", { level: 2 }),
      b("bulletListItem", ""),
      b("heading", "Action Items", { level: 2 }),
      b("checkListItem", "Action — @owner — due date", { checked: false }),
      b("checkListItem", "Action — @owner — due date", { checked: false }),
    ],
  },
  {
    id: "api-design",
    name: "API Design Doc",
    icon: "🔌",
    description: "REST/GraphQL API specification with endpoints and schemas",
    category: "engineering",
    content: [
      b("heading", "API Design: Service Name", { level: 1 }),
      b("paragraph", [bold("Version: "), plain("v1  |  "), bold("Author: "), plain("@name  |  "), bold("Status: "), plain("Draft")]),
      b("heading", "Overview", { level: 2 }),
      b("paragraph", "Brief description of what this API does and who consumes it."),
      b("heading", "Base URL", { level: 2 }),
      b("codeBlock", "https://api.example.com/v1", { language: "text" }),
      b("heading", "Authentication", { level: 2 }),
      b("paragraph", [plain("Bearer token via "), code("Authorization"), plain(" header.")]),
      b("heading", "Endpoints", { level: 2 }),
      b("heading", "GET /resources", { level: 3 }),
      b("paragraph", "List all resources. Supports pagination."),
      b("codeBlock", '{\n  "data": [{ "id": "...", "name": "..." }],\n  "cursor": "...",\n  "hasMore": true\n}', { language: "json" }),
      b("heading", "POST /resources", { level: 3 }),
      b("paragraph", "Create a new resource."),
      b("codeBlock", '// Request\n{\n  "name": "string",\n  "type": "string"\n}\n\n// Response: 201 Created\n{\n  "id": "...",\n  "name": "...",\n  "createdAt": "..."\n}', { language: "json" }),
      b("heading", "Error Codes", { level: 2 }),
      b("bulletListItem", [code("400"), plain(" — Bad Request — invalid input")]),
      b("bulletListItem", [code("401"), plain(" — Unauthorized — missing/invalid token")]),
      b("bulletListItem", [code("404"), plain(" — Not Found")]),
      b("bulletListItem", [code("429"), plain(" — Rate Limited — max 100 req/min")]),
    ],
  },
  {
    id: "decision-log",
    name: "Decision Log",
    icon: "⚖️",
    description: "Track architectural and product decisions with context",
    category: "general",
    content: [
      b("heading", "Decision Log", { level: 1 }),
      b("paragraph", "A record of key decisions for this project. Newest first."),
      b("heading", "Decision: Title", { level: 2 }),
      b("paragraph", [bold("Date: "), plain("YYYY-MM-DD  |  "), bold("Decision Maker: "), plain("@name  |  "), bold("Status: "), plain("Accepted")]),
      b("heading", "Context", { level: 3 }),
      b("paragraph", "What situation prompted this decision?"),
      b("heading", "Options Considered", { level: 3 }),
      b("numberedListItem", [bold("Option A"), plain(" — pros / cons")]),
      b("numberedListItem", [bold("Option B"), plain(" — pros / cons")]),
      b("heading", "Decision", { level: 3 }),
      b("paragraph", "What we decided and why."),
      b("heading", "Consequences", { level: 3 }),
      b("bulletListItem", "Positive consequence"),
      b("bulletListItem", "Trade-off accepted"),
    ],
  },
  {
    id: "weekly-update",
    name: "Weekly Update",
    icon: "📊",
    description: "Team weekly status update — progress, metrics, blockers",
    category: "general",
    content: [
      b("heading", "Weekly Update", { level: 1 }),
      b("paragraph", [bold("Week of: "), plain("YYYY-MM-DD  |  "), bold("Team: "), plain("Team Name")]),
      b("heading", "Highlights", { level: 2 }),
      b("bulletListItem", "Key accomplishment 1"),
      b("bulletListItem", "Key accomplishment 2"),
      b("heading", "Metrics", { level: 2 }),
      b("bulletListItem", [bold("Velocity: "), plain("X pts (target: Y)")]),
      b("bulletListItem", [bold("Bug count: "), plain("X open (down from Y)")]),
      b("bulletListItem", [bold("Sprint progress: "), plain("X% complete")]),
      b("heading", "In Progress", { level: 2 }),
      b("checkListItem", "Feature/task — ETA — @owner", { checked: false }),
      b("heading", "Blockers & Risks", { level: 2 }),
      b("bulletListItem", "Blocker/risk description — impact — mitigation"),
      b("heading", "Next Week Focus", { level: 2 }),
      b("bulletListItem", "Priority 1"),
      b("bulletListItem", "Priority 2"),
    ],
  },
  {
    id: "blank",
    name: "Blank Page",
    icon: "📄",
    description: "Start from scratch with a clean page",
    category: "general",
    content: [],
  },
]

export const TEMPLATE_CATEGORIES = [
  { id: "all" as const, label: "All" },
  { id: "general" as const, label: "General" },
  { id: "engineering" as const, label: "Engineering" },
  { id: "product" as const, label: "Product" },
  { id: "meetings" as const, label: "Meetings" },
  { id: "personal" as const, label: "Personal" },
]
