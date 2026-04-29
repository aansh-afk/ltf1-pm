import React, { useCallback, useMemo, useState } from "react";
import { View, Text, RefreshControl, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "convex/react";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { api } from "convex/_generated/api";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { Avatar, BrutalInput, Skeleton, EmptyState } from "../../components/ui";
import { ProjectCard, StatusChip } from "../../components/features";
import { colors } from "../../lib/theme";

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Planning", value: "planning" },
  { label: "On Hold", value: "on_hold" },
  { label: "Completed", value: "completed" },
] as const;

function ProjectsSkeleton() {
  return (
    <View className="px-4 pt-4 pb-6 gap-4">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Skeleton width={120} height={34} rounded="md" />
        <Skeleton width={36} height={36} rounded="full" />
      </View>

      {/* Search bar */}
      <Skeleton width="100%" height={48} rounded="md" />

      {/* Filter chips */}
      <View className="flex-row gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} width={72} height={32} rounded="md" />
        ))}
      </View>

      {/* Project cards grid */}
      <View className="flex-row flex-wrap gap-3">
        {[1, 2, 3, 4].map((i) => (
          <View key={i} className="flex-1 min-w-[45%]">
            <Skeleton width="100%" height={140} rounded="md" />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ProjectsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ workspaceId?: string }>();
  const { clerkUser, user, isLoading: isUserLoading } = useCurrentUser();
  const projects = useQuery(api.projects.queries.getUserProjects, {});
  const isLoading = projects === undefined || isUserLoading;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];

    let filtered = projects.filter(Boolean);

    // Filter by workspace if param provided
    if (params.workspaceId) {
      filtered = filtered.filter(
        (p: any) => p.workspaceId === params.workspaceId,
      );
    }

    // Filter by status
    if (activeStatus && activeStatus !== "all") {
      filtered = filtered.filter((p: any) => p.status === activeStatus);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p: any) =>
          (p.name as string).toLowerCase().includes(q) ||
          (p.key as string).toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [projects, params.workspaceId, activeStatus, searchQuery]);

  const statusCounts = useMemo(() => {
    if (!projects) return {};
    const counts: Record<string, number> = {};
    for (const p of projects) {
      if (!p) continue;
      const status = (p as any).status as string;
      counts[status] = (counts[status] || 0) + 1;
    }
    return counts;
  }, [projects]);

  const statusFiltersWithCounts = useMemo(
    () =>
      STATUS_FILTERS.map((s) => ({
        ...s,
        count:
          s.value === "all"
            ? projects?.filter(Boolean).length ?? 0
            : statusCounts[s.value] ?? 0,
      })),
    [statusCounts, projects],
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-base">
        <ProjectsSkeleton />
      </SafeAreaView>
    );
  }

  const projectItems = filteredProjects.map((p: any) => ({
    _id: p._id as string,
    key: (p.key as string) || "",
    name: (p.name as string) || "",
    status: (p.status as string) || "active",
    taskCount: 0,
    completedCount: 0,
  }));

  const hasProjects = (projects?.length ?? 0) > 0;
  const hasFilteredResults = projectItems.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-base">
      {/* Header */}
      <Animated.View
        entering={FadeInUp.duration(300)}
        className="flex-row items-center justify-between px-4 pt-4 pb-2"
      >
        <Text className="font-inter text-[28px] font-extrabold leading-[34px] tracking-tight text-primary">
          Projects
        </Text>
        <Avatar
          name={clerkUser?.fullName ?? user?.name ?? "User"}
          url={clerkUser?.imageUrl}
          size="md"
        />
      </Animated.View>

      {!hasProjects ? (
        <View className="flex-1 px-4 justify-center">
          <EmptyState
            heading="No projects yet"
            description="Join a project or ask your team lead for an invite."
          />
        </View>
      ) : (
        <>
          {/* Search */}
          <Animated.View
            entering={FadeInUp.duration(300).delay(50)}
            className="px-4 pb-2"
          >
            <BrutalInput
              placeholder="Search projects..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </Animated.View>

          {/* Status filter chips */}
          <Animated.View entering={FadeInUp.duration(300).delay(100)} className="pb-3">
            <StatusChip
              statuses={statusFiltersWithCounts}
              activeStatus={activeStatus}
              onSelect={setActiveStatus}
            />
          </Animated.View>

          {/* Project grid */}
          {!hasFilteredResults ? (
            <View className="flex-1 px-4 justify-center">
              <EmptyState
                heading="No projects match"
                description={
                  searchQuery
                    ? `No projects found for "${searchQuery}".`
                    : "No projects match your filters."
                }
                ctaLabel="Clear filters"
                onCtaPress={() => {
                  setSearchQuery("");
                  setActiveStatus(null);
                }}
              />
            </View>
          ) : (
            <FlatList
              data={projectItems}
              keyExtractor={(item) => item._id}
              numColumns={2}
              columnWrapperClassName="gap-3 px-4"
              contentContainerClassName="gap-3 pb-6"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.accent.default}
                  progressBackgroundColor={colors.bg.surface}
                />
              }
              renderItem={({ item }) => (
                <View className="flex-1">
                  <ProjectCard
                    project={item}
                    onPress={() =>
                      router.push({
                        pathname: "/project/[id]",
                        params: { id: item._id },
                      })
                    }
                  />
                </View>
              )}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}
