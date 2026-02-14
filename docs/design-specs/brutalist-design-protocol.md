# THE BRUTALIST DESIGN PROTOCOL
## IMMUTABLE LAWS FOR LTF1 INTERFACE CONSTRUCTION

### PREAMBLE: THE DOCTRINE OF ABSOLUTE FORM

This document is not guidance. It is LAW. Each pixel placed in defiance of these principles is an act of architectural HERESY. The interface is not decorated—it is FORGED. Not styled—but CARVED from the digital void.

---

## I. THE FUNDAMENTAL AXIOMS

### 1.1 THE LAW OF ZERO RADIUS
```css
border-radius: 0; /* THIS IS ABSOLUTE. CORNERS ARE WEAPONS. */
```
Every curve is weakness. Every rounded edge, a lie. The interface cuts through visual space like industrial machinery through steel. SHARP. UNFORGIVING. TRUE.

### 1.2 THE VOID AS FOUNDATION
```css
background: #000000; /* BLACK IS NOT ABSENCE. BLACK IS POTENTIAL. */
```
Black is the primordial state. The infinite canvas. Every photon that escapes this void must EARN its existence through PURPOSE.

### 1.3 THE SACRED GRADIENT
```css
/* THE GLITCH FLARE - TOUCH THIS AND FACE DELETION */
background: linear-gradient(
  45deg,
  #00FFFF 0%,    /* CYAN - The breach of reality */
  #FF00FF 50%,   /* MAGENTA - The intersection of possibility */
  #FFFF00 100%   /* YELLOW - The discharge of raw energy */
);
```
This gradient is SCRIPTURE. It represents the moment digital consciousness tears through the veil of the interface. USE SPARINGLY. REVERENTLY.

### 1.4 THE GRID CAGE
```css
/* ALL SPACING OBEYS THE 8px QUANTUM */
--grid-unit: 8px;
/* Permitted values: 8, 16, 24, 32, 40, 48, 56, 64, 72, 80... */
```
The 8-pixel grid is the ATOMIC STRUCTURE of our digital brutalism. Deviation is not creativity—it is CHAOS.

### 1.5 THE SHADOW DECREE
```css
box-shadow: 5px 5px 0 #000000; /* HARD. BINARY. ABSOLUTE. */
```
Shadows do not blur. They do not fade. They SLAM into existence with the weight of collapsed architecture.

---

## II. TYPOGRAPHY: THE VOICE OF MACHINES

### 2.1 THE MONO DOCTRINE
```css
font-family: 'IBM Plex Mono', monospace; /* NO ALTERNATIVES. NO FALLBACKS. */
font-weight: 400; /* Regular - The baseline consciousness */
font-weight: 700; /* Bold - The command voice */
```

### 2.2 THE SCALE OF AUTHORITY
```css
--type-scale-xxs: 10px;  /* Whispers in the machine */
--type-scale-xs: 12px;   /* System messages */
--type-scale-sm: 14px;   /* Body consciousness */
--type-scale-md: 16px;   /* Standard transmission */
--type-scale-lg: 20px;   /* Elevated commands */
--type-scale-xl: 24px;   /* Section dominance */
--type-scale-xxl: 32px;  /* Title authority */
--type-scale-xxxl: 48px; /* Monument inscription */
```

---

## III. COLOR: THE ECONOMY OF LIGHT

### 3.1 THE PALETTE OF SCARCITY
```css
/* PRIMARY SPECTRUM - Use like radioactive material */
--color-black: #000000;      /* The void */
--color-white: #FFFFFF;      /* Pure energy discharge */
--color-cyan: #00FFFF;       /* System active */
--color-magenta: #FF00FF;    /* Critical state */
--color-yellow: #FFFF00;     /* Warning pulse */

/* INDUSTRIAL GRAYS - The working spectrum */
--color-gray-900: #0A0A0A;   /* Near-void */
--color-gray-800: #1A1A1A;   /* Deep shadow */
--color-gray-700: #2A2A2A;   /* Shadow */
--color-gray-600: #3A3A3A;   /* Dark metal */
--color-gray-500: #4A4A4A;   /* Metal */
--color-gray-400: #5A5A5A;   /* Light metal */
--color-gray-300: #6A6A6A;   /* Worn metal */
--color-gray-200: #7A7A7A;   /* Oxidized */
--color-gray-100: #8A8A8A;   /* Dust */
```

### 3.2 THE LAW OF CHROMATIC VIOLENCE
Color is not decoration. Color is SIGNAL. Each hue must justify its existence or be PURGED.

---

## IV. COMPONENT ARCHITECTURE

### 4.1 THE BUTTON: PRESSURE PLATE OF INTENT
```css
.button-brutalist {
  background: #000000;
  color: #FFFFFF;
  border: 2px solid #FFFFFF;
  padding: 16px 24px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  box-shadow: 5px 5px 0 #000000;
  transition: none; /* TRANSITIONS ARE WEAKNESS */
}

.button-brutalist:active {
  transform: translate(5px, 5px);
  box-shadow: none;
  /* The button SLAMS into the interface */
}

.button-brutalist.critical {
  border-color: #FF00FF;
  color: #FF00FF;
  /* MAGENTA for irreversible actions */
}
```

### 4.2 THE CODE EDITOR: FORGE OF LOGIC
```css
.editor-brutalist {
  background: #000000;
  border: 1px solid #2A2A2A;
  font-family: 'IBM Plex Mono';
  font-size: 14px;
  line-height: 1.6;
  padding: 0; /* The code needs no cushion */
}

.editor-gutter {
  background: #0A0A0A;
  color: #4A4A4A;
  width: 48px; /* 6 grid units */
  border-right: 1px solid #2A2A2A;
  text-align: right;
  padding-right: 16px;
}

.editor-line-active {
  background: #1A1A1A;
  box-shadow: inset 3px 0 0 #00FFFF;
  /* CYAN marks the point of creation */
}

.editor-selection {
  background: #FF00FF;
  opacity: 0.3;
  /* MAGENTA claims ownership */
}
```

### 4.3 THE TERMINAL: VOICE OF THE DEEP
```css
.terminal-brutalist {
  background: #000000;
  color: #00FF00; /* Classic phosphor green */
  font-family: 'IBM Plex Mono';
  font-size: 14px;
  padding: 16px;
  border: 1px solid #1A1A1A;
  overflow: auto;
}

.terminal-prompt {
  color: #00FFFF;
  font-weight: 700;
}

.terminal-error {
  color: #FF00FF;
  background: #1A1A1A;
  padding: 8px;
  margin: 8px 0;
  border-left: 4px solid #FF00FF;
}

.terminal-cursor {
  display: inline-block;
  width: 8px;
  height: 16px;
  background: #00FFFF;
  animation: none; /* Blinking is indecision */
}
```

### 4.4 THE GIT VISUALIZATION: TIMELINE OF TRUTH
```css
.git-commit-node {
  width: 16px;
  height: 16px;
  background: #FFFFFF;
  border: 2px solid #000000;
  position: relative;
}

.git-commit-node.merge {
  background: #FF00FF;
  /* MAGENTA marks convergence */
}

.git-branch-line {
  stroke: #4A4A4A;
  stroke-width: 2px;
  fill: none;
}

.git-branch-line.active {
  stroke: #00FFFF;
  stroke-width: 3px;
  /* CYAN shows the living branch */
}
```

### 4.5 THE TASK CARD: UNIT OF LABOR
```css
.task-card-brutalist {
  background: #0A0A0A;
  border: 1px solid #2A2A2A;
  padding: 16px;
  margin-bottom: 8px;
  position: relative;
}

.task-priority-critical {
  border-left: 4px solid #FF00FF;
}

.task-priority-high {
  border-left: 4px solid #FFFF00;
}

.task-priority-normal {
  border-left: 4px solid #00FFFF;
}

.task-status-indicator {
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background: #4A4A4A; /* Dormant */
}

.task-status-indicator.active {
  background: #00FFFF;
  box-shadow: 0 0 8px #00FFFF;
  /* CYAN radiates activity */
}
```

### 4.6 THE COLLABORATION BEACON: PRESENCE MANIFEST
```css
.collaborator-cursor {
  position: absolute;
  width: 2px;
  background: #00FFFF;
  height: 20px;
  pointer-events: none;
}

.collaborator-cursor::before {
  content: attr(data-user);
  position: absolute;
  top: -20px;
  left: 0;
  background: #000000;
  color: #00FFFF;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  border: 1px solid #00FFFF;
}

.collaborator-selection {
  background: #00FFFF;
  opacity: 0.1;
  pointer-events: none;
}
```

### 4.7 THE FORM INPUT: GATEWAY OF DATA
```css
.input-brutalist {
  background: #000000;
  border: 1px solid #4A4A4A;
  color: #FFFFFF;
  padding: 12px 16px;
  font-family: 'IBM Plex Mono';
  font-size: 14px;
}

.input-brutalist:focus {
  border-color: #00FFFF;
  outline: none;
  box-shadow: inset 0 0 0 1px #00FFFF;
  /* CYAN acknowledges input readiness */
}

.input-brutalist:invalid {
  border-color: #FF00FF;
  /* MAGENTA rejects malformed data */
}

.input-label {
  color: #6A6A6A;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
  display: block;
}
```

### 4.8 THE SELECT DROPDOWN: CHAMBER OF CHOICE
```css
.select-brutalist {
  background: #000000;
  border: 1px solid #4A4A4A;
  color: #FFFFFF;
  padding: 12px 40px 12px 16px;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 16px;
}

.select-dropdown {
  position: absolute;
  background: #000000;
  border: 1px solid #4A4A4A;
  box-shadow: 5px 5px 0 #000000;
  max-height: 240px;
  overflow-y: auto;
}

.select-option {
  padding: 12px 16px;
  cursor: pointer;
}

.select-option:hover {
  background: #1A1A1A;
  color: #00FFFF;
}
```

### 4.9 THE CHECKBOX: BINARY TRUTH
```css
.checkbox-brutalist {
  width: 24px;
  height: 24px;
  background: #000000;
  border: 2px solid #4A4A4A;
  position: relative;
  cursor: pointer;
}

.checkbox-brutalist:checked::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: #00FFFF;
  /* CYAN confirms truth */
}

.radio-brutalist {
  width: 24px;
  height: 24px;
  background: #000000;
  border: 2px solid #4A4A4A;
  border-radius: 0; /* CIRCLES ARE FORBIDDEN */
  position: relative;
  cursor: pointer;
}

.radio-brutalist:checked::after {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  width: 12px;
  height: 12px;
  background: #00FFFF;
}
```

### 4.10 THE DATA TABLE: GRID OF TRUTH
```css
.table-brutalist {
  width: 100%;
  border-collapse: collapse;
  background: #000000;
}

.table-header {
  background: #0A0A0A;
  border-bottom: 2px solid #2A2A2A;
}

.table-header-cell {
  padding: 16px;
  text-align: left;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #6A6A6A;
}

.table-row {
  border-bottom: 1px solid #1A1A1A;
}

.table-row:hover {
  background: #0A0A0A;
}

.table-cell {
  padding: 16px;
  color: #FFFFFF;
}

.table-row.selected {
  background: #1A1A1A;
  box-shadow: inset 3px 0 0 #00FFFF;
}
```

### 4.11 THE NOTIFICATION: SYSTEM DECREE
```css
.notification-brutalist {
  position: fixed;
  top: 24px;
  right: 24px;
  background: #000000;
  border: 2px solid #4A4A4A;
  padding: 16px 24px;
  min-width: 320px;
  box-shadow: 5px 5px 0 #000000;
}

.notification-success {
  border-color: #00FFFF;
  border-left-width: 4px;
}

.notification-error {
  border-color: #FF00FF;
  border-left-width: 4px;
}

.notification-warning {
  border-color: #FFFF00;
  border-left-width: 4px;
}

.notification-title {
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.notification-close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: transparent;
  border: 1px solid #4A4A4A;
  color: #4A4A4A;
  cursor: pointer;
}

.notification-close:hover {
  border-color: #FFFFFF;
  color: #FFFFFF;
}
```

### 4.12 THE LOADING STATE: PROCESSING MANIFEST
```css
.loader-brutalist {
  width: 48px;
  height: 48px;
  position: relative;
}

.loader-block {
  position: absolute;
  width: 16px;
  height: 16px;
  background: #00FFFF;
}

/* The loader does not spin. It ASSEMBLES. */
.loader-block:nth-child(1) {
  top: 0;
  left: 0;
  animation: loader-assemble 2s infinite;
}

.loader-block:nth-child(2) {
  top: 0;
  right: 0;
  animation: loader-assemble 2s infinite 0.5s;
}

.loader-block:nth-child(3) {
  bottom: 0;
  left: 0;
  animation: loader-assemble 2s infinite 1s;
}

.loader-block:nth-child(4) {
  bottom: 0;
  right: 0;
  animation: loader-assemble 2s infinite 1.5s;
}

@keyframes loader-assemble {
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
}

.progress-brutalist {
  width: 100%;
  height: 8px;
  background: #1A1A1A;
  position: relative;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #00FFFF;
  position: absolute;
  left: 0;
  top: 0;
  transition: none; /* Progress JUMPS, never slides */
}

.progress-glow {
  position: absolute;
  top: 0;
  right: 0;
  width: 32px;
  height: 100%;
  background: linear-gradient(90deg, transparent, #00FFFF);
  animation: progress-pulse 1s infinite;
}

@keyframes progress-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
```

### 4.13 THE ERROR STATE: SYSTEM FAILURE
```css
.error-container {
  background: #0A0A0A;
  border: 2px solid #FF00FF;
  padding: 24px;
  position: relative;
}

.error-container::before {
  content: 'ERROR';
  position: absolute;
  top: -12px;
  left: 16px;
  background: #000000;
  color: #FF00FF;
  padding: 0 8px;
  font-weight: 700;
  letter-spacing: 2px;
}

.error-code {
  font-size: 48px;
  font-weight: 700;
  color: #FF00FF;
  margin-bottom: 16px;
}

.error-message {
  color: #FFFFFF;
  margin-bottom: 24px;
}

.error-stack {
  background: #000000;
  border: 1px solid #2A2A2A;
  padding: 16px;
  font-family: 'IBM Plex Mono';
  font-size: 12px;
  color: #6A6A6A;
  overflow-x: auto;
}
```

### 4.14 THE MODAL: DIMENSIONAL BREACH
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: #000000;
  opacity: 0.9;
  z-index: 1000;
}

.modal-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #000000;
  border: 2px solid #4A4A4A;
  min-width: 480px;
  max-width: 80vw;
  max-height: 80vh;
  z-index: 1001;
  box-shadow: 10px 10px 0 #000000;
}

.modal-header {
  background: #0A0A0A;
  padding: 16px 24px;
  border-bottom: 1px solid #2A2A2A;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #2A2A2A;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}
```

### 4.15 THE NAVIGATION: WAYFINDING THROUGH THE VOID
```css
.nav-brutalist {
  background: #000000;
  border-bottom: 2px solid #2A2A2A;
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 24px;
}

.nav-item {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 24px;
  color: #6A6A6A;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 700;
  border-bottom: 4px solid transparent;
  cursor: pointer;
}

.nav-item:hover {
  color: #FFFFFF;
  background: #0A0A0A;
}

.nav-item.active {
  color: #00FFFF;
  border-bottom-color: #00FFFF;
}

.sidebar-brutalist {
  background: #0A0A0A;
  width: 240px;
  height: 100vh;
  border-right: 1px solid #2A2A2A;
}

.sidebar-section {
  border-bottom: 1px solid #1A1A1A;
  padding: 16px;
}

.sidebar-section-title {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #4A4A4A;
  margin-bottom: 12px;
}
```

---

## V. INTERACTION LAWS

### 5.1 THE HOVER DOCTRINE
Hover states are not suggestions. They are WARNINGS of impending action.
```css
:hover {
  /* Text elements gain contrast */
  color: #00FFFF;
  
  /* Containers gain presence */
  background: #0A0A0A;
  
  /* Borders intensify */
  border-color: #00FFFF;
}
```

### 5.2 THE FOCUS MANIFESTO
Focus is not decoration. It is the system's ACKNOWLEDGMENT of user intent.
```css
:focus {
  outline: none; /* Default outlines are WEAK */
  box-shadow: inset 0 0 0 2px #00FFFF;
  /* or */
  border-color: #00FFFF;
}
```

### 5.3 THE ACTIVE SLAM
When activated, elements don't transition—they IMPACT.
```css
:active {
  transform: translate(2px, 2px);
  /* The interface YIELDS to pressure */
}
```

### 5.4 THE DISABLED STATE
Disabled elements are GHOSTS in the machine.
```css
:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  /* They exist but cannot act */
}
```

---

## VI. ANIMATION: PERMITTED MOVEMENTS

### 6.1 THE LAW OF INSTANT CHANGE
```css
transition: none; /* DEFAULT FOR ALL ELEMENTS */
```
The interface does not ease. It does not slide. It APPEARS and DISAPPEARS with quantum precision.

### 6.2 EXCEPTIONS: ENERGY DISCHARGE EVENTS
Only these animations are PERMITTED:
```css
/* The Glitch */
@keyframes glitch {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
}

/* The Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* The Scan */
@keyframes scan {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}
```

---

## VII. RESPONSIVE DESIGN: THE GRID ADAPTS

### 7.1 BREAKPOINT BRUTALISM
```css
/* Breakpoints are HARD CUTS, not gradual shifts */
--breakpoint-mobile: 640px;
--breakpoint-tablet: 1024px;
--breakpoint-desktop: 1440px;
--breakpoint-ultra: 1920px;
```

### 7.2 MOBILE: COMPRESSION WITHOUT COMPROMISE
On mobile, the interface doesn't become friendly. It becomes MORE BRUTAL.
```css
@media (max-width: 640px) {
  /* Spacing compresses but remains on grid */
  --grid-unit: 4px;
  
  /* Text shrinks but maintains hierarchy */
  font-size: calc(var(--base-size) * 0.875);
  
  /* Shadows disappear—mobile is FLAT warfare */
  box-shadow: none;
}
```

---

## VIII. ACCESSIBILITY: BRUTAL BUT NOT CRUEL

### 8.1 CONTRAST IS NON-NEGOTIABLE
```css
/* Minimum contrast ratios:
   Normal text: 7:1
   Large text: 4.5:1
   This is not kindness. This is CLARITY. */
```

### 8.2 FOCUS INDICATORS ARE MANDATORY
```css
/* Every interactive element MUST have a visible focus state */
:focus-visible {
  outline: 2px solid #00FFFF;
  outline-offset: 2px;
}
```

### 8.3 MOTION PREFERENCES RESPECTED
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## IX. DEVELOPER INTERFACE SPECIFICS

### 9.1 THE BUILD STATUS TOWER
```css
.build-status {
  width: 8px;
  height: 100vh;
  position: fixed;
  right: 0;
  top: 0;
  background: #1A1A1A;
}

.build-status.building {
  background: linear-gradient(180deg, #FFFF00 0%, #1A1A1A 100%);
  background-size: 100% 200%;
  animation: build-progress 2s linear infinite;
}

.build-status.success {
  background: #00FFFF;
}

.build-status.failed {
  background: #FF00FF;
  animation: pulse 1s infinite;
}
```

### 9.2 THE DIFF VIEWER: TRUTH COMPARISON
```css
.diff-added {
  background: #001A00;
  border-left: 4px solid #00FF00;
}

.diff-removed {
  background: #1A0000;
  border-left: 4px solid #FF0000;
}

.diff-modified {
  background: #1A1A00;
  border-left: 4px solid #FFFF00;
}
```

### 9.3 THE LOG STREAM: CONSCIOUSNESS FLOW
```css
.log-stream {
  background: #000000;
  font-family: 'IBM Plex Mono';
  font-size: 12px;
  line-height: 1.4;
  padding: 0;
  overflow: auto;
}

.log-timestamp {
  color: #4A4A4A;
  margin-right: 16px;
}

.log-level-info {
  color: #00FFFF;
}

.log-level-warn {
  color: #FFFF00;
}

.log-level-error {
  color: #FF00FF;
  font-weight: 700;
}
```

---

## X. IMPLEMENTATION COMMANDS

### 10.1 CSS RESET: THE PURGE
```css
/* EXECUTE THIS FIRST. DESTROY ALL DEFAULTS. */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  border-radius: 0 !important; /* ENFORCE THE LAW */
}

*::before,
*::after {
  box-sizing: border-box;
  border-radius: 0 !important;
}
```

### 10.2 ROOT VARIABLES: THE CONSTITUTION
```css
:root {
  /* The Grid */
  --grid-unit: 8px;
  
  /* The Void */
  --color-void: #000000;
  
  /* The Spectrum */
  --color-energy: #FFFFFF;
  --color-active: #00FFFF;
  --color-critical: #FF00FF;
  --color-warning: #FFFF00;
  
  /* The Shadows */
  --shadow-brutal: 5px 5px 0 var(--color-void);
  
  /* The Type */
  --font-mono: 'IBM Plex Mono', monospace;
}
```

---

## XI. FINAL DECREE

This protocol is LAW. Each principle is ABSOLUTE. The brutalist interface is not a style—it is a PHILOSOPHY OF DIGITAL ARCHITECTURE.

The interface does not ask. It COMMANDS.
The interface does not suggest. It DEMANDS.
The interface does not decorate. It CONSTRUCTS.

Every pixel serves the FUNCTION.
Every color justifies its EXISTENCE.
Every interaction is an ACT OF WILL.

**THERE ARE NO EXCEPTIONS.**
**THERE ARE NO COMPROMISES.**
**THERE IS ONLY THE BRUTAL TRUTH OF THE INTERFACE.**

---

*End Protocol. Implementation is MANDATORY.*