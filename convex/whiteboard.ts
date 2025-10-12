import { v } from "convex/values"
import { mutation, query, action } from "./_generated/server"
import { api } from "./_generated/api"
import { Id } from "./_generated/dataModel"

// Element types for the whiteboard
export const ELEMENT_TYPES = {
  SHAPE: "shape",
  TEXT: "text",
  LINE: "line",
  IMAGE: "image",
  STICKY: "sticky",
  DRAWING: "drawing",
} as const

// Shape types
export const SHAPE_TYPES = {
  RECTANGLE: "rectangle",
  CIRCLE: "circle",
  TRIANGLE: "triangle",
  DIAMOND: "diamond",
  ARROW: "arrow",
  STAR: "star",
} as const

// Create a new whiteboard
export const createWhiteboard = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    description: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    meetingId: v.optional(v.id("meetings")),
    public: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!user) {
      throw new Error("User not found")
    }

    const whiteboardId = await ctx.db.insert("whiteboards", {
      workspaceId: args.workspaceId,
      name: args.name,
      description: args.description,
      projectId: args.projectId,
      meetingId: args.meetingId,
      thumbnail: undefined,
      elements: [],
      collaborators: [{
        userId: user._id,
        cursor: undefined,
        color: generateUserColor(user._id),
        lastActiveAt: Date.now(),
      }],
      version: 1,
      locked: false,
      public: args.public ?? false,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    // Create initial snapshot
    await ctx.db.insert("whiteboardSnapshots", {
      whiteboardId,
      version: 1,
      elements: [],
      createdBy: user._id,
      createdAt: Date.now(),
    })

    return whiteboardId
  },
})

// Add element to whiteboard
export const addElement = mutation({
  args: {
    whiteboardId: v.id("whiteboards"),
    element: v.object({
      type: v.union(
        v.literal("shape"),
        v.literal("text"),
        v.literal("line"),
        v.literal("image"),
        v.literal("sticky"),
        v.literal("drawing")
      ),
      data: v.any(),
      position: v.object({
        x: v.number(),
        y: v.number(),
      }),
      size: v.object({
        width: v.number(),
        height: v.number(),
      }),
      rotation: v.optional(v.number()),
      style: v.optional(v.any()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!user) {
      throw new Error("User not found")
    }

    const whiteboard = await ctx.db.get(args.whiteboardId)
    if (!whiteboard) {
      throw new Error("Whiteboard not found")
    }

    if (whiteboard.locked && whiteboard.createdBy !== user._id) {
      throw new Error("Whiteboard is locked")
    }

    const elementId = generateElementId()
    const newElement = {
      id: elementId,
      type: args.element.type,
      data: args.element.data,
      position: args.element.position,
      size: args.element.size,
      rotation: args.element.rotation ?? 0,
      style: args.element.style ?? getDefaultStyle(args.element.type),
      locked: false,
      createdBy: user._id,
      updatedBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    // Update whiteboard
    await ctx.db.patch(args.whiteboardId, {
      elements: [...whiteboard.elements, newElement],
      version: whiteboard.version + 1,
      updatedAt: Date.now(),
    })

    // Update collaborator activity
    updateCollaboratorActivity(ctx, whiteboard, user._id)

    return elementId
  },
})

// Update element
export const updateElement = mutation({
  args: {
    whiteboardId: v.id("whiteboards"),
    elementId: v.string(),
    updates: v.object({
      data: v.optional(v.any()),
      position: v.optional(v.object({
        x: v.number(),
        y: v.number(),
      })),
      size: v.optional(v.object({
        width: v.number(),
        height: v.number(),
      })),
      rotation: v.optional(v.number()),
      style: v.optional(v.any()),
      locked: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!user) {
      throw new Error("User not found")
    }

    const whiteboard = await ctx.db.get(args.whiteboardId)
    if (!whiteboard) {
      throw new Error("Whiteboard not found")
    }

    if (whiteboard.locked && whiteboard.createdBy !== user._id) {
      throw new Error("Whiteboard is locked")
    }

    const elementIndex = whiteboard.elements.findIndex(e => e.id === args.elementId)
    if (elementIndex === -1) {
      throw new Error("Element not found")
    }

    const element = whiteboard.elements[elementIndex]
    if (element.locked && element.createdBy !== user._id) {
      throw new Error("Element is locked")
    }

    // Update element
    const updatedElement = {
      ...element,
      ...args.updates,
      updatedBy: user._id,
      updatedAt: Date.now(),
    }

    const updatedElements = [...whiteboard.elements]
    updatedElements[elementIndex] = updatedElement

    await ctx.db.patch(args.whiteboardId, {
      elements: updatedElements,
      version: whiteboard.version + 1,
      updatedAt: Date.now(),
    })

    // Update collaborator activity
    updateCollaboratorActivity(ctx, whiteboard, user._id)
  },
})

// Delete element
export const deleteElement = mutation({
  args: {
    whiteboardId: v.id("whiteboards"),
    elementId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!user) {
      throw new Error("User not found")
    }

    const whiteboard = await ctx.db.get(args.whiteboardId)
    if (!whiteboard) {
      throw new Error("Whiteboard not found")
    }

    if (whiteboard.locked && whiteboard.createdBy !== user._id) {
      throw new Error("Whiteboard is locked")
    }

    const element = whiteboard.elements.find(e => e.id === args.elementId)
    if (!element) {
      throw new Error("Element not found")
    }

    if (element.locked && element.createdBy !== user._id) {
      throw new Error("Element is locked")
    }

    // Remove element
    const updatedElements = whiteboard.elements.filter(e => e.id !== args.elementId)

    await ctx.db.patch(args.whiteboardId, {
      elements: updatedElements,
      version: whiteboard.version + 1,
      updatedAt: Date.now(),
    })

    // Update collaborator activity
    updateCollaboratorActivity(ctx, whiteboard, user._id)
  },
})

// Batch update elements (for performance)
export const batchUpdateElements = mutation({
  args: {
    whiteboardId: v.id("whiteboards"),
    updates: v.array(v.object({
      elementId: v.string(),
      updates: v.object({
        data: v.optional(v.any()),
        position: v.optional(v.object({
          x: v.number(),
          y: v.number(),
        })),
        size: v.optional(v.object({
          width: v.number(),
          height: v.number(),
        })),
        rotation: v.optional(v.number()),
        style: v.optional(v.any()),
      }),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!user) {
      throw new Error("User not found")
    }

    const whiteboard = await ctx.db.get(args.whiteboardId)
    if (!whiteboard) {
      throw new Error("Whiteboard not found")
    }

    if (whiteboard.locked && whiteboard.createdBy !== user._id) {
      throw new Error("Whiteboard is locked")
    }

    // Apply all updates
    let updatedElements = [...whiteboard.elements]
    
    for (const update of args.updates) {
      const elementIndex = updatedElements.findIndex(e => e.id === update.elementId)
      if (elementIndex !== -1) {
        updatedElements[elementIndex] = {
          ...updatedElements[elementIndex],
          ...update.updates,
          updatedBy: user._id,
          updatedAt: Date.now(),
        }
      }
    }

    await ctx.db.patch(args.whiteboardId, {
      elements: updatedElements,
      version: whiteboard.version + 1,
      updatedAt: Date.now(),
    })

    // Update collaborator activity
    updateCollaboratorActivity(ctx, whiteboard, user._id)
  },
})

// Update cursor position
export const updateCursor = mutation({
  args: {
    whiteboardId: v.id("whiteboards"),
    cursor: v.optional(v.object({
      x: v.number(),
      y: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!user) {
      throw new Error("User not found")
    }

    const whiteboard = await ctx.db.get(args.whiteboardId)
    if (!whiteboard) {
      throw new Error("Whiteboard not found")
    }

    // Update or add collaborator
    const collaboratorIndex = whiteboard.collaborators.findIndex(c => c.userId === user._id)
    
    if (collaboratorIndex !== -1) {
      const updatedCollaborators = [...whiteboard.collaborators]
      updatedCollaborators[collaboratorIndex] = {
        ...updatedCollaborators[collaboratorIndex],
        cursor: args.cursor,
        lastActiveAt: Date.now(),
      }
      
      await ctx.db.patch(args.whiteboardId, {
        collaborators: updatedCollaborators,
      })
    } else {
      // Add new collaborator
      await ctx.db.patch(args.whiteboardId, {
        collaborators: [...whiteboard.collaborators, {
          userId: user._id,
          cursor: args.cursor,
          color: generateUserColor(user._id),
          lastActiveAt: Date.now(),
        }],
      })
    }
  },
})

// Create snapshot
export const createSnapshot = mutation({
  args: {
    whiteboardId: v.id("whiteboards"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!user) {
      throw new Error("User not found")
    }

    const whiteboard = await ctx.db.get(args.whiteboardId)
    if (!whiteboard) {
      throw new Error("Whiteboard not found")
    }

    const snapshotId = await ctx.db.insert("whiteboardSnapshots", {
      whiteboardId: args.whiteboardId,
      version: whiteboard.version,
      elements: whiteboard.elements,
      createdBy: user._id,
      createdAt: Date.now(),
    })

    // Generate thumbnail (in production, this would create an actual image)
    const thumbnail = generateThumbnail(whiteboard.elements)
    
    await ctx.db.patch(args.whiteboardId, {
      thumbnail,
    })

    return snapshotId
  },
})

// Restore from snapshot
export const restoreSnapshot = mutation({
  args: {
    whiteboardId: v.id("whiteboards"),
    snapshotId: v.id("whiteboardSnapshots"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!user) {
      throw new Error("User not found")
    }

    const whiteboard = await ctx.db.get(args.whiteboardId)
    if (!whiteboard) {
      throw new Error("Whiteboard not found")
    }

    // Only owner can restore
    if (whiteboard.createdBy !== user._id) {
      throw new Error("Only owner can restore snapshots")
    }

    const snapshot = await ctx.db.get(args.snapshotId)
    if (!snapshot || snapshot.whiteboardId !== args.whiteboardId) {
      throw new Error("Snapshot not found")
    }

    // Create a backup snapshot before restoring
    await ctx.db.insert("whiteboardSnapshots", {
      whiteboardId: args.whiteboardId,
      version: whiteboard.version,
      elements: whiteboard.elements,
      createdBy: user._id,
      createdAt: Date.now(),
    })

    // Restore from snapshot
    await ctx.db.patch(args.whiteboardId, {
      elements: snapshot.elements,
      version: whiteboard.version + 1,
      updatedAt: Date.now(),
    })
  },
})

// Get whiteboards for workspace
export const getWhiteboards = query({
  args: {
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects")),
    meetingId: v.optional(v.id("meetings")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!user) {
      throw new Error("User not found")
    }

    let query = ctx.db
      .query("whiteboards")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))

    if (args.projectId) {
      query = query.filter((q) => q.eq(q.field("projectId"), args.projectId))
    }

    if (args.meetingId) {
      query = query.filter((q) => q.eq(q.field("meetingId"), args.meetingId))
    }

    const whiteboards = await query.collect()

    // Filter by access (public or created by user or user is collaborator)
    const accessibleWhiteboards = whiteboards.filter(w => 
      w.public || 
      w.createdBy === user._id || 
      w.collaborators.some(c => c.userId === user._id)
    )

    // Add creator information
    const enrichedWhiteboards = await Promise.all(
      accessibleWhiteboards.map(async (whiteboard) => {
        const creator = await ctx.db.get(whiteboard.createdBy)
        return {
          ...whiteboard,
          creator: creator ? {
            _id: creator._id,
            name: creator.name,
            avatarUrl: creator.avatarUrl,
          } : null,
        }
      })
    )

    return enrichedWhiteboards
  },
})

// Get whiteboard by ID
export const getWhiteboard = query({
  args: {
    whiteboardId: v.id("whiteboards"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!user) {
      throw new Error("User not found")
    }

    const whiteboard = await ctx.db.get(args.whiteboardId)
    if (!whiteboard) {
      return null
    }

    // Check access
    if (!whiteboard.public && 
        whiteboard.createdBy !== user._id && 
        !whiteboard.collaborators.some(c => c.userId === user._id)) {
      throw new Error("Access denied")
    }

    // Enrich collaborator information
    const enrichedCollaborators = await Promise.all(
      whiteboard.collaborators
        .filter(c => Date.now() - c.lastActiveAt < 60000) // Only show active in last minute
        .map(async (collaborator) => {
          const collabUser = await ctx.db.get(collaborator.userId)
          return {
            ...collaborator,
            user: collabUser ? {
              _id: collabUser._id,
              name: collabUser.name,
              avatarUrl: collabUser.avatarUrl,
            } : null,
          }
        })
    )

    const creator = await ctx.db.get(whiteboard.createdBy)

    return {
      ...whiteboard,
      collaborators: enrichedCollaborators,
      creator: creator ? {
        _id: creator._id,
        name: creator.name,
        avatarUrl: creator.avatarUrl,
      } : null,
    }
  },
})

// Get snapshots for whiteboard
export const getSnapshots = query({
  args: {
    whiteboardId: v.id("whiteboards"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const snapshots = await ctx.db
      .query("whiteboardSnapshots")
      .withIndex("by_whiteboard", (q) => q.eq("whiteboardId", args.whiteboardId))
      .order("desc")
      .take(args.limit ?? 20)

    // Add creator information
    const enrichedSnapshots = await Promise.all(
      snapshots.map(async (snapshot) => {
        const creator = await ctx.db.get(snapshot.createdBy)
        return {
          ...snapshot,
          creator: creator ? {
            _id: creator._id,
            name: creator.name,
            avatarUrl: creator.avatarUrl,
          } : null,
        }
      })
    )

    return enrichedSnapshots
  },
})

// Export whiteboard as image
export const exportAsImage = action({
  args: {
    whiteboardId: v.id("whiteboards"),
    format: v.union(v.literal("png"), v.literal("svg"), v.literal("pdf")),
  },
  handler: async (ctx, args) => {
    const whiteboard = await ctx.runQuery(api.whiteboard.getWhiteboard, {
      whiteboardId: args.whiteboardId,
    })

    if (!whiteboard) {
      throw new Error("Whiteboard not found")
    }

    // In production, this would generate an actual image/PDF
    // For now, return a mock URL
    const exportUrl = `exports/${args.whiteboardId}_${Date.now()}.${args.format}`

    return {
      url: exportUrl,
      format: args.format,
    }
  },
})

// Generate upload URL for image
export const generateImageUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    return await ctx.storage.generateUploadUrl()
  },
})

// Get storage URL from storage ID
export const getStorageUrl = query({
  args: {
    storageId: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    return await ctx.storage.getUrl(args.storageId)
  },
})

// Clone whiteboard
export const cloneWhiteboard = mutation({
  args: {
    whiteboardId: v.id("whiteboards"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first()

    if (!user) {
      throw new Error("User not found")
    }

    const original = await ctx.db.get(args.whiteboardId)
    if (!original) {
      throw new Error("Whiteboard not found")
    }

    // Check access
    if (!original.public && 
        original.createdBy !== user._id && 
        !original.collaborators.some(c => c.userId === user._id)) {
      throw new Error("Access denied")
    }

    // Create clone
    const clonedId = await ctx.db.insert("whiteboards", {
      workspaceId: original.workspaceId,
      name: args.name,
      description: original.description ? `Clone of ${original.description}` : `Clone of ${original.name}`,
      projectId: original.projectId,
      meetingId: undefined, // Don't copy meeting association
      thumbnail: original.thumbnail,
      elements: original.elements.map(e => ({
        ...e,
        id: generateElementId(),
        createdBy: user._id,
        updatedBy: user._id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })),
      collaborators: [{
        userId: user._id,
        cursor: undefined,
        color: generateUserColor(user._id),
        lastActiveAt: Date.now(),
      }],
      version: 1,
      locked: false,
      public: false,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return clonedId
  },
})

// Helper functions
function generateElementId(): string {
  return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateUserColor(userId: string): string {
  const colors = [
    '#FF00FF', '#00FFFF', '#FFFF00', '#FF00FF', '#00FF00',
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  ]
  
  // Generate consistent color based on user ID
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  return colors[Math.abs(hash) % colors.length]
}

function getDefaultStyle(type: string): any {
  switch (type) {
    case "shape":
      return {
        fill: "#FFFFFF",
        stroke: "#000000",
        strokeWidth: 2,
        opacity: 1,
      }
    case "text":
      return {
        fontSize: 16,
        fontFamily: "SpaceMono",
        color: "#000000",
        textAlign: "left",
        bold: false,
        italic: false,
      }
    case "line":
      return {
        stroke: "#000000",
        strokeWidth: 2,
        strokeDasharray: "",
        arrowStart: false,
        arrowEnd: false,
      }
    case "sticky":
      return {
        backgroundColor: "#FFFF00",
        borderColor: "#000000",
        borderWidth: 2,
        fontSize: 14,
        fontFamily: "SpaceMono",
      }
    case "drawing":
      return {
        stroke: "#000000",
        strokeWidth: 2,
        opacity: 1,
      }
    default:
      return {}
  }
}

function generateThumbnail(elements: any[]): string {
  // In production, this would generate an actual thumbnail image
  // For now, return a data URL placeholder
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="150" fill="#f0f0f0"/>
      <text x="100" y="75" text-anchor="middle" font-family="SpaceMono" font-size="14">
        ${elements.length} elements
      </text>
    </svg>
  `)}`
}

async function updateCollaboratorActivity(ctx: any, whiteboard: any, userId: string) {
  const collaboratorIndex = whiteboard.collaborators.findIndex((c: any) => c.userId === userId)
  
  if (collaboratorIndex !== -1) {
    const updatedCollaborators = [...whiteboard.collaborators]
    updatedCollaborators[collaboratorIndex] = {
      ...updatedCollaborators[collaboratorIndex],
      lastActiveAt: Date.now(),
    }
    
    await ctx.db.patch(whiteboard._id, {
      collaborators: updatedCollaborators,
    })
  }
}