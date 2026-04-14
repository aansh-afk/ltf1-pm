import React from "react";
import { Pressable, View, type ViewProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  useReducedMotion,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { spacing } from "../../lib/theme";

const PADDING_MAP = {
  sm: "p-2",
  md: "p-4",
  lg: "p-6",
} as const;

const VARIANT_CLASSES = {
  default: "bg-card border border-default rounded-lg",
  bordered: "bg-card border-2 border-default rounded-lg",
  elevated: "bg-card border border-default rounded-lg",
} as const;

interface BrutalCardProps extends ViewProps {
  variant?: "default" | "bordered" | "elevated";
  padding?: "sm" | "md" | "lg";
  onPress?: () => void;
  children: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function BrutalCard({
  variant = "default",
  padding = "md",
  onPress,
  children,
  className,
  ...rest
}: BrutalCardProps) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const shadowStyle =
    variant === "elevated" ? spacing.shadow.hard : undefined;

  const classes = `${VARIANT_CLASSES[variant]} ${PADDING_MAP[padding]}${className ? ` ${className}` : ""}`;

  if (onPress) {
    return (
      <AnimatedPressable
        className={classes}
        style={[animatedStyle, shadowStyle]}
        onPressIn={() => {
          if (!reducedMotion) {
            scale.value = withTiming(0.98, { duration: 100 });
          }
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 100 });
        }}
        onPress={onPress}
        accessibilityRole="button"
        {...rest}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View className={classes} style={shadowStyle} {...rest}>
      {children}
    </View>
  );
}
