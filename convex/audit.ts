import { v } from "convex/values"
import { internalMutation, mutation, query } from "./_generated/server"
import type { Doc, Id } from "./_generated/dataModel"

// Audit event types
export const AUDIT_EVENTS = {
  // Authentication
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  USER_LOGIN_FAILED: 'user.login_failed',
  USER_PASSWORD_RESET: 'user.password_reset',
  USER_MFA_ENABLED: 'user.mfa_enabled',
  USER_MFA_DISABLED: 'user.mfa_disabled',
  
  // User Management
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  USER_ROLE_CHANGED: 'user.role_changed',
  USER_INVITED: 'user.invited',
  USER_SUSPENDED: 'user.suspended',
  USER_REACTIVATED: 'user.reactivated',
  
  // Workspace Management
  WORKSPACE_CREATED: 'workspace.created',
  WORKSPACE_UPDATED: 'workspace.updated',
  WORKSPACE_DELETED: 'workspace.deleted',
  WORKSPACE_MEMBER_ADDED: 'workspace.member_added',
  WORKSPACE_MEMBER_REMOVED: 'workspace.member_removed',
  WORKSPACE_SETTINGS_CHANGED: 'workspace.settings_changed',
  
  // Project Management
  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',
  PROJECT_DELETED: 'project.deleted',
  PROJECT_ARCHIVED: 'project.archived',
  PROJECT_RESTORED: 'project.restored',
  PROJECT_MEMBER_ADDED: 'project.member_added',
  PROJECT_MEMBER_REMOVED: 'project.member_removed',
  
  // Task Management
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_DELETED: 'task.deleted',
  TASK_ASSIGNED: 'task.assigned',
  TASK_UNASSIGNED: 'task.unassigned',
  TASK_COMPLETED: 'task.completed',
  TASK_REOPENED: 'task.reopened',
  
  // Sprint Management
  SPRINT_CREATED: 'sprint.created',
  SPRINT_STARTED: 'sprint.started',
  SPRINT_COMPLETED: 'sprint.completed',
  SPRINT_UPDATED: 'sprint.updated',
  SPRINT_DELETED: 'sprint.deleted',
  
  // Data Security
  DATA_EXPORTED: 'data.exported',
  DATA_IMPORTED: 'data.imported',
  DATA_BACKUP_CREATED: 'data.backup_created',
  DATA_BACKUP_RESTORED: 'data.backup_restored',
  
  // Integration Events
  INTEGRATION_CONNECTED: 'integration.connected',
  INTEGRATION_DISCONNECTED: 'integration.disconnected',
  INTEGRATION_SYNC_STARTED: 'integration.sync_started',
  INTEGRATION_SYNC_COMPLETED: 'integration.sync_completed',
  INTEGRATION_SYNC_FAILED: 'integration.sync_failed',
  
  // Security Events
  PERMISSION_GRANTED: 'permission.granted',
  PERMISSION_REVOKED: 'permission.revoked',
  API_KEY_CREATED: 'api_key.created',
  API_KEY_REVOKED: 'api_key.revoked',
  SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
  
  // Compliance Events
  GDPR_DATA_REQUEST: 'compliance.gdpr_data_request',
  GDPR_DATA_DELETION: 'compliance.gdpr_data_deletion',
  TERMS_ACCEPTED: 'compliance.terms_accepted',
  PRIVACY_SETTINGS_UPDATED: 'compliance.privacy_settings_updated',
} as const

export type AuditEventType = typeof AUDIT_EVENTS[keyof typeof AUDIT_EVENTS]

// Severity levels
export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Audit log entry interface
export interface AuditLogEntry {
  _id?: Id<"auditLogs">
  workspaceId: Id<"workspaces">
  userId?: string // Clerk user ID
  userEmail?: string
  userName?: string
  eventType: AuditEventType
  severity: AuditSeverity
  entityType?: string // 'task', 'project', 'user', etc.
  entityId?: string
  entityName?: string
  description: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  location?: {
    country?: string
    city?: string
    region?: string
  }
  timestamp: number
  sessionId?: string
}

// Create audit log entry
export const createAuditLog = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    eventType: v.string(),
    severity: v.string(),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    entityName: v.optional(v.string()),
    description: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    location: v.optional(v.object({
      country: v.optional(v.string()),
      city: v.optional(v.string()),
      region: v.optional(v.string()),
    })),
    sessionId: v.optional(v.string()),
  },
  returns: v.id("auditLogs"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    
    // Get user details if authenticated
    let userEmail: string | undefined
    let userName: string | undefined
    
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first()
      
      userEmail = user?.email
      userName = user?.name
    }
    
    // Create audit log entry
    const auditLogId = await ctx.db.insert("auditLogs", {
      workspaceId: args.workspaceId,
      userId: identity?.subject,
      userEmail,
      userName,
      eventType: args.eventType as AuditEventType,
      severity: args.severity as AuditSeverity,
      entityType: args.entityType,
      entityId: args.entityId,
      entityName: args.entityName,
      description: args.description,
      metadata: args.metadata,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      location: args.location,
      timestamp: Date.now(),
      sessionId: args.sessionId,
    })
    
    // Check for suspicious activity patterns
    await checkSuspiciousActivity(ctx, args)
    
    return auditLogId
  },
})

// Query audit logs
export const getAuditLogs = query({
  args: {
    workspaceId: v.id("workspaces"),
    eventType: v.optional(v.string()),
    severity: v.optional(v.string()),
    userId: v.optional(v.string()),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("auditLogs"),
    workspaceId: v.id("workspaces"),
    userId: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    userName: v.optional(v.string()),
    eventType: v.string(),
    severity: v.string(),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    entityName: v.optional(v.string()),
    description: v.string(),
    metadata: v.optional(v.record(v.string(), v.any())),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    location: v.optional(v.object({
      country: v.optional(v.string()),
      city: v.optional(v.string()),
      region: v.optional(v.string()),
    })),
    timestamp: v.number(),
    sessionId: v.optional(v.string()),
    _creationTime: v.number(),
  })),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()
    if (!user) throw new Error("User not found")

    const member = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .unique()
    if (!member) throw new Error("Access denied: not a workspace member")

    let query = ctx.db
      .query("auditLogs")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
    
    let logs = await query.collect()
    
    // Apply filters
    if (args.eventType) {
      logs = logs.filter(log => log.eventType === args.eventType)
    }
    
    if (args.severity) {
      logs = logs.filter(log => log.severity === args.severity)
    }
    
    if (args.userId) {
      logs = logs.filter(log => log.userId === args.userId)
    }
    
    if (args.entityType) {
      logs = logs.filter(log => log.entityType === args.entityType)
    }
    
    if (args.entityId) {
      logs = logs.filter(log => log.entityId === args.entityId)
    }
    
    if (args.startDate) {
      logs = logs.filter(log => log.timestamp >= args.startDate!)
    }
    
    if (args.endDate) {
      logs = logs.filter(log => log.timestamp <= args.endDate!)
    }
    
    // Apply limit
    if (args.limit) {
      logs = logs.slice(0, args.limit)
    }
    
    return logs
  },
})

// Get audit log statistics
export const getAuditLogStats = query({
  args: {
    workspaceId: v.id("workspaces"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  returns: v.object({
    totalEvents: v.number(),
    byEventType: v.record(v.string(), v.number()),
    bySeverity: v.record(v.string(), v.number()),
    byUser: v.record(v.string(), v.number()),
    byEntityType: v.record(v.string(), v.number()),
    byDay: v.record(v.string(), v.number()),
    topUsers: v.array(v.object({
      userId: v.string(),
      userName: v.optional(v.string()),
      count: v.number(),
    })),
    recentEvents: v.array(v.object({
      _id: v.id("auditLogs"),
      workspaceId: v.id("workspaces"),
      userId: v.optional(v.string()),
      userEmail: v.optional(v.string()),
      userName: v.optional(v.string()),
      eventType: v.string(),
      severity: v.string(),
      entityType: v.optional(v.string()),
      entityId: v.optional(v.string()),
      entityName: v.optional(v.string()),
      description: v.string(),
      metadata: v.optional(v.record(v.string(), v.any())),
      ipAddress: v.optional(v.string()),
      userAgent: v.optional(v.string()),
      location: v.optional(v.object({
        country: v.optional(v.string()),
        city: v.optional(v.string()),
        region: v.optional(v.string()),
      })),
      timestamp: v.number(),
      sessionId: v.optional(v.string()),
      _creationTime: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()
    if (!user) throw new Error("User not found")

    const member = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .unique()
    if (!member) throw new Error("Access denied: not a workspace member")

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect()

    // Filter by date range
    const filteredLogs = logs.filter(log => {
      if (args.startDate && log.timestamp < args.startDate) return false
      if (args.endDate && log.timestamp > args.endDate) return false
      return true
    })

    // Calculate statistics
    const stats = {
      totalEvents: filteredLogs.length,
      byEventType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byUser: {} as Record<string, number>,
      byEntityType: {} as Record<string, number>,
      byDay: {} as Record<string, number>,
      topUsers: [] as Array<{ userId: string, userName?: string, count: number }>,
      recentEvents: filteredLogs.slice(0, 10),
    }
    
    // Count by event type
    filteredLogs.forEach(log => {
      stats.byEventType[log.eventType] = (stats.byEventType[log.eventType] || 0) + 1
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1
      
      if (log.userId) {
        stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1
      }
      
      if (log.entityType) {
        stats.byEntityType[log.entityType] = (stats.byEntityType[log.entityType] || 0) + 1
      }
      
      // Count by day
      const day = new Date(log.timestamp).toISOString().split('T')[0]
      stats.byDay[day] = (stats.byDay[day] || 0) + 1
    })
    
    // Get top users
    stats.topUsers = Object.entries(stats.byUser)
      .map(([userId, count]) => {
        const userLog = filteredLogs.find(log => log.userId === userId)
        return {
          userId,
          userName: userLog?.userName,
          count
        }
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    return stats
  },
})

// Export audit logs
export const exportAuditLogs = query({
  args: {
    workspaceId: v.id("workspaces"),
    format: v.union(v.literal("json"), v.literal("csv")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  returns: v.object({
    format: v.string(),
    data: v.string(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()
    if (!user) throw new Error("User not found")

    const member = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .unique()
    if (!member) throw new Error("Access denied: not a workspace member")

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect()

    // Filter by date range
    const filteredLogs = logs.filter(log => {
      if (args.startDate && log.timestamp < args.startDate) return false
      if (args.endDate && log.timestamp > args.endDate) return false
      return true
    })
    
    if (args.format === 'csv') {
      // Convert to CSV format
      const headers = [
        'Timestamp',
        'Event Type',
        'Severity',
        'User',
        'Entity Type',
        'Entity Name',
        'Description',
        'IP Address'
      ].join(',')
      
      const rows = filteredLogs.map(log => [
        new Date(log.timestamp).toISOString(),
        log.eventType,
        log.severity,
        log.userName || log.userEmail || log.userId || '',
        log.entityType || '',
        log.entityName || '',
        `"${log.description.replace(/"/g, '""')}"`,
        log.ipAddress || ''
      ].join(','))
      
      return {
        format: 'csv',
        data: [headers, ...rows].join('\n')
      }
    } else {
      // Return as JSON
      return {
        format: 'json',
        data: JSON.stringify(filteredLogs, null, 2)
      }
    }
  },
})

// Set audit log retention policy
export const setRetentionPolicy = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    retentionDays: v.number(),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()
    if (!user) throw new Error("User not found")

    const member = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", user._id)
      )
      .unique()
    if (!member) throw new Error("Access denied: not a workspace member")
    if (member.role !== "admin" && member.role !== "owner") throw new Error("Access denied: admin required")

    // Note: Retention policy is set per workspace ID in a future implementation
    // For now, we'll use the default retention policy of 90 days
    
    // Create audit log for this action
    await ctx.db.insert("auditLogs", {
      workspaceId: args.workspaceId,
      userId: identity.subject,
      eventType: AUDIT_EVENTS.WORKSPACE_SETTINGS_CHANGED,
      severity: AuditSeverity.INFO,
      entityType: 'workspace',
      entityId: args.workspaceId,
      description: `Changed audit log retention policy to ${args.retentionDays} days`,
      metadata: {
        setting: 'auditLogRetentionDays',
        newValue: args.retentionDays
      },
      timestamp: Date.now(),
    })
    
    return { success: true }
  },
})

// Clean up old audit logs based on retention policy
export const cleanupAuditLogs = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.object({ deletedCount: v.number() }),
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId)
    if (!workspace) {
      throw new Error("Workspace not found")
    }
    
    const retentionDays = 90 // Default retention policy
    const cutoffDate = Date.now() - (retentionDays * 24 * 60 * 60 * 1000)
    
    // Get old logs
    const oldLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.lt(q.field("timestamp"), cutoffDate))
      .collect()
    
    // Delete old logs
    for (const log of oldLogs) {
      await ctx.db.delete(log._id)
    }
    
    // Create audit log for cleanup
    await ctx.db.insert("auditLogs", {
      workspaceId: args.workspaceId,
      userId: 'system',
      eventType: AUDIT_EVENTS.DATA_BACKUP_CREATED,
      severity: AuditSeverity.INFO,
      entityType: 'audit_logs',
      description: `Cleaned up ${oldLogs.length} audit logs older than ${retentionDays} days`,
      metadata: {
        deletedCount: oldLogs.length,
        retentionDays,
        cutoffDate
      },
      timestamp: Date.now(),
    })
    
    return { deletedCount: oldLogs.length }
  },
})

// Check for suspicious activity patterns
async function checkSuspiciousActivity(ctx: any, args: any) {
  // Check for multiple failed login attempts
  if (args.eventType === AUDIT_EVENTS.USER_LOGIN_FAILED) {
    const recentFailedLogins = await ctx.db
      .query("auditLogs")
      .withIndex("by_workspace", (q: any) => q.eq("workspaceId", args.workspaceId))
      .filter((q: any) => 
        q.and(
          q.eq(q.field("eventType"), AUDIT_EVENTS.USER_LOGIN_FAILED),
          q.eq(q.field("userId"), args.userId),
          q.gt(q.field("timestamp"), Date.now() - 15 * 60 * 1000) // Last 15 minutes
        )
      )
      .collect()
    
    if (recentFailedLogins.length >= 5) {
      // Create suspicious activity alert
      await ctx.db.insert("auditLogs", {
        workspaceId: args.workspaceId,
        userId: args.userId,
        eventType: AUDIT_EVENTS.SUSPICIOUS_ACTIVITY,
        severity: AuditSeverity.WARNING,
        description: `Multiple failed login attempts detected (${recentFailedLogins.length} attempts in 15 minutes)`,
        metadata: {
          attemptCount: recentFailedLogins.length,
          ipAddress: args.ipAddress
        },
        timestamp: Date.now(),
      })
    }
  }
  
  // Check for unusual data export activity
  if (args.eventType === AUDIT_EVENTS.DATA_EXPORTED) {
    const recentExports = await ctx.db
      .query("auditLogs")
      .withIndex("by_workspace", (q: any) => q.eq("workspaceId", args.workspaceId))
      .filter((q: any) => 
        q.and(
          q.eq(q.field("eventType"), AUDIT_EVENTS.DATA_EXPORTED),
          q.eq(q.field("userId"), args.userId),
          q.gt(q.field("timestamp"), Date.now() - 60 * 60 * 1000) // Last hour
        )
      )
      .collect()
    
    if (recentExports.length >= 10) {
      // Create suspicious activity alert
      await ctx.db.insert("auditLogs", {
        workspaceId: args.workspaceId,
        userId: args.userId,
        eventType: AUDIT_EVENTS.SUSPICIOUS_ACTIVITY,
        severity: AuditSeverity.WARNING,
        description: `Unusual data export activity detected (${recentExports.length} exports in 1 hour)`,
        metadata: {
          exportCount: recentExports.length
        },
        timestamp: Date.now(),
      })
    }
  }
}