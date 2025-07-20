/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#AD2831',
          dark: '#800E13',
        },
        secondary: {
          DEFAULT: '#640D14',
          dark: '#38040E',
        },
        background: {
          DEFAULT: '#250902',
          light: '#38040E',
        },
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        ltf1dark: {
          "primary": "#AD2831",
          "secondary": "#640D14",
          "accent": "#800E13",
          "neutral": "#38040E",
          "base-100": "#250902",
          "info": "#2196F3",
          "success": "#4CAF50",
          "warning": "#FB8C00",
          "error": "#FF5252",
        },
      },
    ],
  },
}