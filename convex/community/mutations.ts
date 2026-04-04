import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrThrow } from "../lib/auth";

export const createPoll = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    options: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
      })
    ),
    category: v.union(
      v.literal("feature"),
      v.literal("opinion"),
      v.literal("feedback"),
      v.literal("general")
    ),
    endsAt: v.optional(v.number()),
  },
  returns: v.id("communityPolls"),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    if (args.options.length < 2) {
      throw new Error("Poll must have at least 2 options");
    }
    if (args.options.length > 6) {
      throw new Error("Poll cannot have more than 6 options");
    }

    const pollId = await ctx.db.insert("communityPolls", {
      title: args.title,
      description: args.description,
      options: args.options,
      category: args.category,
      createdBy: user._id,
      status: "active",
      endsAt: args.endsAt,
      totalVotes: 0,
    });

    return pollId;
  },
});

export const votePoll = mutation({
  args: {
    pollId: v.id("communityPolls"),
    optionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const poll = await ctx.db.get(args.pollId);
    if (!poll) {
      throw new Error("Poll not found");
    }
    if (poll.status !== "active") {
      throw new Error("Poll is closed");
    }

    const validOption = poll.options.some((opt) => opt.id === args.optionId);
    if (!validOption) {
      throw new Error("Invalid option");
    }

    const existingVote = await ctx.db
      .query("communityVotes")
      .withIndex("by_userId_and_pollId", (q) =>
        q.eq("userId", user._id).eq("pollId", args.pollId)
      )
      .first();

    if (existingVote) {
      throw new Error("You have already voted on this poll");
    }

    await ctx.db.insert("communityVotes", {
      pollId: args.pollId,
      userId: user._id,
      optionId: args.optionId,
    });

    await ctx.db.patch(args.pollId, {
      totalVotes: (poll.totalVotes ?? 0) + 1,
    });

    return null;
  },
});

export const closePoll = mutation({
  args: {
    pollId: v.id("communityPolls"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const poll = await ctx.db.get(args.pollId);
    if (!poll) {
      throw new Error("Poll not found");
    }

    if (poll.createdBy !== user._id && user.role !== "admin") {
      throw new Error("Only the poll creator or an admin can close a poll");
    }

    await ctx.db.patch(args.pollId, { status: "closed" });

    return null;
  },
});

export const createPost = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    category: v.union(
      v.literal("discussion"),
      v.literal("idea"),
      v.literal("bug"),
      v.literal("showcase")
    ),
  },
  returns: v.id("communityPosts"),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const postId = await ctx.db.insert("communityPosts", {
      title: args.title,
      content: args.content,
      category: args.category,
      createdBy: user._id,
      upvotes: 0,
      commentCount: 0,
    });

    return postId;
  },
});

export const upvotePost = mutation({
  args: {
    postId: v.id("communityPosts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    const existingUpvote = await ctx.db
      .query("communityUpvotes")
      .withIndex("by_userId_and_postId", (q) =>
        q.eq("userId", user._id).eq("postId", args.postId)
      )
      .first();

    if (existingUpvote) {
      // Toggle off
      await ctx.db.delete(existingUpvote._id);
      await ctx.db.patch(args.postId, {
        upvotes: Math.max(0, (post.upvotes ?? 0) - 1),
      });
    } else {
      // Toggle on
      await ctx.db.insert("communityUpvotes", {
        postId: args.postId,
        userId: user._id,
      });
      await ctx.db.patch(args.postId, {
        upvotes: (post.upvotes ?? 0) + 1,
      });
    }

    return null;
  },
});

export const commentOnPost = mutation({
  args: {
    postId: v.id("communityPosts"),
    content: v.string(),
    parentId: v.optional(v.id("communityComments")),
  },
  returns: v.id("communityComments"),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    if (args.parentId) {
      const parentComment = await ctx.db.get(args.parentId);
      if (!parentComment || parentComment.postId !== args.postId) {
        throw new Error("Parent comment not found or does not belong to this post");
      }
    }

    const commentId = await ctx.db.insert("communityComments", {
      postId: args.postId,
      userId: user._id,
      content: args.content,
      parentId: args.parentId,
    });

    await ctx.db.patch(args.postId, {
      commentCount: (post.commentCount ?? 0) + 1,
    });

    return commentId;
  },
});
