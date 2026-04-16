import React, { useEffect } from "react";
import { Text } from "react-native";
import { WifiOff } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from "react-native-reanimated";

interface OfflineBannerProps {
  isOffline: boolean;
}

export default function OfflineBanner({ isOffline }: OfflineBannerProps) {
  const translateY = useSharedValue(-60);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      translateY.value = isOffline ? 0 : -60;
      return;
    }
    translateY.value = withSpring(isOffline ? 0 : -60, {
      damping: 15,
      stiffness: 150,
    });
  }, [isOffline, reducedMotion, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      className="absolute top-0 left-0 right-0 z-50 bg-warning/15 border-b border-warning/30 px-4 py-2 flex-row items-center justify-center"
      style={animatedStyle}
      accessibilityRole="alert"
      accessibilityLabel="You are offline. Showing cached data."
    >
      <WifiOff size={16} color="#F59E0B" />
      <Text className="text-warning font-mono text-xs ml-2">
        You're offline — showing cached data
      </Text>
    </Animated.View>
  );
}
