/**
 * Agent suggest command
 * Triggers AI analysis and shows suggestions for the current project
 */

import { Command } from "commander";
import { makeFunctionReference } from "convex/server";
import { requireAuth } from "../../lib/auth.js";
import { getAuthenticatedClient, action } from "../../lib/convex.js";
import { getContext, hasProjectContext } from "../../lib/config.js";
import output from "../../lib/output.js";
import { getErrorMessage } from "../../lib/errors.js";

interface Suggestion {
  type: string;
  title: string;
  description: string;
  priority: string;
  confidence: number;
}

interface SuggestOptions {
  json?: boolean;
}

export function suggestCommand(program: Command): void {
  program
    .command("suggest")
    .description("Trigger AI analysis and get suggestions for the project")
    .option("--json", "Output as JSON")
    .action(async (options: SuggestOptions) => {
      await requireAuth();

      const context = getContext();
      if (!hasProjectContext()) {
        output.error(
          "No project selected",
          "Run `ltf project select` to select a project",
        );
        process.exit(1);
      }

      const spin = output.spinner("Running AI analysis...");

      try {
        const client = getAuthenticatedClient();

        const suggestions = (await action(
          client,
          makeFunctionReference<"action">("agent/actions:analyzeSuggestions"),
          { projectId: context?.projectId as string },
        )) as Suggestion[];

        spin.stop();

        if (options.json) {
          output.json(suggestions);
          return;
        }

        if (!suggestions || suggestions.length === 0) {
          output.info("No suggestions at this time — your project looks good!");
          return;
        }

        output.header("AI Suggestions");

        for (const s of suggestions) {
          const conf = Math.round(s.confidence * 100);
          const confStr =
            conf >= 80
              ? output.colors.success(`${conf}%`)
              : output.colors.warning(`${conf}%`);

          output.log(
            `  ${output.formatType(s.type)} ${output.colors.highlight(s.title)}  ${confStr}`,
          );
          output.log(`     ${output.colors.muted(s.description)}`);
          output.log(
            `     Priority: ${output.formatPriority(s.priority)}`,
          );
          output.newline();
        }

        output.log(
          output.colors.muted(
            `${suggestions.length} suggestion(s). Review in the triage queue: ltf agent triage`,
          ),
        );
      } catch (err) {
        spin.stop();
        output.error("AI analysis failed", getErrorMessage(err));
        process.exit(1);
      }
    });
}
