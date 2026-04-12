"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";

// Expose the VAPID public key so the frontend can subscribe
export const getVapidPublicKey = action({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async () => {
    return process.env.VAPID_PUBLIC_KEY || null;
  },
});
