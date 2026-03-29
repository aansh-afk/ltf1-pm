/**
 * LTF1 ASCII Logo Component - Original block style
 */

import { Box, Text } from 'ink';
import { theme } from '../styles/theme.js';

const VERSION = '0.1.0-beta.2';

export function Logo() {
  return (
    <Box flexDirection="column">
      <Text color={theme.colors.text}>██       ████████  ████████    ██</Text>
      <Text color={theme.colors.text}>██          ██     ██        ████</Text>
      <Text color={theme.colors.text}>██          ██     ██████      ██</Text>
      <Text color={theme.colors.text}>██          ██     ██          ██</Text>
      <Text color={theme.colors.text}>████████    ██     ██        ████</Text>
      <Text color={theme.colors.dim}>──────────────────────────────────</Text>
      <Text color={theme.colors.muted}>v{VERSION}</Text>
    </Box>
  );
}
