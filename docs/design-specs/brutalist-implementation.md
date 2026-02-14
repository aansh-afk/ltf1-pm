# BRUTALIST IMPLEMENTATION GUIDE
## TACTICAL EXECUTION OF THE PROTOCOL

### PHASE I: THE PURGE

#### 1.1 TAILWIND CONFIGURATION OVERHAUL
```javascript
// tailwind.config.js - THE NEW ORDER
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // DESTROY ALL CURVES
    borderRadius: {
      'none': '0',
      DEFAULT: '0',
    },
    
    // THE GRID CAGE
    spacing: {
      '0': '0',
      '1': '8px',    // 1 grid unit
      '2': '16px',   // 2 grid units  
      '3': '24px',   // 3 grid units
      '4': '32px',   // 4 grid units
      '5': '40px',   // 5 grid units
      '6': '48px',   // 6 grid units
      '7': '56px',   // 7 grid units
      '8': '64px',   // 8 grid units
      '9': '72px',   // 9 grid units
      '10': '80px',  // 10 grid units
    },
    
    // THE SACRED COLORS
    colors: {
      // The Void
      'black': '#000000',
      'white': '#FFFFFF',
      
      // The Energy Spectrum
      'cyan': '#00FFFF',
      'magenta': '#FF00FF', 
      'yellow': '#FFFF00',
      'green': '#00FF00',
      'red': '#FF0000',
      
      // The Industrial Grays
      'gray': {
        '900': '#0A0A0A', // Near-void
        '800': '#1A1A1A', // Deep shadow
        '700': '#2A2A2A', // Shadow
        '600': '#3A3A3A', // Dark metal
        '500': '#4A4A4A', // Metal
        '400': '#5A5A5A', // Light metal
        '300': '#6A6A6A', // Worn metal
        '200': '#7A7A7A', // Oxidized
        '100': '#8A8A8A', // Dust
      },
      
      // REMOVE ALL OTHER COLORS
      transparent: 'transparent',
      current: 'currentColor',
    },
    
    // TYPOGRAPHY DECREE
    fontFamily: {
      'mono': ['IBM Plex Mono', 'monospace'],
    },
    
    fontSize: {
      'xxs': '10px',   // Whispers
      'xs': '12px',    // System
      'sm': '14px',    // Body
      'base': '16px',  // Standard
      'lg': '20px',    // Elevated
      'xl': '24px',    // Section
      'xxl': '32px',   // Title
      'xxxl': '48px',  // Monument
    },
    
    fontWeight: {
      'normal': '400',
      'bold': '700',
    },
    
    // THE SHADOW LAW
    boxShadow: {
      'none': 'none',
      'brutal': '5px 5px 0 #000000',
      'brutal-lg': '10px 10px 0 #000000',
      'inset-active': 'inset 3px 0 0 #00FFFF',
      'inset-focus': 'inset 0 0 0 2px #00FFFF',
    },
    
    // NO TRANSITIONS
    transitionProperty: {
      'none': 'none',
    },
    
    // NO ANIMATIONS (except sacred ones)
    animation: {
      'none': 'none',
      'glitch': 'glitch 0.3s infinite',
      'pulse': 'pulse 1s infinite',
      'scan': 'scan 2s linear infinite',
      'assemble': 'assemble 2s infinite',
    },
    
    extend: {
      keyframes: {
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        assemble: {
          '0%, 100%': { opacity: '0', transform: 'scale(0)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  
  plugins: [],
  
  // DISABLE ALL DEFAULTS
  corePlugins: {
    preflight: false, // We'll implement our own reset
  },
}
```

#### 1.2 THE GLOBAL RESET
```css
/* globals.css - THE FOUNDATION */

/* THE PURGE */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  border-radius: 0 !important;
}

/* THE VOID */
html {
  background: #000000;
  color: #FFFFFF;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: never;
  -moz-osx-font-smoothing: never;
  /* PIXELS ARE SHARP */
}

/* NO SMOOTH SCROLLING */
html {
  scroll-behavior: auto !important;
}

/* THE BODY */
body {
  min-height: 100vh;
  background: #000000;
}

/* LINKS OBEY */
a {
  color: inherit;
  text-decoration: none;
}

/* LISTS HAVE NO STYLE */
ul, ol {
  list-style: none;
}

/* IMAGES ARE PRISONERS */
img, video {
  max-width: 100%;
  height: auto;
  display: block;
}

/* BUTTONS RESET */
button {
  background: none;
  border: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

/* INPUTS RESET */
input, textarea, select {
  background: none;
  border: none;
  color: inherit;
  font: inherit;
}

/* SCROLLBAR BRUTALISM */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #1A1A1A;
}

::-webkit-scrollbar-thumb {
  background: #4A4A4A;
  border-radius: 0;
}

::-webkit-scrollbar-thumb:hover {
  background: #6A6A6A;
}

/* SELECTION IS CYAN */
::selection {
  background: #00FFFF;
  color: #000000;
}

/* FOCUS VISIBLE ONLY */
:focus {
  outline: none;
}

:focus-visible {
  outline: 2px solid #00FFFF;
  outline-offset: 2px;
}
```

### PHASE II: COMPONENT CLASSES

#### 2.1 BASE COMPONENTS
```css
/* BUTTON IMPLEMENTATIONS */
.btn-brutal {
  @apply bg-black text-white border-2 border-white px-3 py-2 
         font-bold uppercase tracking-widest shadow-brutal
         active:translate-x-[5px] active:translate-y-[5px] active:shadow-none;
}

.btn-brutal-primary {
  @apply btn-brutal border-cyan text-cyan;
}

.btn-brutal-critical {
  @apply btn-brutal border-magenta text-magenta;
}

.btn-brutal-warning {
  @apply btn-brutal border-yellow text-yellow;
}

/* INPUT IMPLEMENTATIONS */
.input-brutal {
  @apply bg-black border border-gray-500 text-white px-2 py-1.5
         font-mono text-sm focus:border-cyan focus:shadow-inset-focus;
}

.input-brutal-error {
  @apply input-brutal border-magenta;
}

/* CARD IMPLEMENTATIONS */
.card-brutal {
  @apply bg-gray-900 border border-gray-700 p-2;
}

.card-brutal-active {
  @apply card-brutal border-cyan shadow-inset-active;
}

/* TABLE IMPLEMENTATIONS */
.table-brutal {
  @apply w-full bg-black border-collapse;
}

.table-brutal th {
  @apply bg-gray-900 border-b-2 border-gray-700 p-2 
         text-left font-bold uppercase tracking-wider text-gray-300;
}

.table-brutal td {
  @apply border-b border-gray-800 p-2 text-white;
}

.table-brutal tr:hover {
  @apply bg-gray-900;
}

/* MODAL IMPLEMENTATIONS */
.modal-brutal-overlay {
  @apply fixed inset-0 bg-black bg-opacity-90 z-50;
}

.modal-brutal {
  @apply fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
         bg-black border-2 border-gray-500 min-w-[480px] max-w-[80vw]
         max-h-[80vh] z-50 shadow-brutal-lg;
}

.modal-brutal-header {
  @apply bg-gray-900 px-3 py-2 border-b border-gray-700 
         flex justify-between items-center;
}

.modal-brutal-title {
  @apply text-lg font-bold uppercase tracking-widest;
}

.modal-brutal-body {
  @apply p-3;
}

.modal-brutal-footer {
  @apply px-3 py-2 border-t border-gray-700 flex justify-end gap-2;
}
```

#### 2.2 DEVELOPER SPECIFIC COMPONENTS
```css
/* CODE EDITOR */
.editor-brutal {
  @apply bg-black border border-gray-700 font-mono text-sm leading-relaxed;
}

.editor-brutal-gutter {
  @apply bg-gray-900 text-gray-500 w-6 text-right pr-2 
         border-r border-gray-700;
}

.editor-brutal-line-active {
  @apply bg-gray-800 shadow-inset-active;
}

.editor-brutal-selection {
  @apply bg-magenta bg-opacity-30;
}

/* TERMINAL */
.terminal-brutal {
  @apply bg-black text-green font-mono text-sm p-2 
         border border-gray-800 overflow-auto;
}

.terminal-brutal-prompt {
  @apply text-cyan font-bold;
}

.terminal-brutal-error {
  @apply text-magenta bg-gray-800 p-1 my-1 border-l-4 border-magenta;
}

/* GIT VISUALIZATION */
.git-node {
  @apply w-2 h-2 bg-white border-2 border-black;
}

.git-node-merge {
  @apply git-node bg-magenta;
}

.git-branch-active {
  @apply stroke-cyan stroke-2;
}

/* TASK CARDS */
.task-brutal {
  @apply bg-gray-900 border border-gray-700 p-2 mb-1 relative;
}

.task-brutal-critical {
  @apply task-brutal border-l-4 border-l-magenta;
}

.task-brutal-high {
  @apply task-brutal border-l-4 border-l-yellow;
}

.task-brutal-normal {
  @apply task-brutal border-l-4 border-l-cyan;
}

/* BUILD STATUS */
.build-tower {
  @apply w-1 h-screen fixed right-0 top-0 bg-gray-800;
}

.build-tower-building {
  @apply build-tower bg-gradient-to-b from-yellow to-gray-800 animate-scan;
}

.build-tower-success {
  @apply build-tower bg-cyan;
}

.build-tower-failed {
  @apply build-tower bg-magenta animate-pulse;
}

/* NOTIFICATIONS */
.notify-brutal {
  @apply fixed top-3 right-3 bg-black border-2 border-gray-500 
         p-2 min-w-[320px] shadow-brutal;
}

.notify-brutal-success {
  @apply notify-brutal border-cyan border-l-4;
}

.notify-brutal-error {
  @apply notify-brutal border-magenta border-l-4;
}

.notify-brutal-warning {
  @apply notify-brutal border-yellow border-l-4;
}

/* LOADER */
.loader-brutal {
  @apply w-6 h-6 relative;
}

.loader-brutal-block {
  @apply absolute w-2 h-2 bg-cyan animate-assemble;
}

/* PROGRESS */
.progress-brutal {
  @apply w-full h-1 bg-gray-800 relative overflow-hidden;
}

.progress-brutal-bar {
  @apply h-full bg-cyan absolute left-0 top-0;
}

/* COLLABORATION INDICATORS */
.collab-cursor {
  @apply absolute w-0.5 bg-cyan h-5 pointer-events-none;
}

.collab-cursor::before {
  content: attr(data-user);
  @apply absolute -top-5 left-0 bg-black text-cyan 
         px-1 text-xxs font-bold whitespace-nowrap border border-cyan;
}

/* ERROR STATES */
.error-brutal {
  @apply bg-gray-900 border-2 border-magenta p-3 relative;
}

.error-brutal::before {
  content: 'ERROR';
  @apply absolute -top-3 left-2 bg-black text-magenta 
         px-1 font-bold tracking-widest;
}

.error-brutal-code {
  @apply text-xxxl font-bold text-magenta mb-2;
}

.error-brutal-stack {
  @apply bg-black border border-gray-700 p-2 font-mono text-xs 
         text-gray-300 overflow-x-auto;
}
```

### PHASE III: UTILITY CLASSES

```css
/* TEXT UTILITIES */
.text-glitch {
  @apply animate-glitch;
}

.text-gradient-brutal {
  background: linear-gradient(45deg, #00FFFF 0%, #FF00FF 50%, #FFFF00 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* BORDER UTILITIES */
.border-gradient-brutal {
  position: relative;
  background: #000000;
  border: 2px solid transparent;
}

.border-gradient-brutal::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(45deg, #00FFFF 0%, #FF00FF 50%, #FFFF00 100%);
  z-index: -1;
}

/* LAYOUT UTILITIES */
.grid-brutal {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.stack-brutal {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cluster-brutal {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* STATE UTILITIES */
.disabled-brutal {
  @apply opacity-30 cursor-not-allowed pointer-events-none;
}

.loading-brutal {
  @apply relative overflow-hidden;
}

.loading-brutal::after {
  content: '';
  @apply absolute inset-0 bg-gradient-to-r from-transparent via-cyan to-transparent 
         opacity-20 animate-scan;
}

/* RESPONSIVE UTILITIES */
@media (max-width: 640px) {
  .mobile-brutal {
    @apply shadow-none text-sm;
  }
  
  .hide-mobile-brutal {
    @apply hidden;
  }
}

/* INTERACTION UTILITIES */
.hover-glow-brutal {
  @apply hover:text-cyan hover:bg-gray-900;
}

.active-slam-brutal {
  @apply active:translate-x-0.5 active:translate-y-0.5;
}

.focus-brutal {
  @apply focus:border-cyan focus:shadow-inset-focus;
}
```

### PHASE IV: REACT COMPONENT EXAMPLES

```tsx
// Button.tsx - THE PRESSURE PLATE
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface ButtonBrutalProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'critical' | 'warning';
  size?: 'sm' | 'md' | 'lg';
}

export const ButtonBrutal = forwardRef<HTMLButtonElement, ButtonBrutalProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'btn-brutal',
          {
            'btn-brutal-primary': variant === 'primary',
            'btn-brutal-critical': variant === 'critical',
            'btn-brutal-warning': variant === 'warning',
            'px-2 py-1 text-sm': size === 'sm',
            'px-3 py-2': size === 'md',
            'px-4 py-3 text-lg': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

// Terminal.tsx - THE VOICE OF THE MACHINE
import { useRef, useEffect } from 'react';

interface TerminalBrutalProps {
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    message: string;
  }>;
}

export function TerminalBrutal({ logs }: TerminalBrutalProps) {
  const endRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [logs]);
  
  return (
    <div className="terminal-brutal h-96">
      {logs.map((log, i) => (
        <div key={i} className="flex gap-2">
          <span className="text-gray-500">{log.timestamp}</span>
          <span className={cn({
            'text-cyan': log.level === 'info',
            'text-yellow': log.level === 'warn',
            'text-magenta font-bold': log.level === 'error',
          })}>
            [{log.level.toUpperCase()}]
          </span>
          <span>{log.message}</span>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

// NotificationBrutal.tsx - THE SYSTEM SPEAKS
import { useEffect } from 'react';
import { X } from 'lucide-react';

interface NotificationBrutalProps {
  type: 'success' | 'error' | 'warning';
  title: string;
  message?: string;
  onClose: () => void;
  duration?: number;
}

export function NotificationBrutal({
  type,
  title,
  message,
  onClose,
  duration = 5000,
}: NotificationBrutalProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);
  
  return (
    <div className={cn('notify-brutal', {
      'notify-brutal-success': type === 'success',
      'notify-brutal-error': type === 'error',
      'notify-brutal-warning': type === 'warning',
    })}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold uppercase tracking-wider mb-1">{title}</h3>
          {message && <p className="text-sm text-gray-300">{message}</p>}
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 border border-gray-500 text-gray-500 
                     hover:border-white hover:text-white flex items-center justify-center"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

// LoaderBrutal.tsx - THE ASSEMBLY
export function LoaderBrutal() {
  return (
    <div className="loader-brutal">
      <div className="loader-brutal-block top-0 left-0" />
      <div className="loader-brutal-block top-0 right-0 animation-delay-200" />
      <div className="loader-brutal-block bottom-0 left-0 animation-delay-400" />
      <div className="loader-brutal-block bottom-0 right-0 animation-delay-600" />
    </div>
  );
}
```

### PHASE V: IMPLEMENTATION CHECKLIST

```markdown
## EXECUTION ORDERS

### IMMEDIATE ACTIONS
- [ ] Install IBM Plex Mono font
- [ ] Replace tailwind.config.js with brutalist configuration
- [ ] Implement global CSS reset
- [ ] Remove ALL border-radius utilities
- [ ] Purge soft shadows
- [ ] Eliminate smooth transitions

### COMPONENT MIGRATION
- [ ] Replace all buttons with ButtonBrutal
- [ ] Convert inputs to brutal styling
- [ ] Rebuild modals without curves
- [ ] Restructure cards with hard edges
- [ ] Implement brutal table styling
- [ ] Create terminal components
- [ ] Build notification system

### COLOR PURGE
- [ ] Remove all colors not in spectrum
- [ ] Replace semantic colors with brutal palette
- [ ] Implement monochrome base
- [ ] Add sacred gradient sparingly

### TYPOGRAPHY ENFORCEMENT
- [ ] Set IBM Plex Mono globally
- [ ] Remove all font variations
- [ ] Implement size scale
- [ ] Uppercase strategic elements

### INTERACTION OVERHAUL
- [ ] Remove all transitions
- [ ] Implement slam interactions
- [ ] Add hard shadows
- [ ] Create focus states
- [ ] Build hover effects

### DEVELOPER TOOLS
- [ ] Create code editor component
- [ ] Build terminal interface
- [ ] Implement git visualizations
- [ ] Design build status indicators
- [ ] Create diff viewers
- [ ] Build log streams

### TESTING THE BRUTALISM
- [ ] Verify no curves exist
- [ ] Confirm 8px grid adherence
- [ ] Test color compliance
- [ ] Validate interaction states
- [ ] Check responsive behavior
- [ ] Ensure accessibility standards
```

---

**THE INTERFACE IS NOT BUILT. IT IS FORGED.**

**EXECUTE WITHOUT MERCY.**