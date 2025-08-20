import type { Shortcut, ShortcutGroup } from '../types/shortcuts'

// Helper to detect platform
export const getPlatform = () => {
  // Check if we're in a browser environment
  if (typeof navigator === 'undefined') {
    return {
      isMac: false,
      isWindows: false,
      isLinux: false,
      modifierKey: 'ctrl' as const,
      modifierSymbol: 'Ctrl'
    }
  }
  
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const isWindows = navigator.platform.toUpperCase().indexOf('WIN') >= 0
  const isLinux = navigator.platform.toUpperCase().indexOf('LINUX') >= 0
  
  return {
    isMac,
    isWindows,
    isLinux,
    modifierKey: isMac ? 'cmd' as const : 'ctrl' as const,
    modifierSymbol: isMac ? '⌘' : 'Ctrl'
  }
}

// Don't call getPlatform at module initialization time
// Instead, use a getter function
const getPlatformSafe = () => {
  if (typeof navigator === 'undefined') {
    return { isMac: false, modifierSymbol: 'Ctrl' }
  }
  return getPlatform()
}

const platform = getPlatformSafe()
const mod = platform.isMac ? 'meta' as const : 'ctrl' as const

// Navigation shortcuts
export const navigationShortcuts: Shortcut[] = [
  {
    id: 'nav.dashboard',
    name: 'Go to Dashboard',
    description: 'Navigate to the dashboard',
    category: 'navigation',
    defaultKeys: { modifiers: [mod], key: 'd', display: `${platform.modifierSymbol}+D` },
    enabled: true,
    context: 'global',
    command: '/dashboard',
    preventInInput: true
  },
  {
    id: 'nav.projects',
    name: 'Go to Projects',
    description: 'Navigate to projects page',
    category: 'navigation',
    defaultKeys: { modifiers: [mod], key: 'p', display: `${platform.modifierSymbol}+P` },
    enabled: true,
    context: 'global',
    command: '/projects',
    preventInInput: true
  },
  {
    id: 'nav.tasks',
    name: 'Go to Tasks',
    description: 'Navigate to tasks page',
    category: 'navigation',
    defaultKeys: { modifiers: [mod], key: 't', display: `${platform.modifierSymbol}+T` },
    enabled: true,
    context: 'global',
    command: '/tasks',
    preventInInput: true
  },
  {
    id: 'nav.meetings',
    name: 'Go to Meetings',
    description: 'Navigate to meetings page',
    category: 'navigation',
    defaultKeys: { modifiers: [mod], key: 'm', display: `${platform.modifierSymbol}+M` },
    enabled: true,
    context: 'global',
    command: '/meetings',
    preventInInput: true
  },
  {
    id: 'nav.team',
    name: 'Go to Team',
    description: 'Navigate to team page',
    category: 'navigation',
    defaultKeys: { modifiers: [mod], key: 'u', display: `${platform.modifierSymbol}+U` },
    enabled: true,
    context: 'global',
    command: '/team',
    preventInInput: true
  },
  {
    id: 'nav.settings',
    name: 'Go to Settings',
    description: 'Open settings page',
    category: 'navigation',
    defaultKeys: { modifiers: [mod], key: ',', display: `${platform.modifierSymbol}+,` },
    enabled: true,
    context: 'global',
    command: '/settings',
    preventInInput: true
  },
  {
    id: 'nav.search',
    name: 'Search',
    description: 'Open search dialog',
    category: 'navigation',
    defaultKeys: { modifiers: [mod], key: '/', display: `${platform.modifierSymbol}+/` },
    enabled: true,
    context: 'global',
    command: 'search',
    preventInInput: true
  }
]

// Quick action shortcuts
export const quickActionShortcuts: Shortcut[] = [
  {
    id: 'action.commandPalette',
    name: 'Command Palette',
    description: 'Open command palette',
    category: 'quick-actions',
    defaultKeys: { modifiers: [mod], key: 'k', display: `${platform.modifierSymbol}+K` },
    enabled: true,
    context: 'global',
    command: 'commandPalette',
    preventInInput: true,
    global: true
  },
  {
    id: 'action.terminal',
    name: 'Open Terminal',
    description: 'Open command terminal',
    category: 'quick-actions',
    defaultKeys: { modifiers: [mod], key: '`', display: `${platform.modifierSymbol}+\`` },
    enabled: true,
    context: 'global',
    command: 'terminal',
    preventInInput: true,
    global: true
  },
  {
    id: 'action.newTask',
    name: 'New Task',
    description: 'Create a new task',
    category: 'quick-actions',
    defaultKeys: { modifiers: [mod], key: 'n', display: `${platform.modifierSymbol}+N` },
    enabled: true,
    context: 'global',
    command: 'newTask',
    preventInInput: true
  },
  {
    id: 'action.newProject',
    name: 'New Project',
    description: 'Create a new project',
    category: 'quick-actions',
    defaultKeys: { modifiers: [mod, 'shift'], key: 'p', display: `${platform.modifierSymbol}+Shift+P` },
    enabled: true,
    context: 'global',
    command: 'newProject',
    preventInInput: true
  },
  {
    id: 'action.newMeeting',
    name: 'New Meeting',
    description: 'Schedule a new meeting',
    category: 'quick-actions',
    defaultKeys: { modifiers: [mod, 'shift'], key: 'm', display: `${platform.modifierSymbol}+Shift+M` },
    enabled: true,
    context: 'global',
    command: 'newMeeting',
    preventInInput: true
  },
  {
    id: 'action.inviteMember',
    name: 'Invite Member',
    description: 'Invite a team member',
    category: 'quick-actions',
    defaultKeys: { modifiers: [mod], key: 'i', display: `${platform.modifierSymbol}+I` },
    enabled: true,
    context: 'global',
    command: 'inviteMember',
    preventInInput: true
  },
  {
    id: 'action.switchWorkspace',
    name: 'Switch Workspace',
    description: 'Switch between workspaces',
    category: 'quick-actions',
    defaultKeys: { modifiers: [mod], key: 'w', display: `${platform.modifierSymbol}+W` },
    enabled: true,
    context: 'global',
    command: 'switchWorkspace',
    preventInInput: true
  }
]

// Task operation shortcuts
export const taskShortcuts: Shortcut[] = [
  {
    id: 'task.toggleComplete',
    name: 'Toggle Complete',
    description: 'Mark task as complete/incomplete',
    category: 'task-operations',
    defaultKeys: { modifiers: [], key: ' ', display: 'Space' },
    enabled: true,
    context: 'task',
    command: 'toggleTaskComplete',
    preventInInput: true
  },
  {
    id: 'task.edit',
    name: 'Edit Task',
    description: 'Edit selected task',
    category: 'task-operations',
    defaultKeys: { modifiers: [], key: 'e', display: 'E' },
    enabled: true,
    context: 'task',
    command: 'editTask',
    preventInInput: true
  },
  {
    id: 'task.delete',
    name: 'Delete Task',
    description: 'Delete selected task',
    category: 'task-operations',
    defaultKeys: { modifiers: [], key: 'Delete', display: 'Del' },
    enabled: true,
    context: 'task',
    command: 'deleteTask',
    preventInInput: true
  },
  {
    id: 'task.assignToMe',
    name: 'Assign to Me',
    description: 'Assign task to yourself',
    category: 'task-operations',
    defaultKeys: { modifiers: [], key: 'a', display: 'A' },
    enabled: true,
    context: 'task',
    command: 'assignTaskToMe',
    preventInInput: true
  },
  {
    id: 'task.setPriority1',
    name: 'Set Priority Urgent',
    description: 'Set task priority to urgent',
    category: 'task-operations',
    defaultKeys: { modifiers: [], key: '1', display: '1' },
    enabled: true,
    context: 'task',
    command: 'setPriorityUrgent',
    preventInInput: true
  },
  {
    id: 'task.setPriority2',
    name: 'Set Priority High',
    description: 'Set task priority to high',
    category: 'task-operations',
    defaultKeys: { modifiers: [], key: '2', display: '2' },
    enabled: true,
    context: 'task',
    command: 'setPriorityHigh',
    preventInInput: true
  },
  {
    id: 'task.setPriority3',
    name: 'Set Priority Medium',
    description: 'Set task priority to medium',
    category: 'task-operations',
    defaultKeys: { modifiers: [], key: '3', display: '3' },
    enabled: true,
    context: 'task',
    command: 'setPriorityMedium',
    preventInInput: true
  },
  {
    id: 'task.setPriority4',
    name: 'Set Priority Low',
    description: 'Set task priority to low',
    category: 'task-operations',
    defaultKeys: { modifiers: [], key: '4', display: '4' },
    enabled: true,
    context: 'task',
    command: 'setPriorityLow',
    preventInInput: true
  },
  {
    id: 'task.addLabel',
    name: 'Add Label',
    description: 'Add label to task',
    category: 'task-operations',
    defaultKeys: { modifiers: [], key: 'l', display: 'L' },
    enabled: true,
    context: 'task',
    command: 'addTaskLabel',
    preventInInput: true
  },
  {
    id: 'task.setDueDate',
    name: 'Set Due Date',
    description: 'Set task due date',
    category: 'task-operations',
    defaultKeys: { modifiers: [], key: 'd', display: 'D' },
    enabled: true,
    context: 'task',
    command: 'setTaskDueDate',
    preventInInput: true
  }
]

// Meeting operation shortcuts
export const meetingShortcuts: Shortcut[] = [
  {
    id: 'meeting.toggleCalendarView',
    name: 'Toggle Calendar View',
    description: 'Switch between month/week/day view',
    category: 'meeting-operations',
    defaultKeys: { modifiers: [], key: 'c', display: 'C' },
    enabled: true,
    context: 'meeting',
    command: 'toggleCalendarView',
    preventInInput: true
  },
  {
    id: 'meeting.today',
    name: 'Go to Today',
    description: 'Navigate to today in calendar',
    category: 'meeting-operations',
    defaultKeys: { modifiers: [], key: 't', display: 'T' },
    enabled: true,
    context: 'meeting',
    command: 'calendarToday',
    preventInInput: true
  },
  {
    id: 'meeting.next',
    name: 'Next Period',
    description: 'Go to next month/week/day',
    category: 'meeting-operations',
    defaultKeys: { modifiers: [], key: 'n', display: 'N' },
    enabled: true,
    context: 'meeting',
    command: 'calendarNext',
    preventInInput: true
  },
  {
    id: 'meeting.previous',
    name: 'Previous Period',
    description: 'Go to previous month/week/day',
    category: 'meeting-operations',
    defaultKeys: { modifiers: [], key: 'p', display: 'P' },
    enabled: true,
    context: 'meeting',
    command: 'calendarPrevious',
    preventInInput: true
  },
  {
    id: 'meeting.join',
    name: 'Join Meeting',
    description: 'Join selected meeting',
    category: 'meeting-operations',
    defaultKeys: { modifiers: [mod], key: 'j', display: `${platform.modifierSymbol}+J` },
    enabled: true,
    context: 'meeting',
    command: 'joinMeeting',
    preventInInput: true
  },
  {
    id: 'meeting.rsvp',
    name: 'RSVP to Meeting',
    description: 'Respond to meeting invitation',
    category: 'meeting-operations',
    defaultKeys: { modifiers: [], key: 'r', display: 'R' },
    enabled: true,
    context: 'meeting',
    command: 'rsvpMeeting',
    preventInInput: true
  }
]

// General shortcuts
export const generalShortcuts: Shortcut[] = [
  {
    id: 'general.help',
    name: 'Show Help',
    description: 'Show keyboard shortcuts help',
    category: 'general',
    defaultKeys: { modifiers: ['shift'], key: '?', display: '?' },
    enabled: true,
    context: 'global',
    command: 'showHelp',
    preventInInput: true,
    global: true
  },
  {
    id: 'general.escape',
    name: 'Close/Cancel',
    description: 'Close modal or cancel action',
    category: 'general',
    defaultKeys: { modifiers: [], key: 'Escape', display: 'Esc' },
    enabled: true,
    context: 'global',
    command: 'escape',
    preventInInput: false,
    global: true
  },
  {
    id: 'general.save',
    name: 'Save',
    description: 'Save current changes',
    category: 'general',
    defaultKeys: { modifiers: [mod], key: 's', display: `${platform.modifierSymbol}+S` },
    enabled: true,
    context: 'global',
    command: 'save',
    preventInInput: false
  },
  {
    id: 'general.undo',
    name: 'Undo',
    description: 'Undo last action',
    category: 'general',
    defaultKeys: { modifiers: [mod], key: 'z', display: `${platform.modifierSymbol}+Z` },
    enabled: true,
    context: 'global',
    command: 'undo',
    preventInInput: false
  },
  {
    id: 'general.redo',
    name: 'Redo',
    description: 'Redo last action',
    category: 'general',
    defaultKeys: { modifiers: [mod, 'shift'], key: 'z', display: `${platform.modifierSymbol}+Shift+Z` },
    enabled: true,
    context: 'global',
    command: 'redo',
    preventInInput: false
  },
  {
    id: 'general.toggleSidebar',
    name: 'Toggle Sidebar',
    description: 'Show/hide sidebar',
    category: 'general',
    defaultKeys: { modifiers: [mod], key: 'b', display: `${platform.modifierSymbol}+B` },
    enabled: true,
    context: 'global',
    command: 'toggleSidebar',
    preventInInput: true
  }
]

// All default shortcuts
export const defaultShortcuts: Shortcut[] = [
  ...navigationShortcuts,
  ...quickActionShortcuts,
  ...taskShortcuts,
  ...meetingShortcuts,
  ...generalShortcuts
]

// Grouped shortcuts for display
export const defaultShortcutGroups: ShortcutGroup[] = [
  {
    id: 'navigation',
    name: 'Navigation',
    category: 'navigation',
    shortcuts: navigationShortcuts,
    description: 'Navigate between different sections of the app'
  },
  {
    id: 'quick-actions',
    name: 'Quick Actions',
    category: 'quick-actions',
    shortcuts: quickActionShortcuts,
    description: 'Quickly perform common actions'
  },
  {
    id: 'task-operations',
    name: 'Task Operations',
    category: 'task-operations',
    shortcuts: taskShortcuts,
    description: 'Keyboard shortcuts for managing tasks'
  },
  {
    id: 'meeting-operations',
    name: 'Meeting Operations',
    category: 'meeting-operations',
    shortcuts: meetingShortcuts,
    description: 'Keyboard shortcuts for meetings and calendar'
  },
  {
    id: 'general',
    name: 'General',
    category: 'general',
    shortcuts: generalShortcuts,
    description: 'General application shortcuts'
  }
]

// Export preset themes
export const shortcutThemes = {
  default: defaultShortcuts,
  vim: [
    // Add vim-style shortcuts here
    // j/k for navigation, dd for delete, etc.
  ],
  emacs: [
    // Add emacs-style shortcuts here
    // C-x C-s for save, etc.
  ]
}