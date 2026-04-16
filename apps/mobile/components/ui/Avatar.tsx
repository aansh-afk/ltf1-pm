import React from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";

const SIZE_MAP = {
  sm: { dimension: 28, fontSize: 11 },
  md: { dimension: 36, fontSize: 14 },
  lg: { dimension: 48, fontSize: 18 },
} as const;

const AVATAR_COLORS = [
  "#6366F1",
  "#22C55E",
  "#8B5CF6",
  "#06B6D4",
  "#F59E0B",
  "#EF4444",
] as const;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface AvatarProps {
  url?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}

export default function Avatar({ url, name, size = "md" }: AvatarProps) {
  const { dimension, fontSize } = SIZE_MAP[size];
  const bgColor = getColorFromName(name);

  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: dimension, height: dimension, borderRadius: dimension / 2 }}
        contentFit="cover"
        accessibilityLabel={name}
      />
    );
  }

  return (
    <View
      className="items-center justify-center"
      style={{
        width: dimension,
        height: dimension,
        borderRadius: dimension / 2,
        backgroundColor: bgColor,
      }}
      accessibilityLabel={name}
    >
      <Text
        className="font-inter font-semibold text-primary"
        style={{ fontSize }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}
