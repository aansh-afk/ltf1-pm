import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "./lib/auth";
import { bugSeverityValidator, bugStatusValidator } from "./lib/validators";

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const submitBugReport = mutation({
  args: {
    userId: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    userName: v.optional(v.string()),
    title: v.string(),
    description: v.string(),
    severity: bugSeverityValidator,
    url: v.string(),
    browserInfo: v.string(),
    viewportSize: v.string(),
    consoleErrors: v.array(
      v.object({
        message: v.string(),
        source: v.optional(v.string()),
        timestamp: v.number(),
      }),
    ),
    screenshotIds: v.array(v.id("_storage")),
    recordedSteps: v.array(
      v.object({
        type: v.union(v.literal("click"), v.literal("input"), v.literal("navigation")),
        target: v.string(),
        value: v.optional(v.string()),
        url: v.string(),
        timestamp: v.number(),
      }),
    ),
  },
  returns: v.id("bugReports"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("bugReports", {
      ...args,
      status: "new" as const,
      createdAt: Date.now(),
    });
  },
});

const bugReportValidator = v.object({
  _id: v.id("bugReports"),
  _creationTime: v.number(),
  userId: v.optional(v.string()),
  userEmail: v.optional(v.string()),
  userName: v.optional(v.string()),
  title: v.string(),
  description: v.string(),
  severity: bugSeverityValidator,
  url: v.string(),
  browserInfo: v.string(),
  viewportSize: v.string(),
  consoleErrors: v.array(
    v.object({
      message: v.string(),
      source: v.optional(v.string()),
      timestamp: v.number(),
    }),
  ),
  screenshotIds: v.array(v.id("_storage")),
  recordedSteps: v.array(
    v.object({
      type: v.union(v.literal("click"), v.literal("input"), v.literal("navigation")),
      target: v.string(),
      value: v.optional(v.string()),
      url: v.string(),
      timestamp: v.number(),
    }),
  ),
  status: bugStatusValidator,
  createdAt: v.number(),
});

async function requireAdmin(ctx: { auth: { getUserIdentity: () => Promise<any> }; db: any }) {
  const user = await getCurrentUserOrThrow(ctx as any);
  if (user.role !== "admin") throw new Error("Admin access required");
  return user;
}

export const listBugReports = query({
  args: {
    status: v.optional(bugStatusValidator),
  },
  returns: v.array(bugReportValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.status) {
      return await ctx.db
        .query("bugReports")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(50);
    }
    return await ctx.db
      .query("bugReports")
      .withIndex("by_created")
      .order("desc")
      .take(50);
  },
});

export const getBugReport = query({
  args: { id: v.id("bugReports") },
  returns: v.union(
    v.object({
      report: bugReportValidator,
      screenshotUrls: v.array(v.union(v.string(), v.null())),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const report = await ctx.db.get(args.id);
    if (!report) return null;
    const screenshotUrls: Array<string | null> = [];
    for (const storageId of report.screenshotIds) {
      const url = await ctx.storage.getUrl(storageId);
      screenshotUrls.push(url);
    }
    return { report, screenshotUrls };
  },
});

export const updateBugReportStatus = mutation({
  args: {
    id: v.id("bugReports"),
    status: bugStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, { status: args.status });
    return null;
  },
});
