import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TextInput, Alert, Keyboard } from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp, useReducedMotion } from "react-native-reanimated";
import {
  BrutalButton,
  BrutalSelect,
  OfflineBanner,
} from "../components/ui";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

const PRIORITY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
  { label: "Urgent", value: "urgent" },
];

const TYPE_OPTIONS = [
  { label: "Task", value: "task" },
  { label: "Feature", value: "feature" },
  { label: "Bug", value: "bug" },
  { label: "Improvement", value: "improvement" },
  { label: "Epic", value: "epic" },
];

const MAX_TITLE_LENGTH = 200;

export default function CaptureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ projectId?: string }>();
  const { isOnline } = useNetworkStatus();
  const reducedMotion = useReducedMotion();
  const titleInputRef = useRef<TextInput>(null);

  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<string | null>(
    params.projectId ?? null,
  );
  const [priority, setPriority] = useState("medium");
  const [type, setType] = useState("task");
  const [isCreating, setIsCreating] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);

  const projects = useQuery(api.projects.queries.getUserProjects, {});
  const createTask = useMutation(api.tasks.mutations.createTask);

  // Auto-select project if user has only one
  useEffect(() => {
    if (!projectId && projects !== undefined && projects !== null && projects.length === 1) {
      setProjectId(projects[0]!._id);
    }
  }, [projects, projectId]);

  // Auto-focus title input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const projectOptions = useMemo(() => {
    if (!projects) return [];
    return projects.map((p: any) => ({
      label: p.name,
      value: p._id,
    }));
  }, [projects]);

  const handleCreate = useCallback(async () => {
    // Validate
    let hasError = false;

    if (!title.trim()) {
      setTitleError("Title is required");
      hasError = true;
    } else {
      setTitleError(null);
    }

    if (!projectId) {
      setProjectError("Select a project");
      hasError = true;
    } else {
      setProjectError(null);
    }

    if (hasError) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsCreating(true);
    Keyboard.dismiss();

    try {
      await createTask({
        projectId: projectId as Id<"projects">,
        title: title.trim(),
        type: type as any,
        priority: priority as any,
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.back();
    } catch {
      setIsCreating(false);
      Alert.alert("Error", "Failed to create task. Try again.");
    }
  }, [title, projectId, type, priority, createTask, router]);

  const noProjects = projects !== undefined && projects.length === 0;

  return (
    <View className="flex-1 bg-base">
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <OfflineBanner isOffline={!isOnline} />

      {/* Handle bar */}
      <View className="items-center pt-2 pb-4">
        <View
          className="bg-default rounded-full"
          style={{ width: 40, height: 4 }}
        />
      </View>

      <View className="flex-1 px-4 pb-4 gap-5">
        {/* Title */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.duration(300)}
        >
          <Text className="font-inter text-[22px] font-bold text-primary mb-4">
            New Task
          </Text>
        </Animated.View>

        {/* Title Input */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.duration(300).delay(50)}
        >
          <TextInput
            ref={titleInputRef}
            className={`bg-card border ${titleError ? "border-error" : "border-default"} rounded-lg px-3 text-[16px] text-primary`}
            style={{ minHeight: 48 }}
            placeholderTextColor="#6B7280"
            placeholder="Task title..."
            value={title}
            onChangeText={(text) => {
              if (text.length <= MAX_TITLE_LENGTH) {
                setTitle(text);
                if (titleError) setTitleError(null);
              }
            }}
            returnKeyType="done"
            accessibilityLabel="Task title"
            maxFontSizeMultiplier={1.3}
          />
          <View className="flex-row justify-between mt-1">
            {titleError ? (
              <Text className="font-inter text-[12px] text-error">
                {titleError}
              </Text>
            ) : (
              <View />
            )}
            {title.length > 150 && (
              <Text className="font-mono text-[10px] text-tertiary">
                {title.length}/{MAX_TITLE_LENGTH}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Project Selector */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.duration(300).delay(100)}
        >
          {noProjects ? (
            <View className="bg-card border border-default rounded-lg p-4">
              <Text className="font-inter text-[14px] text-secondary text-center">
                You need to be a member of a project to create tasks.
              </Text>
            </View>
          ) : (
            <View>
              <BrutalSelect
                label="Project"
                options={projectOptions}
                value={projectId}
                onChange={(value) => {
                  setProjectId(value);
                  if (projectError) setProjectError(null);
                }}
                placeholder={
                  projects === undefined ? "Loading projects..." : "Select project..."
                }
              />
              {projectError && (
                <Text className="font-inter text-[12px] text-error mt-1">
                  {projectError}
                </Text>
              )}
            </View>
          )}
        </Animated.View>

        {/* Priority + Type Row */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.duration(300).delay(150)}
          className="flex-row gap-3"
        >
          <View className="flex-1">
            <BrutalSelect
              label="Priority"
              options={PRIORITY_OPTIONS}
              value={priority}
              onChange={setPriority}
            />
          </View>
          <View className="flex-1">
            <BrutalSelect
              label="Type"
              options={TYPE_OPTIONS}
              value={type}
              onChange={setType}
            />
          </View>
        </Animated.View>

        {/* Spacer */}
        <View className="flex-1" />

        {/* Create Button */}
        <Animated.View
          entering={reducedMotion ? undefined : FadeInUp.duration(300).delay(200)}
        >
          <BrutalButton
            variant="primary"
            size="lg"
            label="Create Task"
            onPress={handleCreate}
            loading={isCreating}
            disabled={isCreating || !isOnline || noProjects}
          />
          {!isOnline && (
            <Text className="font-inter text-[12px] text-warning text-center mt-2">
              You are offline. Task creation is unavailable.
            </Text>
          )}
        </Animated.View>
      </View>
    </View>
  );
}
