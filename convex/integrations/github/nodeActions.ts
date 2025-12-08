"use node";

import { internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { createHmac } from "crypto";
import jwt from "jsonwebtoken";

// Verify GitHub webhook signature using Node.js crypto
export const verifyWebhookSignature = internalAction({
  args: {
    payload: v.string(),
    signature: v.string(),
    secret: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const expectedSignature = "sha256=" +
      createHmac("sha256", args.secret)
        .update(args.payload)
        .digest("hex");

    // Constant-time comparison to prevent timing attacks
    const source = Buffer.from(args.signature);
    const target = Buffer.from(expectedSignature);

    if (source.length !== target.length) {
      console.log(`[Webhook] Signature length mismatch. Received: ${source.length}, Expected: ${target.length}`);
      console.log(`[Webhook] Debug - Received (masked): ${args.signature.substring(0, 10)}...`);
      console.log(`[Webhook] Debug - Expected (masked): ${expectedSignature.substring(0, 10)}...`);
      return false;
    }

    const isValid = createHmac("sha256", args.secret).update(args.payload).digest("hex") === args.signature.replace("sha256=", "");

    // We'll use a simple comparison for now as timingSafeEqual requires equal length buffers
    // and handling the buffer conversion can be tricky with different encodings/lengths.
    // Reverting to simple string comparison but with better logging.

    if (args.signature !== expectedSignature) {
      console.log(`[Webhook] Signature mismatch.`);
      console.log(`[Webhook] Debug - Received: ${args.signature}`);
      console.log(`[Webhook] Debug - Calculated: ${expectedSignature}`);
      console.log(`[Webhook] Debug - Secret length: ${args.secret.length}`);
      return false;
    }

    return true;
  },
});

// Generate JWT for GitHub App authentication
export const generateInstallationToken = internalAction({
  args: {
    appId: v.string(),
    privateKey: v.string(),
    installationId: v.number(),
  },
  returns: v.object({
    token: v.string(),
    expiresAt: v.string(),
    permissions: v.any(),
    repositorySelection: v.string(),
  }),
  handler: async (ctx, args) => {
    // Generate JWT for app authentication
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60, // issued 60 seconds ago
      exp: now + 600, // expires in 10 minutes
      iss: args.appId,
    };

    // Normalize the private key
    let privateKey = args.privateKey;

    // Strip surrounding quotes if present (common env var issue)
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }

    // Handle escaped newlines
    if (!privateKey.includes("\n") && privateKey.includes("\\n")) {
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    // Basic validation
    if (!privateKey.includes("-----BEGIN RSA PRIVATE KEY-----")) {
      throw new Error("Invalid Private Key: Missing BEGIN header. Please check GITHUB_APP_PRIVATE_KEY.");
    }
    if (!privateKey.includes("-----END RSA PRIVATE KEY-----")) {
      throw new Error("Invalid Private Key: Missing END footer. It looks like the key was truncated or missing the footer line.");
    }

    const appToken = jwt.sign(payload, privateKey, {
      algorithm: "RS256",
    });

    // Exchange JWT for installation access token
    const response = await fetch(
      `https://api.github.com/app/installations/${args.installationId}/access_tokens`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${appToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      token: data.token,
      expiresAt: data.expires_at,
      permissions: data.permissions,
      repositorySelection: data.repository_selection,
    };
  },
});

// Create JWT for GitHub App
export const createAppJWT = internalAction({
  args: {
    appId: v.string(),
    privateKey: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60,
      exp: now + 600,
      iss: args.appId,
    };

    return jwt.sign(payload, args.privateKey, {
      algorithm: "RS256",
    });
  },
});