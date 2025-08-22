import { v } from "convex/values"
import { mutation, query, action } from "./_generated/server"
import { api } from "./_generated/api"
import { Id } from "./_generated/dataModel"

// Create a video room
export const createRoom = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    type: v.union(
      v.literal("meeting"),
      v.literal("instant"),
      v.literal("persistent")
    ),
    meetingId: v.optional(v.id("meetings")),
    settings: v.optional(v.object({
      maxParticipants: v.optional(v.number()),
      allowGuests: v.optional(v.boolean()),
      recordingEnabled: v.optional(v.boolean()),
      waitingRoomEnabled: v.optional(v.boolean()),
      muteOnEntry: v.optional(v.boolean()),
      videoOnEntry: v.optional(v.boolean()),
      chatEnabled: v.optional(v.boolean()),
      screenShareEnabled: v.optional(v.boolean()),
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

    const roomId = await ctx.db.insert("videoRooms", {
      workspaceId: args.workspaceId,
      name: args.name,
      type: args.type,
      meetingId: args.meetingId,
      hostId: user._id,
      participants: [],
      settings: {
        maxParticipants: args.settings?.maxParticipants ?? 100,
        allowGuests: args.settings?.allowGuests ?? false,
        recordingEnabled: args.settings?.recordingEnabled ?? false,
        waitingRoomEnabled: args.settings?.waitingRoomEnabled ?? false,
        muteOnEntry: args.settings?.muteOnEntry ?? false,
        videoOnEntry: args.settings?.videoOnEntry ?? true,
        chatEnabled: args.settings?.chatEnabled ?? true,
        screenShareEnabled: args.settings?.screenShareEnabled ?? true,
      },
      status: "scheduled",
      createdAt: Date.now(),
    })

    // If this is for a meeting, update the meeting with the room ID
    if (args.meetingId) {
      await ctx.db.patch(args.meetingId, {
        videoRoomId: roomId,
      })
    }

    return roomId
  },
})

// Join a video room
export const joinRoom = mutation({
  args: {
    roomId: v.id("videoRooms"),
    audio: v.optional(v.boolean()),
    video: v.optional(v.boolean()),
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

    const room = await ctx.db.get(args.roomId)
    if (!room) {
      throw new Error("Room not found")
    }

    // Check if room is full
    if (room.participants.length >= room.settings.maxParticipants) {
      throw new Error("Room is full")
    }

    // Check if user is already in the room
    const existingParticipant = room.participants.find(p => 
      p.userId === user._id && !p.leftAt
    )

    if (existingParticipant) {
      // Update existing participant
      const updatedParticipants = room.participants.map(p => 
        p.userId === user._id ? {
          ...p,
          audio: args.audio ?? p.audio,
          video: args.video ?? p.video,
        } : p
      )
      
      await ctx.db.patch(args.roomId, {
        participants: updatedParticipants,
      })
    } else {
      // Add new participant
      const newParticipant = {
        userId: user._id,
        joinedAt: Date.now(),
        leftAt: undefined,
        role: user._id === room.hostId ? "host" as const : "participant" as const,
        audio: args.audio ?? !room.settings.muteOnEntry,
        video: args.video ?? room.settings.videoOnEntry,
        screen: false,
      }

      await ctx.db.patch(args.roomId, {
        participants: [...room.participants, newParticipant],
        status: "active",
        startedAt: room.startedAt ?? Date.now(),
      })

      // Create audit log
      await ctx.runMutation(api.audit.createAuditLog, {
        workspaceId: room.workspaceId,
        userId: user._id,
        action: "video.room.joined",
        entityType: "videoRoom",
        entityId: args.roomId,
        details: {
          roomName: room.name,
          audio: newParticipant.audio,
          video: newParticipant.video,
        },
        ipAddress: undefined,
        userAgent: undefined,
      })
    }

    return {
      roomId: args.roomId,
      role: user._id === room.hostId ? "host" : "participant",
    }
  },
})

// Leave a video room
export const leaveRoom = mutation({
  args: {
    roomId: v.id("videoRooms"),
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

    const room = await ctx.db.get(args.roomId)
    if (!room) {
      throw new Error("Room not found")
    }

    // Update participant left time
    const updatedParticipants = room.participants.map(p => 
      p.userId === user._id && !p.leftAt ? {
        ...p,
        leftAt: Date.now(),
      } : p
    )

    // Check if all participants have left
    const activeParticipants = updatedParticipants.filter(p => !p.leftAt)
    const roomStatus = activeParticipants.length === 0 ? "ended" as const : room.status

    await ctx.db.patch(args.roomId, {
      participants: updatedParticipants,
      status: roomStatus,
      endedAt: roomStatus === "ended" ? Date.now() : room.endedAt,
    })

    // If host left and room is still active, assign new host
    if (user._id === room.hostId && activeParticipants.length > 0) {
      const newHost = activeParticipants[0]
      await ctx.db.patch(args.roomId, {
        hostId: newHost.userId,
        participants: updatedParticipants.map(p => 
          p.userId === newHost.userId ? { ...p, role: "host" as const } : p
        ),
      })
    }
  },
})

// Update participant media state
export const updateMediaState = mutation({
  args: {
    roomId: v.id("videoRooms"),
    audio: v.optional(v.boolean()),
    video: v.optional(v.boolean()),
    screen: v.optional(v.boolean()),
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

    const room = await ctx.db.get(args.roomId)
    if (!room) {
      throw new Error("Room not found")
    }

    const updatedParticipants = room.participants.map(p => 
      p.userId === user._id && !p.leftAt ? {
        ...p,
        audio: args.audio ?? p.audio,
        video: args.video ?? p.video,
        screen: args.screen ?? p.screen,
      } : p
    )

    await ctx.db.patch(args.roomId, {
      participants: updatedParticipants,
    })
  },
})

// Mute participant (host only)
export const muteParticipant = mutation({
  args: {
    roomId: v.id("videoRooms"),
    participantId: v.id("users"),
    mute: v.boolean(),
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

    const room = await ctx.db.get(args.roomId)
    if (!room) {
      throw new Error("Room not found")
    }

    // Check if user is host
    if (room.hostId !== user._id) {
      throw new Error("Only host can mute participants")
    }

    const updatedParticipants = room.participants.map(p => 
      p.userId === args.participantId && !p.leftAt ? {
        ...p,
        audio: !args.mute,
      } : p
    )

    await ctx.db.patch(args.roomId, {
      participants: updatedParticipants,
    })
  },
})

// Remove participant (host only)
export const removeParticipant = mutation({
  args: {
    roomId: v.id("videoRooms"),
    participantId: v.id("users"),
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

    const room = await ctx.db.get(args.roomId)
    if (!room) {
      throw new Error("Room not found")
    }

    // Check if user is host
    if (room.hostId !== user._id) {
      throw new Error("Only host can remove participants")
    }

    const updatedParticipants = room.participants.map(p => 
      p.userId === args.participantId && !p.leftAt ? {
        ...p,
        leftAt: Date.now(),
      } : p
    )

    await ctx.db.patch(args.roomId, {
      participants: updatedParticipants,
    })
  },
})

// Start recording (host only)
export const startRecording = mutation({
  args: {
    roomId: v.id("videoRooms"),
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

    const room = await ctx.db.get(args.roomId)
    if (!room) {
      throw new Error("Room not found")
    }

    // Check if user is host
    if (room.hostId !== user._id) {
      throw new Error("Only host can start recording")
    }

    // Check if recording is enabled
    if (!room.settings.recordingEnabled) {
      throw new Error("Recording is not enabled for this room")
    }

    // In a real implementation, this would trigger recording service
    // For now, we'll just update the status
    await ctx.db.patch(args.roomId, {
      recordingUrl: `recordings/${args.roomId}_${Date.now()}.webm`,
    })

    // Create audit log
    await ctx.runMutation(api.audit.createAuditLog, {
      workspaceId: room.workspaceId,
      userId: user._id,
      action: "video.recording.started",
      entityType: "videoRoom",
      entityId: args.roomId,
      details: {
        roomName: room.name,
      },
      ipAddress: undefined,
      userAgent: undefined,
    })
  },
})

// Stop recording (host only)
export const stopRecording = mutation({
  args: {
    roomId: v.id("videoRooms"),
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

    const room = await ctx.db.get(args.roomId)
    if (!room) {
      throw new Error("Room not found")
    }

    // Check if user is host
    if (room.hostId !== user._id) {
      throw new Error("Only host can stop recording")
    }

    // Create audit log
    await ctx.runMutation(api.audit.createAuditLog, {
      workspaceId: room.workspaceId,
      userId: user._id,
      action: "video.recording.stopped",
      entityType: "videoRoom",
      entityId: args.roomId,
      details: {
        roomName: room.name,
        recordingUrl: room.recordingUrl,
      },
      ipAddress: undefined,
      userAgent: undefined,
    })
  },
})

// Get active rooms for workspace
export const getActiveRooms = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const rooms = await ctx.db
      .query("videoRooms")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect()

    // Enrich with participant information
    const enrichedRooms = await Promise.all(
      rooms.map(async (room) => {
        const activeParticipants = room.participants.filter(p => !p.leftAt)
        const participantUsers = await Promise.all(
          activeParticipants.map(async (p) => {
            const user = await ctx.db.get(p.userId)
            return {
              ...p,
              user: user ? {
                _id: user._id,
                name: user.name,
                avatarUrl: user.avatarUrl,
              } : null,
            }
          })
        )

        const host = await ctx.db.get(room.hostId)
        
        return {
          ...room,
          participants: participantUsers,
          host: host ? {
            _id: host._id,
            name: host.name,
            avatarUrl: host.avatarUrl,
          } : null,
        }
      })
    )

    return enrichedRooms
  },
})

// Get room by ID
export const getRoom = query({
  args: {
    roomId: v.id("videoRooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const room = await ctx.db.get(args.roomId)
    if (!room) {
      return null
    }

    // Enrich with participant information
    const activeParticipants = room.participants.filter(p => !p.leftAt)
    const participantUsers = await Promise.all(
      activeParticipants.map(async (p) => {
        const user = await ctx.db.get(p.userId)
        return {
          ...p,
          user: user ? {
            _id: user._id,
            name: user.name,
            avatarUrl: user.avatarUrl,
          } : null,
        }
      })
    )

    const host = await ctx.db.get(room.hostId)
    
    return {
      ...room,
      participants: participantUsers,
      host: host ? {
        _id: host._id,
        name: host.name,
        avatarUrl: host.avatarUrl,
      } : null,
    }
  },
})

// Get room recordings
export const getRoomRecordings = query({
  args: {
    workspaceId: v.id("workspaces"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const rooms = await ctx.db
      .query("videoRooms")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.neq(q.field("recordingUrl"), undefined))
      .order("desc")
      .take(args.limit ?? 50)

    return rooms.map(room => ({
      _id: room._id,
      name: room.name,
      recordingUrl: room.recordingUrl,
      duration: room.endedAt && room.startedAt ? room.endedAt - room.startedAt : undefined,
      createdAt: room.createdAt,
      participantCount: room.participants.length,
    }))
  },
})

// WebRTC Signaling Support
// Note: In production, you'd use a dedicated WebRTC signaling server
// This is a simplified implementation for demonstration

export const sendSignal = action({
  args: {
    roomId: v.id("videoRooms"),
    targetUserId: v.id("users"),
    signal: v.object({
      type: v.union(
        v.literal("offer"),
        v.literal("answer"),
        v.literal("ice-candidate")
      ),
      data: v.any(),
    }),
  },
  handler: async (ctx, args) => {
    // In production, this would send the signal through a WebSocket
    // or WebRTC signaling server to the target user
    console.log(`Sending signal from user to ${args.targetUserId}:`, args.signal)
    
    // Store signal temporarily for retrieval
    // In real implementation, use WebSocket for real-time delivery
    return { success: true }
  },
})

// Get instant meeting link
export const getInstantMeetingLink = mutation({
  args: {
    workspaceId: v.id("workspaces"),
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

    // Create instant room
    const roomId = await ctx.db.insert("videoRooms", {
      workspaceId: args.workspaceId,
      name: `${user.name}'s Instant Meeting`,
      type: "instant",
      hostId: user._id,
      participants: [],
      settings: {
        maxParticipants: 100,
        allowGuests: true,
        recordingEnabled: false,
        waitingRoomEnabled: false,
        muteOnEntry: false,
        videoOnEntry: true,
        chatEnabled: true,
        screenShareEnabled: true,
      },
      status: "scheduled",
      createdAt: Date.now(),
    })

    // Generate meeting link
    const meetingLink = `${process.env.APP_URL}/video/${roomId}`
    
    return {
      roomId,
      link: meetingLink,
    }
  },
})

// Schedule a video meeting
export const scheduleMeeting = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    meetingId: v.id("meetings"),
    settings: v.optional(v.object({
      maxParticipants: v.optional(v.number()),
      allowGuests: v.optional(v.boolean()),
      recordingEnabled: v.optional(v.boolean()),
      waitingRoomEnabled: v.optional(v.boolean()),
      muteOnEntry: v.optional(v.boolean()),
      videoOnEntry: v.optional(v.boolean()),
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

    const meeting = await ctx.db.get(args.meetingId)
    if (!meeting) {
      throw new Error("Meeting not found")
    }

    // Create room for scheduled meeting
    const roomId = await ctx.db.insert("videoRooms", {
      workspaceId: args.workspaceId,
      name: meeting.title,
      type: "meeting",
      meetingId: args.meetingId,
      hostId: user._id,
      participants: [],
      settings: {
        maxParticipants: args.settings?.maxParticipants ?? 100,
        allowGuests: args.settings?.allowGuests ?? false,
        recordingEnabled: args.settings?.recordingEnabled ?? true,
        waitingRoomEnabled: args.settings?.waitingRoomEnabled ?? true,
        muteOnEntry: args.settings?.muteOnEntry ?? false,
        videoOnEntry: args.settings?.videoOnEntry ?? true,
        chatEnabled: true,
        screenShareEnabled: true,
      },
      status: "scheduled",
      createdAt: Date.now(),
    })

    // Update meeting with room ID
    await ctx.db.patch(args.meetingId, {
      videoRoomId: roomId,
    })

    return roomId
  },
})