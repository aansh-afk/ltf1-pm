import React from "react";
import { View, Text } from "react-native";

const COLOR_MAP = {
  green: { bg: "bg-success/15", text: "#22C55E" },
  red: { bg: "bg-error/15", text: "#EF4444" },
  amber: { bg: "bg-warning/15", text: "#F59E0B" },
  purple: { bg: "bg-purple/15", text: "#8B5CF6" },
  cyan: { bg: "bg-info/15", text: "#06B6D4" },
  accent: { bg: "bg-accent/15", text: "#6366F1" },
  default: { bg: "bg-default/30", text: "#9CA3AF" },
} as const;

const SIZE_MAP = {
  sm: "px-1.5 py-0.5",
  md: "px-2 py-0.5",
} as const;

const FONT_SIZE_MAP = {
  sm: 10,
  md: 12,
} as const;

interface BrutalBadgeProps {
  label: string;
  color?: keyof typeof COLOR_MAP;
  size?: "sm" | "md";
}

export default function BrutalBadge({
  label,
  color = "default",
  size = "md",
}: BrutalBadgeProps) {
  const colorConfig = COLOR_MAP[color];

  return (
    <View
      className={`${colorConfig.bg} ${SIZE_MAP[size]} rounded items-center justify-center`}
    >
      <Text
        className="font-mono font-semibold uppercase tracking-wider"
        style={{ fontSize: FONT_SIZE_MAP[size], color: colorConfig.text }}
        accessibilityLabel={label}
      >
        {label}
      </Text>
    </View>
  );
}
