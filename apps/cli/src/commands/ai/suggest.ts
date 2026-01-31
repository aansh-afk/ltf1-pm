/**
 * AI Suggest Command
 * Analyzes recent git commits and suggests tasks to create
 */

import output from '../../lib/output.js';
import { getAuthenticatedClient, action } from '../../lib/convex.js';
import { requireAuth } from '../../lib/auth.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import { getRecentCommits, getCurrentBranch, isGitRepo } from '../../lib/git.js';
import { getErrorMessage } from '../../lib/errors.js';

interface SuggestOptions {
  count?: string;
  json?: boolean;
}

interface CommitData {
  hash: string;
  message: string;
  author: string;
  date: Date;
}

interface TaskSuggestion {
  title: string;
  type: 'feature' | 'bug' | 'improvement' | 'task';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  relatedCommits: string[];
}

interface SuggestResponse {
  suggestions: TaskSuggestion[];
  analysis: string;
}

/**
 * Suggest tasks based on git commit history
 */
export async function suggestCommand(options: SuggestOptions): Promise<void> {
  requireAuth();

  // Check if we're in a git repo
  const inGitRepo = await isGitRepo();
  if (!inGitRepo) {
    output.error('Not in a git repository', 'Run this command from within a git repository');
    process.exit(1);
  }

  // Check for project context
  if (!hasProjectContext()) {
    output.error('No project selected', 'Run `ltf project select` first');
    process.exit(1);
  }

  const context = getContext();
  const projectId = context?.projectId;

  if (!projectId) {
    output.error('No project selected', 'Run `ltf project select` first');
    process.exit(1);
  }

  const count = parseInt(options.count || '10', 10);
  const spin = output.spinner('Fetching recent commits...');

  try {
    // Get recent commits
    const commits = await getRecentCommits(count);
    const branch = await getCurrentBranch();

    if (commits.length === 0) {
      spin.stop();
      output.warning('No commits found in this repository');
      return;
    }

    spin.text = `Analyzing ${commits.length} commits with AI...`;

    // Prepare commit data for AI analysis
    const commitData = commits.map((c: CommitData) => ({
      hash: c.hash.substring(0, 7),
      message: c.message,
      author: c.author,
      date: c.date.toISOString(),
    }));

    // Call the AI action to analyze commits and suggest tasks
    const client = getAuthenticatedClient();

    // Try to call the AI action for commit analysis
    // Falls back to local pattern-based analysis if action doesn't exist
    const response = await action<SuggestResponse>(
      client,
      'ai/actions:analyzeCommitsForSuggestions',
      {
        projectId,
        commits: commitData,
        branch: branch || 'main'
      }
    ).catch(async () => {
      // Fallback: Generate suggestions based on commit analysis
      // Parse commits locally and generate suggestions
      return generateLocalSuggestions(commits);
    });

    spin.stop();

    if (options.json) {
      output.json(response);
      return;
    }

    // Display results
    output.newline();
    output.header('AI Task Suggestions');

    if (response.analysis) {
      output.box(response.analysis, 'Analysis');
    }

    if (!response.suggestions || response.suggestions.length === 0) {
      output.info('No task suggestions based on recent activity');
      return;
    }

    output.newline();
    output.log(output.colors.highlight(`Found ${response.suggestions.length} suggested tasks:`));
    output.newline();

    for (let i = 0; i < response.suggestions.length; i++) {
      const suggestion = response.suggestions[i];
      const typeColor = output.colors.primary;
      const priorityColor = getPriorityColor(suggestion.priority);

      output.log(`${output.colors.muted(`${i + 1}.`)} ${output.colors.highlight(suggestion.title)}`);
      output.log(`   ${typeColor(suggestion.type.toUpperCase())} ${priorityColor(suggestion.priority)}`);

      if (suggestion.description) {
        output.log(`   ${output.colors.muted(suggestion.description.substring(0, 100))}${suggestion.description.length > 100 ? '...' : ''}`);
      }

      if (suggestion.relatedCommits && suggestion.relatedCommits.length > 0) {
        output.log(`   ${output.colors.muted('Related:')} ${suggestion.relatedCommits.join(', ')}`);
      }

      output.newline();
    }

    output.info('Use `ltf ai describe "<title>"` to generate full task details');

  } catch (err) {
    spin.stop();
    output.error('Failed to analyze commits', getErrorMessage(err));
    process.exit(1);
  }
}

/**
 * Generate suggestions locally based on commit patterns
 * Used as fallback when AI service is unavailable
 */
function generateLocalSuggestions(commits: CommitData[]): SuggestResponse {
  const suggestions: TaskSuggestion[] = [];

  // Pattern-based analysis
  const fixCommits = commits.filter((c) =>
    /\b(fix|bug|patch|hotfix)\b/i.test(c.message)
  );

  const featureCommits = commits.filter((c) =>
    /\b(feat|feature|add|implement)\b/i.test(c.message)
  );

  const refactorCommits = commits.filter((c) =>
    /\b(refactor|cleanup|improve|optimize)\b/i.test(c.message)
  );

  const wipCommits = commits.filter((c) =>
    /\b(wip|todo|fixme|hack)\b/i.test(c.message)
  );

  // Generate suggestions based on patterns
  if (fixCommits.length > 0) {
    suggestions.push({
      title: 'Add tests for recent bug fixes',
      type: 'improvement',
      priority: 'medium',
      description: `${fixCommits.length} bug fixes were committed recently. Consider adding regression tests.`,
      relatedCommits: fixCommits.slice(0, 3).map((c) => c.hash.substring(0, 7)),
    });
  }

  if (featureCommits.length > 2) {
    suggestions.push({
      title: 'Update documentation for new features',
      type: 'task',
      priority: 'low',
      description: `${featureCommits.length} new features were added. Documentation may need updating.`,
      relatedCommits: featureCommits.slice(0, 3).map((c) => c.hash.substring(0, 7)),
    });
  }

  if (wipCommits.length > 0) {
    suggestions.push({
      title: 'Complete work-in-progress items',
      type: 'task',
      priority: 'high',
      description: `Found ${wipCommits.length} commits with WIP/TODO markers that need attention.`,
      relatedCommits: wipCommits.slice(0, 3).map((c) => c.hash.substring(0, 7)),
    });
  }

  if (refactorCommits.length > 0) {
    suggestions.push({
      title: 'Review and validate refactoring changes',
      type: 'improvement',
      priority: 'medium',
      description: `${refactorCommits.length} refactoring commits may need code review.`,
      relatedCommits: refactorCommits.slice(0, 3).map((c) => c.hash.substring(0, 7)),
    });
  }

  // General suggestion if no patterns found
  if (suggestions.length === 0 && commits.length > 0) {
    suggestions.push({
      title: 'Review recent changes for follow-up tasks',
      type: 'task',
      priority: 'low',
      description: `${commits.length} commits were made. Consider reviewing for any follow-up work needed.`,
      relatedCommits: commits.slice(0, 3).map((c) => c.hash.substring(0, 7)),
    });
  }

  return {
    suggestions,
    analysis: `Analyzed ${commits.length} commits. Found patterns: ${fixCommits.length} fixes, ${featureCommits.length} features, ${refactorCommits.length} refactors, ${wipCommits.length} WIP items.`,
  };
}

/**
 * Get color function for priority
 */
function getPriorityColor(priority: string): (text: string) => string {
  switch (priority) {
    case 'urgent':
      return output.colors.error;
    case 'high':
      return output.colors.warning;
    case 'medium':
      return output.colors.info;
    case 'low':
    default:
      return output.colors.muted;
  }
}
