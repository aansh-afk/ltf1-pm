import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Doc, Id } from "./_generated/dataModel"

// Queries

export const getTimeEntry = query({
  args: { timeEntryId: v.id("timeEntries") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const entry = await ctx.db.get(args.timeEntryId)
    if (!entry) {
      return null
    }

    // Check if user can access this entry
    if (entry.userId !== identity.subject) {
      // TODO: Check if user is a manager/admin
      throw new Error("You can only view your own time entries")
    }

    return entry
  },
})

export const getTimeEntriesByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    return await ctx.db
      .query("timeEntries")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .order("desc")
      .collect()
  },
})

export const getTimeEntriesByUser = query({
  args: { 
    userId: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    let query = ctx.db
      .query("timeEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))

    const entries = await query.collect()

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      return entries.filter(entry => {
        if (args.startDate && entry.startTime < args.startDate) return false
        if (args.endDate && entry.startTime > args.endDate) return false
        return true
      })
    }

    return entries
  },
})

export const getActiveTimeEntry = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const entries = await ctx.db
      .query("timeEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(1)

    const latestEntry = entries[0]
    
    // Check if the latest entry is still active (no endTime)
    if (latestEntry && !latestEntry.endTime) {
      return latestEntry
    }

    return null
  },
})

export const getTimeEntriesByProject = query({
  args: { 
    projectId: v.id("projects"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Get all tasks for the project
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect()

    const taskIds = tasks.map(t => t._id)

    // Get all time entries for these tasks
    const allEntries: Doc<"timeEntries">[] = []
    for (const taskId of taskIds) {
      const entries = await ctx.db
        .query("timeEntries")
        .withIndex("by_task", (q) => q.eq("taskId", taskId))
        .collect()
      allEntries.push(...entries)
    }

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      return allEntries.filter(entry => {
        if (args.startDate && entry.startTime < args.startDate) return false
        if (args.endDate && entry.startTime > args.endDate) return false
        return true
      })
    }

    return allEntries
  },
})

export const getTimeEntriesForApproval = query({
  args: { 
    projectId: v.optional(v.id("projects")),
    userId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // TODO: Check if user is a manager/admin

    let entries: Doc<"timeEntries">[] = []

    if (args.projectId) {
      // Get all tasks for the project
      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_project", (q) => q.eq("projectId", args.projectId!))
        .collect()

      const taskIds = tasks.map(t => t._id)

      // Get all unapproved time entries for these tasks
      for (const taskId of taskIds) {
        const taskEntries = await ctx.db
          .query("timeEntries")
          .withIndex("by_task", (q) => q.eq("taskId", taskId))
          .filter((q) => q.eq(q.field("approved"), false))
          .collect()
        entries.push(...taskEntries)
      }
    } else if (args.userId) {
      entries = await ctx.db
        .query("timeEntries")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .filter((q) => q.eq(q.field("approved"), false))
        .collect()
    } else {
      // Get all unapproved entries
      entries = await ctx.db
        .query("timeEntries")
        .filter((q) => q.eq(q.field("approved"), false))
        .collect()
    }

    return entries
  },
})

// Mutations

export const startTimer = mutation({
  args: {
    taskId: v.id("tasks"),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Check if there's already an active timer for this user
    const activeEntries = await ctx.db
      .query("timeEntries")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(1)

    const activeEntry = activeEntries[0]
    if (activeEntry && !activeEntry.endTime) {
      throw new Error("You already have an active timer. Please stop it first.")
    }

    // Create new time entry
    const entryId = await ctx.db.insert("timeEntries", {
      taskId: args.taskId,
      userId: identity.subject,
      startTime: Date.now(),
      description: args.description,
      billable: true, // Default to billable
      approved: false, // Default to not approved
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return entryId
  },
})

export const stopTimer = mutation({
  args: {
    timeEntryId: v.id("timeEntries"),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const entry = await ctx.db.get(args.timeEntryId)
    if (!entry) {
      throw new Error("Time entry not found")
    }

    if (entry.userId !== identity.subject) {
      throw new Error("You can only stop your own timers")
    }

    if (entry.endTime) {
      throw new Error("This timer has already been stopped")
    }

    const endTime = Date.now()
    const duration = endTime - entry.startTime

    await ctx.db.patch(args.timeEntryId, {
      endTime,
      duration,
      description: args.description || entry.description,
      updatedAt: Date.now(),
    })

    // Update task time spent
    const task = await ctx.db.get(entry.taskId)
    if (task) {
      const currentTimeTracked = task.timeTracked || 0
      await ctx.db.patch(entry.taskId, {
        timeTracked: currentTimeTracked + duration, // Store in milliseconds
        updatedAt: Date.now(),
      })
    }

    return { duration }
  },
})

export const createManualEntry = mutation({
  args: {
    taskId: v.id("tasks"),
    startTime: v.number(),
    endTime: v.number(),
    description: v.optional(v.string()),
    billable: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    if (args.endTime <= args.startTime) {
      throw new Error("End time must be after start time")
    }

    const duration = args.endTime - args.startTime

    const entryId = await ctx.db.insert("timeEntries", {
      taskId: args.taskId,
      userId: identity.subject,
      startTime: args.startTime,
      endTime: args.endTime,
      duration,
      description: args.description,
      billable: args.billable ?? true,
      approved: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Update task time spent
    const task = await ctx.db.get(args.taskId)
    if (task) {
      const currentTimeTracked = task.timeTracked || 0
      await ctx.db.patch(args.taskId, {
        timeTracked: currentTimeTracked + duration, // Store in milliseconds
        updatedAt: Date.now(),
      })
    }

    return entryId
  },
})

export const updateTimeEntry = mutation({
  args: {
    timeEntryId: v.id("timeEntries"),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    description: v.optional(v.string()),
    billable: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const entry = await ctx.db.get(args.timeEntryId)
    if (!entry) {
      throw new Error("Time entry not found")
    }

    if (entry.userId !== identity.subject) {
      throw new Error("You can only update your own time entries")
    }

    const updates: Partial<Doc<"timeEntries">> = {
      updatedAt: Date.now(),
    }

    if (args.startTime !== undefined) {
      updates.startTime = args.startTime
    }
    if (args.endTime !== undefined) {
      updates.endTime = args.endTime
    }
    if (args.description !== undefined) {
      updates.description = args.description
    }
    if (args.billable !== undefined) {
      updates.billable = args.billable
    }

    // Recalculate duration if times changed
    const newStartTime = updates.startTime || entry.startTime
    const newEndTime = updates.endTime || entry.endTime
    if (newEndTime) {
      updates.duration = newEndTime - newStartTime
    }

    await ctx.db.patch(args.timeEntryId, updates)

    return { success: true }
  },
})

export const deleteTimeEntry = mutation({
  args: {
    timeEntryId: v.id("timeEntries"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const entry = await ctx.db.get(args.timeEntryId)
    if (!entry) {
      throw new Error("Time entry not found")
    }

    if (entry.userId !== identity.subject) {
      throw new Error("You can only delete your own time entries")
    }

    if (entry.approved) {
      throw new Error("Cannot delete approved time entries")
    }

    // Update task time spent before deleting
    if (entry.duration) {
      const task = await ctx.db.get(entry.taskId)
      if (task) {
        const currentTimeTracked = task.timeTracked || 0
        const newTimeTracked = Math.max(0, currentTimeTracked - entry.duration)
        await ctx.db.patch(entry.taskId, {
          timeTracked: newTimeTracked,
          updatedAt: Date.now(),
        })
      }
    }

    await ctx.db.delete(args.timeEntryId)

    return { success: true }
  },
})

export const approveTimeEntries = mutation({
  args: {
    timeEntryIds: v.array(v.id("timeEntries")),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // TODO: Check if user is a manager/admin

    for (const entryId of args.timeEntryIds) {
      const entry = await ctx.db.get(entryId)
      if (entry) {
        await ctx.db.patch(entryId, {
          approved: args.approved,
          updatedAt: Date.now(),
        })
      }
    }

    return { success: true, count: args.timeEntryIds.length }
  },
})

export const getTimeStatsByUser = query({
  args: {
    userId: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const entries = await ctx.db
      .query("timeEntries")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect()

    // Filter by date range
    const filteredEntries = entries.filter(entry => {
      if (args.startDate && entry.startTime < args.startDate) return false
      if (args.endDate && entry.startTime > args.endDate) return false
      return true
    })

    // Calculate statistics
    const totalTime = filteredEntries.reduce((sum, entry) => 
      sum + (entry.duration || 0), 0
    )
    
    const billableTime = filteredEntries
      .filter(e => e.billable)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0)
    
    const approvedTime = filteredEntries
      .filter(e => e.approved)
      .reduce((sum, entry) => sum + (entry.duration || 0), 0)
    
    const entryCount = filteredEntries.length
    const averageSessionTime = entryCount > 0 ? totalTime / entryCount : 0

    // Group by task for breakdown
    const taskBreakdown = new Map<Id<"tasks">, number>()
    filteredEntries.forEach(entry => {
      const current = taskBreakdown.get(entry.taskId) || 0
      taskBreakdown.set(entry.taskId, current + (entry.duration || 0))
    })

    return {
      totalTime: totalTime / 3600000, // Convert to hours
      billableTime: billableTime / 3600000,
      approvedTime: approvedTime / 3600000,
      nonBillableTime: (totalTime - billableTime) / 3600000,
      entryCount,
      averageSessionTime: averageSessionTime / 3600000,
      taskBreakdown: Array.from(taskBreakdown.entries()).map(([taskId, duration]) => ({
        taskId,
        duration: duration / 3600000
      }))
    }
  },
})