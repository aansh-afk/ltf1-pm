/**
 * Sprint Panel Component
 */

import { Box, Text } from "ink";
import { theme } from "../styles/theme.js";

interface SprintPanelProps {
  name?: string;
  daysLeft?: number;
  progress?: number;
  tasksTotal?: number;
  tasksDone?: number;
  tasksInProgress?: number;
  tasksTodo?: number;
  width: number;
}

function pad(str: string, len: number): string {
  if (str.length >= len) return str.slice(0, len);
  return str + " ".repeat(len - str.length);
}

export function SprintPanel({
  name = "Sprint 12",
  daysLeft = 4,
  progress = 0.67,
  tasksTotal = 21,
  tasksDone = 14,
  tasksInProgress = 4,
  tasksTodo = 3,
  width,
}: SprintPanelProps) {
  // Fixed width of 50 characters for consistency
  const w = Math.min(width, 50);
  const inner = w - 2; // content between │ and │

  const daysText = `${daysLeft} days left`;
  const row1 = pad(name, inner - daysText.length) + daysText;

  const pct = `${Math.round(progress * 100)}%`;
  const barLen = inner - pct.length - 1;
  const filled = Math.floor(progress * barLen);
  const row2 = "█".repeat(filled) + "░".repeat(barLen - filled) + " " + pct;

  const summary = `${tasksDone}/${tasksTotal} done · ${tasksInProgress} in progress · ${tasksTodo} todo`;
  const row3 = pad(summary, inner);

  return (
    <Box flexDirection="column">
      <Text color={theme.colors.border}>
        {"┌─ SPRINT " + "─".repeat(inner - 9) + "┐"}
      </Text>
      <Text color={theme.colors.border}>
        {"│"}
        <Text color={theme.colors.text}>{row1}</Text>
        {"│"}
      </Text>
      <Text color={theme.colors.border}>
        {"│"}
        <Text color={theme.colors.text}>{row2}</Text>
        {"│"}
      </Text>
      <Text color={theme.colors.border}>
        {"│"}
        <Text color={theme.colors.muted}>{row3}</Text>
        {"│"}
      </Text>
      <Text color={theme.colors.border}>{"└" + "─".repeat(inner) + "┘"}</Text>
    </Box>
  );
}
