import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion';

const FONT: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };

// Colors
const BG = '#0A0A0A';
const CARD = '#111111';
const BORDER = '#2E2E35';
const WHITE = '#F9FAFB';
const GREEN = '#22C55E';
const INDIGO = '#6366F1';
const CYAN = '#06B6D4';
const AMBER = '#F59E0B';
const PURPLE = '#8B5CF6';
const RED = '#EF4444';
const GRAY = '#6B7280';
const SUBTLE = '#1F1F23';

const CMD_TEXT = '$ git push origin feat/auth-flow';

const TASKS = [
  { id: 'TSK-38', title: 'Auth flow refactor', delay: 0 },
  { id: 'TSK-41', title: 'API cache invalidation', delay: 6 },
  { id: 'TSK-55', title: 'Token refresh logic', delay: 12 },
];

// Cursor blink component
function Cursor({ visible }: { visible: boolean }) {
  const frame = useCurrentFrame();
  const blink = Math.floor(frame / 4) % 2 === 0;
  if (!visible) return null;
  return (
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 20,
        backgroundColor: GREEN,
        opacity: blink ? 1 : 0,
        marginLeft: 2,
        verticalAlign: 'middle',
      }}
    />
  );
}

// Progress bar component
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div
      style={{
        width: 400,
        height: 8,
        backgroundColor: BORDER,
        marginTop: 12,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.min(progress * 100, 100)}%`,
          height: '100%',
          backgroundColor: GREEN,
          transition: 'none',
        }}
      />
    </div>
  );
}

// Connection line SVG
function ConnectionLine({
  x1,
  y1,
  x2,
  y2,
  progress,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  progress: number;
}) {
  const midX = (x1 + x2) / 2;
  const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
  const pathLength = 400;

  return (
    <path
      d={path}
      fill="none"
      stroke={INDIGO}
      strokeWidth={2}
      strokeDasharray={pathLength}
      strokeDashoffset={interpolate(progress, [0, 1], [pathLength, 0])}
      opacity={0.7}
    />
  );
}

// Task card with morphing status
function TaskCard({
  id,
  title,
  frame,
  statusStartFrame,
  fps,
}: {
  id: string;
  title: string;
  frame: number;
  statusStartFrame: number;
  fps: number;
}) {
  // Status transitions: TODO -> IN REVIEW -> DONE
  // Each transition takes ~15 frames
  const phase1Start = statusStartFrame;
  const phase2Start = statusStartFrame + 18;
  const phase3Start = statusStartFrame + 36;

  let status = 'TODO';
  let statusColor = GRAY;

  if (frame >= phase3Start) {
    status = 'DONE';
    statusColor = GREEN;
  } else if (frame >= phase2Start) {
    status = 'IN REVIEW';
    statusColor = AMBER;
  } else if (frame >= phase1Start) {
    status = 'TODO';
    statusColor = GRAY;
  }

  // Badge scale spring on each transition
  let badgeScale = 1;
  if (frame >= phase3Start) {
    badgeScale = spring({
      frame: frame - phase3Start,
      fps,
      config: { damping: 10, stiffness: 200 },
    });
  } else if (frame >= phase2Start) {
    badgeScale = spring({
      frame: frame - phase2Start,
      fps,
      config: { damping: 10, stiffness: 200 },
    });
  }

  // Flash green when DONE
  const flashOpacity =
    status === 'DONE'
      ? interpolate(frame - phase3Start, [0, 8, 20], [0, 0.25, 0], {
          extrapolateRight: 'clamp',
          extrapolateLeft: 'clamp',
        })
      : 0;

  return (
    <div
      style={{
        border: `2px solid ${status === 'DONE' ? GREEN : BORDER}`,
        backgroundColor: CARD,
        padding: '14px 16px',
        position: 'relative',
        overflow: 'hidden',
        width: 260,
      }}
    >
      {/* Green flash overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: GREEN,
          opacity: flashOpacity,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <span
          style={{
            ...FONT,
            color: WHITE,
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          {id}
        </span>
        <span
          style={{
            ...FONT,
            fontSize: 12,
            fontWeight: 700,
            color: statusColor,
            textTransform: 'uppercase',
            border: `1px solid ${statusColor}50`,
            backgroundColor: `${statusColor}15`,
            padding: '2px 8px',
            letterSpacing: '0.05em',
            transform: `scale(${badgeScale})`,
            display: 'inline-block',
          }}
        >
          {status}
        </span>
      </div>

      <div style={{ ...FONT, fontSize: 14, color: '#9CA3AF' }}>{title}</div>
    </div>
  );
}

export default function PRDrivenAnimation() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ====== PHASE 1: Terminal typing (0-60) ======
  const typedChars = Math.floor(
    interpolate(frame, [0, 50], [0, CMD_TEXT.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const typedText = CMD_TEXT.slice(0, typedChars);
  const isTyping = frame < 50;
  const showCursor = frame < 65;

  // Progress bar (frames 30-58)
  const pushProgress = interpolate(frame, [30, 58], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Push complete label
  const pushComplete = frame >= 58;

  // ====== PHASE 2: PR Card slides in (60-90) ======
  const prCardX = interpolate(frame, [60, 80], [960, 580], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const prCardOpacity = interpolate(frame, [60, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // AUTO badge spring
  const autoBadgeScale =
    frame >= 75
      ? spring({
          frame: frame - 75,
          fps,
          config: { damping: 12, stiffness: 180 },
        })
      : 0;

  // Task IDs appear in PR card one by one
  const taskIdOpacities = TASKS.map((_, i) =>
    interpolate(frame, [80 + i * 4, 83 + i * 4], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  // ====== PHASE 3: Task cards + status morphing (90-150) ======
  const taskCardsOpacity = interpolate(frame, [88, 95], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const taskCardsX = interpolate(frame, [88, 100], [-300, 40], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Connection lines (90-130)
  const lineProgress0 = interpolate(frame, [95, 115], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lineProgress1 = interpolate(frame, [100, 120], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lineProgress2 = interpolate(frame, [105, 125], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ====== PHASE 4: Merge animation (150-210) ======
  const mergeCompressScale = interpolate(frame, [150, 170], [1, 0.85], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const mergedBadgeScale =
    frame >= 168
      ? spring({
          frame: frame - 168,
          fps,
          config: { damping: 8, stiffness: 150 },
        })
      : 0;

  // Counter animation: "X tasks updated"
  const counterValue = Math.floor(
    interpolate(frame, [175, 200], [0, 3], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  const counterOpacity = interpolate(frame, [170, 180], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ====== PHASE 5: Summary stats (210-270) ======
  const stat0Y = interpolate(frame, [210, 230], [80, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const stat0Opacity = interpolate(frame, [210, 225], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const stat0Scale =
    frame >= 215
      ? spring({
          frame: frame - 215,
          fps,
          config: { damping: 12, stiffness: 120 },
        })
      : 0;

  const stat1Y = interpolate(frame, [220, 240], [80, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const stat1Opacity = interpolate(frame, [220, 235], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const stat1Scale =
    frame >= 225
      ? spring({
          frame: frame - 225,
          fps,
          config: { damping: 12, stiffness: 120 },
        })
      : 0;

  const stat2Y = interpolate(frame, [230, 250], [80, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const stat2Opacity = interpolate(frame, [230, 245], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const stat2Scale =
    frame >= 235
      ? spring({
          frame: frame - 235,
          fps,
          config: { damping: 12, stiffness: 120 },
        })
      : 0;

  // ====== PHASE 6: Hold + fade (270-300) ======
  const fadeOut = interpolate(frame, [280, 298], [1, 0.4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Determine which overall phase we're in for layout
  const showPRCard = frame >= 60;
  const showTaskCards = frame >= 88;
  const showMerged = frame >= 150;
  const showStats = frame >= 210;

  return (
    <AbsoluteFill
      style={{
        ...FONT,
        backgroundColor: BG,
        color: WHITE,
        overflow: 'hidden',
      }}
    >
      <div style={{ opacity: fadeOut, width: '100%', height: '100%' }}>
        {/* ==================== PHASE 1: TERMINAL ==================== */}
        <Sequence from={0} durationInFrames={300} layout="none">
          <div
            style={{
              position: 'absolute',
              top: 40,
              left: 40,
              opacity: frame < 90 ? 1 : interpolate(frame, [90, 110], [1, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {/* Terminal window chrome */}
            <div
              style={{
                backgroundColor: CARD,
                border: `2px solid ${BORDER}`,
                width: 520,
                padding: 0,
                overflow: 'hidden',
              }}
            >
              {/* Title bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderBottom: `1px solid ${SUBTLE}`,
                }}
              >
                <div style={{ width: 10, height: 10, backgroundColor: RED }} />
                <div
                  style={{ width: 10, height: 10, backgroundColor: AMBER }}
                />
                <div
                  style={{ width: 10, height: 10, backgroundColor: GREEN }}
                />
                <span
                  style={{
                    marginLeft: 12,
                    fontSize: 12,
                    color: GRAY,
                    fontWeight: 600,
                  }}
                >
                  terminal
                </span>
              </div>

              {/* Terminal body */}
              <div style={{ padding: '18px 18px 20px 18px' }}>
                <div
                  style={{
                    fontSize: 16,
                    lineHeight: 1.6,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: GREEN }}>
                    {typedText.slice(0, 2)}
                  </span>
                  <span style={{ color: WHITE }}>
                    {typedText.slice(2)}
                  </span>
                  <Cursor visible={showCursor && isTyping} />
                </div>

                {/* Progress bar */}
                {frame >= 30 && (
                  <div style={{ marginTop: 14 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ fontSize: 12, color: GRAY }}>
                        Pushing to origin...
                      </span>
                      <span style={{ fontSize: 12, color: GREEN }}>
                        {Math.floor(pushProgress * 100)}%
                      </span>
                    </div>
                    <ProgressBar progress={pushProgress} />

                    {pushComplete && (
                      <div
                        style={{
                          marginTop: 12,
                          fontSize: 14,
                          color: GREEN,
                          opacity: interpolate(frame, [58, 65], [0, 1], {
                            extrapolateLeft: 'clamp',
                            extrapolateRight: 'clamp',
                          }),
                        }}
                      >
                        {'\u2713'} Push complete. PR #142 created.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Sequence>

        {/* ==================== PHASE 2: PR CARD ==================== */}
        {showPRCard && (
          <Sequence from={0} durationInFrames={300} layout="none">
            <div
              style={{
                position: 'absolute',
                top: showStats ? 30 : showMerged ? 60 : 60,
                left: showMerged
                  ? interpolate(frame, [150, 170], [prCardX - 250, 340], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    })
                  : prCardX - 250,
                opacity: prCardOpacity,
                transform: showMerged
                  ? `scale(${mergeCompressScale})`
                  : 'scale(1)',
                transformOrigin: 'center center',
              }}
            >
              <div
                style={{
                  backgroundColor: CARD,
                  border: `2px solid ${showMerged && frame >= 168 ? GREEN : INDIGO}`,
                  padding: '18px 22px',
                  width: 300,
                  position: 'relative',
                }}
              >
                {/* PR Header */}
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
                      fontSize: 20,
                      fontWeight: 700,
                      color: WHITE,
                    }}
                  >
                    PR #142
                  </span>

                  {/* AUTO badge */}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: INDIGO,
                      border: `1px solid ${INDIGO}60`,
                      backgroundColor: `${INDIGO}18`,
                      padding: '3px 10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      transform: `scale(${autoBadgeScale})`,
                      display: 'inline-block',
                    }}
                  >
                    AUTO
                  </span>
                </div>

                {/* Branch name */}
                <div
                  style={{
                    fontSize: 13,
                    color: CYAN,
                    marginBottom: 14,
                  }}
                >
                  feat/auth-flow {'\u2192'} main
                </div>

                {/* Linked tasks */}
                <div
                  style={{
                    fontSize: 12,
                    color: GRAY,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  Linked Tasks
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {TASKS.map((task, i) => (
                    <span
                      key={task.id}
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: PURPLE,
                        backgroundColor: `${PURPLE}15`,
                        border: `1px solid ${PURPLE}40`,
                        padding: '3px 10px',
                        opacity: taskIdOpacities[i],
                        transform: `translateY(${interpolate(
                          taskIdOpacities[i],
                          [0, 1],
                          [8, 0]
                        )}px)`,
                      }}
                    >
                      {task.id}
                    </span>
                  ))}
                </div>

                {/* MERGED overlay badge */}
                {showMerged && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -14,
                      right: -14,
                      backgroundColor: GREEN,
                      color: BG,
                      fontSize: 13,
                      fontWeight: 800,
                      padding: '6px 14px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      transform: `scale(${mergedBadgeScale})`,
                      transformOrigin: 'center center',
                    }}
                  >
                    MERGED
                  </div>
                )}
              </div>
            </div>
          </Sequence>
        )}

        {/* ==================== PHASE 3: TASK CARDS + LINES ==================== */}
        {showTaskCards && (
          <Sequence from={0} durationInFrames={300} layout="none">
            {/* SVG Connection Lines */}
            {frame >= 95 && frame < 210 && (
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: 960,
                  height: 540,
                  pointerEvents: 'none',
                  opacity: interpolate(
                    frame,
                    [150, 170],
                    [1, 0],
                    {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    }
                  ),
                }}
              >
                <ConnectionLine
                  x1={310}
                  y1={135}
                  x2={prCardX - 250}
                  y2={100}
                  progress={lineProgress0}
                />
                <ConnectionLine
                  x1={310}
                  y1={225}
                  x2={prCardX - 250}
                  y2={140}
                  progress={lineProgress1}
                />
                <ConnectionLine
                  x1={310}
                  y1={315}
                  x2={prCardX - 250}
                  y2={180}
                  progress={lineProgress2}
                />
              </svg>
            )}

            {/* Task Cards */}
            <div
              style={{
                position: 'absolute',
                top: 70,
                left: taskCardsX,
                opacity: taskCardsOpacity * (showStats
                  ? interpolate(frame, [210, 220], [1, 0], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    })
                  : 1),
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {TASKS.map((task, i) => (
                <TaskCard
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  frame={frame}
                  statusStartFrame={100 + i * 15}
                  fps={fps}
                />
              ))}
            </div>
          </Sequence>
        )}

        {/* ==================== PHASE 4: COUNTER ==================== */}
        {showMerged && (
          <Sequence from={0} durationInFrames={300} layout="none">
            <div
              style={{
                position: 'absolute',
                bottom: showStats ? 180 : 50,
                left: 0,
                right: 0,
                textAlign: 'center',
                opacity: counterOpacity * (showStats
                  ? interpolate(frame, [215, 225], [1, 0], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    })
                  : 1),
              }}
            >
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: GREEN,
                }}
              >
                {counterValue}
              </span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: GRAY,
                  marginLeft: 10,
                }}
              >
                tasks updated
              </span>
            </div>
          </Sequence>
        )}

        {/* ==================== PHASE 5: SUMMARY STATS ==================== */}
        {showStats && (
          <Sequence from={0} durationInFrames={300} layout="none">
            <div
              style={{
                position: 'absolute',
                bottom: 60,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                gap: 40,
              }}
            >
              {/* Stat 1: 0 manual updates */}
              <div
                style={{
                  textAlign: 'center',
                  opacity: stat0Opacity,
                  transform: `translateY(${stat0Y}px) scale(${stat0Scale})`,
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: GREEN,
                    lineHeight: 1,
                  }}
                >
                  0
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: GRAY,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginTop: 6,
                    fontWeight: 600,
                  }}
                >
                  manual updates
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  width: 2,
                  backgroundColor: BORDER,
                  opacity: stat0Opacity,
                  alignSelf: 'stretch',
                }}
              />

              {/* Stat 2: 3 tasks resolved */}
              <div
                style={{
                  textAlign: 'center',
                  opacity: stat1Opacity,
                  transform: `translateY(${stat1Y}px) scale(${stat1Scale})`,
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: PURPLE,
                    lineHeight: 1,
                  }}
                >
                  3
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: GRAY,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginTop: 6,
                    fontWeight: 600,
                  }}
                >
                  tasks resolved
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  width: 2,
                  backgroundColor: BORDER,
                  opacity: stat1Opacity,
                  alignSelf: 'stretch',
                }}
              />

              {/* Stat 3: 4.2h cycle time */}
              <div
                style={{
                  textAlign: 'center',
                  opacity: stat2Opacity,
                  transform: `translateY(${stat2Y}px) scale(${stat2Scale})`,
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: CYAN,
                    lineHeight: 1,
                  }}
                >
                  4.2h
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: GRAY,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginTop: 6,
                    fontWeight: 600,
                  }}
                >
                  cycle time
                </div>
              </div>
            </div>

            {/* Tagline at top */}
            <div
              style={{
                position: 'absolute',
                top: 180,
                left: 0,
                right: 0,
                textAlign: 'center',
                opacity: interpolate(frame, [240, 255], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
              }}
            >
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: WHITE,
                  letterSpacing: '-0.02em',
                }}
              >
                Push code. Tasks update themselves.
              </div>
              <div
                style={{
                  fontSize: 15,
                  color: GRAY,
                  marginTop: 8,
                  fontWeight: 500,
                }}
              >
                Zero manual status updates. Ever.
              </div>
            </div>
          </Sequence>
        )}

        {/* ==================== PERSISTENT: PR Card in stats phase ==================== */}
        {showStats && (
          <Sequence from={0} durationInFrames={300} layout="none">
            <div
              style={{
                position: 'absolute',
                top: 30,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                opacity: interpolate(frame, [220, 235], [0, 1], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                }),
              }}
            >
              {/* Mini PR badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  backgroundColor: CARD,
                  border: `2px solid ${GREEN}`,
                  padding: '8px 20px',
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: WHITE,
                  }}
                >
                  PR #142
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: GREEN,
                    backgroundColor: `${GREEN}18`,
                    border: `1px solid ${GREEN}50`,
                    padding: '2px 8px',
                    textTransform: 'uppercase',
                  }}
                >
                  MERGED
                </span>
                <span style={{ fontSize: 13, color: CYAN }}>
                  feat/auth-flow
                </span>
              </div>
            </div>
          </Sequence>
        )}
      </div>
    </AbsoluteFill>
  );
}
