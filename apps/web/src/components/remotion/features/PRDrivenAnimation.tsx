import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
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

// Scene timing constants
const SCENE1_START = 0;
const SCENE1_END = 80;
const SCENE2_START = 70;
const SCENE2_END = 160;
const SCENE3_START = 150;
const SCENE3_END = 220;
const SCENE4_START = 210;
const SCENE4_END = 300;

const CROSSFADE = 10; // frames for crossfade overlap

function sceneOpacity(
  frame: number,
  start: number,
  end: number,
  fadeIn: number = CROSSFADE,
  fadeOut: number = CROSSFADE
): number {
  const fadeInOp = interpolate(frame, [start, start + fadeIn], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOutOp = interpolate(frame, [end - fadeOut, end], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return fadeInOp * fadeOutOp;
}

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
        width: '100%',
        maxWidth: 400,
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
        }}
      />
    </div>
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

// ============================================================
// SCENE 1: Terminal with typewriter + progress bar
// ============================================================
function Scene1({ frame }: { frame: number }) {
  const typedChars = Math.floor(
    interpolate(frame, [0, 50], [0, CMD_TEXT.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );
  const typedText = CMD_TEXT.slice(0, typedChars);
  const isTyping = frame < 50;
  const showCursor = frame < 65;

  const pushProgress = interpolate(frame, [30, 58], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pushComplete = frame >= 58;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
      }}
    >
      {/* Terminal window */}
      <div
        style={{
          backgroundColor: CARD,
          border: `2px solid ${BORDER}`,
          width: 520,
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
          <div style={{ width: 10, height: 10, backgroundColor: AMBER }} />
          <div style={{ width: 10, height: 10, backgroundColor: GREEN }} />
          <span
            style={{
              ...FONT,
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
              ...FONT,
              fontSize: 16,
              lineHeight: 1.6,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ color: GREEN }}>{typedText.slice(0, 2)}</span>
            <span style={{ color: WHITE }}>{typedText.slice(2)}</span>
            <Cursor visible={showCursor && isTyping} />
          </div>

          {frame >= 30 && (
            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <span style={{ ...FONT, fontSize: 12, color: GRAY }}>
                  Pushing to origin...
                </span>
                <span style={{ ...FONT, fontSize: 12, color: GREEN }}>
                  {Math.floor(pushProgress * 100)}%
                </span>
              </div>
              <ProgressBar progress={pushProgress} />

              {pushComplete && (
                <div
                  style={{
                    ...FONT,
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
  );
}

// ============================================================
// SCENE 2: PR card centered + task cards below with connections
// ============================================================
function Scene2({ frame, fps }: { frame: number; fps: number }) {
  // PR card appears with a slide-in from right
  const prSlideX = interpolate(frame, [SCENE2_START, SCENE2_START + 15], [80, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // AUTO badge spring
  const autoBadgeScale =
    frame >= SCENE2_START + 12
      ? spring({
          frame: frame - (SCENE2_START + 12),
          fps,
          config: { damping: 12, stiffness: 180 },
        })
      : 0;

  // Task IDs appear in PR card one by one
  const taskIdOpacities = TASKS.map((_, i) =>
    interpolate(
      frame,
      [SCENE2_START + 15 + i * 4, SCENE2_START + 18 + i * 4],
      [0, 1],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    )
  );

  // Task cards slide in from left
  const taskCardsOpacity = interpolate(
    frame,
    [SCENE2_START + 20, SCENE2_START + 28],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const taskCardsSlideX = interpolate(
    frame,
    [SCENE2_START + 20, SCENE2_START + 35],
    [-60, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Connection line progress (drawn from PR card to task cards)
  const lineProgresses = [
    interpolate(frame, [SCENE2_START + 30, SCENE2_START + 50], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    interpolate(frame, [SCENE2_START + 35, SCENE2_START + 55], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
    interpolate(frame, [SCENE2_START + 40, SCENE2_START + 60], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        gap: 32,
      }}
    >
      {/* PR Card */}
      <div
        style={{
          transform: `translateX(${prSlideX}px)`,
        }}
      >
        <div
          style={{
            backgroundColor: CARD,
            border: `2px solid ${INDIGO}`,
            padding: '18px 22px',
            width: 320,
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
            <span style={{ ...FONT, fontSize: 20, fontWeight: 700, color: WHITE }}>
              PR #142
            </span>
            <span
              style={{
                ...FONT,
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
          <div style={{ ...FONT, fontSize: 13, color: CYAN, marginBottom: 14 }}>
            feat/auth-flow {'\u2192'} main
          </div>

          {/* Linked tasks label */}
          <div
            style={{
              ...FONT,
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
                  ...FONT,
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
        </div>
      </div>

      {/* Connection lines (SVG overlay between PR card and task cards) */}
      <svg
        width="320"
        height="24"
        viewBox="0 0 320 24"
        style={{ overflow: 'visible' }}
      >
        {TASKS.map((_, i) => {
          const startX = 60 + i * 100;
          const endX = 40 + i * 110;
          const pathLength = 60;
          return (
            <line
              key={i}
              x1={startX}
              y1={0}
              x2={endX}
              y2={24}
              stroke={INDIGO}
              strokeWidth={2}
              opacity={0.7 * lineProgresses[i]}
              strokeDasharray={pathLength}
              strokeDashoffset={interpolate(
                lineProgresses[i],
                [0, 1],
                [pathLength, 0]
              )}
            />
          );
        })}
      </svg>

      {/* Task Cards row */}
      <div
        style={{
          display: 'flex',
          gap: 14,
          opacity: taskCardsOpacity,
          transform: `translateX(${taskCardsSlideX}px)`,
        }}
      >
        {TASKS.map((task, i) => (
          <TaskCard
            key={task.id}
            id={task.id}
            title={task.title}
            frame={frame}
            statusStartFrame={SCENE2_START + 35 + i * 15}
            fps={fps}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SCENE 3: Merge animation - PR card compresses, MERGED badge, counter
// ============================================================
function Scene3({ frame, fps }: { frame: number; fps: number }) {
  const mergeCompressScale = interpolate(
    frame,
    [SCENE3_START, SCENE3_START + 20],
    [1, 0.88],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const mergedBadgeScale =
    frame >= SCENE3_START + 18
      ? spring({
          frame: frame - (SCENE3_START + 18),
          fps,
          config: { damping: 8, stiffness: 150 },
        })
      : 0;

  const borderColor = frame >= SCENE3_START + 18 ? GREEN : INDIGO;

  // Counter: "X tasks updated"
  const counterValue = Math.floor(
    interpolate(frame, [SCENE3_START + 25, SCENE3_START + 50], [0, 3], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  const counterOpacity = interpolate(
    frame,
    [SCENE3_START + 20, SCENE3_START + 30],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        gap: 40,
      }}
    >
      {/* PR Card compressing */}
      <div
        style={{
          transform: `scale(${mergeCompressScale})`,
          transformOrigin: 'center center',
        }}
      >
        <div
          style={{
            backgroundColor: CARD,
            border: `2px solid ${borderColor}`,
            padding: '18px 22px',
            width: 320,
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
            <span style={{ ...FONT, fontSize: 20, fontWeight: 700, color: WHITE }}>
              PR #142
            </span>
            <span
              style={{
                ...FONT,
                fontSize: 12,
                fontWeight: 700,
                color: INDIGO,
                border: `1px solid ${INDIGO}60`,
                backgroundColor: `${INDIGO}18`,
                padding: '3px 10px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              AUTO
            </span>
          </div>

          <div style={{ ...FONT, fontSize: 13, color: CYAN, marginBottom: 14 }}>
            feat/auth-flow {'\u2192'} main
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {TASKS.map((task) => (
              <span
                key={task.id}
                style={{
                  ...FONT,
                  fontSize: 13,
                  fontWeight: 700,
                  color: PURPLE,
                  backgroundColor: `${PURPLE}15`,
                  border: `1px solid ${PURPLE}40`,
                  padding: '3px 10px',
                }}
              >
                {task.id}
              </span>
            ))}
          </div>

          {/* MERGED badge */}
          {frame >= SCENE3_START + 18 && (
            <div
              style={{
                position: 'absolute',
                top: -14,
                right: -14,
                backgroundColor: GREEN,
                color: BG,
                ...FONT,
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

      {/* Counter */}
      <div
        style={{
          textAlign: 'center',
          opacity: counterOpacity,
        }}
      >
        <span
          style={{
            ...FONT,
            fontSize: 28,
            fontWeight: 800,
            color: GREEN,
          }}
        >
          {counterValue}
        </span>
        <span
          style={{
            ...FONT,
            fontSize: 18,
            fontWeight: 600,
            color: GRAY,
            marginLeft: 10,
          }}
        >
          tasks updated
        </span>
      </div>
    </div>
  );
}

// ============================================================
// SCENE 4: Summary stats + tagline
// ============================================================
function Scene4({ frame, fps }: { frame: number; fps: number }) {
  const stats = [
    { value: '0', label: 'manual updates', color: GREEN, delay: 0 },
    { value: '3', label: 'tasks resolved', color: PURPLE, delay: 10 },
    { value: '4.2h', label: 'cycle time', color: CYAN, delay: 20 },
  ];

  // Mini PR badge at top
  const badgeOpacity = interpolate(
    frame,
    [SCENE4_START, SCENE4_START + 15],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Tagline fade in
  const taglineOpacity = interpolate(
    frame,
    [SCENE4_START + 40, SCENE4_START + 55],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        gap: 0,
      }}
    >
      {/* Mini PR badge */}
      <div
        style={{
          opacity: badgeOpacity,
          marginBottom: 32,
        }}
      >
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
          <span style={{ ...FONT, fontSize: 14, fontWeight: 700, color: WHITE }}>
            PR #142
          </span>
          <span
            style={{
              ...FONT,
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
          <span style={{ ...FONT, fontSize: 13, color: CYAN }}>
            feat/auth-flow
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 40,
          marginBottom: 40,
        }}
      >
        {stats.map((stat, i) => {
          const statStart = SCENE4_START + 5 + stat.delay;
          const statOpacity = interpolate(
            frame,
            [statStart, statStart + 15],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );
          const statY = interpolate(frame, [statStart, statStart + 20], [80, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const statScale =
            frame >= statStart + 5
              ? spring({
                  frame: frame - (statStart + 5),
                  fps,
                  config: { damping: 12, stiffness: 120 },
                })
              : 0;

          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
              {i > 0 && (
                <div
                  style={{
                    width: 2,
                    height: 60,
                    backgroundColor: BORDER,
                    opacity: statOpacity,
                    marginRight: 0,
                  }}
                />
              )}
              <div
                style={{
                  textAlign: 'center',
                  opacity: statOpacity,
                  transform: `translateY(${statY}px) scale(${statScale})`,
                }}
              >
                <div
                  style={{
                    ...FONT,
                    fontSize: 48,
                    fontWeight: 800,
                    color: stat.color,
                    lineHeight: 1,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    ...FONT,
                    fontSize: 14,
                    color: GRAY,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginTop: 6,
                    fontWeight: 600,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tagline */}
      <div style={{ textAlign: 'center', opacity: taglineOpacity }}>
        <div
          style={{
            ...FONT,
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
            ...FONT,
            fontSize: 15,
            color: GRAY,
            marginTop: 8,
            fontWeight: 500,
          }}
        >
          Zero manual status updates. Ever.
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function PRDrivenAnimation() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Scene opacities - only one scene visible at a time via crossfade
  const scene1Op = sceneOpacity(frame, SCENE1_START, SCENE1_END, 1, CROSSFADE);
  const scene2Op = sceneOpacity(frame, SCENE2_START, SCENE2_END, CROSSFADE, CROSSFADE);
  const scene3Op = sceneOpacity(frame, SCENE3_START, SCENE3_END, CROSSFADE, CROSSFADE);
  const scene4Op = sceneOpacity(frame, SCENE4_START, SCENE4_END, CROSSFADE, 1);

  // Final fade out for the last few frames
  const finalFade = interpolate(frame, [285, 298], [1, 0.4], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        ...FONT,
        backgroundColor: BG,
        color: WHITE,
        overflow: 'hidden',
        padding: '20px 28px',
      }}
    >
      <div style={{ width: '100%', height: '100%', opacity: finalFade }}>
        {/* Scene 1: Terminal */}
        {frame <= SCENE1_END && scene1Op > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: '20px 28px',
              opacity: scene1Op,
            }}
          >
            <Scene1 frame={frame} />
          </div>
        )}

        {/* Scene 2: PR Card + Task Cards */}
        {frame >= SCENE2_START && frame <= SCENE2_END && scene2Op > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: '20px 28px',
              opacity: scene2Op,
            }}
          >
            <Scene2 frame={frame} fps={fps} />
          </div>
        )}

        {/* Scene 3: Merge Animation */}
        {frame >= SCENE3_START && frame <= SCENE3_END && scene3Op > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: '20px 28px',
              opacity: scene3Op,
            }}
          >
            <Scene3 frame={frame} fps={fps} />
          </div>
        )}

        {/* Scene 4: Summary Stats */}
        {frame >= SCENE4_START && frame <= SCENE4_END && scene4Op > 0 && (
          <div
            style={{
              position: 'absolute',
              inset: '20px 28px',
              opacity: scene4Op,
            }}
          >
            <Scene4 frame={frame} fps={fps} />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
