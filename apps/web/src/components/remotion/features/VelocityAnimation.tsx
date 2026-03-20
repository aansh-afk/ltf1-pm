import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

const F: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };

const BG = '#0A0A0A';
const CARD = '#111111';
const BORDER = '#2E2E35';
const WHITE = '#F9FAFB';
const GREEN = '#22C55E';
const PURPLE = '#8B5CF6';
const RED = '#EF4444';
const CYAN = '#06B6D4';
const GRAY = '#6B7280';
const SECONDARY = '#9CA3AF';

const METRICS = [
  { label: 'COMMITS', value: 82, max: 100, change: '+12%', color: GREEN },
  { label: 'MERGED', value: 47, max: 100, change: '+23%', color: GREEN },
  { label: 'DEPLOYED', value: 31, max: 100, change: '+8%', color: GREEN },
  { label: 'REVERTED', value: 2, max: 100, change: '-50%', color: RED },
];

const SPRINTS = [
  { label: 'S11', value: 48 },
  { label: 'S12', value: 57 },
  { label: 'S13', value: 64 },
  { label: 'S14', value: 71 },
];

const PIPELINE = [
  { label: 'Commit', time: '2.1d', bottleneck: true },
  { label: 'PR Open', time: '4.2h', bottleneck: false },
  { label: 'Review', time: '1.3h', bottleneck: false },
  { label: 'Merge', time: '0.4h', bottleneck: false },
  { label: 'Deploy', time: '1.1h', bottleneck: false },
];

const TREND_TEXT = 'shipping 23% faster than last sprint';

// Chart dimensions
const CHART_X = 60;
const CHART_Y = 20;
const CHART_W = 460;
const CHART_H = 100;
const CHART_MAX = 80;

function getChartPoints(): Array<{ x: number; y: number; value: number }> {
  return SPRINTS.map((s, i) => ({
    x: CHART_X + (i / (SPRINTS.length - 1)) * CHART_W,
    y: CHART_Y + CHART_H - (s.value / CHART_MAX) * CHART_H,
    value: s.value,
  }));
}

function getPolylineString(pts: Array<{ x: number; y: number }>): string {
  return pts.map((p) => `${p.x},${p.y}`).join(' ');
}

function getAreaString(pts: Array<{ x: number; y: number }>): string {
  const first = pts[0];
  const last = pts[pts.length - 1];
  return `${first.x},${CHART_Y + CHART_H} ${getPolylineString(pts)} ${last.x},${CHART_Y + CHART_H}`;
}

function getPolylineLength(pts: Array<{ x: number; y: number }>): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}

export default function VelocityAnimation() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── PHASE 1: Header (0-30) ──
  const headerOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const badgeOpacity = interpolate(frame, [8, 25], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const pulseScale = 1 + 0.3 * Math.sin(frame * 0.1);

  // ── PHASE 2: Metric bars (30-90) ──
  const BAR_MAX_W = 340;
  const metricBarData = METRICS.map((m, i) => {
    const start = 30 + i * 12;
    const barProgress = spring({
      frame: frame - start,
      fps,
      config: { damping: 14, stiffness: 80, mass: 0.8 },
    });
    const targetW = (m.value / m.max) * BAR_MAX_W;
    const barWidth = targetW * barProgress;
    const counterVal = Math.floor(
      interpolate(frame, [start, start + 30], [0, m.value], {
        extrapolateRight: 'clamp',
        extrapolateLeft: 'clamp',
      })
    );
    const changeScale = spring({
      frame: frame - (start + 25),
      fps,
      config: { damping: 10, stiffness: 120, mass: 0.6 },
    });
    const rowOpacity = interpolate(frame, [start, start + 5], [0, 1], {
      extrapolateRight: 'clamp',
      extrapolateLeft: 'clamp',
    });
    return { ...m, barWidth, counterVal, changeScale, rowOpacity };
  });

  // ── PHASE 3: Chart (90-150) ──
  const chartPoints = getChartPoints();
  const totalLen = getPolylineLength(chartPoints);
  const chartDrawProgress = interpolate(frame, [90, 140], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const dashOffset = totalLen * (1 - chartDrawProgress);
  const areaOpacity = interpolate(frame, [100, 145], [0, 0.15], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  const chartLabelOpacity = interpolate(frame, [90, 100], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  const percentCounter = Math.floor(
    interpolate(frame, [95, 145], [0, 47], {
      extrapolateRight: 'clamp',
      extrapolateLeft: 'clamp',
    })
  );

  // ── PHASE 4: Pipeline (150-210) ──
  const pipelineItems = PIPELINE.map((p, i) => {
    const start = 150 + i * 10;
    const slideX = interpolate(frame, [start, start + 15], [-200, 0], {
      extrapolateRight: 'clamp',
      extrapolateLeft: 'clamp',
    });
    const slideOpacity = interpolate(frame, [start, start + 10], [0, 1], {
      extrapolateRight: 'clamp',
      extrapolateLeft: 'clamp',
    });
    const arrowOpacity =
      i > 0
        ? interpolate(frame, [start + 5, start + 12], [0, 1], {
            extrapolateRight: 'clamp',
            extrapolateLeft: 'clamp',
          })
        : 0;
    const bottleneckOpacity = p.bottleneck
      ? interpolate(frame, [start + 15, start + 22], [0, 1], {
          extrapolateRight: 'clamp',
          extrapolateLeft: 'clamp',
        })
      : 0;
    return { ...p, slideX, slideOpacity, arrowOpacity, bottleneckOpacity };
  });

  // ── PHASE 5: Pulse + typewriter (210-270) ──
  const activeStage =
    frame >= 210 ? Math.floor(((frame - 210) % 60) / 12) : -1;

  const typedChars = Math.floor(
    interpolate(frame, [215, 265], [0, TREND_TEXT.length], {
      extrapolateRight: 'clamp',
      extrapolateLeft: 'clamp',
    })
  );
  const trendText = TREND_TEXT.slice(0, typedChars);
  const trendOpacity = interpolate(frame, [215, 220], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        ...F,
        backgroundColor: BG,
        padding: 32,
        boxSizing: 'border-box',
      }}
    >
      {/* ─── HEADER ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          opacity: headerOpacity,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: WHITE,
              letterSpacing: '0.08em',
            }}
          >
            VELOCITY
          </span>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: GREEN,
              transform: `scale(${pulseScale})`,
            }}
          />
        </div>
        <span
          style={{
            fontSize: 13,
            color: CYAN,
            letterSpacing: '0.06em',
            opacity: badgeOpacity,
          }}
        >
          LAST 14 DAYS
        </span>
      </div>

      {/* ─── METRIC BARS ─── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          marginBottom: 20,
        }}
      >
        {metricBarData.map((m) => (
          <div
            key={m.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              opacity: m.rowOpacity,
              height: 32,
            }}
          >
            {/* Label */}
            <span
              style={{
                fontSize: 11,
                color: GRAY,
                letterSpacing: '0.05em',
                width: 80,
                textAlign: 'right',
              }}
            >
              {m.label}
            </span>

            {/* Bar container */}
            <div
              style={{
                flex: 1,
                height: 24,
                backgroundColor: CARD,
                border: `2px solid ${BORDER}`,
                borderRadius: 0,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: m.barWidth,
                  backgroundColor: m.color,
                  opacity: 0.8,
                }}
              />
            </div>

            {/* Counter */}
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: WHITE,
                width: 40,
                textAlign: 'right',
              }}
            >
              {m.counterVal}
            </span>

            {/* Change badge */}
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: m.color,
                transform: `scale(${m.changeScale})`,
                width: 50,
              }}
            >
              {m.changeScale > 0.05 ? m.change : ''}
            </span>
          </div>
        ))}
      </div>

      {/* ─── SPRINT VELOCITY CHART + COUNTER ─── */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* Chart panel */}
        <div
          style={{
            flex: 1,
            border: `2px solid ${BORDER}`,
            backgroundColor: CARD,
            padding: 12,
            position: 'relative',
            opacity: chartLabelOpacity,
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: GRAY,
              letterSpacing: '0.06em',
              display: 'block',
              marginBottom: 4,
            }}
          >
            SPRINT VELOCITY
          </span>

          <svg
            width="100%"
            height={140}
            viewBox={`0 0 ${CHART_X + CHART_W + 30} ${CHART_Y + CHART_H + 30}`}
            style={{ display: 'block' }}
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const y = CHART_Y + CHART_H - t * CHART_H;
              return (
                <line
                  key={t}
                  x1={CHART_X}
                  y1={y}
                  x2={CHART_X + CHART_W}
                  y2={y}
                  stroke={BORDER}
                  strokeWidth={1}
                />
              );
            })}

            {/* Area fill */}
            <polygon
              points={getAreaString(chartPoints)}
              fill={PURPLE}
              opacity={areaOpacity}
            />

            {/* Line */}
            <polyline
              points={getPolylineString(chartPoints)}
              fill="none"
              stroke={PURPLE}
              strokeWidth={3}
              strokeDasharray={totalLen}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points + labels */}
            {chartPoints.map((pt, i) => {
              const dotStart = 100 + i * 12;
              const dotScale = spring({
                frame: frame - dotStart,
                fps,
                config: { damping: 10, stiffness: 100, mass: 0.5 },
              });
              const labelOpacity = interpolate(
                frame,
                [dotStart + 5, dotStart + 12],
                [0, 1],
                { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' }
              );
              return (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={5 * dotScale}
                    fill={PURPLE}
                    stroke={BG}
                    strokeWidth={2}
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 14}
                    textAnchor="middle"
                    fill={WHITE}
                    fontSize={12}
                    fontFamily="'IBM Plex Mono', monospace"
                    fontWeight={600}
                    opacity={labelOpacity}
                  >
                    {pt.value}
                  </text>
                  <text
                    x={pt.x}
                    y={CHART_Y + CHART_H + 18}
                    textAnchor="middle"
                    fill={GRAY}
                    fontSize={11}
                    fontFamily="'IBM Plex Mono', monospace"
                    opacity={labelOpacity}
                  >
                    {SPRINTS[i].label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* +47% counter panel */}
        <div
          style={{
            width: 130,
            border: `2px solid ${BORDER}`,
            backgroundColor: CARD,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            opacity: chartLabelOpacity,
          }}
        >
          <span
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: GREEN,
              lineHeight: 1,
            }}
          >
            +{percentCounter}%
          </span>
          <span style={{ fontSize: 10, color: SECONDARY, lineHeight: 1.3 }}>
            over 4 sprints
          </span>
          <span style={{ fontSize: 10, color: GRAY, lineHeight: 1.3 }}>
            92% consistency
          </span>
        </div>
      </div>

      {/* ─── CYCLE TIME PIPELINE ─── */}
      <div
        style={{
          border: `2px solid ${BORDER}`,
          backgroundColor: CARD,
          padding: '12px 16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: GRAY,
              letterSpacing: '0.06em',
            }}
          >
            CYCLE TIME
          </span>
          {/* Trend typewriter */}
          <span
            style={{
              fontSize: 11,
              color: GREEN,
              opacity: trendOpacity,
            }}
          >
            {trendText}
            {typedChars < TREND_TEXT.length && frame >= 215 ? (
              <span
                style={{
                  opacity: Math.sin(frame * 0.3) > 0 ? 1 : 0,
                }}
              >
                _
              </span>
            ) : null}
          </span>
        </div>

        {/* Pipeline stages */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
          }}
        >
          {pipelineItems.map((stage, i) => {
            const isHighlighted = frame >= 210 && activeStage === i;
            const borderColor = stage.bottleneck
              ? RED
              : isHighlighted
                ? CYAN
                : BORDER;
            const bgColor = isHighlighted
              ? `${CYAN}15`
              : stage.bottleneck && stage.bottleneckOpacity > 0.5
                ? `${RED}10`
                : 'transparent';

            return (
              <div
                key={stage.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flex: 1,
                }}
              >
                {/* Arrow connector */}
                {i > 0 && (
                  <span
                    style={{
                      fontSize: 16,
                      color: isHighlighted ? CYAN : BORDER,
                      margin: '0 4px',
                      opacity: stage.arrowOpacity,
                      flexShrink: 0,
                    }}
                  >
                    {'\u2192'}
                  </span>
                )}

                {/* Stage box */}
                <div
                  style={{
                    flex: 1,
                    border: `2px solid ${borderColor}`,
                    borderRadius: 0,
                    padding: '8px 6px',
                    textAlign: 'center',
                    backgroundColor: bgColor,
                    transform: `translateX(${stage.slideX}px)`,
                    opacity: stage.slideOpacity,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: isHighlighted ? WHITE : GRAY,
                      marginBottom: 3,
                    }}
                  >
                    {stage.label}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: stage.bottleneck ? RED : CYAN,
                    }}
                  >
                    {stage.time}
                  </div>

                  {/* Bottleneck label */}
                  {stage.bottleneck && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -18,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: 9,
                        color: RED,
                        letterSpacing: '0.05em',
                        opacity: stage.bottleneckOpacity,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      BOTTLENECK
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
}
