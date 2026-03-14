import type { Theme } from "@blocknote/mantine"

export const brutalDarkTheme = {
  colors: {
    editor: {
      text: "#F9FAFB",
      background: "transparent",
    },
    menu: {
      text: "#F9FAFB",
      background: "#0A0A0A",
    },
    tooltip: {
      text: "#F9FAFB",
      background: "#111111",
    },
    hovered: {
      text: "#F9FAFB",
      background: "#111111",
    },
    selected: {
      text: "#F9FAFB",
      background: "#1F1F23",
    },
    disabled: {
      text: "#6B7280",
      background: "#0A0A0A",
    },
    shadow: "#000000",
    border: "#2E2E35",
    sideMenu: "#6B7280",
    highlights: {
      gray: { text: "#9CA3AF", background: "#1F1F23" },
      brown: { text: "#D97706", background: "#1C1206" },
      red: { text: "#EF4444", background: "#1C0606" },
      orange: { text: "#F59E0B", background: "#1C1006" },
      yellow: { text: "#EAB308", background: "#1C1806" },
      green: { text: "#22C55E", background: "#061C0C" },
      blue: { text: "#3B82F6", background: "#06101C" },
      purple: { text: "#8B5CF6", background: "#10061C" },
      pink: { text: "#EC4899", background: "#1C0616" },
    },
  },
  borderRadius: 0,
  fontFamily: "'Inter', sans-serif",
} satisfies Theme

export const brutalDarkThemeConfig = {
  dark: brutalDarkTheme,
} as const
