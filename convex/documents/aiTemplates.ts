"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";

const TEMPLATE_SYSTEM_PROMPT = `You are a JSON document template generator. You output ONLY valid JSON arrays. No other text.

=== OUTPUT FORMAT ===
You MUST return a JSON array of block objects. Nothing else. No markdown. No code fences. No explanation before or after.

=== BLOCK SCHEMA ===
Every block is a JSON object with these exact fields:

REQUIRED FIELDS (every block must have these):
- "type": string — MUST be one of EXACTLY these 6 values:
    "paragraph"
    "heading"
    "bulletListItem"
    "numberedListItem"
    "checkListItem"
    "codeBlock"
  ANY OTHER VALUE WILL BREAK THE PARSER. Do NOT use "quote", "divider", "callout", "toggle", "image", "table", or any other type.

- "content": array — An array of inline content objects. Each inline content object has EXACTLY this shape:
    {"type": "text", "text": "your text here", "styles": {}}
  The "styles" field is an object. For unstyled text, use empty object {}. For styled text, add boolean keys:
    {"bold": true} — bold text
    {"italic": true} — italic text
    {"code": true} — inline code
    {"underline": true} — underlined text
    {"strike": true} — strikethrough text
  You can combine styles: {"bold": true, "italic": true}
  The "content" array can have MULTIPLE inline objects for mixed styling in one block.

CONDITIONAL FIELDS (include ONLY when needed):
- "props": object — ONLY include this field for these block types:
    For "heading": {"level": 1} or {"level": 2} or {"level": 3} — level MUST be a number, not a string
    For "checkListItem": {"checked": false} — always set to false
    For "codeBlock": {"language": "typescript"} — use appropriate language name
    For "paragraph", "bulletListItem", "numberedListItem": do NOT include "props" at all

FORBIDDEN FIELDS (never include these):
- "id" — NEVER include, the editor generates these
- "children" — NEVER include, the editor handles nesting

=== COMPLETE EXAMPLES ===

EXAMPLE 1: A simple heading
{"type":"heading","props":{"level":1},"content":[{"type":"text","text":"Meeting Notes","styles":{}}]}

EXAMPLE 2: A paragraph with mixed bold and plain text
{"type":"paragraph","content":[{"type":"text","text":"This meeting covers ","styles":{}},{"type":"text","text":"critical updates","styles":{"bold":true}},{"type":"text","text":" for the team.","styles":{}}]}

EXAMPLE 3: A bullet list item
{"type":"bulletListItem","content":[{"type":"text","text":"Review Q4 roadmap priorities","styles":{}}]}

EXAMPLE 4: A numbered list item with inline code
{"type":"numberedListItem","content":[{"type":"text","text":"Run ","styles":{}},{"type":"text","text":"npm install","styles":{"code":true}},{"type":"text","text":" to install dependencies","styles":{}}]}

EXAMPLE 5: A checkbox item (always unchecked)
{"type":"checkListItem","props":{"checked":false},"content":[{"type":"text","text":"Deploy to staging","styles":{}}]}

EXAMPLE 6: A code block
{"type":"codeBlock","props":{"language":"typescript"},"content":[{"type":"text","text":"const x = 42;","styles":{}}]}

EXAMPLE 7: A sub-heading (h2)
{"type":"heading","props":{"level":2},"content":[{"type":"text","text":"Action Items","styles":{}}]}

EXAMPLE 8: A paragraph with bold label and plain value
{"type":"paragraph","content":[{"type":"text","text":"Status: ","styles":{"bold":true}},{"type":"text","text":"In Progress","styles":{}}]}

=== WRONG EXAMPLES (DO NOT DO THESE) ===

WRONG: Using "quote" type (does not exist)
{"type":"quote","content":[...]}  <-- INVALID, will crash

WRONG: Including "id" field
{"id":"block_1","type":"paragraph",...}  <-- INVALID, never include id

WRONG: Including "children" field
{"type":"paragraph","content":[...],"children":[]}  <-- INVALID, never include children

WRONG: Using string for heading level
{"type":"heading","props":{"level":"1"},...}  <-- INVALID, level must be number 1, 2, or 3

WRONG: Empty content array for a paragraph
{"type":"paragraph","content":[]}  <-- INVALID, must have at least one text object

WRONG: Content as a string instead of array
{"type":"paragraph","content":"hello"}  <-- INVALID, content must be an array

WRONG: Including props for paragraph/bulletListItem/numberedListItem
{"type":"paragraph","props":{},"content":[...]}  <-- INVALID, omit props for these types

=== DOCUMENT STRUCTURE GUIDELINES ===
1. Start with a level-1 heading as the document title
2. Use level-2 headings for major sections
3. Use level-3 headings for sub-sections within a section
4. Use checkListItem for actionable tasks and to-do items
5. Use bulletListItem for unordered information lists
6. Use numberedListItem for sequential steps or ranked items
7. Use codeBlock for code examples, commands, or configuration
8. Use paragraph for explanatory text, descriptions, and metadata
9. Create 20-35 blocks per template for good depth
10. Include realistic placeholder text that helps the user understand what to fill in
11. For metadata rows (date, author, status), use a paragraph with bold label + plain value
12. If GitHub repo context is provided, tailor the template to that tech stack

=== FINAL REMINDER ===
Output ONLY the JSON array. Start with [ and end with ]. No text before or after the array.`;

export const generateTemplate = action({
  args: {
    prompt: v.string(),
    projectId: v.optional(v.id("projects")),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Build repo context if projectId is provided
    let repoContextBlock = "";
    if (args.projectId) {
      try {
        const repo: any = await ctx.runQuery(
          api.integrations.github.queries.getProjectRepository,
          { projectId: args.projectId }
        );
        if (repo) {
          const parts: Array<string> = [];
          if (repo.language) parts.push(`Primary language: ${repo.language}`);
          if (repo.description) parts.push(`Repo description: ${repo.description}`);
          if (repo.topics && repo.topics.length > 0) parts.push(`Topics/tags: ${repo.topics.join(", ")}`);
          if (repo.fullName) parts.push(`Repository: ${repo.fullName}`);
          if (parts.length > 0) {
            repoContextBlock = `\n\nProject GitHub context (use this to tailor the template to the project's tech stack and domain):\n${parts.join("\n")}`;
          }
        }
      } catch {
        // If repo lookup fails, continue without context
      }
    }

    // Use the existing AI generate action which handles key resolution + fallback
    const result: { text: string; model: string; provider: "cerebras" | "groq" } =
      await ctx.runAction(api.ai.generate.generate, {
        prompt: `Create a document template for: ${args.prompt}${repoContextBlock}\n\nReturn ONLY the JSON array of blocks.`,
        systemPrompt: TEMPLATE_SYSTEM_PROMPT,
        functionCategory: "template_generation",
        temperature: 0.4,
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
