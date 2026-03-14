"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { createHmac } from "crypto";

export const verifyPolarSignature = internalAction({
  args: {
    payload: v.string(),
    webhookId: v.string(),
    timestamp: v.string(),
    signature: v.string(),
    secret: v.string(),
  },
  returns: v.boolean(),
  handler: async (_ctx, args) => {
    try {
      // Standard webhooks verification
      // Signature is computed over: "{webhook_id}.{timestamp}.{payload}"
      const signedContent = `${args.webhookId}.${args.timestamp}.${args.payload}`;

      // Decode base64 secret
      const secretKey = Buffer.from(args.secret, "base64");

      // Compute expected signature
      const expectedSignature = createHmac("sha256", secretKey)
        .update(signedContent)
        .digest("base64");

      // Polar sends comma-separated signatures with version prefix (v1,xxx)
      const signatures = args.signature.split(" ");
      for (const sig of signatures) {
        const parts = sig.split(",");
        const sigValue = parts.length > 1 ? parts[1] : parts[0];
        if (sigValue === expectedSignature) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error("[Polar] Signature verification error:", error);
      return false;
    }
  },
});
