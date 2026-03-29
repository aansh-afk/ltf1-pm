/**
 * Agent triage command
 * Shows the AI triage queue and allows accepting/rejecting suggestions
 */

import { Command } from "commander";
import { makeFunctionReference } from "convex/server";
import { requireAuth } from "../../lib/auth.js";
import { getAuthenticatedClient, query, mutation } from "../../lib/convex.js";
import { getContext, hasProjectContext } from "../../lib/config.js";
import output from "../../lib/output.js";
import { getErrorMessage } from "../../lib/errors.js";

interface TriageItem {
  _id: string;
  title: string;
  suggestedType?: string;
  suggestedPriority?: string;
  assigneeName?: string;
  confidence?: number;
  status?: string;
}

interface TriageOptions {
  accept?: string;
  reject?: string;
  json?: boolean;
}

export function triageCommand(program: Command): void {
  program
    .command("triage")
    .description("Show AI triage queue and accept/reject suggestions")
    .option("--accept <taskId>", "Accept a triaged task by ID")
    .option("--reject <taskId>", "Reject a triaged task by ID")
    .option("--json", "Output as JSON")
    .action(async (options: TriageOptions) => {
      await requireAuth();

      const context = getContext();
      if (!hasProjectContext()) {
        output.error(
          "No project selected",
          "Run `ltf project select` to select a project",
        );
        process.exit(1);
      }

      const client = getAuthenticatedClient();

      // Handle accept/reject actions
      if (options.accept) {
        const spin = output.spinner("Accepting triaged task...");
        try {
          await mutation(
            client,
            makeFunctionReference<"mutation">("agent/mutations:acceptTriageItem"),
            { taskId: options.accept },
          );
          spin.stop();
          output.success(`Accepted triage item ${options.accept}`);
        } catch (err) {
          spin.stop();
          output.error("Failed to accept triage item", getErrorMessage(err));
          process.exit(1);
        }
        return;
      }

      if (options.reject) {
        const spin = output.spinner("Rejecting triaged task...");
        try {
          await mutation(
            client,
            makeFunctionReference<"mutation">("agent/mutations:rejectTriageItem"),
            { taskId: options.reject },
          );
          spin.stop();
          output.success(`Rejected triage item ${options.reject}`);
        } catch (err) {
          spin.stop();
          output.error("Failed to reject triage item", getErrorMessage(err));
          process.exit(1);
        }
        return;
      }

      // Show triage queue
      const spin = output.spinner("Fetching triage queue...");
      try {
        const items = (await query(
          client,
          makeFunctionReference<"query">("agent/queries:getTriageQueue"),
          { projectId: context?.projectId as string },
        )) as TriageItem[];

        spin.stop();

        if (options.json) {
          output.json(items);
          return;
        }

        if (!items || items.length === 0) {
          output.info("Triage queue is empty — no pending suggestions");
          return;
        }

        output.header("Agent Triage Queue");

        output.table(items as unknown as Record<string, unknown>[], [
          { header: "ID", key: "_id", width: 14, formatter: (v) => String(v).slice(-8) },
          { header: "Title", key: "title", width: 36, formatter: (v) => {
            const s = String(v || "");
            return s.length > 33 ? s.slice(0, 33) + "..." : s;
          }},
          { header: "Type", key: "suggestedType", width: 14, formatter: (v) => output.formatType(String(v || "task")) },
          { header: "Priority", key: "suggestedPriority", width: 10, formatter: (v) => output.formatPriority(String(v || "medium")) },
          { header: "Assignee", key: "assigneeName", width: 16, formatter: (v) => v ? String(v) : output.colors.muted("—") },
          { header: "Confidence", key: "confidence", width: 12, formatter: (v) => {
            const pct = typeof v === "number" ? Math.round(v * 100) : 0;
            return pct >= 80 ? output.colors.success(`${pct}%`) : pct >= 50 ? output.colors.warning(`${pct}%`) : output.colors.muted(`${pct}%`);
          }},
        ]);

        output.newline();
        output.log(output.colors.muted("Accept: ltf agent triage --accept <ID>"));
        output.log(output.colors.muted("Reject: ltf agent triage --reject <ID>"));
      } catch (err) {
        spin.stop();
        output.error("Failed to fetch triage queue", getErrorMessage(err));
        process.exit(1);
      }
    });
}
