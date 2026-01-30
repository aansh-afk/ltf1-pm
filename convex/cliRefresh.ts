"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { createClerkClient } from "@clerk/backend";

/**
 * Server-side CLI token refresh using Clerk Backend SDK.
 * Mints a fresh Convex JWT from a Clerk session ID,
 * so the CLI doesn't need to open a browser every hour.
 */
export const refreshToken = internalAction({
  args: {
    sessionId: v.string(),
  },
  returns: v.union(
    v.object({ token: v.string() }),
    v.object({ error: v.string() }),
  ),
  handler: async (_ctx, args) => {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      return { error: "CLERK_SECRET_KEY not configured" };
    }

    try {
      const clerk = createClerkClient({ secretKey });
      const response = await clerk.sessions.getToken(args.sessionId, "convex");

      if (!response || !response.jwt) {
        return { error: "Session expired or invalid" };
      }

      return { token: response.jwt };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      // Clerk returns specific errors for expired/revoked sessions
      if (message.includes("not found") || message.includes("expired") || message.includes("revoked")) {
        return { error: "Session expired — please log in again" };
      }
      return { error: message };
    }
  },
});
