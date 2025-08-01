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
    
    return args.signature === expectedSignature;
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

    const appToken = jwt.sign(payload, args.privateKey, {
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