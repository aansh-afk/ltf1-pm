import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

const FONT = "'IBM Plex Mono', monospace";
const CYAN = '#06B6D4';
const GREEN = '#22C55E';
const AMBER = '#F59E0B';
const RED = '#EF4444';
const BG = '#050505';
const BG_CARD = '#0A0A0A';
const BG_SURFACE = '#111111';
const BORDER = '#2E2E35';
const TEXT_PRIMARY = '#F9FAFB';
const TEXT_SECONDARY = '#9CA3AF';
const TEXT_TERTIARY = '#6B7280';

const team = [
  { name: '@ada', capacity: 9, max: 10 },
  { name: '@bob', capacity: 8, max: 10 },
  { name: '@eve', capacity: 9, max: 10 },
  { name: '@max', capacity: 6, max: 10 },
];

const TOTAL_PTS = 32;

const includeTasks = [
  { id: 'TSK-82', pts: 5, label: 'Auth token rotation' },
  { id: 'TSK-85', pts: 3, label: 'Dashboard cache layer' },
  { id: 'TSK-91', pts: 1, label: 'Hotfix: rate limiter', critical: true },
  { id: 'TSK-94', pts: 3, label: 'Log aggregation fix' },
];

const deferTasks = [
  { id: 'TSK-88', pts: 8, label: 'UI theme overhaul' },
  { id: 'TSK-93', pts: 2, label: 'Onboarding wizard v2' },
];

const aiMessages = [
  'analyzing velocity...',
  'TSK-88 exceeds capacity — defer',
  'scope optimized: 12pts, 85% load',
];

export default function SprintPlanningAnimation() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- PHASE 1: HEADER (0-30) ---
  const headerOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const headerY = interpolate(frame, [0, 15], [-20, 0], {
    extrapolateRight: 'clamp',
  });
  const aiLabelOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const aiLabelX = interpolate(frame, [10, 25], [30, 0], {
    extrapolateRight: 'clamp',
  });
  // Cyan dot pulse
  const dotPulse = interpolate(
    Math.sin(frame * 0.15),
    [-1, 1],
    [0.3, 1],
  );

  // --- PHASE 2: TEAM CAPACITY (30-90) ---
  const capacityCards = team.map((member, i) => {
    const cardStart = 30 + i * 12;
    const cardOpacity = interpolate(frame, [cardStart, cardStart + 10], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const cardY = interpolate(frame, [cardStart, cardStart + 10], [20, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

    // Each segment fills one at a time across the capacity phase
    const segmentDuration = 4;
    const segments = Array.from({ length: member.max }, (_, si) => {
      const segStart = cardStart + 8 + si * segmentDuration;
      const filled = si < member.capacity;
      const segOpacity = filled
        ? interpolate(frame, [segStart, segStart + segmentDuration], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })
        : 0;
      return { filled, segOpacity };
    });

    return { ...member, cardOpacity, cardY, segments };
  });

  // Total points counter counts up as bars fill
  const totalStart = 38;
  const totalEnd = 85;
  const totalCount = Math.round(
    interpolate(frame, [totalStart, totalEnd], [0, TOTAL_PTS], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );

  // --- PHASE 3: TASK ALLOCATION (90-150) ---
  const includeCards = includeTasks.map((task, i) => {
    const taskStart = 90 + i * 10;
    const x = spring({
      frame: frame - taskStart,
      fps,
      config: { damping: 14, stiffness: 120, mass: 0.8 },
    });
    const slideX = interpolate(x, [0, 1], [200, 0]);
    const opacity = interpolate(frame, [taskStart, taskStart + 5], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return { ...task, slideX, opacity };
  });

  const deferCards = deferTasks.map((task, i) => {
    const taskStart = 115 + i * 12;
    const x = spring({
      frame: frame - taskStart,
      fps,
      config: { damping: 14, stiffness: 100, mass: 1 },
    });
    const slideX = interpolate(x, [0, 1], [200, 0]);
    const opacity = interpolate(frame, [taskStart, taskStart + 5], [0, 0.5], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return { ...task, slideX, opacity };
  });

  // --- PHASE 4: AI TICKER (150-200) ---
  const aiDisplayMessages = aiMessages.map((msg, i) => {
    const msgStart = 150 + i * 16;
    const msgEnd = msgStart + 14;
    // Type out character by character
    const charCount = Math.floor(
      interpolate(frame, [msgStart, msgStart + 12], [0, msg.length], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
    );
    const fadeOut = interpolate(frame, [msgEnd, msgEnd + 4], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const fadeIn = interpolate(frame, [msgStart, msgStart + 3], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const visible = frame >= msgStart && frame <= msgEnd + 4;
    return { msg, charCount, opacity: fadeIn * fadeOut, visible };
  });

  // --- PHASE 5: SPRINT HEALTH (200-250) ---
  const loadBarProgress = interpolate(frame, [200, 240], [0, 85], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const loadBarColor =
    loadBarProgress > 0
      ? GREEN
      : BORDER;

  const riskSpring = spring({
    frame: frame - 225,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.6 },
  });
  const riskScale = interpolate(riskSpring, [0, 1], [0, 1]);
  const riskOpacity = interpolate(frame, [225, 230], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const confidenceCount = Math.round(
    interpolate(frame, [210, 245], [0, 91], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BG,
        fontFamily: FONT,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        overflow: 'hidden',
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
        }}
      >
        <span
          style={{
            fontSize: 14,
            color: TEXT_PRIMARY,
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          SPRINT 14 PLANNING
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: aiLabelOpacity,
            transform: `translateX(${aiLabelX}px)`,
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              background: CYAN,
              opacity: dotPulse,
            }}
          />
          <span
            style={{
              fontSize: 11,
              color: CYAN,
              fontWeight: 600,
              letterSpacing: 1.5,
            }}
          >
            AI-ASSISTED
          </span>
        </div>
      </div>

      {/* ── TEAM CAPACITY ── */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'stretch',
          flexShrink: 0,
        }}
      >
        {capacityCards.map((member) => (
          <div
            key={member.name}
            style={{
              flex: 1,
              background: BG_CARD,
              border: `2px solid ${BORDER}`,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              opacity: member.cardOpacity,
              transform: `translateY(${member.cardY}px)`,
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: CYAN,
                fontWeight: 600,
              }}
            >
              {member.name}
            </span>
            {/* Segmented capacity bar */}
            <div style={{ display: 'flex', gap: 2 }}>
              {member.segments.map((seg, si) => (
                <div
                  key={si}
                  style={{
                    flex: 1,
                    height: 8,
                    background: seg.filled ? CYAN : BORDER,
                    opacity: seg.filled ? seg.segOpacity : 0.2,
                  }}
                />
              ))}
            </div>
            <span
              style={{
                fontSize: 11,
                color: TEXT_SECONDARY,
              }}
            >
              {member.capacity}/{member.max}
            </span>
          </div>
        ))}

        {/* Total card */}
        <div
          style={{
            width: 90,
            background: BG_CARD,
            border: `2px solid ${CYAN}44`,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            opacity: interpolate(frame, [40, 50], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          <span
            style={{
              fontSize: 22,
              color: CYAN,
              fontWeight: 700,
            }}
          >
            {totalCount}
          </span>
          <span
            style={{
              fontSize: 9,
              color: TEXT_TERTIARY,
              letterSpacing: 1,
            }}
          >
            PTS
          </span>
        </div>
      </div>

      {/* ── TASK ALLOCATION ── */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* INCLUDE column */}
        <div
          style={{
            flex: 1,
            background: BG_CARD,
            border: `2px solid ${BORDER}`,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              opacity: interpolate(frame, [88, 94], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: GREEN,
                fontWeight: 700,
                letterSpacing: 1.5,
              }}
            >
              INCLUDE
            </span>
            <span style={{ fontSize: 10, color: TEXT_TERTIARY }}>
              12 pts
            </span>
          </div>

          {includeCards.map((task) => (
            <div
              key={task.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 8px',
                borderLeft: `2px solid ${task.critical ? RED : GREEN}`,
                background: task.critical ? `${RED}0A` : 'transparent',
                opacity: task.opacity,
                transform: `translateX(${task.slideX}px)`,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: TEXT_TERTIARY,
                  minWidth: 46,
                }}
              >
                {task.id}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: TEXT_PRIMARY,
                  flex: 1,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {task.label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: TEXT_PRIMARY,
                  fontWeight: 700,
                }}
              >
                {task.pts}pts
              </span>
              {task.critical && (
                <span
                  style={{
                    fontSize: 9,
                    color: RED,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    border: `1px solid ${RED}44`,
                    padding: '1px 5px',
                  }}
                >
                  CRITICAL
                </span>
              )}
            </div>
          ))}
        </div>

        {/* DEFER column */}
        <div
          style={{
            width: '38%',
            background: BG_CARD,
            border: `2px solid ${BORDER}`,
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              opacity: interpolate(frame, [113, 119], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: AMBER,
                fontWeight: 700,
                letterSpacing: 1.5,
              }}
            >
              DEFER
            </span>
            <span style={{ fontSize: 10, color: TEXT_TERTIARY }}>
              10 pts
            </span>
          </div>

          {deferCards.map((task) => (
            <div
              key={task.id}
              style={{
                position: 'relative',
                padding: '5px 8px',
                borderLeft: `2px solid ${AMBER}44`,
                opacity: task.opacity,
                transform: `translateX(${task.slideX}px)`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: TEXT_TERTIARY,
                    minWidth: 46,
                  }}
                >
                  {task.id}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: TEXT_SECONDARY,
                    flex: 1,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {task.label}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: TEXT_SECONDARY,
                  }}
                >
                  {task.pts}pts
                </span>
              </div>
              {/* Strikethrough line */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: 8,
                  right: 8,
                  height: 1,
                  background: AMBER,
                  opacity: 0.4,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── AI REASONING TICKER ── */}
      <div
        style={{
          height: 28,
          minHeight: 28,
          flexShrink: 0,
          background: BG_SURFACE,
          border: `2px solid ${BORDER}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: 8,
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: CYAN,
            fontWeight: 700,
            opacity: interpolate(
              Math.sin(frame * 0.2),
              [-1, 1],
              [0.3, 1],
            ),
          }}
        >
          &gt;
        </span>
        <div
          style={{
            flex: 1,
            position: 'relative',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {aiDisplayMessages.map(
            (m, i) =>
              m.visible && (
                <span
                  key={i}
                  style={{
                    position: 'absolute',
                    fontSize: 10,
                    color: TEXT_SECONDARY,
                    whiteSpace: 'nowrap',
                    opacity: m.opacity,
                  }}
                >
                  {m.msg.slice(0, m.charCount)}
                  <span
                    style={{
                      color: CYAN,
                      opacity: interpolate(
                        Math.sin(frame * 0.3),
                        [-1, 1],
                        [0, 1],
                      ),
                    }}
                  >
                    _
                  </span>
                </span>
              ),
          )}
        </div>
      </div>

      {/* ── SPRINT HEALTH FOOTER ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexShrink: 0,
          borderTop: `2px solid ${BORDER}`,
          paddingTop: 10,
        }}
      >
        {/* Load bar */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: 9,
                color: TEXT_TERTIARY,
                letterSpacing: 1,
              }}
            >
              SPRINT LOAD
            </span>
            <span
              style={{
                fontSize: 12,
                color: loadBarColor,
                fontWeight: 600,
              }}
            >
              {Math.round(loadBarProgress)}%
            </span>
          </div>
          <div
            style={{
              position: 'relative',
              height: 10,
              background: `${BORDER}44`,
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${loadBarProgress}%`,
                background: GREEN,
              }}
            />
          </div>
        </div>

        {/* Risk label */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            opacity: riskOpacity,
            transform: `scale(${riskScale})`,
          }}
        >
          <span
            style={{
              fontSize: 16,
              color: GREEN,
              fontWeight: 700,
            }}
          >
            LOW
          </span>
          <span
            style={{
              fontSize: 9,
              color: TEXT_TERTIARY,
              letterSpacing: 1,
            }}
          >
            RISK
          </span>
        </div>

        {/* Confidence counter */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <span
            style={{
              fontSize: 16,
              color: GREEN,
              fontWeight: 700,
            }}
          >
            {confidenceCount}%
          </span>
          <span
            style={{
              fontSize: 9,
              color: TEXT_TERTIARY,
              letterSpacing: 1,
            }}
          >
            CONFIDENCE
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
}
