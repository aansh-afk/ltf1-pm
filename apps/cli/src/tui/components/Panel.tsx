/**
 * Panel - Reusable bordered panel with optional title
 * Core layout primitive for the TUI redesign
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';

interface PanelProps {
  title?: string;
  titleColor?: string;
  borderColor?: string;
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
  padding?: number;
  flexGrow?: number;
  flexShrink?: number;
}

export function Panel({
  title,
  titleColor,
  borderColor,
  children,
  width,
  height,
  padding,
  flexGrow,
  flexShrink,
}: PanelProps) {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={borderColor || theme.border}
      paddingX={padding ?? 1}
      paddingY={0}
      width={width}
      height={height}
      flexGrow={flexGrow}
      flexShrink={flexShrink}
    >
      {title && (
        <Box marginBottom={0}>
          <Text color={titleColor || theme.textSecondary} bold>
            {` ${title} `}
          </Text>
        </Box>
      )}
      {children}
    </Box>
  );
}
