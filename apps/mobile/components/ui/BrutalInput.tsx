import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  type TextInputProps,
  type KeyboardTypeOptions,
} from "react-native";

interface BrutalInputProps
  extends Omit<TextInputProps, "value" | "onChangeText"> {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  error?: string;
  multiline?: boolean;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: KeyboardTypeOptions;
}

export default function BrutalInput({
  placeholder,
  value,
  onChangeText,
  label,
  error,
  multiline = false,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
  ...rest
}: BrutalInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const borderClass = error
    ? "border-error"
    : isFocused
      ? "border-accent"
      : "border-default";

  return (
    <View>
      {label && (
        <Text className="text-secondary font-mono text-xs uppercase tracking-wider mb-1.5">
          {label}
        </Text>
      )}
      <TextInput
        className={`bg-surface border ${borderClass} rounded-lg px-3 text-[16px] text-primary font-inter${multiline ? " py-3" : ""}`}
        style={
          multiline
            ? { minHeight: 100, textAlignVertical: "top" }
            : { minHeight: 48 }
        }
        placeholderTextColor="#6B7280"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        accessibilityLabel={label}
        accessibilityState={{ disabled: false }}
        {...rest}
      />
      {error && (
        <Text className="text-error font-inter text-xs mt-1">{error}</Text>
      )}
    </View>
  );
}
