"use node";

import { Resend } from "resend";
import { internalAction } from "../_generated/server";
import { v } from "convex/values";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    replyTo: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    const { error } = await resend.emails.send({
      from: `LTF1 <${from}>`,
      to: args.to,
      subject: args.subject,
      html: args.html,
      ...(args.replyTo ? { replyTo: args.replyTo } : {}),
    });

    if (error) {
      console.error("Failed to send email:", error);
      throw new Error(`Email send failed: ${error.message}`);
    }

    return null;
  },
});
