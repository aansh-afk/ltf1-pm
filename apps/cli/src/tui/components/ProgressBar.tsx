/**
 * ProgressBar - Unicode block progress bar
 */

import { Text } from 'ink';
import { theme } from '../theme.js';

interface ProgressBarProps {
  value: number;
  max: number;
  width?: number;
  color?: string;
  showPercent?: boolean;
}

export function ProgressBar({
  value,
  max,
  width = 20,
  color,
  showPercent = true,
}: ProgressBarProps) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const filled = Math.round(ratio * width);
  const empty = width - filled;

  return (
    <Text>
      <Text color={color || theme.accent}>{'\u2588'.repeat(filled)}</Text>
      <Text color={theme.textDim}>{'\u2591'.repeat(empty)}</Text>
      {showPercent && (
        <Text color={theme.textSecondary}> {Math.round(ratio * 100)}%</Text>
      )}
    </Text>
  );
}
