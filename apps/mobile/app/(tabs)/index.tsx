import React, { useCallback, useMemo } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { FolderKanban, Users, ListChecks, CheckCircle2 } from "lucide-react-native";
import { api } from "convex/_generated/api";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { Avatar, Skeleton, EmptyState, FAB } from "../../components/ui";
import {
  StatCard,
  WorkspaceCard,
  ActivityItem,
} from "../../components/features";
import { colors } from "../../lib/theme";

function DashboardSkeleton() {
  return (
    <View className="px-4 pt-4 pb-6 gap-6">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Skeleton width={160} height={34} rounded="md" />
        <Skeleton width={36} height={36} rounded="full" />
      </View>

      {/* Stats grid */}
      <View className="flex-row flex-wrap gap-3">
        {[1, 2, 3, 4].map((i) => (
          <View key={i} className="flex-1 min-w-[45%]">
            <Skeleton width="100%" height={80} rounded="md" />
          </View>
        ))}
      </View>

      {/* Workspaces */}
      <View className="gap-3">
        <Skeleton width={120} height={16} rounded="sm" />
        <Skeleton width="100%" height={72} rounded="md" />
        <Skeleton width="100%" height={72} rounded="md" />
      </View>

      {/* Activity */}
      <View className="gap-3">
        <Skeleton width={140} height={16} rounded="sm" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} width="100%" height={36} rounded="sm" />
        ))}
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { clerkUser, user, isLoading: isUserLoading } = useCurrentUser();
  const dashboardData = useQuery(api.dashboard.queries.getDashboardData);
  const isLoading = dashboardData === undefined || isUserLoading;

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Convex subscriptions auto-refresh; brief indicator for UX feedback
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const stats = useMemo(() => {
    if (!dashboardData) return { projects: 0, members: 0 };
    const projects = dashboardData.workspaces.reduce(
      (sum, w) => sum + w.projectCount,
      0,
    );
    const members = dashboardData.workspaces.reduce(
      (sum, w) => sum + w.memberCount,
      0,
    );
    return { projects, members };
  }, [dashboardData]);

  const activities = useMemo(() => {
    if (!dashboardData?.recentActivities) return [];
    return dashboardData.recentActivities
      .filter(
        (a: any) =>
          a &&
          typeof a === "object" &&
          a._id &&
          a.timestamp,
      )
      .slice(0, 10)
      .map((a: any) => ({
        _id: a._id as string,
        timestamp: a.timestamp as number,
        userName: (a.userName as string) || "Unknown",
        action: ((a.type as string) || "action").toUpperCase(),
        targetName: (a.targetName as string) || (a.entityType as string) || "",
      }));
  }, [dashboardData]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-base">
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  const workspaces = dashboardData?.workspaces ?? [];
  const hasWorkspaces = workspaces.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-base">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 pb-6 gap-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent.default}
            progressBackgroundColor={colors.bg.surface}
          />
        }
      >
        {/* Header */}
        <Animated.View
          entering={FadeInUp.duration(300)}
          className="flex-row items-center justify-between"
        >
          <Text className="font-inter text-[28px] font-extrabold leading-[34px] tracking-tight text-primary">
            Dashboard
          </Text>
          <Avatar
            name={clerkUser?.fullName ?? user?.name ?? "User"}
            url={clerkUser?.imageUrl}
            size="md"
          />
        </Animated.View>

        {!hasWorkspaces ? (
          <Animated.View entering={FadeInUp.duration(300).delay(100)}>
            <EmptyState
              heading="No workspaces yet"
              description="Create your first workspace on the web app to get started."
            />
          </Animated.View>
        ) : (
          <>
            {/* Stats Grid (2x2) */}
            <Animated.View
              entering={FadeInUp.duration(300).delay(50)}
              className="flex-row flex-wrap gap-3"
            >
              <View className="flex-1 min-w-[45%]">
                <StatCard
                  label="Projects"
                  value={stats.projects}
                  icon={<FolderKanban />}
                  color={colors.accent.default}
                />
              </View>
              <View className="flex-1 min-w-[45%]">
                <StatCard
                  label="Members"
                  value={stats.members}
                  icon={<Users />}
                  color={colors.semantic.purple}
                />
              </View>
              <View className="flex-1 min-w-[45%]">
                <StatCard
                  label="Tasks"
                  value={0}
                  icon={<ListChecks />}
                  color={colors.semantic.cyan}
                />
              </View>
              <View className="flex-1 min-w-[45%]">
                <StatCard
                  label="Done"
                  value={0}
                  icon={<CheckCircle2 />}
                  color={colors.semantic.green}
                />
              </View>
            </Animated.View>

            {/* Workspaces */}
            <Animated.View
              entering={FadeInUp.duration(300).delay(100)}
              className="gap-3"
            >
              <Text className="font-mono text-[11px] font-semibold uppercase tracking-wider text-tertiary">
                Workspaces
              </Text>
              {workspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace._id}
                  workspace={workspace}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/projects",
                      params: { workspaceId: workspace._id },
                    })
                  }
                />
              ))}
            </Animated.View>

            {/* Recent Activity */}
            <Animated.View
              entering={FadeInUp.duration(300).delay(150)}
              className="gap-2"
            >
              <Text className="font-mono text-[11px] font-semibold uppercase tracking-wider text-tertiary">
                Recent Activity
              </Text>
              {activities.length === 0 ? (
                <Text className="font-inter text-sm text-secondary py-4">
                  No recent activity
                </Text>
              ) : (
                activities.map((activity) => (
                  <ActivityItem key={activity._id} activity={activity} />
                ))
              )}
            </Animated.View>
          </>
        )}
      </ScrollView>

      {hasWorkspaces && (
        <FAB onPress={() => router.push("/capture")} />
      )}
    </SafeAreaView>
  );
}
