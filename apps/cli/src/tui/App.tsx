/**
 * LTF1 TUI Dashboard
 * A full-screen terminal UI inspired by OpenCode's aesthetic
 * Built with Ink (React for CLIs)
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { Logo } from './components/Logo.js';
import { Header } from './components/Header.js';
import { SprintPanel } from './components/SprintPanel.js';
import { GitPanel } from './components/GitPanel.js';
import { TasksPanel } from './components/TasksPanel.js';
import { SearchBox } from './components/SearchBox.js';
import { QuickLinks } from './components/QuickLinks.js';
import { StatusBar } from './components/StatusBar.js';
import { NotePanel } from './components/NotePanel.js';
import { theme } from './styles/theme.js';

interface AppProps {
  initialView?: 'dashboard' | 'tasks' | 'sprint' | 'git';
}

export function App({ initialView = 'dashboard' }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [width, setWidth] = useState(stdout?.columns || 120);
  const [height, setHeight] = useState(stdout?.rows || 40);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPanel, setSelectedPanel] = useState<string | null>(null);
  const [view, setView] = useState(initialView);

  // Handle terminal resize
  useEffect(() => {
    const handleResize = () => {
      if (stdout) {
        setWidth(stdout.columns);
        setHeight(stdout.rows);
      }
    };

    stdout?.on('resize', handleResize);
    return () => {
      stdout?.off('resize', handleResize);
    };
  }, [stdout]);

  // Keyboard navigation
  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c')) {
      exit();
    }
    if (input === 't') {
      setView('tasks');
    }
    if (input === 's') {
      setView('sprint');
    }
    if (input === 'g') {
      setView('git');
    }
    if (input === 'd' || key.escape) {
      setView('dashboard');
    }
    if (input === '?') {
      // Show help
    }
  });

  // Calculate layout dimensions
  const contentWidth = Math.min(width - 4, 100);
  const leftColWidth = Math.floor(contentWidth * 0.4);
  const rightColWidth = contentWidth - leftColWidth - 3;

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      paddingX={2}
    >
      {/* Header Section */}
      <Header />

      {/* Main Content Area */}
      <Box flexDirection="row" flexGrow={1} marginTop={1}>
        {/* Left Column */}
        <Box flexDirection="column" width={leftColWidth}>
          {/* Logo and Note */}
          <Box flexDirection="row">
            <Logo />
            <Box marginLeft={2} flexDirection="column">
              <NotePanel />
            </Box>
          </Box>

          {/* Search Box */}
          <Box marginTop={1}>
            <SearchBox
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Type to search tasks..."
            />
          </Box>

          {/* Git Panel */}
          <Box marginTop={1}>
            <GitPanel />
          </Box>
        </Box>

        {/* Right Column */}
        <Box flexDirection="column" marginLeft={3} flexGrow={1}>
          {/* Sprint Panel */}
          <SprintPanel />

          {/* Quick Links */}
          <Box marginTop={1}>
            <QuickLinks section="PRI" />
          </Box>

          {/* Tasks Panel */}
          <Box marginTop={1} flexGrow={1}>
            <TasksPanel />
          </Box>

          {/* Secondary Links */}
          <Box marginTop={1}>
            <QuickLinks section="SEC" />
          </Box>
        </Box>
      </Box>

      {/* Tip Line */}
      <Box marginTop={1}>
        <Text color={theme.colors.accent}>● </Text>
        <Text color={theme.colors.muted}>Tip  </Text>
        <Text color={theme.colors.text}>
          Press <Text bold>t</Text> to view all tasks, or <Text bold>n</Text> to create a new one
        </Text>
      </Box>

      {/* Keyboard Shortcuts */}
      <Box marginTop={1} justifyContent="center">
        <Text color={theme.colors.muted}>
          <Text bold color={theme.colors.text}>t</Text> tasks
          <Text bold color={theme.colors.text}>s</Text> sprint
          <Text bold color={theme.colors.text}>p</Text> projects
          <Text bold color={theme.colors.text}>g</Text> git sync
          <Text bold color={theme.colors.text}>a</Text> ai assist
          <Text bold color={theme.colors.text}>?</Text> help
        </Text>
      </Box>

      {/* Status Bar */}
      <StatusBar />
    </Box>
  );
}

export default App;
