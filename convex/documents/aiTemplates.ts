"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

const TEMPLATE_SYSTEM_PROMPT = `You are a document template generator for a Notion-like editor called LTF1 Pages.
Generate BlockNote-compatible JSON document content based on the user's request.

CRITICAL: Return ONLY a valid JSON array of blocks. No markdown, no code fences, no explanation.

Each block is an object with these fields:
- "type": one of "paragraph", "heading", "bulletListItem", "numberedListItem", "checkListItem", "codeBlock"
- "content": an array of inline content objects, each with: {"type": "text", "text": "your text here", "styles": {}}
  - For styled text, styles can include: {"bold": true}, {"italic": true}, {"code": true}, {"underline": true}, {"strike": true}
- "props": ONLY include when the block type needs it:
  - For "heading": {"level": 1} or {"level": 2} or {"level": 3}
  - For "checkListItem": {"checked": false}
  - For "codeBlock": {"language": "typescript"}
  - For other blocks: omit props entirely

Example output:
[
  {"type":"heading","props":{"level":1},"content":[{"type":"text","text":"Sprint Planning","styles":{}}]},
  {"type":"paragraph","content":[{"type":"text","text":"Use this template to plan your sprint.","styles":{}}]},
  {"type":"heading","props":{"level":2},"content":[{"type":"text","text":"Goals","styles":{}}]},
  {"type":"checkListItem","props":{"checked":false},"content":[{"type":"text","text":"Define sprint goal","styles":{}}]},
  {"type":"bulletListItem","content":[{"type":"text","text":"Item one","styles":{}}]}
]

Guidelines:
- Create professional, well-structured documents with clear hierarchy
- Use headings (h1, h2, h3) to organize sections
- Use checkListItems for actionable items and to-do lists
- Use bulletListItems for lists of information
- Use numberedListItems for sequential steps
- Use codeBlock for any code examples
- Do NOT use "quote" — it is not a valid block type
- Do NOT include "id" or "children" fields
- Make templates between 15-40 blocks for good depth
- Return ONLY the JSON array, nothing else`;

export const generateTemplate = action({
  args: {
    prompt: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Use the existing AI generate action which handles key resolution + fallback
    const result: { text: string; model: string; provider: "cerebras" | "groq" } =
      await ctx.runAction(api.ai.generate.generate, {
        prompt: `Create a document template for: ${args.prompt}\n\nReturn ONLY the JSON array of blocks.`,
        systemPrompt: TEMPLATE_SYSTEM_PROMPT,
        functionCategory: "template_generation",
        temperature: 0.7,
        maxTokens: 4000,
      });

    // Parse the response
    let content: any[];
    try {
      let cleaned = result.text.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      content = JSON.parse(cleaned);
      if (!Array.isArray(content)) {
        throw new Error("Response is not an array");
      }
    } catch {
      throw new Error("AI returned invalid template format. Please try again.");
    }

    return content;
  },
});
