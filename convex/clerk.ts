import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/backend";

export const clerkWebhook = httpAction(async (ctx, request) => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET environment variable");
  }

  const svixHeaders = {
    "svix-id": request.headers.get("svix-id") ?? "",
    "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
    "svix-signature": request.headers.get("svix-signature") ?? "",
  };

  const payload = await request.text();

  const wh = new Webhook(webhookSecret);
  let event: WebhookEvent;

  try {
    event = wh.verify(payload, svixHeaders) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const { id, email_addresses, first_name, last_name, image_url } = event.data;
      const email = email_addresses[0]?.email_address;
      
      if (email) {
        await ctx.runMutation(internal.auth.users.createOrUpdateUser, {
          clerkId: id,
          email,
          name: `${first_name || ""} ${last_name || ""}`.trim() || "Anonymous",
          avatarUrl: image_url,
        });
      }
      break;
    }
    case "user.deleted": {
      // Handle user deletion if needed
      break;
    }
  }

  return new Response(null, { status: 200 });
});