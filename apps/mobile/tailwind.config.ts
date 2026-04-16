import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        base: "#050505",
        surface: "#0A0A0A",
        card: "#111111",

        // Text
        primary: "#F9FAFB",
        secondary: "#9CA3AF",
        tertiary: "#6B7280",

        // Accent
        accent: {
          DEFAULT: "#6366F1",
          hover: "#4F46E5",
        },

        // Borders
        default: "#2E2E35",
        subtle: "#1F1F23",

        // Semantic
        success: "#22C55E",
        error: "#EF4444",
        warning: "#F59E0B",
        info: "#06B6D4",
        purple: "#8B5CF6",
      },
      fontFamily: {
        inter: ["Inter"],
        mono: ["IBMPlexMono"],
      },
      borderRadius: {
        DEFAULT: "8px",
      },
    },
  },
  plugins: [],
} satisfies Config;
