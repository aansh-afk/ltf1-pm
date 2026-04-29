import React from "react";
import { View, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { BrutalCard } from "../ui";

interface WorkspaceCardProps {
  workspace: {
    _id: string;
    name: string;
    projectCount: number;
    memberCount: number;
  };
  onPress: () => void;
}

export default function WorkspaceCard({
  workspace,
  onPress,
}: WorkspaceCardProps) {
  return (
    <BrutalCard
      variant="default"
      padding="md"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`Workspace: ${workspace.name}, ${workspace.projectCount} projects, ${workspace.memberCount} members`}
    >
      {/* Workspace name */}
      <Text className="font-inter text-base font-semibold text-primary">
        {workspace.name}
      </Text>

      {/* Stats row */}
      <View className="flex-row items-center mt-2 gap-4">
        <View className="flex-row items-center gap-1">
          <Text className="font-mono text-xs uppercase tracking-wider text-tertiary">
            Projects
          </Text>
          <Text className="font-mono text-xs font-semibold text-secondary">
            {workspace.projectCount}
          </Text>
        </View>

        <View className="flex-row items-center gap-1">
          <Text className="font-mono text-xs uppercase tracking-wider text-tertiary">
            Members
          </Text>
          <Text className="font-mono text-xs font-semibold text-secondary">
            {workspace.memberCount}
          </Text>
        </View>
      </View>
    </BrutalCard>
  );
}
