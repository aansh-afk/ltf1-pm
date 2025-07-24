import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user")),
    preferences: v.optional(v.object({
      theme: v.optional(v.string()),
      notifications: v.optional(v.object({
        email: v.boolean(),
        push: v.boolean(),
        slack: v.boolean(),
      })),
      defaultWorkspaceId: v.optional(v.id("workspaces")),
      accessibility: v.optional(v.object({
        fontScale: v.optional(v.number()),       // 0.5 to 1.5
        lineHeight: v.optional(v.number()),      // 1.2 to 1.8
        letterSpacing: v.optional(v.string()),   // normal, wide, extra-wide
        reducedMotion: v.optional(v.boolean()),
        highContrast: v.optional(v.boolean()),
        focusWidth: v.optional(v.number()),      // 2, 4, 6
      })),
      defaults: v.optional(v.object({
        projectView: v.optional(v.string()),     // kanban, list, table
        taskPriority: v.optional(v.string()),    // low, medium, high, urgent
        taskType: v.optional(v.string()),        // task, feature, bug, improvement, epic
        autoAssignSelf: v.optional(v.boolean()),
      })),
    })),
    githubUsername: v.optional(v.string()),
    githubTokenValidated: v.optional(v.boolean()),
    bio: v.optional(v.string()),
    lastSeenAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  workspaces: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    ownerId: v.id("users"),
    settings: v.object({
      features: v.object({
        gitIntegration: v.boolean(),
        aiFeatures: v.boolean(),
        meetings: v.boolean(),
        timeTracking: v.boolean(),
      }),
      integrations: v.optional(v.object({
        githubToken: v.optional(v.string()),
        googleCalendarId: v.optional(v.string()),
      })),
    }),
    subscription: v.object({
      plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
      validUntil: v.optional(v.number()),
      seats: v.number(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerId"]),

  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member"), v.literal("viewer")),
    permissions: v.array(v.string()),
    joinedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_workspace_user", ["workspaceId", "userId"]),

  projects: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    key: v.string(),
    description: v.optional(v.string()),
    leadId: v.optional(v.id("users")),
    status: v.union(v.literal("planning"), v.literal("active"), v.literal("on_hold"), v.literal("completed"), v.literal("archived")),
    visibility: v.union(v.literal("public"), v.literal("private")),
    repository: v.optional(v.object({
      provider: v.union(v.literal("github"), v.literal("gitlab"), v.literal("bitbucket")),
      url: v.string(),
      defaultBranch: v.string(),
    })),
    settings: v.object({
      taskPrefix: v.string(),
      defaultAssigneeId: v.optional(v.id("users")),
      workflowType: v.union(v.literal("kanban"), v.literal("scrum"), v.literal("hybrid")),
    }),
    metadata: v.optional(v.object({
      color: v.string(),
      icon: v.string(),
      tags: v.array(v.string()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_key", ["key"])
    .index("by_lead", ["leadId"])
    .index("by_status", ["status"]),

  tasks: defineTable({
    projectId: v.id("projects"),
    parentTaskId: v.optional(v.id("tasks")),
    number: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("backlog"),
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("in_review"),
      v.literal("done"),
      v.literal("cancelled")
    ),
    priority: v.union(v.literal("urgent"), v.literal("high"), v.literal("medium"), v.literal("low")),
    type: v.union(v.literal("feature"), v.literal("bug"), v.literal("improvement"), v.literal("task"), v.literal("epic")),
    assigneeId: v.optional(v.id("users")),
    reporterId: v.id("users"),
    labels: v.array(v.string()),
    dueDate: v.optional(v.number()),
    startDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    estimate: v.optional(v.object({
      points: v.optional(v.number()),
      hours: v.optional(v.number()),
    })),
    timeTracked: v.optional(v.object({
      totalMinutes: v.number(),
      sessions: v.array(v.object({
        userId: v.id("users"),
        startTime: v.number(),
        endTime: v.number(),
        description: v.optional(v.string()),
      })),
    })),
    git: v.optional(v.object({
      branch: v.optional(v.string()),
      commits: v.array(v.string()),
      pullRequestUrl: v.optional(v.string()),
      pullRequestStatus: v.optional(v.union(v.literal("open"), v.literal("merged"), v.literal("closed"))),
    })),
    sprintId: v.optional(v.id("sprints")),
    position: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_assignee", ["assigneeId"])
    .index("by_reporter", ["reporterId"])
    .index("by_status", ["status"])
    .index("by_sprint", ["sprintId"])
    .index("by_parent", ["parentTaskId"])
    .index("by_project_number", ["projectId", "number"]),

  sprints: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    goal: v.optional(v.string()),
    startDate: v.number(),
    endDate: v.number(),
    status: v.union(v.literal("planning"), v.literal("active"), v.literal("completed")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_status", ["status"]),

  comments: defineTable({
    taskId: v.id("tasks"),
    userId: v.id("users"),
    content: v.string(),
    editedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_user", ["userId"]),

  attachments: defineTable({
    taskId: v.id("tasks"),
    userId: v.id("users"),
    fileName: v.string(),
    fileSize: v.number(),
    mimeType: v.string(),
    storageId: v.string(),
    createdAt: v.number(),
  })
    .index("by_task", ["taskId"]),

  meetings: defineTable({
    workspaceId: v.id("workspaces"),
    title: v.string(),
    description: v.optional(v.string()),
    organizerId: v.id("users"),
    startTime: v.number(),
    endTime: v.number(),
    location: v.optional(v.string()),
    meetingUrl: v.optional(v.string()),
    googleEventId: v.optional(v.string()),
    attendees: v.array(v.object({
      userId: v.id("users"),
      status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined"), v.literal("tentative")),
      responseTime: v.optional(v.number()),
    })),
    relatedTasks: v.array(v.id("tasks")),
    recurrence: v.optional(v.object({
      frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
      interval: v.number(),
      endDate: v.optional(v.number()),
    })),
    notes: v.optional(v.string()),
    recordings: v.array(v.object({
      url: v.string(),
      duration: v.number(),
      createdAt: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_organizer", ["organizerId"])
    .index("by_start_time", ["startTime"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    read: v.boolean(),
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"]),

  activities: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    entityType: v.union(v.literal("workspace"), v.literal("project"), v.literal("task"), v.literal("meeting")),
    entityId: v.string(),
    action: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_entity", ["entityType", "entityId"])
    .index("by_created", ["createdAt"]),

  aiTasks: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    sourceType: v.union(v.literal("commit"), v.literal("pr"), v.literal("comment"), v.literal("manual")),
    sourceData: v.any(),
    suggestedTasks: v.array(v.object({
      title: v.string(),
      description: v.string(),
      type: v.string(),
      priority: v.string(),
      estimate: v.optional(v.number()),
      confidence: v.number(),
    })),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
    processedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),
});