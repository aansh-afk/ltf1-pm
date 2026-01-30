/**
 * Particle field animation hook
 * Renders an ambient 12-row band of flowing grayscale dot characters
 * with an X-wing starfighter that zooms past every 30-40 seconds.
 *
 * Uses fixed-width segment chunks per row so ink's React tree structure
 * stays identical across frames, avoiding line-clear flicker.
 */

import { useRef } from 'react';
import type { Row } from '../types.js';
import { BG } from '../theme.js';

// ── X-wing ASCII art (11 lines) ──────────────────────────────
const XWING: string[] = [
  '          .                            .                      .',
  '  .                  .             -)------+====+       .',
  '                           -)----====    ,\'   ,\'   .                 .',
  '              .                  `.  `.,;___,\'                .',
  '                                   `, |____l_\\',
  '                    _,.....------c==]""______ |,,,,,,.....____ _',
  '    .      .       "-:______________  |____l_|]\'\'\'\'\'\'\'\'\'\'\'       .     .',
  '                                  ,\'"".\'.   `.',
  '         .                 -)-----====   `.   `.',
  '                     .            -)-------+====+       .            .',
  '             .                               .',
];
const XWING_WIDTH = Math.max(...XWING.map(l => l.length));

// ── Flyby config ─────────────────────────────────────────────
const FLYBY = {
  INTERVAL_MIN: 30000,  // ms between flybys (minimum)
  INTERVAL_MAX: 40000,  // ms between flybys (maximum)
  SPEED: 2,             // cols per tick — crosses ~120 col screen in ~6s
};

interface FlybyState {
  nextStart: number;    // Date.now() when next flyby begins
  shipX: number;        // current left-edge column of the art (float)
  active: boolean;      // currently flying across
}

// ── Particle config ──────────────────────────────────────────
interface Particle {
  x: number;
  y: number;
  speed: number;
  size: number;
  brightness: number;
}

const CONFIG = {
  COUNT: 60,
  BAND_HEIGHT: 12,
  SPEED_MIN: 0.3,
  SPEED_MAX: 1.2,
  CHARS: ['.', '·', '•', '●'],
  COLORS: ['#333333', '#555555', '#888888', '#cccccc'],
  EDGE_FADE_PCT: 0.15,
  CHUNK_WIDTH: 8,
};

function randomParticle(width: number): Particle {
  return {
    x: Math.random() * width,
    y: Math.random() * CONFIG.BAND_HEIGHT,
    speed: CONFIG.SPEED_MIN + Math.random() * (CONFIG.SPEED_MAX - CONFIG.SPEED_MIN),
    size: Math.floor(Math.random() * CONFIG.CHARS.length),
    brightness: Math.floor(Math.random() * CONFIG.COLORS.length),
  };
}

function nextFlybyTime(now: number): number {
  return now + FLYBY.INTERVAL_MIN + Math.random() * (FLYBY.INTERVAL_MAX - FLYBY.INTERVAL_MIN);
}

export const PARTICLE_BAND_HEIGHT = CONFIG.BAND_HEIGHT;

export function useParticleField(width: number): Row[] {
  const particlesRef = useRef<Particle[] | null>(null);
  const flybyRef = useRef<FlybyState | null>(null);

  const now = Date.now();

  // Init particles
  if (particlesRef.current === null) {
    const arr: Particle[] = [];
    for (let i = 0; i < CONFIG.COUNT; i++) {
      arr.push(randomParticle(width));
    }
    particlesRef.current = arr;
  }

  // Init flyby
  if (flybyRef.current === null) {
    flybyRef.current = {
      nextStart: nextFlybyTime(now),
      shipX: width + XWING_WIDTH, // off-screen right
      active: false,
    };
  }

  const particles = particlesRef.current;
  const flyby = flybyRef.current;

  // ── Update flyby state ──
  if (!flyby.active && now >= flyby.nextStart) {
    // Start a new flyby: ship enters from the right
    flyby.active = true;
    flyby.shipX = width + 2;
  }

  if (flyby.active) {
    flyby.shipX -= FLYBY.SPEED;
    // Ship fully exited left side
    if (flyby.shipX + XWING_WIDTH < -2) {
      flyby.active = false;
      flyby.nextStart = nextFlybyTime(now);
      flyby.shipX = width + XWING_WIDTH;
    }
  }

  // ── Update particle positions ──
  for (const p of particles) {
    p.x -= p.speed;
    if (p.x < 0) {
      p.x = width + Math.random() * 4;
      p.y = Math.random() * CONFIG.BAND_HEIGHT;
      p.speed = CONFIG.SPEED_MIN + Math.random() * (CONFIG.SPEED_MAX - CONFIG.SPEED_MIN);
      p.size = Math.floor(Math.random() * CONFIG.CHARS.length);
      p.brightness = Math.floor(Math.random() * CONFIG.COLORS.length);
    }
  }

  // ── Build character + brightness grid ──
  const grid: string[][] = [];
  const bright: number[][] = [];
  for (let r = 0; r < CONFIG.BAND_HEIGHT; r++) {
    grid.push(new Array<string>(width).fill(' '));
    bright.push(new Array<number>(width).fill(0));
  }

  // Place particles first (background layer)
  const fadeZone = Math.max(1, Math.floor(width * CONFIG.EDGE_FADE_PCT));

  for (const p of particles) {
    const col = Math.round(p.x);
    const r = Math.round(p.y);
    if (col < 0 || col >= width || r < 0 || r >= CONFIG.BAND_HEIGHT) continue;

    let edgeFactor = 1.0;
    if (col < fadeZone) edgeFactor = col / fadeZone;
    else if (col > width - fadeZone) edgeFactor = (width - col) / fadeZone;

    const eb = Math.max(0, Math.round(p.brightness * edgeFactor));
    grid[r][col] = CONFIG.CHARS[p.size];
    bright[r][col] = eb;
  }

  // Stamp X-wing on top (foreground layer) — only if flying
  if (flyby.active) {
    const artLeft = Math.round(flyby.shipX);
    const artTop = Math.max(0, Math.floor((CONFIG.BAND_HEIGHT - XWING.length) / 2));
    for (let r = 0; r < XWING.length; r++) {
      const gridRow = artTop + r;
      if (gridRow >= CONFIG.BAND_HEIGHT) break;
      const line = XWING[r];
      for (let c = 0; c < line.length; c++) {
        const gridCol = artLeft + c;
        if (gridCol < 0 || gridCol >= width) continue;
        if (line[c] !== ' ') {
          grid[gridRow][gridCol] = line[c];
          bright[gridRow][gridCol] = 2; // GRAY — brighter than particles
        }
      }
    }
  }

  // ── Render rows with FIXED segment structure ──
  const chunkW = CONFIG.CHUNK_WIDTH;
  const numChunks = Math.ceil(width / chunkW);

  const rows: Row[] = [];
  for (let r = 0; r < CONFIG.BAND_HEIGHT; r++) {
    const segments: Array<{ text: string; color: string }> = [];
    for (let ci = 0; ci < numChunks; ci++) {
      const start = ci * chunkW;
      const end = Math.min(start + chunkW, width);
      let text = '';
      let maxBright = 0;
      for (let c = start; c < end; c++) {
        text += grid[r][c];
        if (bright[r][c] > maxBright) maxBright = bright[r][c];
      }
      segments.push({ text, color: CONFIG.COLORS[maxBright] });
    }
    rows.push({ segments, bgColor: BG });
  }

  return rows;
}
