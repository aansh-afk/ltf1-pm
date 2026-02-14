/**
 * Search Box Component
 */

import React, { useState, useEffect } from 'react';
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
  const [internalValue, setInternalValue] = useState(value);

  // Sync internal state with parent prop
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useInput(
    (input, key) => {
      if (key.backspace || key.delete) {
        const newValue = internalValue.slice(0, -1);
        setInternalValue(newValue);
        onChange(newValue);
      } else if (key.escape) {
        setInternalValue('');
        onChange('');
      } else if (key.return) {
        onSubmit?.(internalValue);
      } else if (input && !key.ctrl && !key.meta) {
        const newValue = internalValue + input;
        setInternalValue(newValue);
        onChange(newValue);
      }
    },
    { isActive: focused },
  );

  const borderColor = focused ? theme.colors.borderFocus : theme.colors.border;
  const displayText = internalValue
    ? internalValue + (focused ? '\u2588' : '')
    : placeholder;
  const textColor = internalValue ? theme.colors.text : theme.colors.dim;

  const inner = width - 2;

  return (
    <Box flexDirection="column">
      <Text color={borderColor}>{'┌' + '─'.repeat(inner) + '┐'}</Text>
      <Text color={borderColor}>│<Text color={textColor}>{pad(displayText, inner)}</Text>│</Text>
      <Text color={borderColor}>{'└' + '─'.repeat(inner) + '┘'}</Text>
    </Box>
  );
}
