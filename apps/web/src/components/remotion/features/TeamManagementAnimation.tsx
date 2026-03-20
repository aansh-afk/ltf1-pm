import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

const FONT: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };

const MEMBERS = [
  { name: '@ada', initial: 'A', load: 10, max: 10, status: 'OVERLOADED', statusColor: '#EF4444', barColor: '#EF4444' },
  { name: '@bob', initial: 'B', load: 6, max: 10, status: 'BLOCKED', statusColor: '#EF4444', barColor: '#F59E0B' },
  { name: '@eve', initial: 'E', load: 2, max: 10, status: 'AVAILABLE', statusColor: '#22C55E', barColor: '#22C55E' },
  { name: '@max', initial: 'M', load: 7, max: 10, status: 'ACTIVE', statusColor: '#22C55E', barColor: '#F59E0B' },
];

const BLOCKERS = [
  { who: '@bob', time: '4.2h', on: 'PR #198', from: '@ada', resolution: 'notified via Slack' },
  { who: '@max', time: '1.1h', on: 'TSK-95', from: '@eve', resolution: 'flagged in standup' },
];

const STATS = [
  { label: 'pts', target: 25, total: 40, color: '#8B5CF6' },
  { label: 'blocked', target: 1, total: null, color: '#EF4444' },
  { label: 'available', target: 1, total: null, color: '#22C55E' },
];

export default function TeamManagementAnimation() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── PHASE 1: Header (0-30) ──
  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const headerY = interpolate(frame, [0, 15], [-20, 0], { extrapolateRight: 'clamp' });
  const badgeOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: 'clamp' });
  const badgeX = interpolate(frame, [10, 25], [30, 0], { extrapolateRight: 'clamp' });

  // ── PHASE 3: Summary stats (100-140) ──
  const statsY = interpolate(frame, [100, 120], [40, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const statsOpacity = interpolate(frame, [100, 115], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  // ── PHASE 4: Blockers (140-220) ──
  const blockerHeaderOpacity = interpolate(frame, [140, 150], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const blockerPulse = frame >= 140
    ? interpolate(frame % 20, [0, 10, 20], [1, 0.3, 1])
    : 0;

  // ── PHASE 5: Suggestion (220-260) ──
  const suggestionOpacity = interpolate(frame, [220, 235], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
  const suggestionY = interpolate(frame, [220, 240], [20, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  // Arrow animation
  const arrowProgress = interpolate(frame, [240, 258], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

  return (
    <AbsoluteFill style={{ ...FONT, backgroundColor: '#050505', padding: '24px 32px', fontSize: 11, color: '#9CA3AF' }}>

      {/* ── HEADER ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        opacity: headerOpacity,
        transform: `translateY(${headerY}px)`,
      }}>
        <span style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#F9FAFB',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}>
          TEAM WORKLOAD
        </span>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#06B6D4',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          border: '2px solid #06B6D4',
          padding: '2px 10px',
          opacity: badgeOpacity,
          transform: `translateX(${badgeX}px)`,
        }}>
          SPRINT 14
        </span>
      </div>

      {/* ── MEMBER ROWS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {MEMBERS.map((member, i) => {
          const rowStart = 30 + i * 10;
          const rowOpacity = interpolate(frame, [rowStart, rowStart + 12], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
          const rowX = interpolate(frame, [rowStart, rowStart + 12], [-40, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

          // Status badge springs in after bar completes
          const badgeSpring = spring({
            frame: frame - (rowStart + 40),
            fps,
            config: { damping: 12, stiffness: 200, mass: 0.6 },
          });
          const showBadge = frame >= rowStart + 40;

          return (
            <div
              key={member.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                opacity: rowOpacity,
                transform: `translateX(${rowX}px)`,
                height: 36,
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 32,
                height: 32,
                backgroundColor: '#111111',
                border: '2px solid #2E2E35',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#06B6D4',
                }}>
                  {member.initial}
                </span>
              </div>

              {/* Name */}
              <span style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#06B6D4',
                width: 48,
                flexShrink: 0,
              }}>
                {member.name}
              </span>

              {/* Segmented workload bar */}
              <div style={{ display: 'flex', gap: 2, width: 200, height: 14, flexShrink: 0 }}>
                {Array.from({ length: member.max }).map((_, si) => {
                  const segStart = rowStart + 8 + si * 3;
                  const segFill = interpolate(frame, [segStart, segStart + 4], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
                  const isFilled = si < member.load;
                  return (
                    <div
                      key={si}
                      style={{
                        flex: 1,
                        backgroundColor: isFilled
                          ? member.barColor
                          : '#1A1A1A',
                        border: '1px solid #2E2E35',
                        opacity: isFilled ? segFill : 0.4,
                      }}
                    />
                  );
                })}
              </div>

              {/* Load fraction */}
              <span style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#F9FAFB',
                width: 40,
                textAlign: 'right',
                flexShrink: 0,
              }}>
                {member.load}/{member.max}
              </span>

              {/* Status badge */}
              <div style={{
                width: 100,
                flexShrink: 0,
              }}>
                {showBadge && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: member.statusColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    border: `2px solid ${member.statusColor}`,
                    padding: '2px 8px',
                    transform: `scale(${badgeSpring})`,
                    display: 'inline-block',
                  }}>
                    {member.status}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── SUMMARY STATS ── */}
      {frame >= 100 && (
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 14,
          opacity: statsOpacity,
          transform: `translateY(${statsY}px)`,
        }}>
          {STATS.map((stat, i) => {
            const countProgress = interpolate(frame, [105 + i * 5, 130 + i * 5], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
            const currentVal = Math.round(stat.target * countProgress);
            return (
              <div
                key={stat.label}
                style={{
                  border: '2px solid #2E2E35',
                  backgroundColor: '#111111',
                  padding: '8px 16px',
                  textAlign: 'center',
                  flex: 1,
                }}
              >
                <div style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: stat.color,
                  lineHeight: 1.2,
                }}>
                  {stat.total ? `${currentVal}/${stat.total}` : currentVal}
                </div>
                <div style={{
                  fontSize: 10,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginTop: 2,
                }}>
                  {stat.total ? 'pts' : stat.label}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── BLOCKERS DETECTED ── */}
      {frame >= 140 && (
        <div style={{ marginBottom: 12 }}>
          {/* Blocker header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
            opacity: blockerHeaderOpacity,
          }}>
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#EF4444',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}>
              BLOCKERS DETECTED
            </span>
            <div style={{
              width: 8,
              height: 8,
              backgroundColor: '#EF4444',
              opacity: blockerPulse,
            }} />
          </div>

          {/* Blocker cards */}
          {BLOCKERS.map((b, bi) => {
            const cardStart = 150 + bi * 20;
            const cardX = interpolate(frame, [cardStart, cardStart + 15], [200, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
            const cardOpacity = interpolate(frame, [cardStart, cardStart + 10], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

            // Resolution line types in
            const resStart = cardStart + 20;
            const resMaxChars = b.resolution.length + 2; // "✓ " prefix
            const resProgress = interpolate(frame, [resStart, resStart + 25], [0, resMaxChars], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
            const resText = `\u2713 ${b.resolution}`.slice(0, Math.floor(resProgress));
            const showRes = frame >= resStart;

            // Green checkmark spring
            const checkSpring = spring({
              frame: frame - (resStart + 25),
              fps,
              config: { damping: 10, stiffness: 180, mass: 0.5 },
            });
            const showCheck = frame >= resStart + 25;

            return (
              <div
                key={bi}
                style={{
                  opacity: cardOpacity,
                  transform: `translateX(${cardX}px)`,
                  marginBottom: 6,
                  border: '2px solid #2E2E35',
                  backgroundColor: '#111111',
                  padding: '8px 12px',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  flexWrap: 'wrap',
                }}>
                  <span style={{ color: '#06B6D4', fontWeight: 700 }}>{b.who}</span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#EF4444',
                    border: '2px solid #EF4444',
                    padding: '0 6px',
                    lineHeight: '16px',
                  }}>
                    BLOCKED
                  </span>
                  <span style={{ color: '#F59E0B', fontWeight: 700 }}>{b.time}</span>
                  <span style={{ color: '#6B7280' }}>on</span>
                  <span style={{ color: '#F9FAFB', fontWeight: 700 }}>{b.on}</span>
                  <span style={{ color: '#6B7280' }}>waiting for</span>
                  <span style={{ color: '#06B6D4', fontWeight: 700 }}>{b.from}</span>
                </div>
                {showRes && (
                  <div style={{
                    fontSize: 11,
                    marginTop: 4,
                    paddingLeft: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    <span style={{ color: '#22C55E' }}>{resText}</span>
                    {showCheck && (
                      <span style={{
                        color: '#22C55E',
                        fontWeight: 700,
                        fontSize: 14,
                        transform: `scale(${checkSpring})`,
                        display: 'inline-block',
                      }}>
                        {'\u2713'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── SUGGESTION BAR ── */}
      {frame >= 220 && (
        <div style={{
          opacity: suggestionOpacity,
          transform: `translateY(${suggestionY}px)`,
          border: '2px solid #F59E0B',
          backgroundColor: '#111111',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
          position: 'relative',
        }}>
          <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: 12 }}>SUGGESTION: </span>
          <span style={{ color: '#F9FAFB', fontSize: 12 }}>&nbsp;move TSK-94 from </span>
          <span style={{ color: '#06B6D4', fontWeight: 700, fontSize: 12 }}>&nbsp;@ada</span>
          <span style={{ color: '#F9FAFB', fontSize: 12 }}>&nbsp;</span>
          {/* Animated arrow */}
          <svg width="32" height="14" viewBox="0 0 32 14" style={{ flexShrink: 0 }}>
            <line
              x1="0"
              y1="7"
              x2={arrowProgress * 24}
              y2="7"
              stroke="#F59E0B"
              strokeWidth="2"
            />
            {arrowProgress > 0.8 && (
              <>
                <line x1="20" y1="3" x2="26" y2="7" stroke="#F59E0B" strokeWidth="2" />
                <line x1="20" y1="11" x2="26" y2="7" stroke="#F59E0B" strokeWidth="2" />
              </>
            )}
          </svg>
          <span style={{ color: '#06B6D4', fontWeight: 700, fontSize: 12 }}>&nbsp;@eve</span>
          <span style={{ color: '#6B7280', fontSize: 12 }}>&nbsp;(8pts free)</span>
        </div>
      )}

      {/* ── REBALANCE ARROW OVERLAY (drawn between @ada row and @eve row) ── */}
      {frame >= 240 && (
        <svg
          width="960"
          height="540"
          viewBox="0 0 960 540"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}
        >
          {/* Arrow from @ada row area to @eve row area */}
          {(() => {
            // @ada row is index 0, @eve row is index 2
            // Approximate Y positions based on layout: header ~50px, rows start ~66px, each row ~42px
            const adaY = 24 + 40 + 0 * 42 + 18; // row center
            const eveY = 24 + 40 + 2 * 42 + 18;
            const startX = 520; // right side of bars
            const endX = 520;
            const curveX = 560;

            const pathLength = Math.abs(eveY - adaY) + 80;
            const dashOffset = interpolate(frame, [240, 258], [pathLength, 0], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

            return (
              <path
                d={`M ${startX} ${adaY} C ${curveX} ${adaY}, ${curveX} ${eveY}, ${endX} ${eveY}`}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeDasharray={pathLength}
                strokeDashoffset={dashOffset}
                opacity={0.7}
              />
            );
          })()}
        </svg>
      )}
    </AbsoluteFill>
  );
}
