import { v } from "convex/values";
import { internalQuery, internalAction } from "./_generated/server";

// Internal queries for AI actions and other internal operations

// Projects
export const getProject = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

// Tasks
export const getProjectTasks = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_project", q => q.eq("projectId", args.projectId))
      .collect();
  },
});

// Sprints
export const getProjectSprints = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sprints")
      .withIndex("by_project", q => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

// Teams
export const getProjectTeam = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return [];
    
    const memberIds = project.members || [];
    const members = await Promise.all(
      memberIds.map(id => ctx.db.get(id))
    );
    
    return members.filter(m => m !== null);
  },
});

// Meetings  
export const getProjectMeetings = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("meetings")
      .withIndex("by_project", q => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

// AI Credits
export const getUserApiKey = internalQuery({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", q => q.eq("clerkId", identity.subject))
      .first();
    
    if (!user) return null;
    
    const aiCredits = await ctx.db
      .query("aiCredits")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .first();
    
    return aiCredits?.apiKey || null;
  },
});

// AI action using Cerebras (primary) with Groq fallback
export const generateWithAI = internalAction({
  args: {
    prompt: v.string(),
    model: v.optional(v.string()),
    temperature: v.number(),
    apiKey: v.string(),
    complexity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
  },
  handler: async (ctx, args) => {
    const OpenAI = require("openai").default;
    const complexity = args.complexity ?? "medium";

    const client = new OpenAI({
      apiKey: args.apiKey,
      baseURL: "https://api.cerebras.ai/v1",
    });

    const completion = await client.chat.completions.create({
      model: args.model || "gpt-oss-120b",
      messages: [{ role: "user", content: args.prompt }],
      temperature: args.temperature,
      max_tokens: 2048,
      reasoning_effort: complexity,
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) throw new Error("No content in AI response");

    // Strip markdown fences if present
    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    return cleaned;
  },
});