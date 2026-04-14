import React, { useEffect } from "react";
import { type DimensionValue } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";

const ROUNDED_MAP = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
} as const;

interface SkeletonProps {
  width: DimensionValue;
  height: DimensionValue;
  rounded?: "sm" | "md" | "lg" | "full";
}

export default function Skeleton({
  width,
  height,
  rounded = "md",
}: SkeletonProps) {
  const opacity = useSharedValue(0.3);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0.5;
      return;
    }
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [reducedMotion, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className="bg-default"
      style={[
        animatedStyle,
        {
          width,
          height,
          borderRadius: ROUNDED_MAP[rounded],
        },
      ]}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
    />
  );
}
