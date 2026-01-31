/**
 * BorderBox Component - Character-based container with border and title
 * Uses explicit string building for reliable terminal layout
 */

import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../styles/theme.js';

interface BorderBoxProps {
  title?: string;
  children: React.ReactNode;
  width: number;
  focused?: boolean;
}

// Utility to create a line of exact width
function line(char: string, length: number): string {
  return char.repeat(Math.max(0, length));
}

// Utility to pad/truncate string to exact width
function fixedWidth(str: string, width: number, align: 'left' | 'right' = 'left'): string {
  if (str.length > width) {
    return str.slice(0, width);
  }
  if (align === 'right') {
    return str.padStart(width);
  }
  return str.padEnd(width);
}

export function BorderBox({
  title,
  children,
  width,
  focused = false,
}: BorderBoxProps) {
  const borderColor = focused ? theme.colors.borderFocus : theme.colors.border;
  const titleColor = focused ? theme.colors.primary : theme.colors.muted;

  // Inner width = total width - 2 border chars
  const innerWidth = Math.max(0, width - 2);

  // Build top border with title
  let topBorderContent: React.ReactNode;
  if (title) {
    const titleText = ` ${title} `;
    const dashesNeeded = innerWidth - titleText.length;
    const leftDashes = Math.max(0, Math.floor(dashesNeeded / 2));
    const rightDashes = Math.max(0, dashesNeeded - leftDashes);
    topBorderContent = (
      <>
        {line('─', leftDashes)}
        <Text color={titleColor}>{titleText}</Text>
        {line('─', rightDashes)}
      </>
    );
  } else {
    topBorderContent = line('─', innerWidth);
  }

  return (
    <Box flexDirection="column">
      {/* Top border */}
      <Text color={borderColor}>
        ┌{topBorderContent}┐
      </Text>

      {/* Content rows - each child should handle its own width */}
      <Box flexDirection="column">
        {React.Children.map(children, (child) => (
          <Box>
            <Text color={borderColor}>│</Text>
            <Box width={innerWidth}>{child}</Box>
            <Text color={borderColor}>│</Text>
          </Box>
        ))}
      </Box>

      {/* Bottom border */}
      <Text color={borderColor}>
        └{line('─', innerWidth)}┘
      </Text>
    </Box>
  );
}

// Export utilities for child components
export { fixedWidth, line };
