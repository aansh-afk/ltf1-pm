import React, { useCallback, useMemo, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { ChevronDown, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface SelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface BrutalSelectProps {
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export default function BrutalSelect({
  options,
  value,
  onChange,
  label,
  placeholder = "Select...",
}: BrutalSelectProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["50%"], []);

  const selectedOption = options.find((o) => o.value === value);

  const handleOpen = useCallback(() => {
    bottomSheetRef.current?.expand();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      bottomSheetRef.current?.close();
    },
    [onChange],
  );

  return (
    <View>
      {label && (
        <Text className="text-secondary font-mono text-xs uppercase tracking-wider mb-1.5">
          {label}
        </Text>
      )}

      <Pressable
        className="bg-surface border border-default rounded-lg px-3 flex-row items-center justify-between"
        style={{ minHeight: 48 }}
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel={`${label ?? "Select"}: ${selectedOption?.label ?? placeholder}`}
      >
        <Text
          className={`font-inter text-[16px] ${selectedOption ? "text-primary" : "text-tertiary"}`}
        >
          {selectedOption?.label ?? placeholder}
        </Text>
        <ChevronDown size={20} color="#6B7280" />
      </Pressable>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{
          backgroundColor: "#0A0A0A",
          borderTopWidth: 1,
          borderTopColor: "#2E2E35",
        }}
        handleIndicatorStyle={{
          backgroundColor: "#2E2E35",
          width: 40,
          height: 4,
        }}
      >
        <BottomSheetView className="px-4 pb-4">
          {label && (
            <Text className="font-inter text-[18px] font-semibold text-primary mb-4">
              {label}
            </Text>
          )}
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value}
                className="h-12 px-4 flex-row items-center border-b border-subtle"
                onPress={() => handleSelect(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={option.label}
              >
                {option.icon && <View className="mr-3">{option.icon}</View>}
                <Text
                  className={`font-inter text-[16px] flex-1 ${isSelected ? "text-accent" : "text-primary"}`}
                >
                  {option.label}
                </Text>
                {isSelected && <Check size={20} color="#6366F1" />}
              </Pressable>
            );
          })}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}
