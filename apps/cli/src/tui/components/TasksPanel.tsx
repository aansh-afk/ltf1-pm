/**
 * Tasks Panel Component
 */

import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../styles/theme.js';

interface Task {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
}

interface TasksPanelProps {
  tasks?: Task[];
  width: number;
}

const defaultTasks: Task[] = [
  { id: 'ICE-234', title: 'Fix auth redirect', priority: 'high', status: 'in_progress' },
  { id: 'ICE-241', title: 'Add dark mode toggle', priority: 'medium', status: 'in_progress' },
  { id: 'ICE-256', title: 'Update API docs', priority: 'low', status: 'done' },
  { id: 'ICE-262', title: 'Refactor user service', priority: 'medium', status: 'todo' },
  { id: 'ICE-270', title: 'Write unit tests', priority: 'low', status: 'todo' },
];

function pad(str: string, len: number): string {
  if (str.length >= len) return str.slice(0, len);
  return str + ' '.repeat(len - str.length);
}

function getStatusIcon(status: Task['status']): string {
  switch (status) {
    case 'done': return '✓';
    case 'in_progress': return '●';
    default: return '○';
  }
}

function getPriorityLabel(priority: Task['priority']): string {
  return priority.toUpperCase();
}

export function TasksPanel({ tasks = defaultTasks, width }: TasksPanelProps) {
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  // Fixed width of 50 characters for consistency
  const w = Math.min(width, 50);
  const inner = w - 2;

  const renderTask = (task: Task) => {
    const icon = getStatusIcon(task.status);
    const pri = getPriorityLabel(task.priority);
    // Format: "● ICE-234 Fix auth redirect      HIGH"
    const prefix = `${icon} ${task.id} `;
    const titleSpace = inner - prefix.length - pri.length - 1;
    const title = task.title.length > titleSpace
      ? task.title.slice(0, titleSpace - 2) + '..'
      : task.title;
    const row = prefix + pad(title, titleSpace) + ' ' + pri;
    return (
      <Text key={task.id} color={theme.colors.border}>
        │<Text color={theme.colors.text}>{pad(row, inner)}</Text>│
      </Text>
    );
  };

  const sectionRow = (label: string) => (
    <Text color={theme.colors.border}>│<Text color={theme.colors.muted}>{pad(label, inner)}</Text>│</Text>
  );

  return (
    <Box flexDirection="column">
      <Text color={theme.colors.border}>{'┌─ MY TASKS ' + '─'.repeat(inner - 11) + '┐'}</Text>

      {inProgressTasks.length > 0 && (
        <>
          {sectionRow('IN PROGRESS')}
          {inProgressTasks.map(renderTask)}
        </>
      )}

      {todoTasks.length > 0 && (
        <>
          {sectionRow('TODO')}
          {todoTasks.map(renderTask)}
        </>
      )}

      {doneTasks.length > 0 && (
        <Text color={theme.colors.border}>│<Text color={theme.colors.dim}>{pad(`${doneTasks.length} completed`, inner)}</Text>│</Text>
      )}

      <Text color={theme.colors.border}>{'└' + '─'.repeat(inner) + '┘'}</Text>
    </Box>
  );
}
