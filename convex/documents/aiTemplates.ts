"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

const TEMPLATE_SYSTEM_PROMPT = `You are a document template generator for a Notion-like editor called LTF1 Pages.
Generate BlockNote-compatible JSON document content based on the user's request.

CRITICAL: Return ONLY a valid JSON array of blocks. No markdown, no code fences, no explanation.

Each block is an object with these fields:
- "id": a unique string (use format "block_1", "block_2", etc.)
- "type": one of "paragraph", "heading", "bulletListItem", "numberedListItem", "checkListItem", "codeBlock", "quote"
- "content": an array of inline content objects, each with: {"type": "text", "text": "your text here", "styles": {}}
  - For styled text, styles can include: {"bold": true}, {"italic": true}, {"code": true}, {"underline": true}, {"strike": true}
  - You can mix multiple style objects in the same styles object
- "props": an object with block-specific properties
  - For "heading": {"level": 1} or {"level": 2} or {"level": 3}
  - For "checkListItem": {"checked": false}
  - For "codeBlock": {"language": "typescript"} (or any language)
  - For other blocks: {} (empty object)
- "children": [] (always empty array)

Example output:
[
  {"id":"block_1","type":"heading","props":{"level":1},"content":[{"type":"text","text":"Sprint Planning","styles":{}}],"children":[]},
  {"id":"block_2","type":"paragraph","props":{},"content":[{"type":"text","text":"Use this template to plan your sprint.","styles":{}}],"children":[]},
  {"id":"block_3","type":"heading","props":{"level":2},"content":[{"type":"text","text":"Goals","styles":{}}],"children":[]},
  {"id":"block_4","type":"checkListItem","props":{"checked":false},"content":[{"type":"text","text":"Define sprint goal","styles":{}}],"children":[]},
  {"id":"block_5","type":"checkListItem","props":{"checked":false},"content":[{"type":"text","text":"Assign story points","styles":{}}],"children":[]}
]

Guidelines:
- Create professional, well-structured documents with clear hierarchy
- Use headings (h1, h2, h3) to organize sections
- Use checkListItems for actionable items and to-do lists
- Use bulletListItems for lists of information
- Use numberedListItems for sequential steps
- Use codeBlock for any code examples
- Use quote for important callouts or notes
- Include placeholder text that's helpful and realistic
- Make templates between 15-40 blocks for good depth
- For dev tools: include code examples, architecture patterns, API specs
- For project management: include checklists, timelines, stakeholders
- Return ONLY the JSON array, nothing else`;

export const generateTemplate = action({
  args: {
    prompt: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const result: { text: string; model: string; provider: "cerebras" | "groq" } =
      await ctx.runAction(internal.ai.providers.generateWithProvider, {
        provider: "cerebras",
        model: "gpt-oss-120b",
        apiKey: process.env.CEREBRAS_API_KEY!,
        prompt: `Create a document template for: ${args.prompt}\n\nReturn ONLY the JSON array of blocks.`,
        systemPrompt: TEMPLATE_SYSTEM_PROMPT,
        temperature: 0.7,
        maxTokens: 4000,
        complexity: "medium",
      });

    // Parse the response
    let content: any[];
    try {
      let cleaned = result.text.trim();
      // Strip code fences if present
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
