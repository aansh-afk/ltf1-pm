/**
 * Header Component - Date, Sprint Progress, Day
 */

import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../styles/theme.js';

function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString().slice(-2);
  return `${day}.${month}.${year}`;
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
}

function generateWaveform(progress: number, width: number = 25): string {
  const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  let wave = '';

  for (let i = 0; i < width; i++) {
    // Create a wave pattern that peaks based on progress
    const position = i / width;
    const inProgress = position < progress;

    if (inProgress) {
      // Active part of the wave
      const wavePos = Math.sin(position * Math.PI * 4) * 0.5 + 0.5;
      const charIndex = Math.floor(wavePos * (chars.length - 1));
      wave += chars[charIndex];
    } else {
      // Inactive part
      wave += chars[0];
    }
  }

  return wave;
}

interface HeaderProps {
  sprintDay?: number;
  sprintDaysLeft?: number;
  sprintTotal?: number;
  sprintProgress?: number;
  sprintName?: string;
}

export function Header({
  sprintDay = 8,
  sprintDaysLeft = 4,
  sprintTotal = 12,
  sprintProgress = 0.67,
  sprintName = 'SPRINT 12',
}: HeaderProps) {
  const now = new Date();
  const dateStr = formatDate(now);
  const dayName = getDayName(now);
  const waveform = generateWaveform(sprintProgress);

  return (
    <Box flexDirection="column">
      {/* Top row - Date, Waveform, Day */}
      <Box justifyContent="space-between">
        <Box flexDirection="column">
          <Text color={theme.colors.text} bold>
            {dateStr}
          </Text>
          <Text color={theme.colors.dim}>───────</Text>
          <Text color={theme.colors.muted}>  DAY: {sprintDay.toString().padStart(2, '0')}</Text>
          <Text color={theme.colors.muted}> LEFT: {sprintDaysLeft.toString().padStart(2, '0')}</Text>
          <Text color={theme.colors.muted}>TOTAL: {sprintTotal.toString().padStart(2, '0')}</Text>
        </Box>

        <Box flexDirection="column" alignItems="center">
          <Text color={theme.colors.primary}>{waveform}</Text>
          <Text color={theme.colors.text}>
            {sprintName} · {Math.round(sprintProgress * 100)}% COMPLETE
          </Text>
          <Box marginTop={1}>
            <Text color={theme.colors.dim}>┌─────────────────────┐</Text>
          </Box>
          <Box>
            <Text color={theme.colors.dim}>│ </Text>
            <Text color={theme.colors.primary}>
              {theme.progress.filled.repeat(Math.floor(sprintProgress * 18))}
            </Text>
            <Text color={theme.colors.dim}>
              {theme.progress.empty.repeat(18 - Math.floor(sprintProgress * 18))}
            </Text>
            <Text color={theme.colors.dim}> │</Text>
          </Box>
          <Box>
            <Text color={theme.colors.dim}>└─────────────────────┘</Text>
          </Box>
        </Box>

        <Box flexDirection="column" alignItems="flex-end">
          <Text color={theme.colors.text} bold>
            {dayName}
          </Text>
          <Text color={theme.colors.dim}>───────</Text>
          <Text color={theme.colors.muted}>CITY: SYD</Text>
          <Text color={theme.colors.muted}>TEMP: 24°C</Text>
          <Text color={theme.colors.dim}>─────────</Text>
        </Box>
      </Box>
    </Box>
  );
}
