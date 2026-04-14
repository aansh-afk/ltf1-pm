import React from "react";
import { View, Text } from "react-native";
import BrutalButton from "./BrutalButton";

interface EmptyStateProps {
  icon?: React.ReactNode;
  heading: string;
  description: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

export default function EmptyState({
  icon,
  heading,
  description,
  ctaLabel,
  onCtaPress,
}: EmptyStateProps) {
  return (
    <View className="border border-dashed border-default rounded-lg p-8 items-center justify-center">
      {icon && <View className="mb-4">{icon}</View>}
      <Text className="text-primary font-inter text-base font-semibold text-center">
        {heading}
      </Text>
      <Text
        className="text-secondary font-inter text-sm text-center mt-2"
        style={{ maxWidth: 260 }}
      >
        {description}
      </Text>
      {ctaLabel && onCtaPress && (
        <View className="mt-4">
          <BrutalButton
            variant="secondary"
            size="sm"
            label={ctaLabel}
            onPress={onCtaPress}
          />
        </View>
      )}
    </View>
  );
}
