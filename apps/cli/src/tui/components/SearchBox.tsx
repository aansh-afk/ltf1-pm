/**
 * Search Box Component
 */

import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../styles/theme.js';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  focused?: boolean;
}

export function SearchBox({
  value,
  onChange,
  placeholder = 'Type to search tasks...',
  focused = false,
}: SearchBoxProps) {
  const borderColor = focused ? theme.colors.borderFocus : theme.colors.border;
  const displayText = value || placeholder;
  const textColor = value ? theme.colors.text : theme.colors.dim;

  return (
    <Box flexDirection="column">
      <Text color={borderColor}>
        {theme.box.topLeft}
        {theme.box.horizontal.repeat(43)}
        {theme.box.topRight}
      </Text>
      <Box>
        <Text color={borderColor}>{theme.box.vertical} </Text>
        <Text color={textColor}>{displayText.padEnd(41)}</Text>
        <Text color={borderColor}> {theme.box.vertical}</Text>
      </Box>
      <Text color={borderColor}>
        {theme.box.bottomLeft}
        {theme.box.horizontal.repeat(43)}
        {theme.box.bottomRight}
      </Text>
    </Box>
  );
}
