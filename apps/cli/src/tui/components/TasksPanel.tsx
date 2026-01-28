/**
 * Tasks Panel Component
 */

import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../styles/theme.js';
import { BorderBox } from './BorderBox.js';

interface Task {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
}

interface TasksPanelProps {
  tasks?: Task[];
}

const defaultTasks: Task[] = [
  { id: 'ICE-234', title: 'Fix auth redirect', priority: 'high', status: 'in_progress' },
  { id: 'ICE-241', title: 'Add dark mode toggle', priority: 'medium', status: 'in_progress' },
  { id: 'ICE-256', title: 'Update API docs', priority: 'low', status: 'done' },
  { id: 'ICE-262', title: 'Refactor user service', priority: 'medium', status: 'todo' },
  { id: 'ICE-270', title: 'Write unit tests', priority: 'low', status: 'todo' },
];

function getStatusIcon(status: Task['status']): string {
  switch (status) {
    case 'done':
      return theme.icons.done;
    case 'in_progress':
      return theme.icons.inProgress;
    default:
      return theme.icons.todo;
  }
}

function getStatusColor(status: Task['status']): string {
  switch (status) {
    case 'done':
      return theme.colors.success;
    case 'in_progress':
      return theme.colors.warning;
    default:
      return theme.colors.muted;
  }
}

function getPriorityColor(priority: Task['priority']): string {
  switch (priority) {
    case 'high':
      return theme.colors.high;
    case 'medium':
      return theme.colors.medium;
    default:
      return theme.colors.low;
  }
}

function getPriorityLabel(priority: Task['priority']): string {
  return priority.toUpperCase();
}

export function TasksPanel({ tasks = defaultTasks }: TasksPanelProps) {
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  return (
    <BorderBox title="MY TASKS" width={60}>
      <Box flexDirection="column" paddingX={1}>
        {/* In Progress Section */}
        {inProgressTasks.length > 0 && (
          <>
            <Text color={theme.colors.muted} bold>
              IN PROGRESS
            </Text>
            {inProgressTasks.map((task) => (
              <Box key={task.id} justifyContent="space-between">
                <Box>
                  <Text color={getStatusColor(task.status)}>
                    {getStatusIcon(task.status)}{' '}
                  </Text>
                  <Text color={theme.colors.primary}>{task.id}</Text>
                  <Text color={theme.colors.text}>  {task.title}</Text>
                </Box>
                <Text color={getPriorityColor(task.priority)}>
                  {getPriorityLabel(task.priority)}
                </Text>
              </Box>
            ))}
          </>
        )}

        {/* Todo Section */}
        {todoTasks.length > 0 && (
          <>
            <Box marginTop={1}>
              <Text color={theme.colors.muted} bold>
                TODO
              </Text>
            </Box>
            {todoTasks.map((task) => (
              <Box key={task.id} justifyContent="space-between">
                <Box>
                  <Text color={getStatusColor(task.status)}>
                    {getStatusIcon(task.status)}{' '}
                  </Text>
                  <Text color={theme.colors.primary}>{task.id}</Text>
                  <Text color={theme.colors.text}>  {task.title}</Text>
                </Box>
                <Text color={getPriorityColor(task.priority)}>
                  {getPriorityLabel(task.priority)}
                </Text>
              </Box>
            ))}
          </>
        )}

        {/* Done Section (collapsed) */}
        {doneTasks.length > 0 && (
          <Box marginTop={1}>
            <Text color={theme.colors.dim}>
              {doneTasks.length} completed tasks (press 'd' to show)
            </Text>
          </Box>
        )}
      </Box>
    </BorderBox>
  );
}
