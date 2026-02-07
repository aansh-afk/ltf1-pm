import { query } from "./_generated/server";
import { v } from "convex/values";

export const globalSearch = query({
  args: {
    query: v.string(),
    filters: v.optional(
      v.object({
        type: v.optional(v.array(v.string())),
        workspace: v.optional(v.id("workspaces")),
        project: v.optional(v.id("projects")),
        dateRange: v.optional(
          v.object({
            start: v.optional(v.number()),
            end: v.optional(v.number()),
          })
        ),
      })
    ),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.union(
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
        id: v.id("users"),
        type: v.literal("user"),
        title: v.string(),
        description: v.optional(v.string()),
        role: v.optional(v.string()),
        createdAt: v.number(),
        url: v.string(),
      })
    )
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const searchTerm = args.query;
    const limit = args.limit || 50;
    const types = args.filters?.type;

    const searchTasks = async () => {
      if (types && !types.includes("task")) return [];
      const tasks = await ctx.db
        .query("tasks")
        .withSearchIndex("search_title", (q) => {
          let sq = q.search("title", searchTerm);
          if (args.filters?.project) {
            sq = sq.eq("projectId", args.filters.project);
          }
          return sq;
        })
        .take(limit);

      return tasks.map((task) => ({
        id: task._id,
        type: "task" as const,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        projectId: task.projectId,
        createdAt: task._creationTime,
        url: `/tasks/${task._id}`,
      }));
    };

    const searchProjects = async () => {
      if (types && !types.includes("project")) return [];
      const projects = await ctx.db
        .query("projects")
        .withSearchIndex("search_name", (q) => {
          let sq = q.search("name", searchTerm);
          if (args.filters?.workspace) {
            sq = sq.eq("workspaceId", args.filters.workspace);
          }
          return sq;
        })
        .take(limit);

      return projects.map((project) => ({
        id: project._id,
        type: "project" as const,
        title: project.name,
        description: project.description,
        status: project.status,
        createdAt: project._creationTime,
        url: `/projects/${project._id}`,
      }));
    };

    const searchSprints = async () => {
      if (types && !types.includes("sprint")) return [];
      const sprints = await ctx.db
        .query("sprints")
        .withSearchIndex("search_name", (q) => {
          let sq = q.search("name", searchTerm);
          if (args.filters?.project) {
            sq = sq.eq("projectId", args.filters.project);
          }
          return sq;
        })
        .take(limit);

      return sprints.map((sprint) => ({
        id: sprint._id,
        type: "sprint" as const,
        title: sprint.name,
        description: sprint.goal,
        status: sprint.status,
        projectId: sprint.projectId,
        createdAt: sprint._creationTime,
        url: `/sprints/${sprint._id}`,
      }));
    };

    const searchUsers = async () => {
      if (types && !types.includes("user")) return [];
      const users = await ctx.db
        .query("users")
        .withSearchIndex("search_email", (q) => q.search("email", searchTerm))
        .take(limit);

      return users.map((user) => ({
        id: user._id,
        type: "user" as const,
        title: user.email,
        description: user.email,
        role: user.role,
        createdAt: user._creationTime,
        url: `/users/${user._id}`,
      }));
    };

    const [taskResults, projectResults, sprintResults, userResults] =
      await Promise.all([
        searchTasks(),
        searchProjects(),
        searchSprints(),
        searchUsers(),
      ]);

    return [...taskResults, ...projectResults, ...sprintResults, ...userResults];
  },
});

// Quick search for command palette
export const quickSearch = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      id: v.union(v.id("tasks"), v.id("projects")),
      type: v.string(),
      title: v.string(),
      icon: v.string(),
      action: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const limit = args.limit || 10;
    const halfLimit = Math.floor(limit / 2);

    const [tasks, projects] = await Promise.all([
      ctx.db
        .query("tasks")
        .withSearchIndex("search_title", (q) =>
          q.search("title", args.query)
        )
        .take(halfLimit),
      ctx.db
        .query("projects")
        .withSearchIndex("search_name", (q) =>
          q.search("name", args.query)
        )
        .take(halfLimit),
    ]);

    return [
      ...tasks.map((task) => ({
        id: task._id,
        type: "task" as const,
        title: task.title,
        icon: "\u{1F4CB}",
        action: `/tasks/${task._id}`,
      })),
      ...projects.map((project) => ({
        id: project._id,
        type: "project" as const,
        title: project.name,
        icon: "\u{1F4C1}",
        action: `/projects/${project._id}`,
      })),
    ];
  },
});

// Search suggestions for autocomplete
export const searchSuggestions = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const limit = args.limit || 5;

    const [tasks, projects] = await Promise.all([
      ctx.db
        .query("tasks")
        .withSearchIndex("search_title", (q) =>
          q.search("title", args.query)
        )
        .take(limit),
      ctx.db
        .query("projects")
        .withSearchIndex("search_name", (q) =>
          q.search("name", args.query)
        )
        .take(limit),
    ]);

    const suggestions = new Set<string>();
    tasks.forEach((task) => suggestions.add(task.title));
    projects.forEach((project) => suggestions.add(project.name));

    return Array.from(suggestions).slice(0, limit);
  },
});
