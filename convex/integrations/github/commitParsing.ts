/**
 * Conventional commit parsing utilities.
 * Pure functions (not Convex functions) used by release notes and webhook handlers.
 */

export interface ParsedCommit {
  type: string | null; // feat, fix, chore, refactor, test, docs, perf, ci, style, build
  scope: string | null; // optional (auth), (ui), etc.
  breaking: boolean; // ! after type
  description: string; // the rest of the message
}

// Regex for conventional commit format: type(scope)!: description
const CONVENTIONAL_COMMIT_REGEX =
  /^(feat|fix|chore|refactor|test|docs|perf|ci|style|build|revert)(\(([^)]+)\))?(!)?\s*:\s*(.+)/i;

/**
 * Parse a conventional commit prefix from a string (commit message or PR title).
 *
 * Supported formats:
 *   feat: add new button
 *   fix(auth): resolve login issue
 *   chore!: breaking change in config
 *   feat(ui)!: redesign dashboard
 */
export function parseConventionalCommit(message: string): ParsedCommit {
  // Trim and take only the first line for matching
  const firstLine = message.trim().split("\n")[0].trim();

  const match = CONVENTIONAL_COMMIT_REGEX.exec(firstLine);

  if (!match) {
    return {
      type: null,
      scope: null,
      breaking: false,
      description: firstLine,
    };
  }

  return {
    type: match[1].toLowerCase(),
    scope: match[3] || null,
    breaking: match[4] === "!",
    description: match[5].trim(),
  };
}

/**
 * Map a conventional commit type to an LTF1 task type.
 *
 * Mapping:
 *   feat       -> feature
 *   fix        -> bug
 *   chore      -> task
 *   refactor   -> improvement
 *   test       -> task
 *   docs       -> task
 *   perf       -> improvement
 *   ci         -> task
 *   style      -> improvement
 *   build      -> task
 *   revert     -> bug
 */
export function mapCommitTypeToTaskType(commitType: string): string {
  const typeMap: Record<string, string> = {
    feat: "feature",
    fix: "bug",
    chore: "task",
    refactor: "improvement",
    test: "task",
    docs: "task",
    perf: "improvement",
    ci: "task",
    style: "improvement",
    build: "task",
    revert: "bug",
  };

  return typeMap[commitType.toLowerCase()] || "task";
}

/**
 * Get a human-readable section title for a conventional commit type.
 * Used by release notes generation.
 */
export function getSectionTitle(commitType: string): string {
  const titleMap: Record<string, string> = {
    feat: "New Features",
    fix: "Bug Fixes",
    chore: "Maintenance",
    refactor: "Refactoring",
    test: "Tests",
    docs: "Documentation",
    perf: "Performance Improvements",
    ci: "CI/CD",
    style: "Style Changes",
    build: "Build System",
    revert: "Reverted Changes",
  };

  return titleMap[commitType.toLowerCase()] || "Other Changes";
}

/**
 * Get the release notes section key for a conventional commit type.
 * Groups related types together for cleaner release notes.
 */
export function getSectionKey(commitType: string): string {
  const sectionMap: Record<string, string> = {
    feat: "features",
    fix: "fixes",
    perf: "performance",
    chore: "other",
    refactor: "other",
    test: "other",
    docs: "other",
    ci: "other",
    style: "other",
    build: "other",
    revert: "fixes",
  };

  return sectionMap[commitType.toLowerCase()] || "other";
}
