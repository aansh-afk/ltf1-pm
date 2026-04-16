import React from "react";
import { View, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { BrutalCard, BrutalBadge } from "../ui";
import { colors } from "../../lib/theme";

const STATUS_BADGE_COLORS = {
  active: "green",
  paused: "amber",
  completed: "accent",
  archived: "default",
} as const;

interface ProjectCardProps {
  project: {
    _id: string;
    key: string;
    name: string;
    status: string;
    taskCount: number;
    completedCount: number;
  };
  onPress: () => void;
}

export default function ProjectCard({ project, onPress }: ProjectCardProps) {
  const progress =
    project.taskCount > 0
      ? (project.completedCount / project.taskCount) * 100
      : 0;

  const badgeColor =
    STATUS_BADGE_COLORS[project.status as keyof typeof STATUS_BADGE_COLORS] ??
    "default";

  return (
    <BrutalCard
      variant="default"
      padding="md"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`Project: ${project.name}, ${project.completedCount} of ${project.taskCount} tasks complete`}
    >
      {/* Row 1: Key + Status badge */}
      <View className="flex-row items-center justify-between">
        <Text className="font-mono text-xs uppercase tracking-wider text-accent">
          {project.key}
        </Text>
        <BrutalBadge label={project.status} color={badgeColor} size="sm" />
      </View>

      {/* Project name */}
      <Text
        className="font-inter text-base font-semibold text-primary mt-1"
        numberOfLines={2}
      >
        {project.name}
      </Text>

      {/* Progress bar */}
      <View className="h-1.5 bg-default rounded-full mt-3">
        <View
          className="h-1.5 bg-accent rounded-full"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </View>

      {/* Task count */}
      <Text className="font-mono text-xs text-tertiary mt-1">
        {project.completedCount}/{project.taskCount} tasks
      </Text>
    </BrutalCard>
  );
}
