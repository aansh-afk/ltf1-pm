import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useReducedMotion,
  runOnJS,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { formatDistanceToNow, isPast } from "date-fns";
import { BrutalBadge, Avatar } from "../ui";
import { colors } from "../../lib/theme";

const STATUS_COLORS = {
  backlog: "default",
  todo: "cyan",
  in_progress: "accent",
  in_review: "purple",
  done: "green",
  cancelled: "red",
} as const;

const PRIORITY_COLORS = {
  urgent: "red",
  high: "amber",
  medium: "accent",
  low: "default",
} as const;

const TYPE_COLORS = {
  bug: "red",
  feature: "accent",
  task: "default",
  improvement: "purple",
  chore: "default",
} as const;

const SWIPE_THRESHOLD = 100;

interface TaskCardProps {
  task: {
    _id: string;
    title: string;
    status: string;
    priority: string;
    type: string;
    assignees?: Array<{ name: string; imageUrl?: string }>;
    dueDate?: number;
  };
  onPress: () => void;
  onMarkDone?: () => void;
  onDelete?: () => void;
}

export default function TaskCard({
  task,
  onPress,
  onMarkDone,
  onDelete,
}: TaskCardProps) {
  const translateX = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  const triggerMarkDone = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onMarkDone?.();
  };

  const triggerDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete?.();
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD && onMarkDone) {
        runOnJS(triggerMarkDone)();
      } else if (event.translationX < -SWIPE_THRESHOLD && onDelete) {
        runOnJS(triggerDelete)();
      }
      translateX.value = withTiming(0, { duration: 200 });
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftActionStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 40 ? withTiming(1) : withTiming(0),
  }));

  const rightActionStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -40 ? withTiming(1) : withTiming(0),
  }));

  const priorityColor =
    PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] ?? "default";
  const typeColor =
    TYPE_COLORS[task.type as keyof typeof TYPE_COLORS] ?? "default";

  const isOverdue = task.dueDate ? isPast(new Date(task.dueDate)) : false;
  const dueDateText = task.dueDate
    ? formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })
    : null;

  const assignees = task.assignees ?? [];
  const visibleAssignees = assignees.slice(0, 3);
  const extraCount = assignees.length - 3;

  return (
    <View className="mb-2 overflow-hidden rounded-lg">
      {/* Swipe action backgrounds */}
      <Animated.View
        className="absolute inset-0 items-start justify-center rounded-lg pl-4"
        style={[{ backgroundColor: colors.semantic.green }, leftActionStyle]}
      >
        <Text className="font-mono text-sm font-semibold text-white">
          DONE
        </Text>
      </Animated.View>
      <Animated.View
        className="absolute inset-0 items-end justify-center rounded-lg pr-4"
        style={[{ backgroundColor: colors.semantic.red }, rightActionStyle]}
      >
        <Text className="font-mono text-sm font-semibold text-white">
          DELETE
        </Text>
      </Animated.View>

      {/* Card content */}
      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={reducedMotion ? undefined : cardStyle}>
          <Pressable
            className="bg-card border border-default rounded-lg p-3"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPress();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Task: ${task.title}, Priority: ${task.priority}, Status: ${task.status}`}
          >
            {/* Row 1: Priority badge, title, due date */}
            <View className="flex-row items-center gap-2">
              <BrutalBadge
                label={task.priority}
                color={priorityColor}
                size="sm"
              />
              <Text
                className="flex-1 font-inter text-base text-primary"
                numberOfLines={1}
              >
                {task.title}
              </Text>
              {dueDateText && (
                <Text
                  className="font-mono text-xs"
                  style={{
                    color: isOverdue
                      ? colors.semantic.red
                      : colors.text.tertiary,
                  }}
                >
                  {dueDateText}
                </Text>
              )}
            </View>

            {/* Row 2: Type badge, assignee avatars */}
            <View className="flex-row items-center mt-2 gap-2">
              <BrutalBadge label={task.type} color={typeColor} size="sm" />
              {visibleAssignees.length > 0 && (
                <View className="flex-row items-center ml-auto">
                  {visibleAssignees.map((assignee, index) => (
                    <View
                      key={assignee.name + index}
                      style={{ marginLeft: index > 0 ? -8 : 0, zIndex: 3 - index }}
                    >
                      <Avatar
                        name={assignee.name}
                        url={assignee.imageUrl}
                        size="sm"
                      />
                    </View>
                  ))}
                  {extraCount > 0 && (
                    <View
                      className="items-center justify-center rounded-full bg-default"
                      style={{ width: 28, height: 28, marginLeft: -8 }}
                    >
                      <Text className="font-mono text-xs text-secondary">
                        +{extraCount}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
