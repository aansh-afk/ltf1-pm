import React from "react";
import { View, Text } from "react-native";
import { formatDistanceToNow } from "date-fns";

interface ActivityItemProps {
  activity: {
    _id: string;
    timestamp: number;
    userName: string;
    action: string;
    targetName: string;
  };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toLowerCase() ?? "?";
  return parts[0].toLowerCase();
}

export default function ActivityItem({ activity }: ActivityItemProps) {
  const timeAgo = formatDistanceToNow(new Date(activity.timestamp), {
    addSuffix: false,
  });

  // Shorten to compact form: "2 minutes" -> "2m", "3 hours" -> "3h"
  const shortTime = timeAgo
    .replace(/ minutes?/, "m")
    .replace(/ hours?/, "h")
    .replace(/ days?/, "d")
    .replace(/ seconds?/, "s")
    .replace(/about /, "")
    .replace(/less than /, "<")
    .replace(/over /, ">");

  return (
    <View
      className="flex-row items-center py-2.5 border-b border-subtle"
      accessibilityLabel={`${activity.userName} ${activity.action} ${activity.targetName}, ${timeAgo} ago`}
    >
      {/* Time */}
      <Text
        className="font-mono text-xs text-tertiary"
        style={{ width: 48 }}
        numberOfLines={1}
      >
        {shortTime}
      </Text>

      {/* Separator */}
      <Text className="font-mono text-xs text-default mx-2">|</Text>

      {/* User */}
      <Text className="font-mono text-xs text-secondary" numberOfLines={1}>
        {getInitials(activity.userName)}
      </Text>

      {/* Separator */}
      <Text className="font-mono text-xs text-default mx-2">|</Text>

      {/* Action */}
      <Text className="font-mono text-xs text-tertiary" numberOfLines={1}>
        {activity.action}
      </Text>

      {/* Separator */}
      <Text className="font-mono text-xs text-default mx-2">|</Text>

      {/* Target */}
      <Text
        className="font-mono text-xs text-primary flex-1"
        numberOfLines={1}
      >
        {activity.targetName}
      </Text>
    </View>
  );
}
