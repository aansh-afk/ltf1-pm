import React from "react";
import { Pressable, Text, ActivityIndicator } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useReducedMotion,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const VARIANT_CONFIG = {
  primary: {
    container: "bg-accent rounded-lg",
    pressed: "bg-accent-hover",
    text: "text-primary font-inter font-semibold",
    indicatorColor: "#F9FAFB",
  },
  secondary: {
    container: "border border-default rounded-lg",
    pressed: "bg-card",
    text: "text-primary font-inter font-semibold",
    indicatorColor: "#F9FAFB",
  },
  ghost: {
    container: "rounded-lg",
    pressed: "bg-card",
    text: "text-secondary font-inter",
    indicatorColor: "#9CA3AF",
  },
  danger: {
    container: "bg-error rounded-lg",
    pressed: "bg-[#DC2626]",
    text: "text-primary font-inter font-semibold",
    indicatorColor: "#F9FAFB",
  },
} as const;

const SIZE_CONFIG = {
  sm: { height: 36, px: "px-3", fontSize: "text-[13px]" },
  md: { height: 44, px: "px-4", fontSize: "text-[15px]" },
  lg: { height: 52, px: "px-6", fontSize: "text-[17px]" },
} as const;

interface BrutalButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function BrutalButton({
  variant = "primary",
  size = "md",
  label,
  onPress,
  loading = false,
  disabled = false,
  icon,
}: BrutalButtonProps) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  const config = VARIANT_CONFIG[variant];
  const sizeConfig = SIZE_CONFIG[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      className={`${config.container} ${sizeConfig.px} flex-row items-center justify-center${isDisabled ? " opacity-50" : ""}`}
      style={[animatedStyle, { minHeight: sizeConfig.height, minWidth: 80 }]}
      onPressIn={() => {
        if (isDisabled) return;
        if (!reducedMotion) {
          scale.value = withTiming(0.98, { duration: 100 });
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 100 });
      }}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={config.indicatorColor} />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            className={`${config.text} ${sizeConfig.fontSize}${icon ? " ml-2" : ""}`}
          >
            {label}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}
