"use node";

import { v } from "convex/values";
import {
  mutation,
  internalAction,
  internalMutation,
} from "../_generated/server";
// @ts-ignore — deep type instantiation
import { internal } from "../_generated/api";
import { getCurrentUserOrThrow } from "../lib/auth";
import webpush from "web-push";

// ─── VAPID Configuration ────────────────────────────────────────────
// Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in your Convex environment.
// Generate with: npx web-push generate-vapid-keys
function getVapidKeys() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID keys not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in Convex environment variables.",
    );
  }
  return { publicKey, privateKey };
}

// ─── Public mutations for subscription management ────────────────────

export const subscribe = mutation({
  args: {
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
    userAgent: v.optional(v.string()),
  },
  returns: v.id("pushSubscriptions"),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    // Check if this endpoint is already registered
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing) {
      // Update keys if they changed
      await ctx.db.patch(existing._id, {
        keys: args.keys,
        userAgent: args.userAgent,
      });
      return existing._id;
    }

    return await ctx.db.insert("pushSubscriptions", {
      userId: user._id,
      endpoint: args.endpoint,
      keys: args.keys,
      userAgent: args.userAgent,
      createdAt: Date.now(),
    });
  },
});

export const unsubscribe = mutation({
  args: {
    endpoint: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const sub = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (sub && sub.userId === user._id) {
      await ctx.db.delete(sub._id);
    }

    return null;
  },
});

// ─── Internal: send push to all of a user's devices ──────────────────

export const sendPushToUser = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    link: v.optional(v.string()),
    tag: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { publicKey, privateKey } = getVapidKeys();

    webpush.setVapidDetails(
      "mailto:support@ltf1.dev",
      publicKey,
      privateKey,
    );

    // Get all push subscriptions for this user
    const subscriptions: any[] = await ctx.runQuery(
      internal.notifications.push_helpers.getUserSubscriptions,
      { userId: args.userId },
    );

    if (subscriptions.length === 0) return null;

    const payload = JSON.stringify({
      title: args.title,
      body: args.body,
      url: args.link || "https://ltf1.dev",
      tag: args.tag || "ltf1",
      icon: "/icon-192.png",
      badge: "/badge-72.png",
    });

    // Send to all devices
    const staleEndpoints: string[] = [];

    await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys,
            },
            payload,
            { TTL: 60 * 60 }, // 1 hour TTL
          );
        } catch (err: any) {
          // 410 Gone or 404 = subscription expired, clean up
          if (err.statusCode === 410 || err.statusCode === 404) {
            staleEndpoints.push(sub.endpoint);
          } else {
            console.error(
              `[PUSH] Failed to send to ${sub.endpoint.substring(0, 50)}:`,
              err.message,
            );
          }
        }
      }),
    );

    // Clean up stale subscriptions
    if (staleEndpoints.length > 0) {
      await ctx.runMutation(
        internal.notifications.push_helpers.removeStaleSubscriptions,
        { endpoints: staleEndpoints },
      );
    }

    return null;
  },
});
