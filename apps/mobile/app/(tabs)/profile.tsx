import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { api } from "convex/_generated/api";
import Animated, { FadeInUp, useReducedMotion } from "react-native-reanimated";
import {
  LogOut,
  Building2,
  Users,
  FolderKanban,
  ChevronRight,
  Mail,
} from "lucide-react-native";
import {
  Avatar,
  BrutalButton,
  BrutalCard,
  Divider,
  OfflineBanner,
  Skeleton,
} from "../../components/ui";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { useOfflineCache } from "../../hooks/useOfflineCache";
import { clearCache } from "../../lib/cache";

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { isOnline } = useNetworkStatus();
  const reducedMotion = useReducedMotion();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const workspaces = useOfflineCache(
    api.workspaces.queries.getUserWorkspaces,
    isClerkLoaded && clerkUser ? {} : "skip",
  );

  const handleSignOut = useCallback(() => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setIsSigningOut(true);
          try {
            clearCache();
            await signOut();
          } catch {
            setIsSigningOut(false);
            Alert.alert("Error", "Failed to sign out. Try again.");
          }
        },
      },
    ]);
  }, [signOut]);

  const isLoading = !isClerkLoaded || (clerkUser && workspaces === undefined);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-base">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pt-4 pb-6 gap-6"
        >
          <View className="items-center gap-3 pt-8">
            <Skeleton width={80} height={80} rounded="full" />
            <Skeleton width={160} height={24} rounded="md" />
            <Skeleton width={200} height={16} rounded="md" />
          </View>
          <Divider />
          <Skeleton width={120} height={14} rounded="sm" />
          <View className="gap-3">
            <Skeleton width="100%" height={72} rounded="md" />
            <Skeleton width="100%" height={72} rounded="md" />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const displayName =
    clerkUser?.fullName ?? clerkUser?.firstName ?? "User";
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ?? "";
  const avatarUrl = clerkUser?.imageUrl ?? null;

  return (
    <SafeAreaView className="flex-1 bg-base">
      <OfflineBanner isOffline={!isOnline} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-4 pb-6 gap-6"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <Text className="font-inter text-[28px] font-extrabold tracking-tight text-primary">
            Profile
          </Text>
        </View>

        {/* User Info Card */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.duration(300)}
        >
          <BrutalCard variant="elevated" padding="lg">
            <View className="items-center gap-3">
              <Avatar url={avatarUrl} name={displayName} size="lg" />
              <View className="items-center gap-1">
                <Text
                  className="font-inter text-[22px] font-bold text-primary"
                  accessibilityRole="header"
                >
                  {displayName}
                </Text>
                {email ? (
                  <View className="flex-row items-center gap-1.5">
                    <Mail size={14} color="#6B7280" />
                    <Text className="font-inter text-[14px] text-tertiary">
                      {email}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </BrutalCard>
        </Animated.View>

        {/* Workspaces Section */}
        <View className="gap-3">
          <Text className="font-mono text-[11px] font-semibold uppercase tracking-wider text-tertiary">
            Workspaces
          </Text>

          {workspaces && workspaces.length === 0 ? (
            <BrutalCard>
              <Text className="font-inter text-[14px] text-secondary text-center">
                No workspaces yet. Create one on the web app.
              </Text>
            </BrutalCard>
          ) : (
            workspaces?.map((workspace: any, index: number) => (
              <Animated.View
                key={workspace._id}
                entering={
                  reducedMotion
                    ? undefined
                    : FadeInUp.duration(300).delay(100 + index * 50)
                }
              >
                <BrutalCard>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 gap-1.5">
                      <View className="flex-row items-center gap-2">
                        <Building2 size={16} color="#6366F1" />
                        <Text className="font-inter text-[16px] font-semibold text-primary">
                          {workspace.name}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-4 ml-6">
                        <View className="flex-row items-center gap-1">
                          <FolderKanban size={12} color="#6B7280" />
                          <Text className="font-inter text-[12px] text-tertiary">
                            {workspace.projectCount}{" "}
                            {workspace.projectCount === 1
                              ? "project"
                              : "projects"}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Users size={12} color="#6B7280" />
                          <Text className="font-inter text-[12px] text-tertiary">
                            {workspace.memberCount}{" "}
                            {workspace.memberCount === 1
                              ? "member"
                              : "members"}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                      <Text className="font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
                        {workspace.role}
                      </Text>
                      <ChevronRight size={16} color="#6B7280" />
                    </View>
                  </View>
                </BrutalCard>
              </Animated.View>
            ))
          )}
        </View>

        <Divider />

        {/* Actions Section */}
        <View className="gap-3">
          <Text className="font-mono text-[11px] font-semibold uppercase tracking-wider text-tertiary">
            Account
          </Text>

          <BrutalButton
            variant="danger"
            size="lg"
            label="Sign Out"
            onPress={handleSignOut}
            loading={isSigningOut}
            disabled={isSigningOut}
            icon={
              !isSigningOut ? (
                <LogOut size={18} color="#F9FAFB" />
              ) : undefined
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
