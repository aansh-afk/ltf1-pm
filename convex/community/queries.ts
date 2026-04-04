import { query } from "../_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "../lib/auth";

export const getActivePolls = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("communityPolls"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      options: v.array(
        v.object({
          id: v.string(),
          text: v.string(),
          voteCount: v.number(),
        })
      ),
      category: v.union(
        v.literal("feature"),
        v.literal("opinion"),
        v.literal("feedback"),
        v.literal("general")
      ),
      createdBy: v.object({
        _id: v.id("users"),
        name: v.string(),
        avatarUrl: v.optional(v.string()),
      }),
      status: v.literal("active"),
      endsAt: v.optional(v.number()),
      totalVotes: v.number(),
      userVotedOptionId: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    const polls = await ctx.db
      .query("communityPolls")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();

    const results = [];
    for (const poll of polls) {
      const creator = await ctx.db.get(poll.createdBy);
      if (!creator) continue;

      const votes = await ctx.db
        .query("communityVotes")
        .withIndex("by_pollId", (q) => q.eq("pollId", poll._id))
        .collect();

      const voteCounts: Record<string, number> = {};
      for (const opt of poll.options) {
        voteCounts[opt.id] = 0;
      }
      let userVotedOptionId: string | undefined = undefined;
      for (const vote of votes) {
        voteCounts[vote.optionId] = (voteCounts[vote.optionId] ?? 0) + 1;
        if (currentUser && vote.userId === currentUser._id) {
          userVotedOptionId = vote.optionId;
        }
      }

      results.push({
        _id: poll._id,
        _creationTime: poll._creationTime,
        title: poll.title,
        description: poll.description,
        options: poll.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          voteCount: voteCounts[opt.id] ?? 0,
        })),
        category: poll.category,
        createdBy: {
          _id: creator._id,
          name: creator.name,
          avatarUrl: creator.avatarUrl,
        },
        status: "active" as const,
        endsAt: poll.endsAt,
        totalVotes: votes.length,
        userVotedOptionId,
      });
    }

    return results;
  },
});

export const getClosedPolls = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("communityPolls"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      options: v.array(
        v.object({
          id: v.string(),
          text: v.string(),
          voteCount: v.number(),
        })
      ),
      category: v.union(
        v.literal("feature"),
        v.literal("opinion"),
        v.literal("feedback"),
        v.literal("general")
      ),
      createdBy: v.object({
        _id: v.id("users"),
        name: v.string(),
        avatarUrl: v.optional(v.string()),
      }),
      status: v.literal("closed"),
      totalVotes: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const polls = await ctx.db
      .query("communityPolls")
      .withIndex("by_status", (q) => q.eq("status", "closed"))
      .order("desc")
      .take(limit);

    const results = [];
    for (const poll of polls) {
      const creator = await ctx.db.get(poll.createdBy);
      if (!creator) continue;

      const votes = await ctx.db
        .query("communityVotes")
        .withIndex("by_pollId", (q) => q.eq("pollId", poll._id))
        .collect();

      const voteCounts: Record<string, number> = {};
      for (const opt of poll.options) {
        voteCounts[opt.id] = 0;
      }
      for (const vote of votes) {
        voteCounts[vote.optionId] = (voteCounts[vote.optionId] ?? 0) + 1;
      }

      results.push({
        _id: poll._id,
        _creationTime: poll._creationTime,
        title: poll.title,
        description: poll.description,
        options: poll.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          voteCount: voteCounts[opt.id] ?? 0,
        })),
        category: poll.category,
        createdBy: {
          _id: creator._id,
          name: creator.name,
          avatarUrl: creator.avatarUrl,
        },
        status: "closed" as const,
        totalVotes: votes.length,
      });
    }

    return results;
  },
});

export const getPosts = query({
  args: {
    category: v.optional(
      v.union(
        v.literal("discussion"),
        v.literal("idea"),
        v.literal("bug"),
        v.literal("showcase")
      )
    ),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("communityPosts"),
      _creationTime: v.number(),
      title: v.string(),
      content: v.string(),
      category: v.union(
        v.literal("discussion"),
        v.literal("idea"),
        v.literal("bug"),
        v.literal("showcase")
      ),
      createdBy: v.object({
        _id: v.id("users"),
        name: v.string(),
        avatarUrl: v.optional(v.string()),
      }),
      upvotes: v.number(),
      commentCount: v.number(),
      userUpvoted: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);
    const limit = args.limit ?? 50;

    let postsQuery;
    if (args.category) {
      postsQuery = ctx.db
        .query("communityPosts")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .order("desc");
    } else {
      postsQuery = ctx.db.query("communityPosts").order("desc");
    }

    const posts = await postsQuery.take(limit);

    const results = [];
    for (const post of posts) {
      const creator = await ctx.db.get(post.createdBy);
      if (!creator) continue;

      let userUpvoted = false;
      if (currentUser) {
        const existingUpvote = await ctx.db
          .query("communityUpvotes")
          .withIndex("by_userId_and_postId", (q) =>
            q.eq("userId", currentUser._id).eq("postId", post._id)
          )
          .first();
        userUpvoted = !!existingUpvote;
      }

      results.push({
        _id: post._id,
        _creationTime: post._creationTime,
        title: post.title,
        content: post.content,
        category: post.category,
        createdBy: {
          _id: creator._id,
          name: creator.name,
          avatarUrl: creator.avatarUrl,
        },
        upvotes: post.upvotes ?? 0,
        commentCount: post.commentCount ?? 0,
        userUpvoted,
      });
    }

    return results;
  },
});

export const getPostComments = query({
  args: {
    postId: v.id("communityPosts"),
  },
  returns: v.array(
    v.object({
      _id: v.id("communityComments"),
      _creationTime: v.number(),
      content: v.string(),
      parentId: v.optional(v.id("communityComments")),
      user: v.object({
        _id: v.id("users"),
        name: v.string(),
        avatarUrl: v.optional(v.string()),
      }),
    })
  ),
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("communityComments")
      .withIndex("by_postId", (q) => q.eq("postId", args.postId))
      .order("asc")
      .collect();

    const results = [];
    for (const comment of comments) {
      const user = await ctx.db.get(comment.userId);
      if (!user) continue;

      results.push({
        _id: comment._id,
        _creationTime: comment._creationTime,
        content: comment.content,
        parentId: comment.parentId,
        user: {
          _id: user._id,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
      });
    }

    return results;
  },
});
