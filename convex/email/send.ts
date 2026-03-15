"use node";

import { Resend } from "resend";
import { internalAction, action } from "../_generated/server";
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

    console.log(`[EMAIL] Sending to: ${args.to}, from: ${from}, subject: ${args.subject}`);

    const { data, error } = await resend.emails.send({
      from: `LTF1 <${from}>`,
      to: args.to,
      subject: args.subject,
      html: args.html,
      ...(args.replyTo ? { replyTo: args.replyTo } : {}),
    });

    if (error) {
      console.error("[EMAIL] Send failed:", JSON.stringify(error));
      throw new Error(`Email send failed: ${error.message}`);
    }

    console.log(`[EMAIL] Success — Resend ID: ${data?.id}`);
    return null;
  },
});

// Public action for testing email delivery from the UI
export const sendTestEmail = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    resendId: v.optional(v.string()),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userEmail = identity.email;
    if (!userEmail) {
      return { success: false, message: "No email found on your account" };
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    if (!apiKey) {
      return { success: false, message: "RESEND_API_KEY is not set in Convex environment variables" };
    }

    console.log(`[TEST EMAIL] API key: ${apiKey.substring(0, 8)}..., From: ${from}, To: ${userEmail}`);

    try {
      const r = new Resend(apiKey);
      const { data, error } = await r.emails.send({
        from: `LTF1 Test <${from}>`,
        to: userEmail,
        subject: "LTF1 — Test Email",
        html: `
          <div style="font-family: 'IBM Plex Mono', monospace; background: #0B0B0F; color: #E4E4E8; padding: 32px; max-width: 500px;">
            <h1 style="font-size: 20px; letter-spacing: 0.05em; margin-bottom: 16px; border-bottom: 2px solid #2A2A3A; padding-bottom: 12px;">
              LTF1 EMAIL TEST
            </h1>
            <p style="font-size: 14px; line-height: 1.6; color: #A0A0B0;">
              If you're reading this, your email delivery pipeline is working.
            </p>
            <div style="margin-top: 24px; padding: 12px; border: 2px solid #6366F1; background: rgba(99,102,241,0.1);">
              <p style="font-size: 12px; color: #6366F1; margin: 0;">
                <strong>From:</strong> ${from}<br/>
                <strong>To:</strong> ${userEmail}<br/>
                <strong>Sent at:</strong> ${new Date().toISOString()}<br/>
                <strong>Provider:</strong> Resend
              </p>
            </div>
            <p style="font-size: 11px; color: #6B6B80; margin-top: 24px;">
              This is a test email from LTF1. No action needed.
            </p>
          </div>
        `,
      });

      if (error) {
        console.error("[TEST EMAIL] Failed:", JSON.stringify(error));
        return { success: false, message: `Resend error: ${error.message}` };
      }

      console.log(`[TEST EMAIL] Sent — ID: ${data?.id}`);
      return {
        success: true,
        message: `Test email sent to ${userEmail}`,
        resendId: data?.id,
      };
    } catch (err: any) {
      console.error("[TEST EMAIL] Exception:", err.message);
      return { success: false, message: `Exception: ${err.message}` };
    }
  },
});
