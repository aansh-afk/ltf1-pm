import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user")),
    status: v.optional(v.union(v.literal("active"), v.literal("waitlisted"))),
    waitlistPosition: v.optional(v.number()),
    preferences: v.optional(v.object({
      theme: v.optional(v.string()),
      hasCompletedOnboarding: v.optional(v.boolean()),
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
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

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
        githubInstallationId: v.optional(v.number()),
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

  teams: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_workspace_slug", ["workspaceId", "slug"]),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: v.union(v.literal("lead"), v.literal("member")),
    joinedAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_team_user", ["teamId", "userId"]),

  projectMembers: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    role: v.union(v.literal("lead"), v.literal("member"), v.literal("contributor"), v.literal("viewer")),
    joinedAt: v.number(),
    invitedBy: v.optional(v.id("users")),
    status: v.union(v.literal("active"), v.literal("pending"), v.literal("removed")),
  })
    .index("by_project", ["projectId"])
    .index("by_user", ["userId"])
    .index("by_project_user", ["projectId", "userId"])
    .index("by_status", ["status"]),

  projectInvitations: defineTable({
    projectId: v.id("projects"),
    invitedEmail: v.string(),
    invitedBy: v.id("users"),
    role: v.union(v.literal("lead"), v.literal("member"), v.literal("contributor"), v.literal("viewer")),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined"), v.literal("expired")),
    inviteCode: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_invite_code", ["inviteCode"])
    .index("by_status", ["status"])
    .index("by_email", ["invitedEmail"]),

  projects: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    key: v.string(),
    description: v.optional(v.string()),
    leadId: v.optional(v.id("users")),
    members: v.optional(v.array(v.id("users"))), // Array of user IDs who are members
    teamIds: v.optional(v.array(v.id("teams"))), // Array of Team IDs assigned to this project
    status: v.union(v.literal("planning"), v.literal("active"), v.literal("on_hold"), v.literal("completed"), v.literal("archived")),
    visibility: v.union(v.literal("public"), v.literal("private")),
    inviteCode: v.optional(v.string()), // UUID for project joining
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
    teamSettings: v.optional(v.object({
      maxMembers: v.optional(v.number()),
      allowSelfJoin: v.optional(v.boolean()),
      requireApproval: v.optional(v.boolean()),
      autoAssignLead: v.optional(v.boolean()),
    })),
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
    .index("by_status", ["status"])
    .index("by_invite_code", ["inviteCode"]),

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
    assigneeIds: v.optional(v.array(v.id("users"))),
    assigneeId: v.optional(v.id("users")), // Deprecated - kept for migration
    reporterId: v.id("users"),
    labels: v.array(v.string()),
    dueDate: v.optional(v.number()),
    startDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    dependencies: v.optional(v.array(v.id("tasks"))), // Task dependencies for Gantt
    progress: v.optional(v.number()), // 0-100 progress percentage
    milestone: v.optional(v.boolean()), // Is this a milestone
    criticalPath: v.optional(v.boolean()), // Is on critical path
    estimate: v.optional(v.object({
      points: v.optional(v.number()),
      hours: v.optional(v.number()),
    })),
    timeTracked: v.optional(v.number()), // Total milliseconds tracked
    git: v.optional(v.object({
      branch: v.optional(v.string()),
      commits: v.array(v.string()),
      pullRequestUrl: v.optional(v.string()),
      pullRequestStatus: v.optional(v.union(v.literal("open"), v.literal("merged"), v.literal("closed"))),
    })),
    // GitHub Issue sync (bi-directional)
    githubIssue: v.optional(v.object({
      repositoryFullName: v.string(),
      issueNumber: v.number(),
      issueUrl: v.string(),
      syncEnabled: v.boolean(),
      lastSyncedAt: v.optional(v.number()),
    })),
    gitlabIssueId: v.optional(v.number()), // GitLab issue ID if synced
    gitlabIssueUrl: v.optional(v.string()), // GitLab issue URL
    sprintId: v.optional(v.id("sprints")),
    position: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_assignee", ["assigneeId"]) // Deprecated - kept for migration
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
    projectId: v.optional(v.id("projects")),
    sprintId: v.optional(v.id("sprints")),
    title: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("standup"),
      v.literal("retrospective"),
      v.literal("planning"),
      v.literal("review"),
      v.literal("custom")
    ),
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
    actionItems: v.optional(v.array(v.object({
      id: v.string(),
      description: v.string(),
      assigneeId: v.optional(v.id("users")),
      completed: v.boolean(),
      createdTaskId: v.optional(v.id("tasks")),
      createdAt: v.number(),
    }))),
    template: v.optional(v.object({
      agenda: v.optional(v.array(v.string())),
      duration: v.optional(v.number()), // in minutes
      isRecurring: v.boolean(),
    })),
    recordings: v.array(v.object({
      url: v.string(),
      duration: v.number(),
      createdAt: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_project", ["projectId"])
    .index("by_sprint", ["sprintId"])
    .index("by_type", ["type"])
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

  // GitHub OAuth
  githubOAuthStates: defineTable({
    state: v.string(),
    clerkId: v.string(),
    returnUrl: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_state", ["state"]),

  githubConnections: defineTable({
    userId: v.id("users"),
    githubId: v.number(),
    githubUsername: v.string(),
    accessToken: v.string(),
    scope: v.string(),
    tokenType: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_github_id", ["githubId"]),

  // Temporary permissive schema for migration - will be restored after user clears old data
  activities: defineTable(v.any())
    .index("by_type", ["type", "timestamp"]),

  timeEntries: defineTable({
    taskId: v.id("tasks"),
    userId: v.string(), // Clerk user ID
    startTime: v.number(),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()), // In milliseconds
    description: v.optional(v.string()),
    billable: v.optional(v.boolean()),
    approved: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_user", ["userId"])
    .index("by_task_and_user", ["taskId", "userId"])
    .index("by_start_time", ["startTime"]),

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

  // AI Sessions for tracking all AI interactions
  aiSessions: defineTable({
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
    type: v.string(), // task.title.generate, sprint.analysis, etc.
    input: v.string(),
    output: v.string(),
    model: v.union(v.literal("gemini-2.5-flash"), v.literal("gemini-2.5-flash-lite")),
    tokens: v.object({
      input: v.number(),
      output: v.number(),
      total: v.number(),
    }),
    cost: v.number(),
    latency: v.number(), // milliseconds
    cached: v.boolean(),
    feedback: v.optional(v.object({
      helpful: v.boolean(),
      rating: v.number(), // 1-5
      comment: v.optional(v.string()),
    })),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_workspace", ["workspaceId"])
    .index("by_type", ["type"])
    .index("by_created", ["createdAt"]),

  // AI-generated insights and recommendations
  aiInsights: defineTable({
    workspaceId: v.id("workspaces"),
    targetType: v.union(v.literal("task"), v.literal("sprint"), v.literal("project"), v.literal("team"), v.literal("user")),
    targetId: v.string(), // ID of the target entity
    insightType: v.union(
      v.literal("risk"),
      v.literal("recommendation"),
      v.literal("opportunity"),
      v.literal("anomaly"),
      v.literal("prediction")
    ),
    severity: v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low")),
    title: v.string(),
    description: v.string(),
    recommendations: v.array(v.string()),
    metadata: v.any(), // Additional context
    dismissed: v.boolean(),
    actionTaken: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_target", ["targetType", "targetId"])
    .index("by_insight_type", ["insightType"])
    .index("by_dismissed", ["dismissed"])
    .index("by_created", ["createdAt"]),

  filterPresets: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    name: v.string(),
    filters: v.any(), // Store the TaskFilters object
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_workspace_user", ["workspaceId", "userId"]),

  // Developer profiles - optional for backward compatibility
  developerProfiles: defineTable({
    userId: v.id("users"),

    // Profile information (from frontend form)
    profile: v.optional(v.object({
      role: v.optional(v.string()),
      bio: v.optional(v.string()),
      location: v.optional(v.string()),
      phone: v.optional(v.string()),
      githubUsername: v.optional(v.string()),
      yearsExperience: v.optional(v.number()),
      careerLevel: v.optional(v.union(v.literal("junior"), v.literal("mid"), v.literal("senior"), v.literal("lead"), v.literal("principal"))),
      skills: v.optional(v.array(v.string())),
      interests: v.optional(v.array(v.string())),
      workingHours: v.optional(v.object({
        start: v.string(),
        end: v.string(),
      })),
      communicationPrefs: v.optional(v.union(v.literal("email"), v.literal("slack"), v.literal("teams"), v.literal("discord"))),
      workStyle: v.optional(v.string()),
      careerGoals: v.optional(v.string()),
      mentoringInterests: v.optional(v.array(v.string())),
      technologies: v.optional(v.array(v.object({
        name: v.string(),
        level: v.union(v.literal("expert"), v.literal("proficient"), v.literal("learning")),
      }))),
      timezone: v.optional(v.string()),
      availability: v.optional(v.string()),
    })),

    // Work status
    status: v.optional(v.union(
      v.literal("LOCKED_IN"),
      v.literal("AVAILABLE"),
      v.literal("IN_REVIEW"),
      v.literal("AFK"),
      v.literal("IN_MEETING")
    )),
    statusMessage: v.optional(v.string()),
    timezone: v.optional(v.string()),
    workHours: v.optional(v.object({
      start: v.string(), // "09:00"
      end: v.string(),   // "17:00"
      days: v.array(v.number()), // [1,2,3,4,5] for Mon-Fri
    })),
    techStack: v.optional(v.array(v.object({
      name: v.string(),
      level: v.union(v.literal("expert"), v.literal("proficient"), v.literal("learning")),
      yearsOfExperience: v.optional(v.number()),
    }))),
    currentFocus: v.optional(v.string()),
    reviewPreferences: v.optional(v.object({
      maxConcurrentReviews: v.number(),
      preferredFileTypes: v.array(v.string()),
      averageResponseTime: v.optional(v.number()), // in hours
    })),
    githubStats: v.optional(v.object({
      username: v.optional(v.string()),
      totalPRs: v.number(),
      totalReviews: v.number(),
      avgReviewTime: v.number(), // in hours
      languages: v.array(v.object({
        name: v.string(),
        percentage: v.number(),
      })),
      lastSynced: v.number(),
    })),
    gitCoAuthorString: v.optional(v.string()),
    availability: v.optional(v.object({
      forProjects: v.boolean(),
      forReviews: v.boolean(),
      forPairing: v.boolean(),
    })),
    profileCompleteness: v.number(), // 0-100
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  expertiseSearchIndex: defineTable({
    profileId: v.id("developerProfiles"),
    userId: v.id("users"),
    technology: v.string(),
    level: v.string(),
    searchableText: v.string(), // lowercase, normalized for search
  })
    .index("by_technology", ["technology"])
    .searchIndex("search_expertise", {
      searchField: "searchableText",
    }),

  // GitHub Integration Tables
  githubInstallations: defineTable({
    installationId: v.number(), // GitHub's installation ID
    accountType: v.union(v.literal("user"), v.literal("organization")),
    accountName: v.string(), // GitHub username or org name
    accountId: v.number(), // GitHub account ID
    targetType: v.union(v.literal("user"), v.literal("organization")),
    permissions: v.any(), // GitHub permissions object
    events: v.array(v.string()), // Webhook events subscribed
    repositorySelection: v.union(v.literal("all"), v.literal("selected")),
    installedAt: v.number(),
    updatedAt: v.number(),
    suspendedAt: v.optional(v.number()),
  })
    .index("by_installation_id", ["installationId"])
    .index("by_account", ["accountName"]),

  githubRepositories: defineTable({
    installationId: v.number(),
    repoId: v.number(), // GitHub's repository ID
    nodeId: v.string(), // GitHub's node ID
    owner: v.string(),
    name: v.string(),
    fullName: v.string(), // owner/name
    private: v.boolean(),
    description: v.optional(v.string()),
    defaultBranch: v.string(),
    language: v.optional(v.string()),
    topics: v.array(v.string()),
    stargazersCount: v.number(),
    forksCount: v.number(),
    openIssuesCount: v.number(),
    createdAt: v.string(), // ISO date string
    updatedAt: v.string(), // ISO date string
    pushedAt: v.optional(v.string()), // ISO date string
    connectedAt: v.number(), // When connected to LTF1
    syncedAt: v.optional(v.number()), // Last sync time
  })
    .index("by_installation", ["installationId"])
    .index("by_repo_id", ["repoId"])
    .index("by_full_name", ["fullName"]),

  githubWebhookEvents: defineTable({
    eventType: v.string(), // push, pull_request, etc.
    deliveryId: v.string(), // GitHub's delivery ID
    payload: v.any(), // Raw webhook payload
    signature: v.string(), // Webhook signature
    receivedAt: v.number(),
    processedAt: v.optional(v.number()),
    status: v.union(v.literal("pending"), v.literal("processed"), v.literal("failed")),
    error: v.optional(v.string()),
  })
    .index("by_type", ["eventType", "receivedAt"])
    .index("by_status", ["status"])
    .index("by_delivery_id", ["deliveryId"]),

  githubActivities: defineTable({
    type: v.string(), // push, pull_request, issue, etc.
    repositoryFullName: v.string(),
    actor: v.string(), // GitHub username
    metadata: v.any(), // Event-specific data
    timestamp: v.number(),
  })
    .index("by_repository", ["repositoryFullName"])
    .index("by_actor", ["actor"])
    .index("by_type", ["type", "timestamp"]),

  githubCommits: defineTable({
    repositoryFullName: v.string(),
    sha: v.string(), // Commit SHA
    message: v.string(),
    author: v.object({
      name: v.string(),
      email: v.string(),
      date: v.optional(v.string()),
    }),
    timestamp: v.string(), // ISO date string
    url: v.string(), // GitHub URL
    branch: v.string(),
    linkedTaskKeys: v.array(v.string()), // e.g., ["WEB-123", "API-456"]
    createdAt: v.number(),
  })
    .index("by_repository", ["repositoryFullName"])
    .index("by_sha", ["sha"])
    .index("by_branch", ["repositoryFullName", "branch"]),

  githubPullRequests: defineTable({
    repositoryFullName: v.string(),
    number: v.number(), // PR number
    title: v.string(),
    state: v.string(), // open, closed, merged
    draft: v.boolean(),
    url: v.string(),
    createdAt: v.string(), // ISO date string
    updatedAt: v.string(),
    closedAt: v.optional(v.string()),
    mergedAt: v.optional(v.string()),
    author: v.string(), // GitHub username
    linkedTaskKeys: v.array(v.string()), // e.g., ["WEB-123", "API-456"]
  })
    .index("by_repository", ["repositoryFullName"])
    .index("by_repository_number", ["repositoryFullName", "number"])
    .index("by_state", ["state"]),

  githubIssues: defineTable({
    repositoryFullName: v.string(),
    number: v.number(), // Issue number
    title: v.string(),
    body: v.optional(v.string()),
    state: v.string(), // open, closed
    labels: v.array(v.string()),
    assignees: v.array(v.string()), // GitHub usernames
    author: v.string(), // GitHub username
    createdAt: v.string(), // ISO date string
    updatedAt: v.string(),
    closedAt: v.optional(v.string()),
    linkedTaskId: v.optional(v.id("tasks")), // If synced to LTF1 task
  })
    .index("by_repository", ["repositoryFullName"])
    .index("by_repository_number", ["repositoryFullName", "number"])
    .index("by_linked_task", ["linkedTaskId"]),

  // GitHub User Mappings - Map GitHub users to LTF1 users
  githubUserMappings: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    githubId: v.number(),
    githubUsername: v.string(),
    githubEmail: v.optional(v.string()),
    mappingType: v.union(
      v.literal("oauth"),      // Auto-created from OAuth connection
      v.literal("manual"),     // Manually linked by admin
      v.literal("inferred")    // Inferred from email match
    ),
    verified: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_github_id", ["githubId"])
    .index("by_workspace_username", ["workspaceId", "githubUsername"]),

  // Workspace GitHub Installations - Junction table for multi-installation support
  workspaceGitHubInstallations: defineTable({
    workspaceId: v.id("workspaces"),
    installationId: v.number(),
    isPrimary: v.boolean(), // Primary installation for this workspace
    nickname: v.optional(v.string()), // User-friendly name (e.g., "Production Org")
    accountLogin: v.string(), // GitHub account login name
    accountType: v.union(v.literal("user"), v.literal("organization")),
    syncSettings: v.object({
      autoSyncIssues: v.boolean(),
      bidirectionalSync: v.boolean(),
      createTasksFromIssues: v.boolean(),
      syncLabels: v.boolean(),
      defaultProjectId: v.optional(v.id("projects")),
    }),
    addedBy: v.id("users"),
    addedAt: v.number(),
    lastSyncAt: v.optional(v.number()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_installation", ["installationId"])
    .index("by_workspace_primary", ["workspaceId", "isPrimary"]),

  // GitHub Team Mappings - Map LTF1 teams to GitHub org teams
  githubTeamMappings: defineTable({
    workspaceId: v.id("workspaces"),
    teamId: v.id("teams"),
    installationId: v.number(),
    githubOrgName: v.string(),
    githubTeamSlug: v.string(),
    githubTeamId: v.number(),
    syncDirection: v.union(
      v.literal("github_to_ltf1"),   // GitHub is source of truth
      v.literal("ltf1_to_github"),   // LTF1 is source of truth
      v.literal("bidirectional")     // Sync both ways
    ),
    syncMembers: v.boolean(),
    lastSyncAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_team", ["teamId"])
    .index("by_github_team", ["githubOrgName", "githubTeamSlug"]),

  // GitHub Issue Sync Queue - Queue for bi-directional issue sync
  githubIssueSyncQueue: defineTable({
    workspaceId: v.id("workspaces"),
    direction: v.union(
      v.literal("to_github"),    // LTF1 task → GitHub issue
      v.literal("from_github")   // GitHub issue → LTF1 task
    ),
    taskId: v.optional(v.id("tasks")),
    githubIssueNumber: v.optional(v.number()),
    repositoryFullName: v.string(),
    operation: v.union(
      v.literal("create"),
      v.literal("update"),
      v.literal("close"),
      v.literal("reopen"),
      v.literal("sync_comments")
    ),
    payload: v.any(), // Operation-specific data
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    retryCount: v.number(),
    lastError: v.optional(v.string()),
    scheduledFor: v.optional(v.number()), // For delayed processing
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_task", ["taskId"])
    .index("by_workspace", ["workspaceId"])
    .index("by_scheduled", ["status", "scheduledFor"]),

  // GitHub webhook events storage
  webhookEvents: defineTable({
    type: v.string(),
    repository: v.string(),
    data: v.any(),
    createdAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_repository", ["repository"])
    .index("by_created", ["createdAt"]),

  // AI Credits and BYOK System
  userAICredits: defineTable({
    userId: v.string(),

    // Credit system
    freeCredits: v.number(), // Free monthly credits
    purchasedCredits: v.number(), // Additional purchased credits
    totalCreditsUsed: v.number(), // Lifetime usage
    monthlyCreditsUsed: v.number(), // Current month usage
    lastResetDate: v.string(), // Last monthly reset

    // BYOK (Bring Your Own Key)
    hasOwnKey: v.boolean(),
    encryptedApiKey: v.optional(v.string()), // Encrypted Gemini API key
    keyAddedAt: v.optional(v.string()),
    keyLastUsed: v.optional(v.string()),

    // Subscription status
    subscriptionTier: v.union(
      v.literal("free"),
      v.literal("pro"),
      v.literal("enterprise")
    ),

    // Usage metrics
    totalRequests: v.number(),
    totalTokensUsed: v.number(),
    lastUsedAt: v.optional(v.string()),

    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"]),

  // AI usage logs for tracking and billing
  aiUsageLogs: defineTable({
    userId: v.string(),

    // Request details
    requestType: v.string(), // e.g., "task_generation", "code_review", "meeting_summary"
    model: v.string(), // e.g., "gemini-2.0-flash-exp"

    // Usage metrics
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    creditsUsed: v.number(),

    // Key used
    keyType: v.union(
      v.literal("platform"), // Our key
      v.literal("user"), // User's BYOK
      v.literal("free") // Free tier
    ),

    // Response info
    success: v.boolean(),
    error: v.optional(v.string()),
    responseTime: v.number(), // in ms

    timestamp: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  // Pricing tiers and limits
  aiPricingTiers: defineTable({
    tier: v.string(),

    // Credits
    monthlyFreeCredits: v.number(),
    creditPrice: v.number(), // Price per 1000 credits

    // Rate limits
    requestsPerMinute: v.number(),
    requestsPerDay: v.number(),
    maxTokensPerRequest: v.number(),

    // Features
    features: v.array(v.string()),

    // BYOK
    allowsBYOK: v.boolean(),

    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_tier", ["tier"]),

  aiCredits: defineTable({
    userId: v.id("users"),
    apiKey: v.optional(v.string()), // User's own API key for BYOK
    credits: v.number(), // Credits remaining
    monthlyCredits: v.number(), // Monthly credit allowance
    lastResetDate: v.string(), // Last date credits were reset
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // GitLab Integration Tables
  gitlabOAuthStates: defineTable({
    state: v.string(),
    userId: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_state", ["state"]),

  gitlabIntegrations: defineTable({
    userId: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
    scope: v.optional(v.string()),
    gitlabUserId: v.number(),
    gitlabUsername: v.string(),
    gitlabEmail: v.string(),
    gitlabName: v.string(),
    gitlabAvatarUrl: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  gitlabProjects: defineTable({
    userId: v.string(),
    projectId: v.id("projects"),
    gitlabProjectId: v.number(),
    gitlabProjectPath: v.string(),
    gitlabProjectUrl: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"]),

  gitlabMergeRequests: defineTable({
    projectId: v.id("projects"),
    gitlabMrId: v.number(),
    gitlabMrIid: v.number(),
    title: v.string(),
    description: v.optional(v.string()),
    state: v.string(),
    sourceBranch: v.string(),
    targetBranch: v.string(),
    authorId: v.number(),
    authorUsername: v.string(),
    labels: v.array(v.string()),
    webUrl: v.string(),
    mergedAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_and_mr", ["projectId", "gitlabMrId"]),

  // Slack Integration Tables
  slackIntegrations: defineTable({
    workspaceId: v.id("workspaces"),
    accessToken: v.string(),
    teamId: v.string(),
    teamName: v.string(),
    botUserId: v.string(),
    botAccessToken: v.string(),
    incomingWebhookUrl: v.optional(v.string()),
    incomingWebhookChannel: v.optional(v.string()),
    scopes: v.array(v.string()),
    userId: v.string(), // Clerk user ID who connected
    active: v.boolean(),
    settings: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_team", ["teamId"]),

  slackChannels: defineTable({
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects")),
    channelId: v.string(),
    channelName: v.string(),
    channelType: v.union(v.literal("project"), v.literal("general"), v.literal("alerts")),
    syncEvents: v.array(v.string()),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_project", ["projectId"])
    .index("by_channel", ["workspaceId", "channelId"]),

  slackUserMappings: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    slackUserId: v.string(),
    slackUsername: v.string(),
    slackEmail: v.optional(v.string()),
    slackRealName: v.optional(v.string()),
    slackAvatar: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_slack_user", ["workspaceId", "slackUserId"]),

  slackEvents: defineTable({
    workspaceId: v.id("workspaces"),
    eventType: v.string(),
    eventData: v.any(),
    userId: v.optional(v.string()),
    channelId: v.optional(v.string()),
    messageTs: v.optional(v.string()),
    processed: v.boolean(),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_processed", ["processed", "createdAt"]),

  slackFiles: defineTable({
    workspaceId: v.id("workspaces"),
    projectId: v.id("projects"),
    fileId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    fileUrl: v.string(),
    uploadedBy: v.string(),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_project", ["projectId"]),

  slackTaskLinks: defineTable({
    taskId: v.id("tasks"),
    messageTs: v.string(),
    channelId: v.string(),
    createdAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_message", ["messageTs", "channelId"]),

  standups: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    date: v.number(),
    yesterday: v.string(),
    today: v.string(),
    blockers: v.optional(v.string()),
    slackUserId: v.optional(v.string()),
    channelId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "date"])
    .index("by_date", ["date"]),

  // Audit Logs
  auditLogs: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.optional(v.string()), // Clerk user ID
    userEmail: v.optional(v.string()),
    userName: v.optional(v.string()),
    eventType: v.string(),
    severity: v.string(),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    entityName: v.optional(v.string()),
    description: v.string(),
    metadata: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    location: v.optional(v.object({
      country: v.optional(v.string()),
      city: v.optional(v.string()),
      region: v.optional(v.string()),
    })),
    timestamp: v.number(),
    sessionId: v.optional(v.string()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_event_type", ["eventType"])
    .index("by_entity", ["entityType", "entityId"])
    .index("by_timestamp", ["timestamp"]),

  // Custom Fields
  customFieldDefinitions: defineTable({
    workspaceId: v.id("workspaces"),
    entityType: v.union(v.literal("task"), v.literal("project"), v.literal("user")),
    key: v.string(),
    label: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("number"),
      v.literal("date"),
      v.literal("select"),
      v.literal("multiselect"),
      v.literal("boolean"),
      v.literal("url"),
      v.literal("email")
    ),
    options: v.optional(v.array(v.string())), // For select/multiselect
    required: v.boolean(),
    defaultValue: v.optional(v.any()),
    validation: v.optional(v.object({
      min: v.optional(v.number()),
      max: v.optional(v.number()),
      pattern: v.optional(v.string()),
      message: v.optional(v.string()),
    })),
    permissions: v.optional(v.object({
      view: v.array(v.string()), // Role IDs
      edit: v.array(v.string()),
    })),
    order: v.number(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_entity_type", ["entityType"])
    .index("by_key", ["workspaceId", "entityType", "key"]),

  customFieldValues: defineTable({
    fieldDefinitionId: v.id("customFieldDefinitions"),
    entityId: v.string(), // ID of task, project, or user
    value: v.any(),
    updatedAt: v.number(),
    updatedBy: v.string(), // Clerk user ID
  })
    .index("by_field", ["fieldDefinitionId"])
    .index("by_entity", ["entityId"])
    .index("by_field_and_entity", ["fieldDefinitionId", "entityId"]),

  // Workflow Automation
  workflows: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    trigger: v.object({
      type: v.union(
        v.literal("event"),
        v.literal("schedule"),
        v.literal("webhook"),
        v.literal("manual")
      ),
      eventType: v.optional(v.string()),
      schedule: v.optional(v.string()), // Cron expression
      webhookUrl: v.optional(v.string()),
      conditions: v.optional(v.array(v.object({
        field: v.string(),
        operator: v.string(),
        value: v.any(),
      }))),
    }),
    actions: v.array(v.object({
      type: v.string(),
      config: v.any(),
      order: v.number(),
    })),
    enabled: v.boolean(),
    lastRun: v.optional(v.number()),
    runCount: v.number(),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_enabled", ["enabled"])
    .index("by_trigger_type", ["trigger.type"]),

  workflowRuns: defineTable({
    workflowId: v.id("workflows"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    triggeredBy: v.string(),
    triggerData: v.optional(v.any()),
    executionLog: v.array(v.object({
      timestamp: v.number(),
      action: v.string(),
      status: v.string(),
      message: v.string(),
      data: v.optional(v.any()),
    })),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
  })
    .index("by_workflow", ["workflowId"])
    .index("by_status", ["status"])
    .index("by_started_at", ["startedAt"]),

  // Chat System
  chatChannels: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("public"),
      v.literal("private"),
      v.literal("direct"),
      v.literal("project"),
      v.literal("sprint")
    ),
    entityId: v.optional(v.string()), // For project/sprint channels
    members: v.array(v.id("users")),
    admins: v.array(v.id("users")),
    settings: v.optional(v.object({
      allowThreads: v.boolean(),
      allowReactions: v.boolean(),
      allowFiles: v.boolean(),
      allowGuestAccess: v.boolean(),
      autoArchiveAfterDays: v.optional(v.number()),
    })),
    archived: v.boolean(),
    pinnedMessages: v.array(v.id("chatMessages")),
    lastActivityAt: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_type", ["type"])
    .index("by_members", ["members"])
    .index("by_entity", ["entityId"])
    .index("by_activity", ["lastActivityAt"]),

  chatMessages: defineTable({
    channelId: v.id("chatChannels"),
    senderId: v.id("users"),
    content: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("file"),
      v.literal("image"),
      v.literal("code"),
      v.literal("system"),
      v.literal("task"),
      v.literal("meeting")
    ),
    metadata: v.optional(v.object({
      fileName: v.optional(v.string()),
      fileUrl: v.optional(v.string()),
      fileSize: v.optional(v.number()),
      mimeType: v.optional(v.string()),
      codeLanguage: v.optional(v.string()),
      taskId: v.optional(v.id("tasks")),
      meetingId: v.optional(v.id("meetings")),
      editedAt: v.optional(v.number()),
      editedBy: v.optional(v.id("users")),
    })),
    parentId: v.optional(v.id("chatMessages")), // For threads
    threadCount: v.number(),
    reactions: v.array(v.object({
      emoji: v.string(),
      userId: v.id("users"),
      createdAt: v.number(),
    })),
    mentions: v.array(v.id("users")),
    readBy: v.array(v.object({
      userId: v.id("users"),
      readAt: v.number(),
    })),
    deleted: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_channel", ["channelId"])
    .index("by_sender", ["senderId"])
    .index("by_parent", ["parentId"])
    .index("by_created", ["channelId", "createdAt"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["channelId", "senderId"],
    }),

  chatTypingIndicators: defineTable({
    channelId: v.id("chatChannels"),
    userId: v.id("users"),
    lastTypingAt: v.number(),
  })
    .index("by_channel", ["channelId"])
    .index("by_user", ["userId"]),

  chatNotificationSettings: defineTable({
    userId: v.id("users"),
    channelId: v.id("chatChannels"),
    muted: v.boolean(),
    muteUntil: v.optional(v.number()),
    notifyFor: v.union(
      v.literal("all"),
      v.literal("mentions"),
      v.literal("none")
    ),
  })
    .index("by_user", ["userId"])
    .index("by_channel", ["channelId"])
    .index("by_user_channel", ["userId", "channelId"]),

  // Video Conferencing
  videoRooms: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    type: v.union(
      v.literal("meeting"),
      v.literal("instant"),
      v.literal("persistent")
    ),
    meetingId: v.optional(v.id("meetings")),
    hostId: v.id("users"),
    participants: v.array(v.object({
      userId: v.id("users"),
      joinedAt: v.number(),
      leftAt: v.optional(v.number()),
      role: v.union(v.literal("host"), v.literal("presenter"), v.literal("participant")),
      audio: v.boolean(),
      video: v.boolean(),
      screen: v.boolean(),
    })),
    settings: v.object({
      maxParticipants: v.number(),
      allowGuests: v.boolean(),
      recordingEnabled: v.boolean(),
      waitingRoomEnabled: v.boolean(),
      muteOnEntry: v.boolean(),
      videoOnEntry: v.boolean(),
      chatEnabled: v.boolean(),
      screenShareEnabled: v.boolean(),
    }),
    recordingUrl: v.optional(v.string()),
    status: v.union(
      v.literal("scheduled"),
      v.literal("active"),
      v.literal("ended")
    ),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_meeting", ["meetingId"])
    .index("by_host", ["hostId"])
    .index("by_status", ["status"]),

  // Collaborative Whiteboard
  whiteboards: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    meetingId: v.optional(v.id("meetings")),
    thumbnail: v.optional(v.string()),
    elements: v.array(v.object({
      id: v.string(),
      type: v.union(
        v.literal("shape"),
        v.literal("text"),
        v.literal("line"),
        v.literal("image"),
        v.literal("sticky"),
        v.literal("drawing"),
        v.literal("arrow")
      ),
      data: v.any(), // Element-specific data
      position: v.object({
        x: v.number(),
        y: v.number(),
      }),
      size: v.object({
        width: v.number(),
        height: v.number(),
      }),
      rotation: v.number(),
      style: v.any(),
      locked: v.boolean(),
      createdBy: v.id("users"),
      updatedBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
    })),
    collaborators: v.array(v.object({
      userId: v.id("users"),
      cursor: v.optional(v.object({
        x: v.number(),
        y: v.number(),
      })),
      color: v.string(),
      lastActiveAt: v.number(),
    })),
    version: v.number(),
    locked: v.boolean(),
    public: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_project", ["projectId"])
    .index("by_meeting", ["meetingId"])
    .index("by_creator", ["createdBy"]),

  whiteboardSnapshots: defineTable({
    whiteboardId: v.id("whiteboards"),
    version: v.number(),
    elements: v.any(), // Snapshot of elements at this version
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_whiteboard", ["whiteboardId"])
    .index("by_version", ["whiteboardId", "version"]),

  // GitHub Rate Limiting
  githubRateLimits: defineTable({
    installationId: v.number(),
    apiType: v.union(v.literal("core"), v.literal("search"), v.literal("graphql")),
    remaining: v.number(),
    reset: v.number(), // Unix timestamp
    limit: v.number(),
    lastUpdated: v.number(),
  })
    .index("by_installation_api", ["installationId", "apiType"])
    .index("by_installation", ["installationId"]),

  // GitHub Operation Logs
  githubOperationLogs: defineTable({
    timestamp: v.number(),
    level: v.union(v.literal("debug"), v.literal("info"), v.literal("warn"), v.literal("error")),
    operation: v.string(),
    installationId: v.optional(v.number()),
    workspaceId: v.optional(v.id("workspaces")),
    duration: v.optional(v.number()),
    rateLimitRemaining: v.optional(v.number()),
    error: v.optional(v.object({
      code: v.string(),
      message: v.string(),
      retryable: v.boolean(),
    })),
    metadata: v.optional(v.any()),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_level", ["level"])
    .index("by_installation", ["installationId"]),
});