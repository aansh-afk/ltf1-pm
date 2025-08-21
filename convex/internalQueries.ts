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

// Gemini AI action
export const generateWithGemini = internalAction({
  args: {
    prompt: v.string(),
    model: v.string(),
    temperature: v.number(),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    
    const genAI = new GoogleGenerativeAI(args.apiKey);
    const model = genAI.getGenerativeModel({ 
      model: args.model,
      generationConfig: {
        temperature: args.temperature,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });
    
    const result = await model.generateContent(args.prompt);
    const response = await result.response;
    return response.text();
  },
});