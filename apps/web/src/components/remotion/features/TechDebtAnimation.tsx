import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

const F: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };

const HEALTH = [
  { label: 'COMPLEXITY', value: 67, color: '#F59E0B', delta: '+5%' },
  { label: 'COVERAGE', value: 34, color: '#EF4444', delta: '-3%' },
  { label: 'DRIFT', value: 12, color: '#22C55E', delta: '+2%' },
  { label: 'DUPLICATION', value: 28, color: '#F59E0B', delta: '+1%' },
];

const ISSUES = [
  { file: 'auth.ts', sev: 'CRIT' as const, sevColor: '#EF4444', msg: 'complexity exceeds threshold' },
  { file: 'db.ts', sev: 'CRIT' as const, sevColor: '#EF4444', msg: 'coverage below 20%' },
  { file: 'utils.ts', sev: 'WARN' as const, sevColor: '#F59E0B', msg: '4 duplicate patterns' },
];

const TREND = [62, 64, 68, 63, 65, 67];
const TREND_LABELS = ['S9', 'S10', 'S11', 'S12', 'S13', 'S14'];

const HEADER_TEXT = 'DEBT SCANNER';

function typeText(text: string, frame: number, startFrame: number, charsPerFrame: number): string {
  const elapsed = Math.max(0, frame - startFrame);
  const chars = Math.floor(elapsed * charsPerFrame);
  return text.slice(0, Math.min(chars, text.length));
}

function GaugeRing({
  value,
  color,
  frame,
  fps,
  startFrame,
}: {
  value: number;
  color: string;
  frame: number;
  fps: number;
  startFrame: number;
}) {
  const size = 100;
  const strokeW = 8;
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const targetOffset = circ * (1 - value / 100);

  const fillProgress = interpolate(frame, [startFrame, startFrame + 40], [circ, targetOffset], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const countUp = interpolate(frame, [startFrame, startFrame + 40], [0, value], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const labelOpacity = interpolate(frame, [startFrame + 10, startFrame + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const deltaScale = spring({
    frame: frame - (startFrame + 44),
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.6 },
  });

  const deltaOpacity = frame >= startFrame + 44 ? 1 : 0;

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#2E2E35"
          strokeWidth={strokeW}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeDasharray={circ}
          strokeDashoffset={fillProgress}
          strokeLinecap="butt"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color,
          marginTop: 6,
          ...F,
        }}
      >
        {Math.round(countUp)}%
      </div>
      <div
        style={{
          fontSize: 13,
          color: '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginTop: 4,
          opacity: labelOpacity,
          ...F,
        }}
      >
        {HEALTH[HEALTH.findIndex((h) => h.value === value)]?.label}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color,
          marginTop: 6,
          opacity: deltaOpacity,
          transform: `scale(${deltaScale})`,
          ...F,
        }}
      >
        {HEALTH[HEALTH.findIndex((h) => h.value === value)]?.delta}
      </div>
    </div>
  );
}

export default function TechDebtAnimation() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === FRAME 0-30: Header ===
  const headerTyped = typeText(HEADER_TEXT, frame, 0, 1.5);
  const warningPulse = 0.5 + 0.5 * Math.sin(frame * 0.3);
  const sprintOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // === FRAME 30-90: Scan progress bar ===
  const scanWidth = interpolate(frame, [30, 88], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scanBarOpacity = interpolate(frame, [28, 32], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scanText = frame < 30 ? '' : frame < 60 ? 'scanning...' : 'complete';
  const scanTextColor = frame >= 60 ? '#22C55E' : '#9CA3AF';

  // === FRAME 60-120: Gauges ===
  const gaugesOpacity = interpolate(frame, [58, 62], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // === FRAME 120-180: Issue cards ===
  const issueCards = ISSUES.map((issue, i) => {
    const cardStart = 120 + i * 15;
    const slideY = interpolate(frame, [cardStart, cardStart + 20], [80, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const cardOpacity = interpolate(frame, [cardStart, cardStart + 15], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const badgeScale = spring({
      frame: frame - (cardStart + 8),
      fps,
      config: { damping: 10, stiffness: 180, mass: 0.5 },
    });
    const isCrit = issue.sev === 'CRIT';
    const critPulse = isCrit ? 0.4 + 0.6 * Math.sin(frame * 0.2 + i) : 0;
    const critBorderColor = isCrit
      ? `rgba(239, 68, 68, ${0.4 + 0.6 * (0.5 + 0.5 * Math.sin(frame * 0.15 + i))})`
      : '#2E2E35';

    return { ...issue, slideY, cardOpacity, badgeScale, critPulse, critBorderColor, cardStart };
  });

  // === FRAME 180-240: Trend chart ===
  const trendMin = 57;
  const trendMax = 72;
  const chartW = 400;
  const chartH = 140;
  const toX = (i: number) => 30 + (i / (TREND.length - 1)) * (chartW - 60);
  const toY = (v: number) => chartH - 15 - ((v - trendMin) / (trendMax - trendMin)) * (chartH - 30);
  const pathD = TREND.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`).join(' ');

  // Total line length approximation
  let lineLen = 0;
  for (let i = 1; i < TREND.length; i++) {
    const dx = toX(i) - toX(i - 1);
    const dy = toY(TREND[i]) - toY(TREND[i - 1]);
    lineLen += Math.sqrt(dx * dx + dy * dy);
  }

  const lineDrawProgress = interpolate(frame, [180, 225], [lineLen, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const thresholdY = toY(65);
  const thresholdOpacity = interpolate(frame, [200, 215], [0, 0.7], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const endDotPulse = 0.5 + 0.5 * Math.sin(frame * 0.25);
  const endDotOpacity = interpolate(frame, [220, 230], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const actionText = 'ACTION RECOMMENDED';
  const actionTyped = typeText(actionText, frame, 225, 1.2);
  const chartOpacity = interpolate(frame, [178, 182], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // === FRAME 240-270: Ticket cards ===
  const ticket1SlideX = interpolate(frame, [240, 258], [-300, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ticket1Opacity = interpolate(frame, [240, 252], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ticket2SlideX = interpolate(frame, [250, 268], [-300, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ticket2Opacity = interpolate(frame, [250, 262], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#050505',
        padding: '36px 48px',
        ...F,
      }}
    >
      {/* === HEADER === */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: '#EF4444',
              opacity: warningPulse,
              ...F,
            }}
          >
            !
          </span>
          <span
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#F9FAFB',
              letterSpacing: '0.08em',
              ...F,
            }}
          >
            {headerTyped}
            <span
              style={{
                opacity: frame % 20 < 10 ? 1 : 0,
                color: '#6B7280',
              }}
            >
              _
            </span>
          </span>
        </div>
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#06B6D4',
            letterSpacing: '0.06em',
            opacity: sprintOpacity,
            ...F,
          }}
        >
          SPRINT 14
        </span>
      </div>

      {/* === SCAN BAR === */}
      <div style={{ opacity: scanBarOpacity, marginBottom: 18 }}>
        <div
          style={{
            width: '100%',
            height: 8,
            backgroundColor: '#1F1F23',
            border: '2px solid #2E2E35',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${scanWidth}%`,
              backgroundColor: frame >= 60 ? '#22C55E' : '#6366F1',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
          }}
        >
          <span
            style={{
              fontSize: 14,
              color: scanTextColor,
              letterSpacing: '0.04em',
              ...F,
            }}
          >
            {scanText}
          </span>
          <span
            style={{
              fontSize: 14,
              color: '#6B7280',
              ...F,
            }}
          >
            {Math.round(scanWidth)}%
          </span>
        </div>
      </div>

      {/* === GAUGES === */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 24,
          marginBottom: 24,
          opacity: gaugesOpacity,
        }}
      >
        {HEALTH.map((h, i) => (
          <div
            key={h.label}
            style={{
              flex: 1,
              border: '2px solid #2E2E35',
              backgroundColor: '#0A0A0A',
              padding: '16px 8px 12px',
            }}
          >
            <GaugeRing
              value={h.value}
              color={h.color}
              frame={frame}
              fps={fps}
              startFrame={60 + i * 8}
            />
          </div>
        ))}
      </div>

      {/* === BOTTOM SECTION === */}
      <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0 }}>
        {/* LEFT: Issue cards + Tickets */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* Issue Cards */}
          <div
            style={{
              border: '2px solid #2E2E35',
              backgroundColor: '#0A0A0A',
              padding: '14px 18px',
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#EF4444',
                letterSpacing: '0.06em',
                marginBottom: 12,
                ...F,
              }}
            >
              ISSUES FLAGGED
            </div>
            {issueCards.map((card) => (
              <div
                key={card.file}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 12px',
                  marginBottom: 6,
                  backgroundColor: '#111111',
                  border: `2px solid ${card.critBorderColor}`,
                  opacity: card.cardOpacity,
                  transform: `translateY(${card.slideY}px)`,
                  ...F,
                }}
              >
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#F9FAFB',
                    width: 90,
                    flexShrink: 0,
                  }}
                >
                  {card.file}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: card.sevColor,
                    border: `2px solid ${card.sevColor}`,
                    padding: '2px 8px',
                    flexShrink: 0,
                    letterSpacing: '0.06em',
                    transform: `scale(${card.badgeScale})`,
                    display: 'inline-block',
                  }}
                >
                  {card.sev}
                </span>
                <span
                  style={{
                    fontSize: 14,
                    color: '#9CA3AF',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {card.msg}
                </span>
              </div>
            ))}
          </div>

          {/* Ticket cards */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div
              style={{
                flex: 1,
                border: '2px solid #06B6D4',
                backgroundColor: '#0A0A0A',
                padding: '10px 16px',
                opacity: ticket1Opacity,
                transform: `translateX(${ticket1SlideX}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: '#6B7280',
                  letterSpacing: '0.04em',
                  ...F,
                }}
              >
                AUTO-CREATED
              </span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#06B6D4',
                  letterSpacing: '0.04em',
                  ...F,
                }}
              >
                DEBT-12
              </span>
            </div>
            <div
              style={{
                flex: 1,
                border: '2px solid #06B6D4',
                backgroundColor: '#0A0A0A',
                padding: '10px 16px',
                opacity: ticket2Opacity,
                transform: `translateX(${ticket2SlideX}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: '#6B7280',
                  letterSpacing: '0.04em',
                  ...F,
                }}
              >
                AUTO-CREATED
              </span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#06B6D4',
                  letterSpacing: '0.04em',
                  ...F,
                }}
              >
                DEBT-13
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Trend chart */}
        <div
          style={{
            width: '44%',
            flexShrink: 0,
            border: '2px solid #2E2E35',
            backgroundColor: '#0A0A0A',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            opacity: chartOpacity,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#6B7280',
              letterSpacing: '0.06em',
              marginBottom: 10,
              ...F,
            }}
          >
            DEBT TREND
          </div>

          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              style={{ width: '100%', height: '100%' }}
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Grid lines */}
              {[60, 63, 65, 68, 71].map((v) => (
                <line
                  key={v}
                  x1={25}
                  y1={toY(v)}
                  x2={chartW - 10}
                  y2={toY(v)}
                  stroke="#1F1F23"
                  strokeWidth={1}
                />
              ))}

              {/* Y-axis labels */}
              {[60, 65, 70].map((v) => (
                <text
                  key={v}
                  x={18}
                  y={toY(v) + 4}
                  fill="#6B7280"
                  fontSize={11}
                  textAnchor="end"
                  fontFamily="'IBM Plex Mono', monospace"
                >
                  {v}
                </text>
              ))}

              {/* Threshold line */}
              <line
                x1={25}
                y1={thresholdY}
                x2={chartW - 10}
                y2={thresholdY}
                stroke="#EF4444"
                strokeWidth={1.5}
                strokeDasharray="8,5"
                opacity={thresholdOpacity}
              />
              <text
                x={chartW - 8}
                y={thresholdY - 6}
                fill="#EF4444"
                fontSize={10}
                textAnchor="end"
                fontFamily="'IBM Plex Mono', monospace"
                opacity={thresholdOpacity}
              >
                LIMIT
              </text>

              {/* Main trend line */}
              <path
                d={pathD}
                fill="none"
                stroke="#F59E0B"
                strokeWidth={3}
                strokeDasharray={lineLen}
                strokeDashoffset={lineDrawProgress}
              />

              {/* Data points */}
              {TREND.map((v, i) => {
                const dotOpacity = interpolate(
                  frame,
                  [185 + i * 7, 190 + i * 7],
                  [0, 1],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                );
                return (
                  <circle
                    key={i}
                    cx={toX(i)}
                    cy={toY(v)}
                    r={i === TREND.length - 1 ? 5 + 2 * endDotPulse : 4}
                    fill={i === TREND.length - 1 ? '#F59E0B' : '#0A0A0A'}
                    stroke="#F59E0B"
                    strokeWidth={2}
                    opacity={i === TREND.length - 1 ? endDotOpacity : dotOpacity}
                  />
                );
              })}
            </svg>
          </div>

          {/* Sprint labels */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingLeft: 20,
              paddingRight: 6,
              marginTop: 4,
            }}
          >
            {TREND_LABELS.map((l, i) => (
              <span
                key={l}
                style={{
                  fontSize: 13,
                  color: i === TREND_LABELS.length - 1 ? '#F9FAFB' : '#6B7280',
                  fontWeight: i === TREND_LABELS.length - 1 ? 700 : 400,
                  ...F,
                }}
              >
                {l}
              </span>
            ))}
          </div>

          {/* ACTION RECOMMENDED */}
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#F59E0B',
              letterSpacing: '0.06em',
              marginTop: 12,
              ...F,
            }}
          >
            {actionTyped}
            {frame >= 225 && actionTyped.length < actionText.length && (
              <span style={{ opacity: frame % 16 < 8 ? 1 : 0, color: '#6B7280' }}>_</span>
            )}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
