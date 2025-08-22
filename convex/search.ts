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
  returns: v.array(v.union(
    v.object({
      id: v.id("tasks"),
      type: v.literal("task"),
      title: v.string(),
      description: v.optional(v.string()),
      status: v.optional(v.string()),
      priority: v.optional(v.string()),
      projectId: v.optional(v.id("projects")),
      createdAt: v.number(),
      url: v.string(),
    }),
    v.object({
      id: v.id("projects"),
      type: v.literal("project"),
      title: v.string(),
      description: v.optional(v.string()),
      status: v.optional(v.string()),
      createdAt: v.number(),
      url: v.string(),
    }),
    v.object({
      id: v.id("sprints"),
      type: v.literal("sprint"),
      title: v.string(),
      description: v.optional(v.string()),
      status: v.optional(v.string()),
      projectId: v.optional(v.id("projects")),
      createdAt: v.number(),
      url: v.string(),
    }),
    v.object({
      id: v.id("meetings"),
      type: v.literal("meeting"),
      title: v.string(),
      description: v.optional(v.string()),
      createdAt: v.number(),
      url: v.string(),
    }),
    v.object({
      id: v.id("users"),
      type: v.literal("user"),
      title: v.string(),
      description: v.optional(v.string()),
      role: v.optional(v.string()),
      createdAt: v.number(),
      url: v.string(),
    })
  )),
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
      let allTasks = await ctx.db.query("tasks").collect()
      
      // Apply project filter if provided
      if (args.filters?.project) {
        allTasks = allTasks.filter(t => t.projectId === args.filters!.project)
      }
      
      // Filter by search query in JavaScript (case-insensitive)
      const tasks = allTasks
        .filter(task => {
          const titleMatch = task.title.toLowerCase().includes(searchQuery)
          const descMatch = task.description?.toLowerCase().includes(searchQuery) || false
          return titleMatch || descMatch
        })
        .slice(0, limit)
      
      results.push(...tasks.map(task => ({
        id: task._id,
        type: 'task' as const,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        projectId: task.projectId,
        createdAt: task._creationTime,
        url: `/tasks/${task._id}`
      })))
    }
    
    // Search Projects
    if (!args.filters?.type || args.filters.type.includes('project')) {
      let allProjects = await ctx.db.query("projects").collect()
      
      // Apply workspace filter if provided
      if (args.filters?.workspace) {
        allProjects = allProjects.filter(p => p.workspaceId === args.filters!.workspace)
      }
      
      // Filter by search query in JavaScript (case-insensitive)
      const projects = allProjects
        .filter((project: any) => {
          const nameMatch = project.name.toLowerCase().includes(searchQuery)
          const descMatch = project.description?.toLowerCase().includes(searchQuery) || false
          return nameMatch || descMatch
        })
        .slice(0, limit)
      
      results.push(...projects.map(project => ({
        id: project._id,
        type: 'project' as const,
        title: project.name,
        description: project.description,
        status: project.status,
        createdAt: project._creationTime,
        url: `/projects/${project._id}`
      })))
    }
    
    // Search Sprints
    if (!args.filters?.type || args.filters.type.includes('sprint')) {
      let allSprints = await ctx.db.query("sprints").collect()
      
      // Apply project filter if provided
      if (args.filters?.project) {
        allSprints = allSprints.filter(s => s.projectId === args.filters!.project)
      }
      
      // Filter by search query in JavaScript (case-insensitive)
      const sprints = allSprints
        .filter((sprint: any) => {
          const nameMatch = sprint.name.toLowerCase().includes(searchQuery)
          const goalMatch = sprint.goal?.toLowerCase().includes(searchQuery) || false
          return nameMatch || goalMatch
        })
        .slice(0, limit)
      
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
      let allMeetings = await ctx.db.query("meetings").collect()
      
      // Apply workspace filter if provided
      if (args.filters?.workspace) {
        allMeetings = allMeetings.filter(m => m.workspaceId === args.filters!.workspace)
      }
      
      // Filter by search query in JavaScript (case-insensitive)
      const meetings = allMeetings
        .filter((meeting: any) => {
          const titleMatch = meeting.title.toLowerCase().includes(searchQuery)
          const descMatch = meeting.description?.toLowerCase().includes(searchQuery) || false
          return titleMatch || descMatch
        })
        .slice(0, limit)
      
      results.push(...meetings.map((meeting: any) => ({
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
      const allUsers = await ctx.db.query("users").collect()
      
      // Filter by search query in JavaScript (case-insensitive)
      const users = allUsers
        .filter(user => {
          const emailMatch = user.email.toLowerCase().includes(searchQuery)
          return emailMatch
        })
        .slice(0, limit)
      
      results.push(...users.map(user => ({
        id: user._id,
        type: 'user' as const,
        title: user.email,
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
  returns: v.array(v.object({
    id: v.union(v.id("tasks"), v.id("projects")),
    type: v.string(),
    title: v.string(),
    icon: v.string(),
    action: v.string(),
  })),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const limit = args.limit || 10
    const searchQuery = args.query.toLowerCase()
    
    // Quick search only returns top matches across all types
    const allTasks = await ctx.db.query("tasks").collect()
    const results = allTasks
      .filter(task => task.title.toLowerCase().includes(searchQuery))
      .slice(0, Math.floor(limit / 2))
    
    const allProjects = await ctx.db.query("projects").collect()
    const projects = allProjects
      .filter(project => project.name.toLowerCase().includes(searchQuery))
      .slice(0, Math.floor(limit / 2))
    
    return [
      ...results.map(task => ({
        id: task._id,
        type: 'task' as const,
        title: task.title,
        icon: '📋',
        action: `/tasks/${task._id}`
      })),
      ...projects.map(project => ({
        id: project._id,
        type: 'project' as const,
        title: project.name,
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
  returns: v.array(v.string()),
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
    const allTasks = await ctx.db.query("tasks").collect()
    const tasks = allTasks
      .filter(task => task.title.toLowerCase().includes(searchQuery))
      .slice(0, limit)
    
    tasks.forEach(task => suggestions.add(task.title))
    
    // Get project names
    const allProjects = await ctx.db.query("projects").collect()
    const projects = allProjects
      .filter(project => project.name.toLowerCase().includes(searchQuery))
      .slice(0, limit)
    
    projects.forEach(project => suggestions.add(project.name))
    
    return Array.from(suggestions).slice(0, limit)
  }
})