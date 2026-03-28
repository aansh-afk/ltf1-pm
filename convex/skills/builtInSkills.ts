/**
 * Built-in skill templates that ship with every workspace.
 * These are seeded into new workspaces via seedBuiltInSkills mutation.
 */
export const BUILT_IN_SKILLS = [
  {
    name: "bug-triage",
    displayName: "Bug Triage",
    description:
      "Automatically categorize bugs, set high priority, and assign to available developer",
    trigger: "auto" as const,
    conditions: {
      taskTypes: ["bug"],
      keywords: ["bug", "error", "crash", "broken", "fix", "issue", "fail"],
    },
    actions: [
      { type: "set_type", config: { type: "bug" } },
      { type: "set_priority", config: { priority: "high" } },
      { type: "add_label", config: { labels: ["bug", "needs-review"] } },
    ],
    isBuiltIn: true,
    isActive: true,
  },
  {
    name: "deploy-checklist",
    displayName: "Deploy Checklist",
    description: "Create 5 verification tasks for deployment readiness",
    trigger: "manual" as const,
    conditions: {},
    actions: [
      {
        type: "create_tasks",
        config: {
          tasks: [
            {
              title: "Run full test suite",
              type: "task",
              priority: "high",
            },
            {
              title: "Review database migrations",
              type: "task",
              priority: "high",
            },
            {
              title: "Update environment variables",
              type: "task",
              priority: "medium",
            },
            {
              title: "Verify staging deployment",
              type: "task",
              priority: "high",
            },
            {
              title: "Update changelog and release notes",
              type: "task",
              priority: "medium",
            },
          ],
        },
      },
    ],
    isBuiltIn: true,
    isActive: true,
  },
  {
    name: "sprint-plan",
    displayName: "Sprint Planning",
    description:
      "AI suggests sprint backlog based on priorities, velocity, and team capacity",
    trigger: "manual" as const,
    conditions: {},
    actions: [{ type: "ai_sprint_plan", config: {} }],
    isBuiltIn: true,
    isActive: true,
  },
  {
    name: "pr-review",
    displayName: "PR Review Checklist",
    description: "Generate review checklist from task requirements",
    trigger: "manual" as const,
    conditions: {},
    actions: [
      {
        type: "create_tasks",
        config: {
          tasks: [
            {
              title: "Code review: logic correctness",
              type: "task",
              priority: "high",
            },
            {
              title: "Code review: test coverage",
              type: "task",
              priority: "high",
            },
            {
              title: "Code review: security implications",
              type: "task",
              priority: "medium",
            },
            {
              title: "Code review: performance impact",
              type: "task",
              priority: "medium",
            },
          ],
        },
      },
    ],
    isBuiltIn: true,
    isActive: true,
  },
] as const;
