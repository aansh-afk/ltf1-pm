/**
 * Sidebar - Left navigation panel with 11 nav items
 * Supports keyboard and mouse navigation
 */

import { useRef, useCallback } from 'react';
import { Box, Text, type DOMElement } from 'ink';
import { useOnMouseClick } from '@zenobius/ink-mouse';
import { theme } from '../theme.js';
import type { Page } from '../types.js';

interface NavItem {
  key: Page;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard',     icon: '\u2302', label: 'Dashboard' },
  { key: 'tasks',         icon: '\u2610', label: 'Tasks' },
  { key: 'sprint',        icon: '\u27F3', label: 'Sprint' },
  { key: 'agent',         icon: '\u26A1', label: 'Agent' },
  { key: 'skills',        icon: '\u25C6', label: 'Skills' },
  { key: 'git',           icon: '\u2299', label: 'Git' },
  { key: 'projects',      icon: '\u22B3', label: 'Projects' },
  { key: 'search',        icon: '\uD83D\uDD0D', label: 'Search' },
  { key: 'notifications', icon: '\u2295', label: 'Notifs' },
  { key: 'settings',      icon: '\u2699', label: 'Settings' },
  { key: 'help',          icon: '?',      label: 'Help' },
];

interface SidebarItemProps {
  item: NavItem;
  isActive: boolean;
  badge?: number;
  onNavigate: (page: Page) => void;
}

function SidebarItem({ item, isActive, badge, onNavigate }: SidebarItemProps) {
  const ref = useRef<DOMElement>(null);

  const handleClick = useCallback(
    (clicked: boolean) => {
      if (clicked) onNavigate(item.key);
    },
    [item.key, onNavigate],
  );

  useOnMouseClick(ref, handleClick);

  return (
    <Box ref={ref} paddingX={1}>
      {isActive ? (
        <Text color={theme.accent} bold>
          {item.icon} {item.label}
          {badge && badge > 0 ? ` (${badge})` : ''}
        </Text>
      ) : (
        <Text color={theme.textMuted}>
          {item.icon} {item.label}
          {badge && badge > 0 ? (
            <Text color={theme.amber}> {badge}</Text>
          ) : ''}
        </Text>
      )}
    </Box>
  );
}

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  pendingTriage?: number;
}

export function Sidebar({ activePage, onNavigate, pendingTriage = 0 }: SidebarProps) {
  return (
    <Box
      flexDirection="column"
      width={18}
      borderStyle="single"
      borderRight
      borderTop={false}
      borderBottom={false}
      borderLeft={false}
      borderColor={theme.borderSubtle}
      paddingY={1}
    >
      {NAV_ITEMS.map((item) => (
        <SidebarItem
          key={item.key}
          item={item}
          isActive={activePage === item.key}
          badge={item.key === 'notifications' ? pendingTriage : undefined}
          onNavigate={onNavigate}
        />
      ))}
    </Box>
  );
}
