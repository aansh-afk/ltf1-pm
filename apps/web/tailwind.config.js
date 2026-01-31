/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'animate-marquee',
    'animate-marquee2',
    'animate-marquee-slow',
    'animate-marquee-fast',
  ],
  theme: {
    extend: {
      colors: {
        // BRUTALIST COLOR PROTOCOL
        'event-horizon': '#000000',
        'carbon-plate': '#0A0A0A',
        'cathode-white': '#F5F5F5',
        'basalt-border': '#333333',
        'primary-brutalist': '#FFFF00',
        // Status colors following Brutalist protocol
        'brutal-error': '#FF0000',
        'brutal-success': '#00FF00',
        'brutal-info': '#FF2D78',
        'brutal-warning': '#FF00FF',
        'warning-brutalist': '#FF00FF',
        'success-brutalist': '#00FF00',
        'terminal-green': '#00FF00',
      },
      backgroundImage: {
        'glitch-flare': 'linear-gradient(90deg, #FF2D78, #FF00FF, #FFFF00)',
      },
      fontFamily: {
        'mono': ['IBM Plex Mono', 'monospace'],
      },
      spacing: {
        // 8px grid system
        '2px': '2px',
        '8px': '8px',
        '16px': '16px',
        '24px': '24px',
        '32px': '32px',
        '40px': '40px',
        '48px': '48px',
        '56px': '56px',
        '64px': '64px',
        '72px': '72px',
        '80px': '80px',
        '96px': '96px',
        '120px': '120px',
        '160px': '160px',
        '240px': '240px',
        '256px': '256px',
      },
      boxShadow: {
        'brutal': '5px 5px 0px #000000',
        'brutal-sm': '3px 3px 0px #000000',
        'brutal-lg': '8px 8px 0px #000000',
        'brutal-hover': '8px 8px 0px #000000',
      },
      fontSize: {
        'brutal-xs': ['0.75rem', { lineHeight: '1.2' }],
        'brutal-sm': ['0.875rem', { lineHeight: '1.2' }],
        'brutal-md': ['1rem', { lineHeight: '1.4' }],
        'brutal-lg': ['1.25rem', { lineHeight: '1.4' }],
        'brutal-xl': ['1.5rem', { lineHeight: '1.4' }],
        'brutal-2xl': ['2rem', { lineHeight: '1.2' }],
        // Marketing hero type scale
        'hero-sm': ['2rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'hero-md': ['3rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'hero-lg': ['4rem', { lineHeight: '1.0', letterSpacing: '-0.03em' }],
        'hero-xl': ['5rem', { lineHeight: '1.0', letterSpacing: '-0.03em' }],
        'hero-2xl': ['6.5rem', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
        'section-title': ['2.5rem', { lineHeight: '1.1', letterSpacing: '0.02em' }],
      },
      transitionTimingFunction: {
        'brutal': 'linear',
        'brutal-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'brutal-step': 'steps(4)',
      },
      animation: {
        'brutal-fade': 'brutalFade 0.3s linear',
        'glitch': 'glitch 0.5s infinite linear',
        'brutal-pulse': 'brutalPulse 1s infinite steps(2)',
        'brutal-slide': 'brutalSlide 0.2s linear',
        'marquee': 'marquee 25s linear infinite',
        'marquee2': 'marquee2 25s linear infinite',
        'marquee-slow': 'marquee 50s linear infinite',
        'marquee-fast': 'marquee 15s linear infinite',
        'scanline': 'scanline 8s linear infinite',
        'crt-flicker': 'crt-flicker 0.15s infinite',
        'cursor-blink': 'cursor-blink 1.06s step-end infinite',
      },
      keyframes: {
        brutalFade: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glitch: {
          '0%': { textShadow: '2px 2px 0 #FF2D78, -2px -2px 0 #FF00FF' },
          '25%': { textShadow: '-2px 2px 0 #FF2D78, 2px -2px 0 #FF00FF' },
          '50%': { textShadow: '2px -2px 0 #FF2D78, -2px 2px 0 #FF00FF' },
          '75%': { textShadow: '-2px -2px 0 #FF2D78, 2px 2px 0 #FF00FF' },
          '100%': { textShadow: '2px 2px 0 #FF2D78, -2px -2px 0 #FF00FF' },
        },
        brutalPulse: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0.5' },
        },
        brutalSlide: {
          '0%': { transform: 'translateX(-8px)' },
          '100%': { transform: 'translateX(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        marquee2: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0%)' },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'crt-flicker': {
          '0%': { opacity: '0.9' },
          '50%': { opacity: '1.0' },
          '100%': { opacity: '0.9' },
        },
        'cursor-blink': {
          '0%, 49%': { opacity: '1' },
          '50%, 100%': { opacity: '0' },
        },
      },
      borderRadius: {
        'none': '0',
        DEFAULT: '0',
        'sm': '0',
        'md': '0',
        'lg': '0',
        'xl': '0',
        '2xl': '0',
        '3xl': '0',
        'full': '0',
      },
      borderWidth: {
        DEFAULT: '2px',
        '0': '0',
        '2': '2px',
        '4': '4px',
        '8': '8px',
      },
    },
  },
  plugins: [],
}