import { v } from "convex/values"
import { mutation, query } from "../_generated/server"
import { Id } from "../_generated/dataModel"

export const startTimeTracking = mutation({
  args: {
    taskId: v.id("tasks")
  },
  handler: async (ctx, { taskId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    const task = await ctx.db.get(taskId)
    if (!task) {
      throw new Error("Task not found")
    }

    // Check if there's already an active time tracking session
    const activeSession = await ctx.db
      .query("timeEntries")
      .withIndex("by_task_and_user", (q) => 
        q.eq("taskId", taskId).eq("userId", identity.subject)
      )
      .filter((q) => q.eq(q.field("endTime"), undefined))
      .first()

    if (activeSession) {
      throw new Error("Time tracking already active for this task")
    }

    // Create new time entry
    const timeEntryId = await ctx.db.insert("timeEntries", {
      taskId,
      userId: identity.subject,
      startTime: Date.now(),
      description: `Working on: ${task.title}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })

    // Update task status to in-progress if not already
    if (task.status !== "in_progress") {
      await ctx.db.patch(taskId, {
        status: "in_progress",
        updatedAt: Date.now()
      })
    }

    return timeEntryId
  }
})

export const pauseTimeTracking = mutation({
  args: {
    taskId: v.id("tasks"),
    duration: v.number()
  },
  handler: async (ctx, { taskId, duration }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    // Find active time tracking session
    const activeSession = await ctx.db
      .query("timeEntries")
      .withIndex("by_task_and_user", (q) => 
        q.eq("taskId", taskId).eq("userId", identity.subject)
      )
      .filter((q) => q.eq(q.field("endTime"), undefined))
      .first()

    if (!activeSession) {
      throw new Error("No active time tracking session found")
    }

    // Update the session with end time and duration
    await ctx.db.patch(activeSession._id, {
      endTime: Date.now(),
      duration: Math.max(duration, Date.now() - activeSession.startTime),
      updatedAt: Date.now()
    })

    return activeSession._id
  }
})

export const stopTimeTracking = mutation({
  args: {
    taskId: v.id("tasks"),
    duration: v.number()
  },
  handler: async (ctx, { taskId, duration }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Not authenticated")
    }

    // Find active time tracking session
    const activeSession = await ctx.db
      .query("timeEntries")
      .withIndex("by_task_and_user", (q) => 
        q.eq("taskId", taskId).eq("userId", identity.subject)
      )
      .filter((q) => q.eq(q.field("endTime"), undefined))
      .first()

    if (!activeSession) {
      throw new Error("No active time tracking session found")
    }

    // Calculate final duration
    const finalDuration = Math.max(duration, Date.now() - activeSession.startTime)

    // Update the session with end time and duration
    await ctx.db.patch(activeSession._id, {
      endTime: Date.now(),
      duration: finalDuration,
      updatedAt: Date.now()
    })

    // Update task's total time tracked
    const task = await ctx.db.get(taskId)
    if (task) {
      const currentTimeTracked = task.timeTracked || 0
      await ctx.db.patch(taskId, {
        timeTracked: currentTimeTracked + finalDuration,
        updatedAt: Date.now()
      })
    }

    return {
      timeEntryId: activeSession._id,
      totalDuration: finalDuration
    }
  }
})

export const getTaskTimeEntries = query({
  args: {
    taskId: v.id("tasks")
  },
  handler: async (ctx, { taskId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    const timeEntries = await ctx.db
      .query("timeEntries")
      .withIndex("by_task_and_user", (q) => 
        q.eq("taskId", taskId).eq("userId", identity.subject)
      )
      .collect()

    return timeEntries.map(entry => ({
      ...entry,
      duration: entry.duration || (entry.endTime ? entry.endTime - entry.startTime : 0)
    }))
  }
})

export const getActiveTimeEntry = query({
  args: {
    taskId: v.id("tasks")
  },
  handler: async (ctx, { taskId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const activeEntry = await ctx.db
      .query("timeEntries")
      .withIndex("by_task_and_user", (q) => 
        q.eq("taskId", taskId).eq("userId", identity.subject)
      )
      .filter((q) => q.eq(q.field("endTime"), undefined))
      .first()

    return activeEntry
  }
})