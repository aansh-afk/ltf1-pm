import React from "react";
import { View, Text } from "react-native";
import { BrutalCard } from "../ui";
import { colors } from "../../lib/theme";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  color = colors.accent.default,
}: StatCardProps) {
  return (
    <BrutalCard variant="default" padding="md">
      <View className="flex-row items-start gap-3">
        {icon && (
          <View
            className="items-center justify-center"
            style={{ width: 20, height: 20 }}
            accessibilityLabel={label}
          >
            {React.isValidElement(icon)
              ? React.cloneElement(icon as React.ReactElement<{ color?: string; size?: number }>, {
                  color,
                  size: 20,
                })
              : icon}
          </View>
        )}
        <View className="flex-1">
          <Text className="font-mono text-xs uppercase tracking-wider text-secondary">
            {label}
          </Text>
          <Text
            className="font-inter text-2xl font-bold text-primary mt-1"
            accessibilityLabel={`${label}: ${value}`}
          >
            {value}
          </Text>
        </View>
      </View>
    </BrutalCard>
  );
}
