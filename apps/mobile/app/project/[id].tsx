import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ChevronDown, ChevronRight } from "lucide-react-native";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { Skeleton, EmptyState, FAB, BrutalBadge, Avatar } from "../../components/ui";
import { TaskCard } from "../../components/features";
import { colors } from "../../lib/theme";

const STATUS_GROUP_ORDER = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "cancelled",
] as const;

const STATUS_DISPLAY: Record<string, string> = {
  backlog: "BACKLOG",
  todo: "TODO",
  in_progress: "IN PROGRESS",
  in_review: "IN REVIEW",
  done: "DONE",
  cancelled: "CANCELLED",
};

type BadgeColor = "green" | "red" | "amber" | "purple" | "cyan" | "accent" | "default";

const PROJECT_STATUS_COLORS: Record<string, BadgeColor> = {
  active: "green",
  planning: "accent",
  on_hold: "amber",
  completed: "default",
  archived: "default",
};

type SegmentTab = "tasks" | "info";

function ProjectDetailSkeleton() {
  return (
    <View className="px-4 pt-4 pb-6 gap-4">
      <Skeleton width="80%" height={24} rounded="md" />
      <Skeleton width="60%" height={16} rounded="sm" />
      <View className="flex-row gap-4 mt-2">
        <Skeleton width={80} height={32} rounded="md" />
        <Skeleton width={80} height={32} rounded="md" />
      </View>
      <View className="gap-3 mt-4">
        <Skeleton width={120} height={20} rounded="sm" />
        <Skeleton width="100%" height={64} rounded="md" />
        <Skeleton width="100%" height={64} rounded="md" />
        <Skeleton width="100%" height={64} rounded="md" />
      </View>
    </View>
  );
}

export default function ProjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = id as Id<"projects">;

  const project = useQuery(api.projects.queries.getProject, { projectId });
  const tasks = useQuery(api.tasks.queries.getProjectTasks, { projectId });
  const isLoading = project === undefined || tasks === undefined;

  const [activeTab, setActiveTab] = useState<SegmentTab>("tasks");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set(["done", "cancelled"]),
  );

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const toggleGroup = useCallback(
    (status: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCollapsedGroups((prev) => {
        const next = new Set(prev);
        if (next.has(status)) {
          next.delete(status);
        } else {
          next.add(status);
        }
        return next;
      });
    },
    [],
  );

  const taskGroups = useMemo(() => {
    if (!tasks) return [];
    const grouped: Record<string, any[]> = {};
    for (const task of tasks) {
      const status = (task as any).status as string;
      if (!grouped[status]) grouped[status] = [];
      grouped[status].push(task);
    }
    return STATUS_GROUP_ORDER.map((status) => ({
      status,
      label: STATUS_DISPLAY[status] || status.toUpperCase(),
      tasks: grouped[status] || [],
    })).filter((g) => g.tasks.length > 0 || STATUS_GROUP_ORDER.indexOf(g.status) < 4);
  }, [tasks]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-base">
        <Stack.Screen
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.bg.base },
            headerTintColor: colors.text.primary,
            title: "Loading...",
          }}
        />
        <ProjectDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView className="flex-1 bg-base justify-center px-4">
        <Stack.Screen
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.bg.base },
            headerTintColor: colors.text.primary,
            title: "Error",
          }}
        />
        <EmptyState
          heading="Project not found"
          description="This project doesn't exist or you don't have access."
          ctaLabel="Go back"
          onCtaPress={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const projectName = (project as any).name as string;
  const projectKey = (project as any).key as string;
  const projectStatus = (project as any).status as string;
  const projectDescription = (project as any).description as string | undefined;
  const projectLead = (project as any).lead as any;
  const projectMembers = ((project as any).members as any[]) || [];
  const projectWorkflow = (project as any).methodology as string | undefined;
  const projectVisibility = (project as any).visibility as string | undefined;
  const projectRepo = (project as any).repositoryUrl as string | undefined;

  const statusBadgeColor = PROJECT_STATUS_COLORS[projectStatus] || "default";

  return (
    <SafeAreaView className="flex-1 bg-base">
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.bg.base },
          headerTintColor: colors.text.primary,
          headerShadowVisible: false,
          title: `${projectKey || ""} ${projectName}`,
          headerTitleStyle: {
            fontFamily: "Inter",
            fontWeight: "600",
            fontSize: 16,
            color: colors.text.primary,
          },
        }}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.default}
            progressBackgroundColor={colors.bg.surface}
          />
        }
      >
        {/* Project header */}
        <Animated.View entering={FadeInUp.duration(300)} className="px-4 pt-2 pb-4">
          <View className="flex-row items-center gap-2 mb-1">
            <BrutalBadge label={projectStatus} color={statusBadgeColor} size="sm" />
            <Text className="font-mono text-xs text-tertiary uppercase tracking-wider">
              {projectKey}
            </Text>
          </View>
          {projectDescription ? (
            <Text className="font-inter text-sm text-secondary mt-1" numberOfLines={3}>
              {projectDescription}
            </Text>
          ) : null}
        </Animated.View>

        {/* Segment tabs */}
        <View className="flex-row border-b border-subtle mx-4">
          <Pressable
            className={`flex-1 py-3 items-center ${activeTab === "tasks" ? "border-b-2 border-accent" : ""}`}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab("tasks");
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "tasks" }}
          >
            <Text
              className={`font-mono text-xs uppercase tracking-wider ${activeTab === "tasks" ? "text-accent" : "text-tertiary"}`}
            >
              Tasks
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 py-3 items-center ${activeTab === "info" ? "border-b-2 border-accent" : ""}`}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab("info");
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "info" }}
          >
            <Text
              className={`font-mono text-xs uppercase tracking-wider ${activeTab === "info" ? "text-accent" : "text-tertiary"}`}
            >
              Info
            </Text>
          </Pressable>
        </View>

        {/* Tab content */}
        {activeTab === "tasks" ? (
          <View className="px-4 pt-4 gap-4">
            {tasks && tasks.length === 0 ? (
              <EmptyState
                heading="No tasks yet"
                description="Tap + to create the first one."
              />
            ) : (
              taskGroups.map((group) => (
                <Animated.View
                  key={group.status}
                  entering={FadeInUp.duration(300)}
                >
                  {/* Group header */}
                  <Pressable
                    className="flex-row items-center justify-between py-2"
                    onPress={() => toggleGroup(group.status)}
                    accessibilityRole="button"
                    accessibilityLabel={`${group.label}, ${group.tasks.length} tasks, ${collapsedGroups.has(group.status) ? "collapsed" : "expanded"}`}
                  >
                    <View className="flex-row items-center gap-2">
                      <Text className="font-mono text-xs font-semibold uppercase tracking-wider text-secondary">
                        {group.label}
                      </Text>
                      <Text className="font-mono text-xs text-tertiary">
                        ({group.tasks.length})
                      </Text>
                    </View>
                    {collapsedGroups.has(group.status) ? (
                      <ChevronRight size={16} color={colors.text.tertiary} />
                    ) : (
                      <ChevronDown size={16} color={colors.text.tertiary} />
                    )}
                  </Pressable>

                  {/* Group tasks */}
                  {!collapsedGroups.has(group.status) &&
                    (group.tasks.length === 0 ? (
                      <Text className="font-inter text-xs text-tertiary py-2 pl-2">
                        (empty)
                      </Text>
                    ) : (
                      group.tasks.map((task: any) => (
                        <TaskCard
                          key={task._id}
                          task={{
                            _id: task._id,
                            title: task.title,
                            status: task.status,
                            priority: task.priority || "medium",
                            type: task.type || "task",
                            assignees: (task.assignees || []).map((a: any) => ({
                              name: a.name || "Unknown",
                              imageUrl: a.avatarUrl || a.imageUrl,
                            })),
                            dueDate: task.dueDate,
                          }}
                          onPress={() =>
                            router.push({
                              pathname: "/task/[id]",
                              params: { id: task._id },
                            })
                          }
                        />
                      ))
                    ))}
                </Animated.View>
              ))
            )}
          </View>
        ) : (
          /* INFO tab */
          <View className="px-4 pt-4 gap-6">
            {/* Details section */}
            <Animated.View entering={FadeInUp.duration(300)} className="gap-3">
              <Text className="font-mono text-[11px] font-semibold uppercase tracking-wider text-tertiary">
                Details
              </Text>
              <View className="bg-card border border-default rounded-lg p-4 gap-3">
                <DetailRow label="Status" value={projectStatus} />
                {projectWorkflow && (
                  <DetailRow label="Workflow" value={projectWorkflow} />
                )}
                <DetailRow label="Prefix" value={projectKey} />
                {projectVisibility && (
                  <DetailRow label="Visibility" value={projectVisibility} />
                )}
              </View>
            </Animated.View>

            {/* Repository section */}
            {projectRepo && (
              <Animated.View entering={FadeInUp.duration(300).delay(50)} className="gap-3">
                <Text className="font-mono text-[11px] font-semibold uppercase tracking-wider text-tertiary">
                  Repository
                </Text>
                <Pressable
                  className="bg-card border border-default rounded-lg p-4"
                  onPress={() => Linking.openURL(projectRepo)}
                  accessibilityRole="link"
                  accessibilityLabel={`Open repository: ${projectRepo}`}
                >
                  <Text className="font-mono text-sm text-accent" numberOfLines={1}>
                    {projectRepo}
                  </Text>
                </Pressable>
              </Animated.View>
            )}

            {/* Team section */}
            <Animated.View
              entering={FadeInUp.duration(300).delay(100)}
              className="gap-3"
            >
              <Text className="font-mono text-[11px] font-semibold uppercase tracking-wider text-tertiary">
                Team ({projectMembers.length})
              </Text>
              <View className="bg-card border border-default rounded-lg overflow-hidden">
                {projectMembers.length === 0 ? (
                  <Text className="font-inter text-sm text-secondary p-4">
                    No team members
                  </Text>
                ) : (
                  projectMembers.map((member: any, index: number) => (
                    <View
                      key={member._id}
                      className={`flex-row items-center p-3 gap-3 ${
                        index < projectMembers.length - 1
                          ? "border-b border-subtle"
                          : ""
                      }`}
                    >
                      <Avatar
                        name={member.name || "Unknown"}
                        url={member.avatarUrl}
                        size="sm"
                      />
                      <View className="flex-1">
                        <Text className="font-inter text-sm text-primary">
                          {member.name || "Unknown"}
                        </Text>
                      </View>
                      <Text className="font-mono text-xs text-tertiary uppercase">
                        {member.projectRole || "Member"}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            </Animated.View>
          </View>
        )}
      </ScrollView>

      {/* FAB for creating task in this project */}
      <FAB
        onPress={() =>
          router.push({
            pathname: "/capture",
            params: { projectId: id },
          })
        }
      />
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="font-inter text-sm text-secondary">{label}</Text>
      <Text className="font-inter text-sm text-primary capitalize">{value}</Text>
    </View>
  );
}
