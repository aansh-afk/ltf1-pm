import React from "react";
import { Pressable } from "react-native";
import { Plus } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useReducedMotion,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { spacing } from "../../lib/theme";

interface FABProps {
  onPress: () => void;
  icon?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function FAB({ onPress, icon }: FABProps) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      className="absolute bottom-6 right-4 w-14 h-14 rounded-2xl bg-accent items-center justify-center"
      style={[animatedStyle, spacing.shadow.hard]}
      onPressIn={() => {
        if (!reducedMotion) {
          scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Create new"
    >
      {icon ?? <Plus size={24} color="#F9FAFB" />}
    </AnimatedPressable>
  );
}
