import { query } from "./_generated/server"
import { v } from "convex/values"

export const globalSearch = query({
  args: { 
    query: v.string(),
    filters: v.optional(v.object({
      type: v.optional(v.array(v.string())),
      workspace: v.optional(v.id("workspaces")),
      project: v.optional(v.id("projects")),
      dateRange: v.optional(v.object({
        start: v.optional(v.number()),
        end: v.optional(v.number())
      }))
    })),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const searchQuery = args.query.toLowerCase()
    const limit = args.limit || 50
    const results = []
    
    // Search Tasks
    if (!args.filters?.type || args.filters.type.includes('task')) {
      const tasks = await ctx.db
        .query("tasks")
        .filter((q) => {
          let filter = q.or(
            q.gte(q.field("title").toLowerCase(), searchQuery),
            q.gte(q.field("description").toLowerCase(), searchQuery)
          )
          
          if (args.filters?.workspace) {
            filter = q.and(filter, q.eq(q.field("workspaceId"), args.filters.workspace))
          }
          if (args.filters?.project) {
            filter = q.and(filter, q.eq(q.field("projectId"), args.filters.project))
          }
          
          return filter
        })
        .take(limit)
      
      results.push(...tasks.map(task => ({
        id: task._id,
        type: 'task' as const,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        projectId: task.projectId,
        workspaceId: task.workspaceId,
        createdAt: task._creationTime,
        url: `/tasks/${task._id}`
      })))
    }
    
    // Search Projects
    if (!args.filters?.type || args.filters.type.includes('project')) {
      const projects = await ctx.db
        .query("projects")
        .filter((q) => {
          let filter = q.or(
            q.gte(q.field("name").toLowerCase(), searchQuery),
            q.gte(q.field("description").toLowerCase(), searchQuery)
          )
          
          if (args.filters?.workspace) {
            filter = q.and(filter, q.eq(q.field("workspaceId"), args.filters.workspace))
          }
          
          return filter
        })
        .take(limit)
      
      results.push(...projects.map(project => ({
        id: project._id,
        type: 'project' as const,
        title: project.name,
        description: project.description,
        status: project.status,
        workspaceId: project.workspaceId,
        createdAt: project._creationTime,
        url: `/projects/${project._id}`
      })))
    }
    
    // Search Sprints
    if (!args.filters?.type || args.filters.type.includes('sprint')) {
      const sprints = await ctx.db
        .query("sprints")
        .filter((q) => {
          let filter = q.or(
            q.gte(q.field("name").toLowerCase(), searchQuery),
            q.gte(q.field("goal").toLowerCase(), searchQuery)
          )
          
          if (args.filters?.project) {
            filter = q.and(filter, q.eq(q.field("projectId"), args.filters.project))
          }
          
          return filter
        })
        .take(limit)
      
      results.push(...sprints.map(sprint => ({
        id: sprint._id,
        type: 'sprint' as const,
        title: sprint.name,
        description: sprint.goal,
        status: sprint.status,
        projectId: sprint.projectId,
        createdAt: sprint._creationTime,
        url: `/sprints/${sprint._id}`
      })))
    }
    
    // Search Meetings
    if (!args.filters?.type || args.filters.type.includes('meeting')) {
      const meetings = await ctx.db
        .query("meetings")
        .filter((q) => {
          let filter = q.or(
            q.gte(q.field("title").toLowerCase(), searchQuery),
            q.gte(q.field("description").toLowerCase(), searchQuery)
          )
          
          if (args.filters?.workspace) {
            filter = q.and(filter, q.eq(q.field("workspaceId"), args.filters.workspace))
          }
          
          return filter
        })
        .take(limit)
      
      results.push(...meetings.map(meeting => ({
        id: meeting._id,
        type: 'meeting' as const,
        title: meeting.title,
        description: meeting.description,
        startTime: meeting.startTime,
        workspaceId: meeting.workspaceId,
        createdAt: meeting._creationTime,
        url: `/meetings/${meeting._id}`
      })))
    }
    
    // Search Users
    if (!args.filters?.type || args.filters.type.includes('user')) {
      const users = await ctx.db
        .query("users")
        .filter((q) => {
          return q.or(
            q.gte(q.field("firstName").toLowerCase(), searchQuery),
            q.gte(q.field("lastName").toLowerCase(), searchQuery),
            q.gte(q.field("email").toLowerCase(), searchQuery)
          )
        })
        .take(limit)
      
      results.push(...users.map(user => ({
        id: user._id,
        type: 'user' as const,
        title: `${user.firstName} ${user.lastName}`,
        description: user.email,
        role: user.role,
        createdAt: user._creationTime,
        url: `/users/${user._id}`
      })))
    }
    
    // Sort results by relevance (simple text match score) and date
    const scoredResults = results.map(result => {
      let score = 0
      const titleLower = result.title?.toLowerCase() || ''
      const descLower = result.description?.toLowerCase() || ''
      
      // Exact match in title
      if (titleLower === searchQuery) score += 10
      // Start of title match
      else if (titleLower.startsWith(searchQuery)) score += 8
      // Contains in title
      else if (titleLower.includes(searchQuery)) score += 5
      
      // Exact match in description
      if (descLower === searchQuery) score += 6
      // Start of description match
      else if (descLower.startsWith(searchQuery)) score += 4
      // Contains in description
      else if (descLower.includes(searchQuery)) score += 2
      
      // Recency bonus (newer items score higher)
      const ageInDays = (Date.now() - result.createdAt) / (1000 * 60 * 60 * 24)
      score += Math.max(0, 5 - ageInDays / 30) // Up to 5 points for items < 30 days old
      
      return { ...result, score }
    })
    
    // Sort by score descending, then by date descending
    scoredResults.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.createdAt - a.createdAt
    })
    
    // Remove score from final results
    return scoredResults.map(({ score, ...result }) => result)
  },
})

// Quick search for command palette
export const quickSearch = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const limit = args.limit || 10
    const searchQuery = args.query.toLowerCase()
    
    // Quick search only returns top matches across all types
    const results = await ctx.db
      .query("tasks")
      .filter((q) => 
        q.or(
          q.gte(q.field("title").toLowerCase(), searchQuery),
          q.gte(q.field("key").toLowerCase(), searchQuery)
        )
      )
      .take(limit / 2) // Get some tasks
    
    const projects = await ctx.db
      .query("projects")
      .filter((q) => 
        q.gte(q.field("name").toLowerCase(), searchQuery)
      )
      .take(limit / 2) // Get some projects
    
    return [
      ...results.map(task => ({
        id: task._id,
        type: 'task' as const,
        title: task.title,
        key: task.key,
        icon: '📋',
        action: `/tasks/${task._id}`
      })),
      ...projects.map(project => ({
        id: project._id,
        type: 'project' as const,
        title: project.name,
        key: project.key,
        icon: '📁',
        action: `/projects/${project._id}`
      }))
    ]
  }
})

// Search suggestions for autocomplete
export const searchSuggestions = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const limit = args.limit || 5
    const searchQuery = args.query.toLowerCase()
    
    // Get unique titles/names for suggestions
    const suggestions = new Set<string>()
    
    // Get task titles
    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => 
        q.gte(q.field("title").toLowerCase(), searchQuery)
      )
      .take(limit)
    
    tasks.forEach(task => suggestions.add(task.title))
    
    // Get project names
    const projects = await ctx.db
      .query("projects")
      .filter((q) => 
        q.gte(q.field("name").toLowerCase(), searchQuery)
      )
      .take(limit)
    
    projects.forEach(project => suggestions.add(project.name))
    
    return Array.from(suggestions).slice(0, limit)
  }
})