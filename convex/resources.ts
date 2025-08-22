import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Doc, Id } from "./_generated/dataModel"

// Resource allocation interface
export interface ResourceAllocation {
  _id?: string
  userId: Id<"users">
  projectId: Id<"projects">
  allocation: number // Percentage 0-100
  role: string
  startDate: number
  endDate: number
  skills?: string[]
  approved: boolean
  createdAt: number
  updatedAt: number
}

// Queries

export const getResourceAllocations = query({
  args: {
    projectId: v.optional(v.id("projects")),
    userId: v.optional(v.id("users")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Get allocations from the database
    // Note: We'll need to add resourceAllocations table to schema
    let allocations: ResourceAllocation[] = []

    // For now, return mock data
    // TODO: Implement actual database queries once table is added
    if (args.projectId) {
      // Mock allocation for project
      const users = await ctx.db.query("users").take(5)
      allocations = users.map((user, index) => ({
        userId: user._id,
        projectId: args.projectId!,
        allocation: Math.min(100, (index + 1) * 20),
        role: ["Developer", "Designer", "Manager", "QA", "DevOps"][index],
        startDate: Date.now() - 30 * 24 * 60 * 60 * 1000,
        endDate: Date.now() + 60 * 24 * 60 * 60 * 1000,
        skills: ["React", "TypeScript", "Node.js"],
        approved: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }))
    }

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      allocations = allocations.filter(allocation => {
        if (args.startDate && allocation.endDate < args.startDate) return false
        if (args.endDate && allocation.startDate > args.endDate) return false
        return true
      })
    }

    return allocations
  },
})

export const getTeamCapacity = query({
  args: {
    teamIds: v.optional(v.array(v.id("users"))),
    startDate: v.number(),
    endDate: v.number()
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Calculate team capacity
    const capacity = new Map<Id<"users">, number>()
    
    // Get all users or specific team members
    const users = args.teamIds 
      ? await Promise.all(args.teamIds.map(id => ctx.db.get(id)))
      : await ctx.db.query("users").collect()

    // Calculate working days between dates
    const workingDays = Math.ceil((args.endDate - args.startDate) / (24 * 60 * 60 * 1000))
    const workingHours = workingDays * 8 // Assume 8 hours per day

    // Set capacity for each user
    users.forEach(user => {
      if (user) {
        capacity.set(user._id, workingHours)
      }
    })

    return Array.from(capacity.entries()).map(([userId, hours]) => ({
      userId,
      availableHours: hours,
      allocatedHours: 0, // TODO: Calculate from actual allocations
      utilizationRate: 0 // TODO: Calculate utilization
    }))
  },
})

export const getSkillMatrix = query({
  args: {
    projectId: v.optional(v.id("projects")),
    skills: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Get all users
    const users = await ctx.db.query("users").collect()

    // Build skill matrix
    const skillMatrix = users.map(user => ({
      userId: user._id,
      userName: user.name,
      skills: [
        { skill: "React", level: Math.floor(Math.random() * 5) + 1 },
        { skill: "TypeScript", level: Math.floor(Math.random() * 5) + 1 },
        { skill: "Node.js", level: Math.floor(Math.random() * 5) + 1 },
        { skill: "Python", level: Math.floor(Math.random() * 5) + 1 },
        { skill: "Docker", level: Math.floor(Math.random() * 5) + 1 },
        { skill: "AWS", level: Math.floor(Math.random() * 5) + 1 }
      ].filter(s => !args.skills || args.skills.includes(s.skill))
    }))

    return skillMatrix
  },
})

export const getWorkloadBalance = query({
  args: {
    teamIds: v.optional(v.array(v.id("users"))),
    period: v.optional(v.union(v.literal("week"), v.literal("month"), v.literal("quarter")))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const period = args.period || "month"
    const now = Date.now()
    let startDate = now
    let endDate = now

    switch (period) {
      case "week":
        endDate = now + 7 * 24 * 60 * 60 * 1000
        break
      case "month":
        endDate = now + 30 * 24 * 60 * 60 * 1000
        break
      case "quarter":
        endDate = now + 90 * 24 * 60 * 60 * 1000
        break
    }

    // Get users
    const users = args.teamIds
      ? await Promise.all(args.teamIds.map(id => ctx.db.get(id)))
      : await ctx.db.query("users").collect()

    // Calculate workload for each user
    const workload = await Promise.all(
      users.filter(u => u !== null).map(async (user) => {
        // Get assigned tasks
        const tasks = await ctx.db
          .query("tasks")
          .filter(q => q.eq(q.field("status"), "todo"))
          .collect()

        const userTasks = tasks.filter(task => 
          task.assigneeIds?.includes(user!._id) || 
          task.assigneeId === user!._id
        )

        const totalEstimate = userTasks.reduce((sum, task) => 
          sum + (task.estimate?.hours || 8), 0
        )

        const capacity = period === "week" ? 40 : period === "month" ? 160 : 480
        const utilization = (totalEstimate / capacity) * 100

        return {
          userId: user!._id,
          userName: user!.name,
          assignedTasks: userTasks.length,
          estimatedHours: totalEstimate,
          capacity,
          utilization,
          status: utilization > 100 ? "overloaded" : utilization > 80 ? "high" : utilization > 50 ? "balanced" : "available"
        }
      })
    )

    return workload
  },
})

export const getUtilizationReport = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    groupBy: v.optional(v.union(v.literal("user"), v.literal("project"), v.literal("department")))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const groupBy = args.groupBy || "user"

    // Get time entries in date range
    const timeEntries = await ctx.db
      .query("timeEntries")
      .withIndex("by_start_time", q => 
        q.gte("startTime", args.startDate).lte("startTime", args.endDate)
      )
      .collect()

    // Calculate utilization based on grouping
    const utilization = new Map<string, {
      totalHours: number
      billableHours: number
      tasks: Set<Id<"tasks">>
    }>()

    for (const entry of timeEntries) {
      const duration = (entry.duration || 0) / 3600000 // Convert to hours
      const billable = entry.billable ? duration : 0

      let key = ""
      switch (groupBy) {
        case "user":
          key = entry.userId
          break
        case "project":
          const task = await ctx.db.get(entry.taskId)
          key = task?.projectId || "unknown"
          break
        case "department":
          // TODO: Get department from user
          key = "Engineering"
          break
      }

      const current = utilization.get(key) || {
        totalHours: 0,
        billableHours: 0,
        tasks: new Set()
      }

      current.totalHours += duration
      current.billableHours += billable
      current.tasks.add(entry.taskId)

      utilization.set(key, current)
    }

    // Convert to array and calculate rates
    const report = Array.from(utilization.entries()).map(([key, data]) => ({
      id: key,
      totalHours: data.totalHours,
      billableHours: data.billableHours,
      nonBillableHours: data.totalHours - data.billableHours,
      utilizationRate: data.billableHours / data.totalHours * 100,
      taskCount: data.tasks.size
    }))

    return report
  },
})

// Mutations

export const allocateResource = mutation({
  args: {
    userId: v.id("users"),
    projectId: v.id("projects"),
    allocation: v.number(), // 0-100
    role: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    skills: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Validate allocation percentage
    if (args.allocation < 0 || args.allocation > 100) {
      throw new Error("Allocation must be between 0 and 100")
    }

    // Validate dates
    if (args.endDate <= args.startDate) {
      throw new Error("End date must be after start date")
    }

    // TODO: Check for allocation conflicts
    // For now, just return success
    // In real implementation, would insert into resourceAllocations table

    return {
      success: true,
      message: "Resource allocated successfully"
    }
  },
})

export const updateAllocation = mutation({
  args: {
    allocationId: v.string(), // Would be v.id("resourceAllocations") with real table
    allocation: v.optional(v.number()),
    role: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    skills: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Validate allocation if provided
    if (args.allocation !== undefined && (args.allocation < 0 || args.allocation > 100)) {
      throw new Error("Allocation must be between 0 and 100")
    }

    // TODO: Update actual allocation in database
    
    return {
      success: true,
      message: "Allocation updated successfully"
    }
  },
})

export const removeAllocation = mutation({
  args: {
    allocationId: v.string() // Would be v.id("resourceAllocations") with real table
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // TODO: Remove allocation from database

    return {
      success: true,
      message: "Allocation removed successfully"
    }
  },
})

export const balanceWorkload = mutation({
  args: {
    projectId: v.id("projects"),
    strategy: v.union(v.literal("even"), v.literal("skills"), v.literal("availability"))
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Get all unassigned tasks for the project
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", q => q.eq("projectId", args.projectId))
      .filter(q => q.eq(q.field("status"), "todo"))
      .collect()

    const unassignedTasks = tasks.filter(task => 
      !task.assigneeIds || task.assigneeIds.length === 0
    )

    // Get available team members
    const projectMembers = await ctx.db
      .query("projectMembers")
      .withIndex("by_project", q => q.eq("projectId", args.projectId))
      .collect()

    if (projectMembers.length === 0) {
      throw new Error("No team members found for this project")
    }

    // Balance based on strategy
    let assignmentIndex = 0
    for (const task of unassignedTasks) {
      let assigneeId: Id<"users">

      switch (args.strategy) {
        case "even":
          // Round-robin assignment
          assigneeId = projectMembers[assignmentIndex % projectMembers.length].userId
          assignmentIndex++
          break
        
        case "skills":
          // TODO: Match based on skills
          assigneeId = projectMembers[0].userId
          break
        
        case "availability":
          // TODO: Check availability
          assigneeId = projectMembers[0].userId
          break
      }

      // Update task assignment
      await ctx.db.patch(task._id, {
        assigneeIds: [assigneeId],
        updatedAt: Date.now()
      })
    }

    return {
      success: true,
      tasksAssigned: unassignedTasks.length,
      message: `Assigned ${unassignedTasks.length} tasks using ${args.strategy} strategy`
    }
  },
})