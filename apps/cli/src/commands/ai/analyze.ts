/**
 * AI Analyze Command
 * Analyzes current sprint health with AI insights
 */

import output from '../../lib/output.js';
import { getAuthenticatedClient, action, query } from '../../lib/convex.js';
import { requireAuth } from '../../lib/auth.js';
import { getContext, hasProjectContext } from '../../lib/config.js';
import { getErrorMessage } from '../../lib/errors.js';

interface AnalyzeOptions {
  sprint?: string;
  json?: boolean;
}

interface SprintAnalysis {
  velocity: number;
  healthScore: number;
  risks: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
  }>;
  recommendations: string[];
  insights: {
    strongPoints: string[];
    improvements: string[];
  };
  metrics?: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    completionRate: number;
  };
}

interface Sprint {
  _id: string;
  name: string;
  status: 'planning' | 'active' | 'completed';
  startDate: number;
  endDate: number;
  goal?: string;
}

/**
 * Analyze sprint health with AI
 */
export async function analyzeCommand(options: AnalyzeOptions): Promise<void> {
  requireAuth();

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

  const spin = output.spinner('Fetching sprint data...');

  try {
    const client = getAuthenticatedClient();

    // Get the sprint to analyze
    let sprintId = options.sprint;

    if (!sprintId) {
      // Get active sprint for the project
      spin.text = 'Finding active sprint...';
      const sprints = await query<Sprint[]>(
        client,
        'sprints/queries:getProjectSprints',
        { projectId }
      );

      const activeSprint = sprints.find((s) => s.status === 'active');

      if (!activeSprint) {
        spin.stop();
        output.warning('No active sprint found');
        output.info('Use `ltf sprint create` to create a sprint, or specify a sprint ID with --sprint');
        return;
      }

      sprintId = activeSprint._id;
    }

    spin.text = 'Analyzing sprint with AI...';

    // Call the AI analysis action
    const analysis = await action<SprintAnalysis>(
      client,
      'ai/actions:analyzeSprint',
      { sprintId }
    );

    spin.stop();

    if (options.json) {
      output.json(analysis);
      return;
    }

    // Display results
    output.newline();
    output.header('Sprint Health Analysis');

    // Health score with visual indicator
    const healthColor = getHealthColor(analysis.healthScore);
    const healthBar = getHealthBar(analysis.healthScore);

    output.box(
      `${healthBar}\n\n` +
      `${output.colors.highlight('Health Score:')} ${healthColor(`${analysis.healthScore}%`)}\n` +
      `${output.colors.highlight('Velocity:')} ${analysis.velocity} points`,
      'Sprint Health'
    );

    // Display metrics if available
    if (analysis.metrics) {
      output.newline();
      output.log(output.colors.highlight('METRICS'));
      output.keyValue([
        ['Total Tasks', String(analysis.metrics.totalTasks)],
        ['Completed', `${analysis.metrics.completedTasks} (${analysis.metrics.completionRate.toFixed(1)}%)`],
        ['In Progress', String(analysis.metrics.inProgressTasks)],
        ['Blocked', String(analysis.metrics.blockedTasks)],
      ]);
    }

    // Display risks
    if (analysis.risks && analysis.risks.length > 0) {
      output.newline();
      output.log(output.colors.highlight('RISKS'));
      output.newline();

      for (const risk of analysis.risks) {
        const severityIcon = getSeverityIcon(risk.severity);
        const severityColor = getSeverityColor(risk.severity);
        output.log(`  ${severityIcon} ${severityColor(risk.severity.toUpperCase())} ${risk.message}`);
      }
    } else {
      output.newline();
      output.success('No significant risks identified');
    }

    // Display insights
    if (analysis.insights) {
      if (analysis.insights.strongPoints && analysis.insights.strongPoints.length > 0) {
        output.newline();
        output.log(output.colors.success('STRONG POINTS'));
        output.list(analysis.insights.strongPoints, output.icons.success);
      }

      if (analysis.insights.improvements && analysis.insights.improvements.length > 0) {
        output.newline();
        output.log(output.colors.warning('AREAS FOR IMPROVEMENT'));
        output.list(analysis.insights.improvements, output.icons.warning);
      }
    }

    // Display recommendations
    if (analysis.recommendations && analysis.recommendations.length > 0) {
      output.newline();
      output.log(output.colors.highlight('RECOMMENDATIONS'));
      output.newline();

      for (let i = 0; i < analysis.recommendations.length; i++) {
        output.log(`  ${output.colors.primary(`${i + 1}.`)} ${analysis.recommendations[i]}`);
      }
    }

    output.newline();

  } catch (err) {
    spin.stop();
    output.error('Failed to analyze sprint', getErrorMessage(err));
    process.exit(1);
  }
}

/**
 * Get color function based on health score
 */
function getHealthColor(score: number): (text: string) => string {
  if (score >= 80) return output.colors.success;
  if (score >= 60) return output.colors.warning;
  if (score >= 40) return output.colors.primary;
  return output.colors.error;
}

/**
 * Get visual health bar
 */
function getHealthBar(score: number): string {
  const width = 20;
  const filled = Math.round((score / 100) * width);
  const empty = width - filled;

  const healthColor = getHealthColor(score);
  const filledBar = healthColor('\u2588'.repeat(filled));
  const emptyBar = output.colors.muted('\u2591'.repeat(empty));

  return `${filledBar}${emptyBar} ${score}%`;
}

/**
 * Get severity icon
 */
function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'critical':
      return output.colors.error('\u26A0');
    case 'high':
      return output.colors.error('\u25CF');
    case 'medium':
      return output.colors.warning('\u25CF');
    case 'low':
    default:
      return output.colors.muted('\u25CB');
  }
}

/**
 * Get severity color function
 */
function getSeverityColor(severity: string): (text: string) => string {
  switch (severity) {
    case 'critical':
      return output.colors.error;
    case 'high':
      return output.colors.error;
    case 'medium':
      return output.colors.warning;
    case 'low':
    default:
      return output.colors.muted;
  }
}
