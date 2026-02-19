/**
 * Search Box Component
 */

import React from 'react';
import { Box, Text, useInput } from 'ink';
import { theme } from '../styles/theme.js';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
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
  onChange,
  onSubmit,
  placeholder = 'Type to search...',
  focused = false,
  width,
}: SearchBoxProps) {
  useInput(
    (input, key) => {
      if (key.backspace || key.delete) {
        onChange(value.slice(0, -1));
      } else if (key.escape) {
        onChange('');
      } else if (key.return) {
        onSubmit?.(value);
      } else if (input && !key.ctrl && !key.meta) {
        onChange(value + input);
      }
    },
    { isActive: focused },
  );

  const borderColor = focused ? theme.colors.borderFocus : theme.colors.border;
  const displayText = value
    ? value + (focused ? '\u2588' : '')
    : placeholder;
  const textColor = value ? theme.colors.text : theme.colors.dim;

  const inner = width - 2;

  return (
    <Box flexDirection="column">
      <Text color={borderColor}>{'┌' + '─'.repeat(inner) + '┐'}</Text>
      <Text color={borderColor}>│<Text color={textColor}>{pad(displayText, inner)}</Text>│</Text>
      <Text color={borderColor}>{'└' + '─'.repeat(inner) + '┘'}</Text>
    </Box>
  );
}
