import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

const FONT: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };

const CODE_LINES = [
  { n: 1, pre: '+', text: 'async function refreshToken(ctx) {', color: '#22C55E' },
  { n: 2, pre: '+', text: '  const session = await getSession(ctx);', color: '#22C55E' },
  { n: 3, pre: '+', text: '  if (session.expired) {', color: '#22C55E' },
  { n: 4, pre: '-', text: '    // old refresh logic', color: '#EF4444' },
  { n: 5, pre: '+', text: '    await ctx.auth.rotate(session);', color: '#22C55E' },
  { n: 6, pre: '+', text: '    logger.info("token rotated");', color: '#22C55E' },
  { n: 7, pre: '-', text: '  validatePermissions(ctx);', color: '#EF4444' },
  { n: 8, pre: '+', text: '  await enforceRBAC(ctx, session);', color: '#22C55E' },
];

const COMPLEXITY_ANNOTATIONS: Array<{ lineIndex: number; level: 'low' | 'med' | 'high' }> = [
  { lineIndex: 0, level: 'low' },
  { lineIndex: 1, level: 'med' },
  { lineIndex: 2, level: 'high' },
  { lineIndex: 3, level: 'low' },
  { lineIndex: 4, level: 'high' },
  { lineIndex: 5, level: 'low' },
  { lineIndex: 6, level: 'med' },
  { lineIndex: 7, level: 'high' },
];

const ANNOTATION_COLORS: Record<string, string> = {
  low: '#22C55E',
  med: '#F59E0B',
  high: '#EF4444',
};

const FILES = [
  {
    name: 'auth.ts',
    score: 7,
    metrics: [
      { label: 'cyclo', val: 12, max: 15, color: '#EF4444' },
      { label: 'nest', val: 4, max: 8, color: '#F59E0B' },
      { label: 'deps', val: 8, max: 12, color: '#EF4444' },
    ],
  },
  {
    name: 'db.ts',
    score: 4,
    metrics: [
      { label: 'cyclo', val: 5, max: 15, color: '#F59E0B' },
      { label: 'nest', val: 2, max: 8, color: '#22C55E' },
      { label: 'deps', val: 4, max: 12, color: '#22C55E' },
    ],
  },
];

const CALIBRATION = [
  { text: '1pt\u21921.1', check: '\u2713' },
  { text: '3pt\u21922.8', check: '\u2713' },
  { text: '5pt\u21925.2', check: '\u2713' },
];

export default function ComplexityEstimateAnimation() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- PHASE 1: Code diff lines (frame 0-60) ---
  const lineHeight = 22;

  // --- PHASE 2: Scan line (frame 60-120) ---
  const codeBlockTop = 44;
  const codeBlockHeight = CODE_LINES.length * lineHeight;
  const scanLineY = interpolate(frame, [60, 120], [codeBlockTop, codeBlockTop + codeBlockHeight], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scanLineOpacity = interpolate(frame, [60, 62, 118, 120], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // --- PHASE 3: File cards (frame 120-180) ---
  const card0X = interpolate(frame, [120, 145], [200, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const card0Opacity = interpolate(frame, [120, 135], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const card1X = interpolate(frame, [135, 160], [200, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const card1Opacity = interpolate(frame, [135, 150], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // --- PHASE 4: Estimate section (frame 180-240) ---
  const pointsScale = spring({ frame: frame - 180, fps, config: { damping: 12, stiffness: 120 } });
  const ptsOpacity = interpolate(frame, [195, 210], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Gauge 1: complexity (67%)
  const gauge1Size = 60;
  const gauge1R = (gauge1Size - 4) / 2;
  const gauge1Circ = 2 * Math.PI * gauge1R;
  const gauge1Target = gauge1Circ * (1 - 0.67);
  const gauge1Offset = interpolate(frame, [200, 230], [gauge1Circ, gauge1Target], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Gauge 2: confidence (94%)
  const gauge2Size = 60;
  const gauge2R = (gauge2Size - 4) / 2;
  const gauge2Circ = 2 * Math.PI * gauge2R;
  const gauge2Target = gauge2Circ * (1 - 0.94);
  const gauge2Offset = interpolate(frame, [210, 240], [gauge2Circ, gauge2Target], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const badgeScale = spring({ frame: frame - 220, fps, config: { damping: 10, stiffness: 100 } });

  // --- PHASE 5: Calibration (frame 240-270) ---
  const calibrationOpacity = interpolate(frame, [240, 255], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // --- PHASE 6: End hold + fade (frame 270-300) ---
  const endFade = interpolate(frame, [285, 300], [1, 0.6], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        ...FONT,
        backgroundColor: '#050505',
        color: '#9CA3AF',
        padding: '24px 28px',
        boxSizing: 'border-box',
        opacity: endFade,
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#F9FAFB',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            AI COMPLEXITY ENGINE
          </span>
          <span
            style={{
              width: 6,
              height: 6,
              backgroundColor: '#F59E0B',
              display: 'inline-block',
              opacity: interpolate(Math.sin(frame * 0.15), [-1, 1], [0.3, 1]),
            }}
          />
        </div>
        <span
          style={{
            fontSize: 9,
            color: '#F59E0B',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          ANALYZING PR #203
        </span>
      </div>

      {/* MAIN TWO-COLUMN */}
      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
        {/* LEFT PANEL -- Code Diff */}
        <div
          style={{
            width: '55%',
            border: '2px solid #2E2E35',
            backgroundColor: '#111111',
            padding: '10px 12px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 8,
            }}
          >
            DIFF PREVIEW
          </div>

          {/* Scan line (phase 2) */}
          {frame >= 60 && frame <= 120 && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: scanLineY,
                height: 2,
                backgroundColor: '#F59E0B',
                boxShadow: '0 0 12px rgba(245,158,11,0.5), 0 0 4px rgba(245,158,11,0.3)',
                opacity: scanLineOpacity,
                zIndex: 5,
                pointerEvents: 'none',
              }}
            />
          )}

          {/* Code lines */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {CODE_LINES.map((line, i) => {
              const lineAppearFrame = i * 6;
              const lineX = interpolate(frame, [lineAppearFrame, lineAppearFrame + 8], [-120, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const lineOpacity = interpolate(
                frame,
                [lineAppearFrame, lineAppearFrame + 8],
                [0, 1],
                {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                },
              );

              // Annotation appears when scan line passes this line
              const annotation = COMPLEXITY_ANNOTATIONS[i];
              const lineScanY = codeBlockTop + i * lineHeight + lineHeight / 2;
              const annotationVisible = frame >= 60 && scanLineY >= lineScanY;
              const annotationOpacity = annotationVisible
                ? interpolate(
                    frame,
                    [
                      60 + ((lineScanY - codeBlockTop) / codeBlockHeight) * 60,
                      60 + ((lineScanY - codeBlockTop) / codeBlockHeight) * 60 + 6,
                    ],
                    [0, 1],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
                  )
                : 0;

              // Highlight when scan line is near
              const distFromScan = Math.abs(scanLineY - (codeBlockTop + i * lineHeight));
              const isHighlighted = frame >= 60 && frame <= 120 && distFromScan < lineHeight;

              return (
                <div
                  key={line.n}
                  style={{
                    display: 'flex',
                    gap: 6,
                    lineHeight: '18px',
                    fontSize: 12,
                    padding: '1px 4px',
                    transform: `translateX(${lineX}px)`,
                    opacity: lineOpacity,
                    backgroundColor: isHighlighted
                      ? 'rgba(245,158,11,0.06)'
                      : 'transparent',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      color: '#6B7280',
                      width: 16,
                      textAlign: 'right',
                      flexShrink: 0,
                      fontSize: 10,
                      userSelect: 'none',
                    }}
                  >
                    {line.n}
                  </span>
                  <span
                    style={{
                      color: line.color,
                      flexShrink: 0,
                      width: 10,
                      opacity: 0.7,
                    }}
                  >
                    {line.pre}
                  </span>
                  <span style={{ color: `${line.color}CC`, flex: 1 }}>{line.text}</span>
                  {/* Complexity annotation square */}
                  {annotation && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        backgroundColor: ANNOTATION_COLORS[annotation.level],
                        flexShrink: 0,
                        opacity: annotationOpacity,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 8,
              paddingTop: 6,
              borderTop: '1px solid #2E2E35',
              fontSize: 10,
              color: '#6B7280',
            }}
          >
            4 files &middot; <span style={{ color: '#22C55E' }}>+321</span>{' '}
            <span style={{ color: '#EF4444' }}>-62</span>
          </div>
        </div>

        {/* RIGHT PANEL -- Analysis */}
        <div
          style={{
            width: '45%',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {/* File analysis cards */}
          {FILES.map((file, fileIdx) => {
            const cardX = fileIdx === 0 ? card0X : card1X;
            const cardOpacity = fileIdx === 0 ? card0Opacity : card1Opacity;

            return (
              <div
                key={file.name}
                style={{
                  border: '2px solid #2E2E35',
                  backgroundColor: '#111111',
                  padding: '8px 10px',
                  transform: `translateX(${cardX}px)`,
                  opacity: cardOpacity,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#F9FAFB' }}>
                    {file.name}
                  </span>
                  <span style={{ fontSize: 10, color: '#6B7280' }}>
                    score:{' '}
                    <span
                      style={{
                        color: file.score >= 6 ? '#EF4444' : '#F59E0B',
                        fontWeight: 700,
                      }}
                    >
                      {file.score}/10
                    </span>
                  </span>
                </div>
                {file.metrics.map((met, metIdx) => {
                  const barDelay = (fileIdx === 0 ? 130 : 145) + metIdx * 5;
                  const barWidth = spring({
                    frame: frame - barDelay,
                    fps,
                    config: { damping: 14, stiffness: 80 },
                  });
                  const targetPercent = (met.val / met.max) * 100;

                  return (
                    <div
                      key={met.label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginBottom: 3,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: '#6B7280',
                          width: 32,
                          flexShrink: 0,
                        }}
                      >
                        {met.label}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: 4,
                          backgroundColor: '#2E2E35',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${barWidth * targetPercent}%`,
                            backgroundColor: met.color,
                            height: '100%',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: met.color,
                          width: 24,
                          textAlign: 'right',
                          flexShrink: 0,
                        }}
                      >
                        {Math.round(barWidth * met.val)}/{met.max}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Calibration card (phase 5) */}
          <div
            style={{
              border: '2px solid #2E2E35',
              backgroundColor: '#111111',
              padding: '8px 10px',
              opacity: calibrationOpacity,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 6,
              }}
            >
              CALIBRATION
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
              {CALIBRATION.map((cal, calIdx) => {
                const checkAppear = 245 + calIdx * 6;
                const checkOpacity = interpolate(frame, [checkAppear, checkAppear + 4], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });
                return (
                  <div key={calIdx} style={{ fontSize: 10, color: '#9CA3AF' }}>
                    {cal.text}{' '}
                    <span style={{ color: '#22C55E', opacity: checkOpacity }}>{cal.check}</span>
                  </div>
                );
              })}
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#22C55E',
                marginTop: 4,
                opacity: interpolate(frame, [260, 268], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
              }}
            >
              overall: 91% accurate
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ESTIMATE BAR (phase 4) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
          marginTop: 12,
          paddingTop: 10,
          borderTop: '2px solid #2E2E35',
        }}
      >
        {/* Left gauge -- Complexity 67% */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg
            width={gauge1Size}
            height={gauge1Size}
            style={{ transform: 'rotate(-90deg)', display: 'block' }}
          >
            <circle
              cx={gauge1Size / 2}
              cy={gauge1Size / 2}
              r={gauge1R}
              fill="none"
              stroke="#2E2E35"
              strokeWidth={4}
            />
            <circle
              cx={gauge1Size / 2}
              cy={gauge1Size / 2}
              r={gauge1R}
              fill="none"
              stroke="#F59E0B"
              strokeWidth={4}
              strokeDasharray={gauge1Circ}
              strokeDashoffset={gauge1Offset}
            />
          </svg>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', lineHeight: 1 }}>67%</div>
          <div
            style={{
              fontSize: 8,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            COMPLEXITY
          </div>
        </div>

        {/* Center -- Points + Badge */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ lineHeight: 1 }}>
            <span
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: '#F9FAFB',
                display: 'inline-block',
                transform: `scale(${frame >= 180 ? pointsScale : 0})`,
              }}
            >
              5
            </span>
            <span
              style={{
                fontSize: 20,
                color: '#6B7280',
                marginLeft: 4,
                opacity: ptsOpacity,
              }}
            >
              pts
            </span>
          </div>
          <div
            style={{
              display: 'inline-block',
              fontSize: 10,
              fontWeight: 700,
              color: '#F59E0B',
              border: '2px solid #F59E0B',
              padding: '2px 10px',
              marginTop: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              transform: `scale(${frame >= 220 ? badgeScale : 0})`,
            }}
          >
            MEDIUM
          </div>
        </div>

        {/* Right gauge -- Confidence 94% */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <svg
            width={gauge2Size}
            height={gauge2Size}
            style={{ transform: 'rotate(-90deg)', display: 'block' }}
          >
            <circle
              cx={gauge2Size / 2}
              cy={gauge2Size / 2}
              r={gauge2R}
              fill="none"
              stroke="#2E2E35"
              strokeWidth={4}
            />
            <circle
              cx={gauge2Size / 2}
              cy={gauge2Size / 2}
              r={gauge2R}
              fill="none"
              stroke="#22C55E"
              strokeWidth={4}
              strokeDasharray={gauge2Circ}
              strokeDashoffset={gauge2Offset}
            />
          </svg>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#22C55E', lineHeight: 1 }}>94%</div>
          <div
            style={{
              fontSize: 8,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            CONFIDENCE
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
