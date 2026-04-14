export const colors = {
  bg: {
    base: "#050505",
    surface: "#0A0A0A",
    card: "#111111",
    elevated: "#1A1A1A",
  },
  text: {
    primary: "#F9FAFB",
    secondary: "#9CA3AF",
    tertiary: "#6B7280",
  },
  accent: {
    default: "#6366F1",
    hover: "#4F46E5",
  },
  border: {
    standard: "#2E2E35",
    subtle: "#1F1F23",
  },
  semantic: {
    green: "#22C55E",
    red: "#EF4444",
    amber: "#F59E0B",
    purple: "#8B5CF6",
    cyan: "#06B6D4",
  },
} as const;

export const typography = {
  fontFamily: {
    sans: "Inter",
    mono: "IBMPlexMono",
  },
} as const;

export const spacing = {
  borderWidth: {
    standard: 2,
    subtle: 1,
  },
  borderRadius: {
    none: 0,
    sm: 8,
    md: 12,
  },
  shadow: {
    hard: {
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 0,
      shadowColor: "#000000",
      elevation: 4,
    },
  },
} as const;
