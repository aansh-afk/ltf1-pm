import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Alert, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import Animated, { FadeInUp, useReducedMotion } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  ArrowLeft,
  MoreHorizontal,
  Calendar,
  Users,
  Tag,
  Clock,
  Target,
  FileText,
} from "lucide-react-native";
import {
  BrutalButton,
  BrutalCard,
  BrutalBadge,
  Avatar,
  Divider,
  OfflineBanner,
  Skeleton,
} from "../../components/ui";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { formatDate, formatDuration, isOverdue } from "../../lib/utils";

const STATUSES = [
  { label: "Backlog", value: "backlog" as const },
  { label: "Todo", value: "todo" as const },
  { label: "In Progress", value: "in_progress" as const },
  { label: "In Review", value: "in_review" as const },
  { label: "Done", value: "done" as const },
  { label: "Cancelled", value: "cancelled" as const },
] as const;

const PRIORITIES = [
  { label: "Urgent", value: "urgent" as const },
  { label: "High", value: "high" as const },
  { label: "Medium", value: "medium" as const },
  { label: "Low", value: "low" as const },
] as const;

const STATUS_COLORS: Record<string, "default" | "cyan" | "accent" | "purple" | "green" | "red"> = {
  backlog: "default",
  todo: "cyan",
  in_progress: "accent",
  in_review: "purple",
  done: "green",
  cancelled: "red",
};

const PRIORITY_COLORS: Record<string, "red" | "amber" | "accent" | "default"> = {
  urgent: "red",
  high: "amber",
  medium: "accent",
  low: "default",
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const reducedMotion = useReducedMotion();
  const [isDeleting, setIsDeleting] = useState(false);

  const taskId = id as Id<"tasks">;
  const task = useQuery(api.tasks.queries.getTask, { taskId });
  const updateTask = useMutation(api.tasks.mutations.updateTask);
  const deleteTask = useMutation(api.tasks.mutations.deleteTask);

  const handleStatusChange = useCallback(
    async (status: string) => {
      if (!task) return;
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await updateTask({ taskId, status: status as any });
        if (status === "done") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch {
        Alert.alert("Error", "Failed to update status. Check your connection.");
      }
    },
    [task, taskId, updateTask],
  );

  const handlePriorityChange = useCallback(
    async (priority: string) => {
      if (!task) return;
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await updateTask({ taskId, priority: priority as any });
      } catch {
        Alert.alert("Error", "Failed to update priority. Check your connection.");
      }
    },
    [task, taskId, updateTask],
  );

  const handleMarkDone = useCallback(async () => {
    if (!task) return;
    try {
      await updateTask({ taskId, status: "done" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to mark as done. Check your connection.");
    }
  }, [task, taskId, updateTask, router]);

  const handleDelete = useCallback(() => {
    if (!task) return;
    const taskLabel = task.project?.key
      ? `${task.project.key}-${task.number}`
      : `Task #${task.number}`;

    Alert.alert(
      "Delete Task",
      `Are you sure you want to delete ${taskLabel}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await deleteTask({ taskId });
              router.back();
            } catch {
              setIsDeleting(false);
              Alert.alert("Error", "Failed to delete task. Try again.");
            }
          },
        },
      ],
    );
  }, [task, taskId, deleteTask, router]);

  // Task deleted while viewing
  if (task === null) {
    router.back();
    return null;
  }

  // Loading state
  if (task === undefined) {
    return (
      <SafeAreaView className="flex-1 bg-base">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center px-4 h-14">
          <Pressable
            hitSlop={12}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={24} color="#F9FAFB" />
          </Pressable>
          <View className="flex-1 ml-3">
            <Skeleton width={100} height={18} rounded="sm" />
          </View>
        </View>
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pt-2 pb-6 gap-6"
        >
          <Skeleton width="80%" height={28} rounded="md" />
          <Skeleton width="100%" height={14} rounded="sm" />
          <View className="flex-row flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} width={72} height={32} rounded="md" />
            ))}
          </View>
          <Divider />
          <Skeleton width="100%" height={80} rounded="md" />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const taskLabel = task.project?.key
    ? `${task.project.key}-${task.number}`
    : `#${task.number}`;
  const assignees = task.assignees ?? [];
  const labels = task.labels ?? [];
  const dueDateOverdue = task.dueDate ? isOverdue(task.dueDate) : false;
  const estimatePoints = task.estimate?.points;
  const estimateHours = task.estimate?.hours;

  return (
    <SafeAreaView className="flex-1 bg-base">
      <Stack.Screen options={{ headerShown: false }} />
      <OfflineBanner isOffline={!isOnline} />

      {/* Header */}
      <View className="flex-row items-center px-4 h-14 justify-between">
        <View className="flex-row items-center">
          <Pressable
            hitSlop={12}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={24} color="#F9FAFB" />
          </Pressable>
          <Text className="font-mono text-[13px] font-normal text-accent ml-3">
            {taskLabel}
          </Text>
        </View>
        <Pressable
          hitSlop={12}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <MoreHorizontal size={24} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-2 pb-6 gap-6"
      >
        {/* Title */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.duration(300)}
        >
          <Text
            className="font-inter text-[22px] font-bold text-primary leading-[28px]"
            accessibilityRole="header"
          >
            {task.title}
          </Text>
        </Animated.View>

        {/* Status Chips */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.duration(300).delay(50)}
        >
          <Text className="font-mono text-[11px] font-semibold uppercase tracking-wider text-tertiary mb-2">
            Status
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {STATUSES.map((s) => {
              const isActive = task.status === s.value;
              const color = STATUS_COLORS[s.value] ?? "default";
              return (
                <Pressable
                  key={s.value}
                  onPress={() => handleStatusChange(s.value)}
                  disabled={!isOnline}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`Status: ${s.label}`}
                  style={!isOnline ? { opacity: 0.5 } : undefined}
                >
                  <BrutalBadge
                    label={s.label}
                    color={isActive ? color : "default"}
                    size="md"
                  />
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Priority Chips */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.duration(300).delay(100)}
        >
          <Text className="font-mono text-[11px] font-semibold uppercase tracking-wider text-tertiary mb-2">
            Priority
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {PRIORITIES.map((p) => {
              const isActive = task.priority === p.value;
              const color = PRIORITY_COLORS[p.value] ?? "default";
              return (
                <Pressable
                  key={p.value}
                  onPress={() => handlePriorityChange(p.value)}
                  disabled={!isOnline}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`Priority: ${p.label}`}
                  style={!isOnline ? { opacity: 0.5 } : undefined}
                >
                  <BrutalBadge
                    label={p.label}
                    color={isActive ? color : "default"}
                    size="md"
                  />
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Type */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.duration(300).delay(150)}
        >
          <Text className="font-mono text-[11px] font-semibold uppercase tracking-wider text-tertiary mb-2">
            Type
          </Text>
          <BrutalBadge label={task.type} color="accent" size="md" />
        </Animated.View>

        {/* Assignees */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.duration(300).delay(200)}
        >
          <View className="flex-row items-center gap-1.5 mb-2">
            <Users size={14} color="#6B7280" />
            <Text className="font-mono text-[11px] font-semibold uppercase tracking-wider text-tertiary">
              Assignees
            </Text>
          </View>
          {assignees.length > 0 ? (
            <View className="flex-row items-center gap-2 flex-wrap">
              {assignees.map((assignee: any) => (
                <View key={assignee._id} className="flex-row items-center gap-2">
                  <Avatar
                    name={assignee.name ?? "Unknown"}
                    url={assignee.imageUrl}
                    size="sm"
                  />
                  <Text className="font-inter text-[14px] text-secondary">
                    {assignee.name ?? "Unknown"}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="font-inter text-[14px] text-tertiary">
              Unassigned
            </Text>
          )}
        </Animated.View>

        {/* Due Date */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.duration(300).delay(250)}
        >
          <View className="flex-row items-center gap-1.5 mb-2">
            <Calendar size={14} color="#6B7280" />
            <Text className="font-mono text-[11px] font-semibold uppercase tracking-wider text-tertiary">
              Due Date
            </Text>
          </View>
          {task.dueDate ? (
            <Text
              className="font-inter text-[14px]"
              style={{ color: dueDateOverdue ? "#EF4444" : "#9CA3AF" }}
            >
              {formatDate(task.dueDate)}
              {dueDateOverdue ? " (Overdue)" : ""}
            </Text>
          ) : (
            <Text className="font-inter text-[14px] text-tertiary">
              No due date
            </Text>
          )}
        </Animated.View>

        {/* Labels */}
        {labels.length > 0 && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInUp.duration(300).delay(300)}
          >
            <View className="flex-row items-center gap-1.5 mb-2">
              <Tag size={14} color="#6B7280" />
              <Text className="font-mono text-[11px] font-semibold uppercase tracking-wider text-tertiary">
                Labels
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {labels.map((label: string) => (
                <BrutalBadge key={label} label={label} color="accent" size="sm" />
              ))}
            </View>
          </Animated.View>
        )}

        {/* Description */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.duration(300).delay(350)}
        >
          <View className="flex-row items-center gap-1.5 mb-2">
            <FileText size={14} color="#6B7280" />
            <Text className="font-mono text-[11px] font-semibold uppercase tracking-wider text-tertiary">
              Description
            </Text>
          </View>
          <BrutalCard padding="md">
            <Text className="font-inter text-[14px] leading-[20px] text-secondary">
              {task.description || "No description"}
            </Text>
          </BrutalCard>
        </Animated.View>

        {/* Time Tracked */}
        {task.timeTracked != null && task.timeTracked > 0 && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInUp.duration(300).delay(400)}
          >
            <View className="flex-row items-center gap-1.5 mb-2">
              <Clock size={14} color="#6B7280" />
              <Text className="font-mono text-[11px] font-semibold uppercase tracking-wider text-tertiary">
                Time Tracked
              </Text>
            </View>
            <Text className="font-inter text-[14px] text-secondary">
              {formatDuration(task.timeTracked)}
            </Text>
          </Animated.View>
        )}

        {/* Estimate */}
        {(estimatePoints != null || estimateHours != null) && (
          <Animated.View
            entering={reducedMotion ? undefined : FadeInUp.duration(300).delay(450)}
          >
            <View className="flex-row items-center gap-1.5 mb-2">
              <Target size={14} color="#6B7280" />
              <Text className="font-mono text-[11px] font-semibold uppercase tracking-wider text-tertiary">
                Estimate
              </Text>
            </View>
            <Text className="font-inter text-[14px] text-secondary">
              {[
                estimatePoints != null ? `${estimatePoints} points` : null,
                estimateHours != null ? `${estimateHours} hours` : null,
              ]
                .filter(Boolean)
                .join("  \u00B7  ")}
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="px-4 pb-4 pt-2 border-t border-subtle flex-row gap-3">
        {task.status !== "done" ? (
          <View className="flex-1">
            <BrutalButton
              variant="primary"
              size="lg"
              label="Mark Done"
              onPress={handleMarkDone}
              disabled={!isOnline}
            />
          </View>
        ) : null}
        <View className={task.status !== "done" ? "flex-1" : "flex-1"}>
          <BrutalButton
            variant="danger"
            size="lg"
            label="Delete"
            onPress={handleDelete}
            loading={isDeleting}
            disabled={!isOnline || isDeleting}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
