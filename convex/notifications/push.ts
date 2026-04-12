"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
// @ts-ignore — deep type instantiation
import { internal } from "../_generated/api";
import webpush from "web-push";

// ─── VAPID Configuration ────────────────────────────────────────────
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
            { TTL: 60 * 60 },
          );
        } catch (err: any) {
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
