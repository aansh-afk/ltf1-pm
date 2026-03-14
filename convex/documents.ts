import { v } from "convex/values"
import { query, mutation, action } from "./_generated/server"
import { getCurrentUserOrThrow } from "./lib/auth"
import { Id } from "./_generated/dataModel"
import { internal, api } from "./_generated/api"

// Get a single document by ID
export const getDocument = query({
  args: {
    documentId: v.id("whiteboards"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)
    const doc = await ctx.db.get(args.documentId)
    if (!doc) return null

    // Check access: owner, collaborator, or public
    if (
      !doc.public &&
      doc.createdBy !== user._id &&
      !doc.collaborators.some((c) => c.userId === user._id)
    ) {
      throw new Error("Access denied")
    }

    const creator = await ctx.db.get(doc.createdBy)
    return {
      ...doc,
      creator: creator
        ? { _id: creator._id, name: creator.name, avatarUrl: creator.avatarUrl }
        : null,
    }
  },
})

// Get all documents for a workspace (top-level, non-archived)
export const getDocuments = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const docs = await ctx.db
      .query("whiteboards")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect()

    // Filter: top-level (no parentId), not archived, accessible
    const filtered = docs.filter(
      (d) =>
        !d.parentId &&
        !d.isArchived &&
        (d.public ||
          d.createdBy === user._id ||
          d.collaborators.some((c) => c.userId === user._id))
    )

    const enriched = await Promise.all(
      filtered.map(async (doc) => {
        const creator = await ctx.db.get(doc.createdBy)
        return {
          ...doc,
          creator: creator
            ? { _id: creator._id, name: creator.name, avatarUrl: creator.avatarUrl }
            : null,
        }
      })
    )

    return enriched
  },
})

// Get child documents (nested pages)
export const getChildDocuments = query({
  args: {
    parentId: v.id("whiteboards"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const children = await ctx.db
      .query("whiteboards")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect()

    return children.filter(
      (d) =>
        !d.isArchived &&
        (d.public ||
          d.createdBy === user._id ||
          d.collaborators.some((c) => c.userId === user._id))
    )
  },
})

// Search documents by name
export const searchDocuments = query({
  args: {
    workspaceId: v.id("workspaces"),
    searchTerm: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const docs = await ctx.db
      .query("whiteboards")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect()

    const term = args.searchTerm.toLowerCase()

    return docs.filter(
      (d) =>
        !d.isArchived &&
        d.name.toLowerCase().includes(term) &&
        (d.public ||
          d.createdBy === user._id ||
          d.collaborators.some((c) => c.userId === user._id))
    )
  },
})

// Create a new document (page)
export const createDocument = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    parentId: v.optional(v.id("whiteboards")),
    icon: v.optional(v.string()),
  },
  returns: v.id("whiteboards"),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const docId = await ctx.db.insert("whiteboards", {
      workspaceId: args.workspaceId,
      name: args.name,
      description: undefined,
      projectId: undefined,
      meetingId: undefined,
      thumbnail: undefined,
      elements: [],
      collaborators: [
        {
          userId: user._id,
          cursor: undefined,
          color: generateUserColor(user._id),
          lastActiveAt: Date.now(),
        },
      ],
      version: 1,
      locked: false,
      public: false,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      content: undefined,
      icon: args.icon,
      coverImage: undefined,
      isArchived: false,
      parentId: args.parentId,
    })

    return docId
  },
})

// Update document content (BlockNote JSON)
export const updateDocumentContent = mutation({
  args: {
    documentId: v.id("whiteboards"),
    content: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const doc = await ctx.db.get(args.documentId)
    if (!doc) throw new Error("Document not found")
    if (doc.createdBy !== user._id && !doc.collaborators.some((c) => c.userId === user._id)) {
      throw new Error("Access denied")
    }

    await ctx.db.patch(args.documentId, {
      content: args.content,
      version: doc.version + 1,
      updatedAt: Date.now(),
    })
    return null
  },
})

// Update document metadata (name, icon, coverImage)
export const updateDocumentMeta = mutation({
  args: {
    documentId: v.id("whiteboards"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    coverImage: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const doc = await ctx.db.get(args.documentId)
    if (!doc) throw new Error("Document not found")
    if (doc.createdBy !== user._id && !doc.collaborators.some((c) => c.userId === user._id)) {
      throw new Error("Access denied")
    }

    const updates: Record<string, any> = { updatedAt: Date.now() }
    if (args.name !== undefined) updates.name = args.name
    if (args.icon !== undefined) updates.icon = args.icon
    if (args.coverImage !== undefined) updates.coverImage = args.coverImage

    await ctx.db.patch(args.documentId, updates)
    return null
  },
})

// Archive a document (soft delete)
export const archiveDocument = mutation({
  args: {
    documentId: v.id("whiteboards"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const doc = await ctx.db.get(args.documentId)
    if (!doc) throw new Error("Document not found")
    if (doc.createdBy !== user._id) {
      throw new Error("Only the creator can archive")
    }

    // Archive this document and all children recursively
    await archiveRecursive(ctx, args.documentId)
    return null
  },
})

// Restore an archived document
export const restoreDocument = mutation({
  args: {
    documentId: v.id("whiteboards"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const doc = await ctx.db.get(args.documentId)
    if (!doc) throw new Error("Document not found")
    if (doc.createdBy !== user._id) {
      throw new Error("Only the creator can restore")
    }

    await ctx.db.patch(args.documentId, {
      isArchived: false,
      updatedAt: Date.now(),
    })

    // If parent is archived, move to top-level
    if (doc.parentId) {
      const parent = await ctx.db.get(doc.parentId)
      if (parent?.isArchived) {
        await ctx.db.patch(args.documentId, { parentId: undefined })
      }
    }

    return null
  },
})

// Get archived documents (trash)
export const getArchivedDocuments = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const docs = await ctx.db
      .query("whiteboards")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect()

    return docs.filter((d) => d.isArchived && d.createdBy === user._id)
  },
})

// Permanently delete a document (must be archived first)
export const deleteDocumentPermanent = mutation({
  args: {
    documentId: v.id("whiteboards"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const doc = await ctx.db.get(args.documentId)
    if (!doc) throw new Error("Document not found")
    if (doc.createdBy !== user._id) {
      throw new Error("Only the creator can permanently delete")
    }

    // Delete snapshots
    const snapshots = await ctx.db
      .query("whiteboardSnapshots")
      .withIndex("by_whiteboard", (q) => q.eq("whiteboardId", args.documentId))
      .collect()

    for (const snapshot of snapshots) {
      await ctx.db.delete(snapshot._id)
    }

    // Delete children recursively
    const children = await ctx.db
      .query("whiteboards")
      .withIndex("by_parent", (q) => q.eq("parentId", args.documentId))
      .collect()

    for (const child of children) {
      await ctx.db.delete(child._id)
    }

    await ctx.db.delete(args.documentId)
    return null
  },
})

// Create a document with pre-filled content (for templates)
export const createDocumentFromTemplate = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    icon: v.optional(v.string()),
    content: v.any(),
    parentId: v.optional(v.id("whiteboards")),
  },
  returns: v.id("whiteboards"),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const docId = await ctx.db.insert("whiteboards", {
      workspaceId: args.workspaceId,
      name: args.name,
      description: undefined,
      projectId: undefined,
      meetingId: undefined,
      thumbnail: undefined,
      elements: [],
      collaborators: [
        {
          userId: user._id,
          cursor: undefined,
          color: generateUserColor(user._id),
          lastActiveAt: Date.now(),
        },
      ],
      version: 1,
      locked: false,
      public: false,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      content: args.content,
      icon: args.icon,
      coverImage: undefined,
      isArchived: false,
      parentId: args.parentId,
    })

    return docId
  },
})

// Check if user has a welcome page already
export const hasWelcomePage = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)

    const docs = await ctx.db
      .query("whiteboards")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect()

    return docs.some(
      (d) => d.createdBy === user._id && d.name === "Welcome to Pages"
    )
  },
})

// --- Helpers ---

async function archiveRecursive(ctx: any, documentId: Id<"whiteboards">) {
  await ctx.db.patch(documentId, {
    isArchived: true,
    updatedAt: Date.now(),
  })

  const children = await ctx.db
    .query("whiteboards")
    .withIndex("by_parent", (q: any) => q.eq("parentId", documentId))
    .collect()

  for (const child of children) {
    await archiveRecursive(ctx, child._id)
  }
}

function generateUserColor(userId: string): string {
  const colors = [
    "#FF00FF", "#00FFFF", "#FFFF00", "#FF00FF", "#00FF00",
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  ]
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}
