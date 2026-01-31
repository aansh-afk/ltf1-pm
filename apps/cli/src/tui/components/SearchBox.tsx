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
  width: number;
}

function pad(str: string, len: number): string {
  if (str.length >= len) return str.slice(0, len);
  return str + ' '.repeat(len - str.length);
}

export function SearchBox({
  value,
  placeholder = 'Type to search...',
  focused = false,
  width,
}: SearchBoxProps) {
  const borderColor = focused ? theme.colors.borderFocus : theme.colors.border;
  const displayText = value || placeholder;
  const textColor = value ? theme.colors.text : theme.colors.dim;

  const w = Math.min(width, 32);
  const inner = w - 2;

  return (
    <Box flexDirection="column">
      <Text color={borderColor}>{'┌' + '─'.repeat(inner) + '┐'}</Text>
      <Text color={borderColor}>│<Text color={textColor}>{pad(displayText, inner)}</Text>│</Text>
      <Text color={borderColor}>{'└' + '─'.repeat(inner) + '┘'}</Text>
    </Box>
  );
}
