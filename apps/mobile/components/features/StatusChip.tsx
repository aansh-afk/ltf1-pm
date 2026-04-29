import React from "react";
import { Text, ScrollView, Pressable } from "react-native";
import * as Haptics from "expo-haptics";

interface StatusChipProps {
  statuses: Array<{ label: string; value: string; count?: number }>;
  activeStatus: string | null;
  onSelect: (value: string | null) => void;
}

export default function StatusChip({
  statuses,
  activeStatus,
  onSelect,
}: StatusChipProps) {
  const handlePress = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Toggle: if already active, deselect
    onSelect(activeStatus === value ? null : value);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
      {statuses.map((status) => {
        const isActive = activeStatus === status.value;

        return (
          <Pressable
            key={status.value}
            className={`rounded-lg px-3 h-8 flex-row items-center justify-center ${
              isActive
                ? "bg-accent"
                : "border border-default"
            }`}
            onPress={() => handlePress(status.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`Filter by ${status.label}${status.count !== undefined ? `, ${status.count} items` : ""}`}
          >
            <Text
              className={`font-mono text-xs uppercase ${
                isActive ? "text-white" : "text-secondary"
              }`}
            >
              {status.label}
            </Text>
            {status.count !== undefined && (
              <Text
                className={`font-mono text-xs ml-1 ${
                  isActive ? "text-white/70" : "text-tertiary"
                }`}
              >
                {status.count}
              </Text>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
