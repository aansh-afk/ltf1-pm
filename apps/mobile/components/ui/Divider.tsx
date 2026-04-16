import React from "react";
import { View } from "react-native";

const SPACING_MAP = {
  sm: "my-2",
  md: "my-4",
  lg: "my-6",
} as const;

interface DividerProps {
  spacing?: "sm" | "md" | "lg";
}

export default function Divider({ spacing = "md" }: DividerProps) {
  return <View className={`h-px bg-subtle ${SPACING_MAP[spacing]}`} />;
}
