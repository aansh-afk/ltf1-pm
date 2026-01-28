/**
 * BorderBox Component - Styled container with border and title
 */

import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../styles/theme.js';

interface BorderBoxProps {
  title?: string;
  children: React.ReactNode;
  width?: number | string;
  height?: number;
  focused?: boolean;
}

export function BorderBox({
  title,
  children,
  width,
  height,
  focused = false,
}: BorderBoxProps) {
  const borderColor = focused ? theme.colors.borderFocus : theme.colors.border;
  const titleColor = focused ? theme.colors.primary : theme.colors.muted;

  // Calculate the width for the border
  const boxWidth = typeof width === 'number' ? width : 40;
  const innerWidth = boxWidth - 2;

  // Build top border with title
  let topBorder = theme.box.topLeft;
  if (title) {
    const titleStr = ` ${title} `;
    const remainingWidth = innerWidth - titleStr.length;
    const leftDashes = Math.floor(remainingWidth / 2);
    const rightDashes = remainingWidth - leftDashes;
    topBorder += theme.box.horizontal.repeat(Math.max(0, leftDashes));
    topBorder += titleStr;
    topBorder += theme.box.horizontal.repeat(Math.max(0, rightDashes));
  } else {
    topBorder += theme.box.horizontal.repeat(innerWidth);
  }
  topBorder += theme.box.topRight;

  // Build bottom border
  const bottomBorder =
    theme.box.bottomLeft +
    theme.box.horizontal.repeat(innerWidth) +
    theme.box.bottomRight;

  return (
    <Box flexDirection="column" width={width}>
      {/* Top border */}
      <Text color={borderColor}>
        {theme.box.topLeft}
        {theme.box.horizontal}
        {title && <Text color={titleColor}> {title} </Text>}
        {theme.box.horizontal.repeat(
          Math.max(0, innerWidth - (title ? title.length + 4 : 0))
        )}
        {theme.box.topRight}
      </Text>

      {/* Content with side borders */}
      <Box flexDirection="row">
        <Text color={borderColor}>{theme.box.vertical}</Text>
        <Box flexDirection="column" flexGrow={1} height={height}>
          {children}
        </Box>
        <Text color={borderColor}>{theme.box.vertical}</Text>
      </Box>

      {/* Bottom border */}
      <Text color={borderColor}>
        {theme.box.bottomLeft}
        {theme.box.horizontal.repeat(innerWidth)}
        {theme.box.bottomRight}
      </Text>
    </Box>
  );
}
