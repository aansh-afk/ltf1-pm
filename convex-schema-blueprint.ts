import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Foundation Schema for LTF1 - designed for scalability and flexibility

export default defineSchema({
  // ==================== USERS & AUTH ====================
  users: defineTable({
    // External auth provider ID (Clerk)
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    
    // User preferences
    settings: v.object({
      theme: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
      timezone: v.string(),
      language: v.string(),
      notifications: v.object({
        email: v.object({
          taskAssigned: v.boolean(),
          taskCommented: v.boolean(),
          meetingInvite: v.boolean(),
          dailyDigest: v.boolean(),
        }),
        inApp: v.object({
          taskAssigned: v.boolean(),
          taskCommented: v.boolean(),
          meetingInvite: v.boolean(),
        }),
      }),
    }),
    
    // Global user status
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended")),
    lastActiveAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_clerk", ["clerkId"])
    .index("by_email", ["email"]),

  // ==================== WORKSPACES ====================
  workspaces: defineTable({
    name: v.string(),
    slug: v.string(), // URL-friendly unique identifier
    description: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    
    // Ownership
    ownerId: v.id("users"),
    
    // Billing & limits
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
    planDetails: v.object({
      maxMembers: v.number(),
      maxProjects: v.number(),
      maxStorageGB: v.number(),
      customRoles: v.boolean(),
      advancedPermissions: v.boolean(),
      apiAccess: v.boolean(),
      prioritySupport: v.boolean(),
    }),
    
    // Feature flags
    features: v.object({
      aiEnabled: v.boolean(),
      githubIntegration: v.boolean(),
      googleIntegration: v.boolean(),
      customFields: v.boolean(),
      timeTracking: v.boolean(),
      budgetTracking: v.boolean(),
    }),
    
    // Workspace settings
    settings: v.object({
      defaultProjectVisibility: v.union(v.literal("public"), v.literal("private")),
      taskStatuses: v.array(v.object({
        id: v.string(),
        name: v.string(),
        color: v.string(),
        order: v.number(),
      })),
      taskPriorities: v.array(v.object({
        id: v.string(),
        name: v.string(),
        color: v.string(),
        order: v.number(),
      })),
    }),
    
    status: v.union(v.literal("active"), v.literal("suspended"), v.literal("deleted")),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerId"]),

  // ==================== WORKSPACE MEMBERSHIP ====================
  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    
    // Built-in roles with option for custom
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("manager"),
      v.literal("developer"),
      v.literal("viewer"),
      v.literal("custom")
    ),
    customRoleId: v.optional(v.id("customRoles")),
    
    // Member metadata
    joinedAt: v.number(),
    invitedBy: v.optional(v.id("users")),
    lastActiveAt: v.number(),
    
    // Member-specific settings
    settings: v.object({
      emailNotifications: v.boolean(),
      defaultProjectId: v.optional(v.id("projects")),
    }),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_workspace_user", ["workspaceId", "userId"]),

  // ==================== CUSTOM ROLES ====================
  customRoles: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    
    // Granular permissions
    permissions: v.object({
      // Workspace level
      workspace: v.object({
        manage: v.boolean(),
        billing: v.boolean(),
        members: v.object({
          invite: v.boolean(),
          remove: v.boolean(),
          changeRoles: v.boolean(),
        }),
      }),
      
      // Project level
      projects: v.object({
        create: v.boolean(),
        archive: v.boolean(),
        delete: v.boolean(),
        editAll: v.boolean(),
        viewAll: v.boolean(),
      }),
      
      // Task level
      tasks: v.object({
        create: v.boolean(),
        editAll: v.boolean(),
        editAssigned: v.boolean(),
        delete: v.boolean(),
        assign: v.boolean(),
      }),
      
      // Other features
      meetings: v.object({
        create: v.boolean(),
        editAll: v.boolean(),
        delete: v.boolean(),
      }),
      integrations: v.object({
        manage: v.boolean(),
      }),
    }),
    
    createdAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_workspace", ["workspaceId"]),

  // ==================== PROJECTS ====================
  projects: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    identifier: v.string(), // e.g., "PROJ-1"
    description: v.optional(v.string()),
    
    // Project metadata
    status: v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("on-hold"),
      v.literal("completed"),
      v.literal("archived")
    ),
    visibility: v.union(v.literal("public"), v.literal("private")),
    priority: v.union(v.literal("urgent"), v.literal("high"), v.literal("medium"), v.literal("low")),
    
    // Leadership
    leadId: v.optional(v.id("users")),
    
    // Timeline
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    actualStartDate: v.optional(v.number()),
    actualEndDate: v.optional(v.number()),
    
    // Visual customization
    color: v.string(),
    icon: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    
    // Categorization
    tags: v.array(v.string()),
    category: v.optional(v.string()),
    
    // Project settings
    settings: v.object({
      taskPrefix: v.string(), // e.g., "TASK"
      defaultAssignee: v.optional(v.id("users")),
      autoArchiveDays: v.optional(v.number()),
      requireTimeTracking: v.boolean(),
    }),
    
    // Metrics
    metrics: v.object({
      totalTasks: v.number(),
      completedTasks: v.number(),
      totalEstimatedHours: v.number(),
      totalActualHours: v.number(),
    }),
    
    createdAt: v.number(),
    createdBy: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_lead", ["leadId"])
    .index("by_status", ["status"])
    .index("by_workspace_status", ["workspaceId", "status"]),

  // ==================== PROJECT MEMBERS ====================
  projectMembers: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    
    // Project-specific roles
    role: v.union(
      v.literal("lead"),
      v.literal("member"),
      v.literal("viewer")
    ),
    
    // Member contribution tracking
    addedAt: v.number(),
    addedBy: v.id("users"),
    lastActiveAt: v.optional(v.number()),
    
    // Permissions override (if different from workspace role)
    permissions: v.optional(v.object({
      canEditTasks: v.boolean(),
      canDeleteTasks: v.boolean(),
      canManageMembers: v.boolean(),
    })),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"])
    .index("by_project_user", ["projectId", "userId"]),

  // ==================== TASKS ====================
  tasks: defineTable({
    // Hierarchy
    workspaceId: v.id("workspaces"),
    projectId: v.id("projects"),
    parentId: v.optional(v.id("tasks")), // For subtasks
    
    // Core fields
    identifier: v.string(), // e.g., "PROJ-123"
    title: v.string(),
    description: v.optional(v.string()),
    
    // Status and workflow
    status: v.string(), // Flexible for custom workflows
    statusChangedAt: v.number(),
    priority: v.string(), // Flexible for custom priorities
    
    // Assignment
    assigneeId: v.optional(v.id("users")),
    reporterId: v.id("users"),
    
    // Timeline
    dueDate: v.optional(v.number()),
    startDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    
    // Effort tracking
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    remainingHours: v.optional(v.number()),
    
    // Task metadata
    type: v.union(v.literal("task"), v.literal("bug"), v.literal("feature"), v.literal("epic")),
    tags: v.array(v.string()),
    labels: v.array(v.object({
      name: v.string(),
      color: v.string(),
    })),
    
    // Relationships
    blockedBy: v.array(v.id("tasks")),
    blocks: v.array(v.id("tasks")),
    relatedTasks: v.array(v.id("tasks")),
    
    // External references
    externalLinks: v.array(v.object({
      type: v.string(), // "github", "figma", "doc", etc.
      url: v.string(),
      title: v.string(),
    })),
    
    // Custom fields (for extensibility)
    customFields: v.optional(v.any()),
    
    // Tracking
    createdAt: v.number(),
    createdBy: v.id("users"),
    updatedAt: v.number(),
    updatedBy: v.id("users"),
    
    // Soft delete
    deletedAt: v.optional(v.number()),
  })
    .index("by_project", ["projectId"])
    .index("by_assignee", ["assigneeId"])
    .index("by_reporter", ["reporterId"])
    .index("by_parent", ["parentId"])
    .index("by_workspace", ["workspaceId"])
    .index("by_identifier", ["identifier"])
    .index("by_project_status", ["projectId", "status"]),

  // ==================== TASK COMMENTS ====================
  taskComments: defineTable({
    taskId: v.id("tasks"),
    userId: v.id("users"),
    
    // Comment content
    content: v.string(),
    contentType: v.union(v.literal("markdown"), v.literal("plaintext")),
    
    // Mentions and notifications
    mentions: v.array(v.id("users")),
    
    // Threading
    parentCommentId: v.optional(v.id("taskComments")),
    
    // Metadata
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    editedBy: v.optional(v.id("users")),
    
    // Soft delete
    deletedAt: v.optional(v.number()),
  })
    .index("by_task", ["taskId"])
    .index("by_user", ["userId"])
    .index("by_parent", ["parentCommentId"]),

  // ==================== ACTIVITY LOG ====================
  activityLogs: defineTable({
    // Scope
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects")),
    
    // Actor
    userId: v.id("users"),
    
    // Entity
    entityType: v.string(), // "task", "project", "meeting", etc.
    entityId: v.string(),
    
    // Action
    action: v.string(), // "created", "updated", "deleted", "commented", etc.
    
    // Changes (for updates)
    changes: v.optional(v.array(v.object({
      field: v.string(),
      oldValue: v.any(),
      newValue: v.any(),
    }))),
    
    // Additional context
    metadata: v.optional(v.any()),
    
    // Timestamp
    timestamp: v.number(),
    
    // IP tracking for security
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_project", ["projectId"])
    .index("by_entity", ["entityType", "entityId"])
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  // ==================== MEETINGS ====================
  meetings: defineTable({
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects")),
    
    // Meeting details
    title: v.string(),
    description: v.optional(v.string()),
    
    // Timing
    startTime: v.number(),
    endTime: v.number(),
    timezone: v.string(),
    
    // Organizer
    organizerId: v.id("users"),
    
    // Meeting logistics
    location: v.optional(v.string()),
    meetingUrl: v.optional(v.string()),
    meetingType: v.union(
      v.literal("in-person"),
      v.literal("video"),
      v.literal("phone"),
      v.literal("hybrid")
    ),
    
    // Recurrence
    recurrence: v.optional(v.object({
      frequency: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
      interval: v.number(),
      endDate: v.optional(v.number()),
      exceptions: v.array(v.number()), // Dates to skip
    })),
    
    // Status
    status: v.union(
      v.literal("scheduled"),
      v.literal("in-progress"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    
    // External calendar sync
    externalCalendarId: v.optional(v.string()),
    externalEventId: v.optional(v.string()),
    
    createdAt: v.number(),
    createdBy: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_project", ["projectId"])
    .index("by_organizer", ["organizerId"])
    .index("by_start_time", ["startTime"])
    .index("by_status", ["status"]),

  // ==================== MEETING PARTICIPANTS ====================
  meetingParticipants: defineTable({
    meetingId: v.id("meetings"),
    userId: v.id("users"),
    
    // RSVP status
    status: v.union(
      v.literal("invited"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("tentative"),
      v.literal("no-response")
    ),
    
    // Participation
    required: v.boolean(),
    attended: v.optional(v.boolean()),
    
    // Response tracking
    respondedAt: v.optional(v.number()),
    responseNote: v.optional(v.string()),
    
    invitedAt: v.number(),
  })
    .index("by_meeting", ["meetingId"])
    .index("by_user", ["userId"])
    .index("by_meeting_user", ["meetingId", "userId"]),

  // ==================== INTEGRATIONS ====================
  integrations: defineTable({
    workspaceId: v.id("workspaces"),
    
    // Integration type
    provider: v.union(v.literal("github"), v.literal("google"), v.literal("slack")),
    
    // Authentication
    accessToken: v.optional(v.string()), // Encrypted
    refreshToken: v.optional(v.string()), // Encrypted
    expiresAt: v.optional(v.number()),
    
    // Provider-specific data
    providerData: v.any(), // Flexible for different providers
    
    // Configuration
    settings: v.object({
      enabled: v.boolean(),
      syncDirection: v.union(v.literal("pull"), v.literal("push"), v.literal("both")),
      syncFrequency: v.optional(v.number()), // minutes
      lastSyncAt: v.optional(v.number()),
    }),
    
    // Connection metadata
    connectedBy: v.id("users"),
    connectedAt: v.number(),
    lastUsedAt: v.optional(v.number()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_provider", ["provider"]),

  // ==================== AI USAGE TRACKING ====================
  aiUsage: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    
    // Request details
    feature: v.string(), // "task-generation", "meeting-summary", etc.
    model: v.string(),
    prompt: v.string(),
    response: v.string(),
    
    // Usage metrics
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    cost: v.number(), // in cents
    
    // Performance
    latencyMs: v.number(),
    success: v.boolean(),
    error: v.optional(v.string()),
    
    timestamp: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  // ==================== NOTIFICATIONS ====================
  notifications: defineTable({
    userId: v.id("users"),
    
    // Notification details
    type: v.string(), // "task-assigned", "mentioned", "meeting-invite", etc.
    title: v.string(),
    message: v.string(),
    
    // Related entities
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    
    // Delivery
    channels: v.array(v.union(v.literal("inApp"), v.literal("email"), v.literal("push"))),
    
    // Status
    read: v.boolean(),
    readAt: v.optional(v.number()),
    emailSent: v.boolean(),
    emailSentAt: v.optional(v.number()),
    
    // Action URL
    actionUrl: v.optional(v.string()),
    
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "read"])
    .index("by_created", ["createdAt"]),

  // ==================== FILE ATTACHMENTS ====================
  attachments: defineTable({
    // Scope
    workspaceId: v.id("workspaces"),
    
    // Parent entity
    entityType: v.string(), // "task", "comment", "project", etc.
    entityId: v.string(),
    
    // File details
    filename: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    
    // Storage
    storageUrl: v.string(), // Could be Convex storage or external
    thumbnailUrl: v.optional(v.string()),
    
    // Metadata
    uploadedBy: v.id("users"),
    uploadedAt: v.number(),
    lastAccessedAt: v.optional(v.number()),
    
    // Soft delete
    deletedAt: v.optional(v.number()),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_workspace", ["workspaceId"])
    .index("by_uploader", ["uploadedBy"]),
});