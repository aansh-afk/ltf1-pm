import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';

const FONT: React.CSSProperties = { fontFamily: "'IBM Plex Mono', monospace" };

// Colors
const BG = '#050505';
const CARD = '#111111';
const BORDER = '#2E2E35';
const WHITE = '#F9FAFB';
const GREEN = '#22C55E';
const EMERALD = '#10B981';
const INDIGO = '#6366F1';
const AMBER = '#F59E0B';
const PURPLE = '#8B5CF6';
const CYAN = '#06B6D4';
const GRAY = '#6B7280';
const MUTED = '#9CA3AF';

const PROMPT_GLOW = '0 0 4px rgba(16,185,129,0.2)';
const GREEN_GLOW = '0 0 3px rgba(34,197,94,0.15)';

// Commands
const CMD1 = 'ltf1 tasks --mine --sprint current';
const CMD1_SPLIT = 15; // index where flags start
const CMD2 = 'ltf1 task move TSK-38 --status "in review"';
const CMD2_SPLIT = 24;
const CMD3 = 'ltf1 sprint status';

// Output lines for command 1
const OUTPUT1 = [
  {
    parts: [
      { text: '  #38  auth flow      ', color: WHITE },
      { text: '[*] in progress', color: INDIGO },
    ],
  },
  {
    parts: [{ text: '  #41  api cache      [o] todo', color: MUTED }],
  },
  {
    parts: [
      {
        text: '  #55  token refresh  [v] done',
        color: GREEN,
        glow: GREEN_GLOW,
      },
    ],
  },
  {
    parts: [
      { text: '  3 remaining, 1 done  velocity: ', color: MUTED },
      { text: '+23%', color: PURPLE },
    ],
  },
];

// TUI board data
const BOARD_COLS = [
  {
    title: 'TODO',
    count: 2,
    color: GRAY,
    borderColor: 'rgba(107,114,128,0.3)',
    items: ['TSK-41', 'TSK-62'],
  },
  {
    title: 'PROGRESS',
    count: 2,
    color: INDIGO,
    borderColor: 'rgba(99,102,241,0.3)',
    items: ['TSK-38', 'TSK-44'],
  },
  {
    title: 'DONE',
    count: 3,
    color: GREEN,
    borderColor: 'rgba(34,197,94,0.3)',
    items: ['TSK-55', 'TSK-49', 'TSK-51'],
  },
];

/** Type a command character by character across a frame range */
function useTypedText(
  frame: number,
  text: string,
  startFrame: number,
  endFrame: number,
): string {
  const progress = interpolate(frame, [startFrame, endFrame], [0, text.length], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return text.slice(0, Math.floor(progress));
}

/** Blinking cursor block */
function Cursor({ frame, visible }: { frame: number; visible: boolean }) {
  if (!visible) return null;
  const on = frame % 16 < 8;
  return (
    <span
      style={{
        color: EMERALD,
        textShadow: PROMPT_GLOW,
        opacity: on ? 1 : 0,
      }}
    >
      {'▌'}
    </span>
  );
}

/** Prompt dollar sign */
function Prompt() {
  return (
    <span style={{ color: EMERALD, textShadow: PROMPT_GLOW }}>{'$ '}</span>
  );
}

export default function TerminalFirstAnimation() {
  const frame = useCurrentFrame();
  useVideoConfig();

  // ── Phase calculations ──

  // Terminal window appearance (0-10)
  const windowOpacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const windowY = interpolate(frame, [0, 8], [12, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Command 1 typing (10-50)
  const typed1 = useTypedText(frame, CMD1, 10, 48);
  const showCmd1 = frame >= 10;
  const cmd1Done = frame >= 50;

  // Output 1 lines (50-90) — one every 8 frames
  const output1Visible = OUTPUT1.map((_, i) => frame >= 50 + i * 8);
  const output1Offsets = OUTPUT1.map((_, i) =>
    interpolate(frame, [50 + i * 8, 56 + i * 8], [20, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  const output1Opacities = OUTPUT1.map((_, i) =>
    interpolate(frame, [50 + i * 8, 56 + i * 8], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );

  // Command 2 typing (90-130)
  const typed2 = useTypedText(frame, CMD2, 90, 126);
  const showCmd2 = frame >= 90;
  const cmd2Done = frame >= 130;

  // Output 2 (130-140)
  const output2Visible = frame >= 132;
  const output2X = interpolate(frame, [132, 138], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const output2Opacity = interpolate(frame, [132, 138], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Command 3 typing (130-170) — starts when cmd2 output shows
  const typed3 = useTypedText(frame, CMD3, 140, 160);
  const showCmd3 = frame >= 140;
  const cmd3Done = frame >= 170;

  // Output 3 lines (162-180)
  const output3aVisible = frame >= 162;
  const output3aX = interpolate(frame, [162, 168], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const output3aOp = interpolate(frame, [162, 168], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const output3bVisible = frame >= 170;
  const output3bX = interpolate(frame, [170, 176], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const output3bOp = interpolate(frame, [170, 176], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // TUI Board (170-240)
  // Border draws clockwise: top(174-182), right(182-190), bottom(190-198), left(198-206)
  const boardVisible = frame >= 174;
  const borderTop = interpolate(frame, [174, 182], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const borderRight = interpolate(frame, [182, 190], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const borderBottom = interpolate(frame, [190, 198], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const borderLeft = interpolate(frame, [198, 206], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const borderComplete = frame >= 206;

  // Board header types in (206-218)
  const boardHeaderText = 'ltf1 board';
  const typedBoardHeader = useTypedText(frame, boardHeaderText, 206, 216);
  const boardHeaderDone = frame >= 216;

  // Board columns appear (218-234)
  const colsVisible = BOARD_COLS.map((_, i) => frame >= 218 + i * 5);
  const colsOpacity = BOARD_COLS.map((_, i) =>
    interpolate(frame, [218 + i * 5, 222 + i * 5], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );

  // Nav hints (234-240)
  const navHintsOpacity = interpolate(frame, [234, 240], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // TSK-38 highlight/move (240-260)
  // Highlight slides to TSK-38 in PROGRESS column
  const highlightOpacity = interpolate(frame, [240, 244], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // At frame 250, task moves from PROGRESS to DONE
  const taskMoveProgress = interpolate(frame, [250, 258], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const taskMoved = frame >= 250;

  // Final cursor (260-300)
  const showFinalCursor = frame >= 260;

  // ── Determine which cursor is active ──
  const cursorAtCmd1 = showCmd1 && !cmd1Done;
  const cursorAtCmd2 = showCmd2 && !cmd2Done && frame < 140;
  const cursorAtCmd3 = showCmd3 && !cmd3Done && frame < 170;

  // ── Render helpers ──

  function renderTypedCommand(
    typed: string,
    _fullCmd: string,
    splitAt: number,
    showCursor: boolean,
  ) {
    const cmdPart = typed.slice(0, Math.min(typed.length, splitAt));
    const flagPart = typed.length > splitAt ? typed.slice(splitAt) : '';
    return (
      <div style={{ lineHeight: '20px' }}>
        <Prompt />
        <span style={{ color: WHITE }}>{cmdPart}</span>
        <span style={{ color: MUTED }}>{flagPart}</span>
        <Cursor frame={frame} visible={showCursor} />
      </div>
    );
  }

  // Build the clockwise border using CSS clip-path approximation
  // We'll use individual border sides with opacity
  function boardBorderStyle(): React.CSSProperties {
    if (borderComplete) {
      return { border: `1px solid ${BORDER}` };
    }
    return {
      borderTop: `1px solid ${borderTop > 0 ? BORDER : 'transparent'}`,
      borderRight: `1px solid ${borderRight > 0 ? BORDER : 'transparent'}`,
      borderBottom: `1px solid ${borderBottom > 0 ? BORDER : 'transparent'}`,
      borderLeft: `1px solid ${borderLeft > 0 ? BORDER : 'transparent'}`,
    };
  }

  return (
    <AbsoluteFill
      style={{
        ...FONT,
        backgroundColor: BG,
        color: MUTED,
        overflow: 'hidden',
      }}
    >
      {/* Scanline overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 10,
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.015) 3px, rgba(0,0,0,0.015) 6px)',
        }}
      />

      {/* Main content wrapper */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 20px',
          opacity: windowOpacity,
          transform: `translateY(${windowY}px)`,
        }}
      >
        {/* ── Terminal chrome header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', gap: 5 }}>
            {['#EF4444', '#F59E0B', '#22C55E'].map((c) => (
              <span
                key={c}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: c,
                  opacity: 0.7,
                  display: 'inline-block',
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 11, color: GRAY, marginLeft: 4 }}>
            ltf1 — bash — 80x24
          </span>
          <span
            style={{
              fontSize: 10,
              color: EMERALD,
              marginLeft: 'auto',
              textShadow: '0 0 6px rgba(16,185,129,0.3)',
              opacity: interpolate(frame, [4, 10], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            [connected]
          </span>
        </div>

        {/* ── CLI output area ── */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            fontSize: 13,
            lineHeight: '20px',
            overflow: 'hidden',
          }}
        >
          {/* Command 1 */}
          {showCmd1 &&
            renderTypedCommand(typed1, CMD1, CMD1_SPLIT, cursorAtCmd1)}

          {/* Output 1 */}
          {cmd1Done &&
            OUTPUT1.map((line, i) =>
              output1Visible[i] ? (
                <div
                  key={i}
                  style={{
                    opacity: output1Opacities[i],
                    transform: `translateX(${output1Offsets[i]}px)`,
                  }}
                >
                  {line.parts.map((p, j) => (
                    <span
                      key={j}
                      style={{
                        color: p.color,
                        textShadow:
                          'glow' in p ? (p as { glow: string }).glow : undefined,
                      }}
                    >
                      {p.text}
                    </span>
                  ))}
                </div>
              ) : null,
            )}

          {/* Spacer */}
          {showCmd2 && <div style={{ height: 6 }} />}

          {/* Command 2 */}
          {showCmd2 && (
            <>
              {renderTypedCommand(typed2, CMD2, CMD2_SPLIT, cursorAtCmd2)}
              {/* Output 2 */}
              {output2Visible && (
                <div
                  style={{
                    opacity: output2Opacity,
                    transform: `translateX(${output2X}px)`,
                  }}
                >
                  <span style={{ color: WHITE }}>{'  TSK-38 → '}</span>
                  <span style={{ color: AMBER }}>IN REVIEW</span>
                  <span style={{ color: MUTED }}>{'  PR #142 linked'}</span>
                </div>
              )}
            </>
          )}

          {/* Spacer */}
          {showCmd3 && <div style={{ height: 6 }} />}

          {/* Command 3 */}
          {showCmd3 && (
            <>
              <div style={{ lineHeight: '20px' }}>
                <Prompt />
                <span style={{ color: WHITE }}>{typed3}</span>
                <Cursor frame={frame} visible={cursorAtCmd3} />
              </div>

              {/* Output 3a */}
              {output3aVisible && (
                <div
                  style={{
                    opacity: output3aOp,
                    transform: `translateX(${output3aX}px)`,
                  }}
                >
                  <span style={{ color: WHITE }}>{'  sprint 14: '}</span>
                  <span style={{ color: PURPLE }}>10/34 pts</span>
                  <span style={{ color: WHITE }}> (29%){'  '}</span>
                  <span style={{ color: AMBER }}>6d left</span>
                </div>
              )}
              {/* Output 3b */}
              {output3bVisible && (
                <div
                  style={{
                    opacity: output3bOp,
                    transform: `translateX(${output3bX}px)`,
                  }}
                >
                  <span style={{ color: GREEN, textShadow: GREEN_GLOW }}>
                    {'  velocity: +12% above average'}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── TUI Board Panel ── */}
        {boardVisible && (
          <div
            style={{
              backgroundColor: CARD,
              ...boardBorderStyle(),
              padding: '10px 12px',
              marginTop: 6,
              opacity: interpolate(frame, [174, 180], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {/* Board header */}
            <div style={{ fontSize: 11, marginBottom: 6, minHeight: 16 }}>
              {frame >= 206 && (
                <>
                  <span style={{ color: WHITE, fontWeight: 700 }}>
                    {typedBoardHeader}
                  </span>
                  {boardHeaderDone && (
                    <>
                      <span style={{ color: GRAY }}>{' ── '}</span>
                      <span
                        style={{
                          color: CYAN,
                          opacity: interpolate(frame, [216, 218], [0, 1], {
                            extrapolateLeft: 'clamp',
                            extrapolateRight: 'clamp',
                          }),
                        }}
                      >
                        sprint 14
                      </span>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Columns */}
            <div style={{ display: 'flex', gap: 8, minHeight: 70 }}>
              {BOARD_COLS.map((col, ci) => {
                if (!colsVisible[ci]) return <div key={ci} style={{ flex: 1 }} />;
                return (
                  <div key={ci} style={{ flex: 1, opacity: colsOpacity[ci] }}>
                    {/* Column header */}
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase' as const,
                        color: col.color,
                        borderBottom: `1px solid ${col.borderColor}`,
                        paddingBottom: 3,
                        marginBottom: 4,
                        letterSpacing: '0.04em',
                      }}
                    >
                      {col.title}{' '}
                      <span style={{ fontWeight: 400 }}>
                        {/* Update count when task moves */}
                        {ci === 1 && taskMoved
                          ? col.count - 1
                          : ci === 2 && taskMoved
                            ? col.count + 1
                            : col.count}
                      </span>
                    </div>
                    {/* Items */}
                    {col.items.map((item, _ii) => {
                      const isTSK38 = item === 'TSK-38';
                      const inProgressCol = ci === 1;
                      const inDoneCol = ci === 2;

                      // TSK-38 in PROGRESS: show with highlight, then slide out
                      if (isTSK38 && inProgressCol) {
                        // After move, hide from PROGRESS
                        if (taskMoved && taskMoveProgress >= 1) return null;
                        return (
                          <div
                            key={item}
                            style={{
                              fontSize: 12,
                              lineHeight: '18px',
                              color: WHITE,
                              borderLeft:
                                highlightOpacity > 0
                                  ? `2px solid ${INDIGO}`
                                  : '2px solid transparent',
                              paddingLeft: 6,
                              opacity: taskMoved
                                ? interpolate(
                                    taskMoveProgress,
                                    [0, 0.5],
                                    [1, 0],
                                    {
                                      extrapolateLeft: 'clamp',
                                      extrapolateRight: 'clamp',
                                    },
                                  )
                                : 1,
                              transform: taskMoved
                                ? `translateX(${taskMoveProgress * 80}px)`
                                : undefined,
                            }}
                          >
                            {item}
                          </div>
                        );
                      }

                      // TSK-38 appears in DONE column after move
                      if (isTSK38 && inDoneCol) {
                        // This won't match since TSK-38 isn't in DONE items initially
                        return null;
                      }

                      return (
                        <div
                          key={item}
                          style={{
                            fontSize: 12,
                            lineHeight: '18px',
                            color: MUTED,
                          }}
                        >
                          {item}
                        </div>
                      );
                    })}

                    {/* Add TSK-38 to DONE column when moved */}
                    {ci === 2 && taskMoved && (
                      <div
                        style={{
                          fontSize: 12,
                          lineHeight: '18px',
                          color: WHITE,
                          opacity: interpolate(
                            taskMoveProgress,
                            [0.5, 1],
                            [0, 1],
                            {
                              extrapolateLeft: 'clamp',
                              extrapolateRight: 'clamp',
                            },
                          ),
                          transform: `translateX(${interpolate(
                            taskMoveProgress,
                            [0.5, 1],
                            [-30, 0],
                            {
                              extrapolateLeft: 'clamp',
                              extrapolateRight: 'clamp',
                            },
                          )}px)`,
                          textShadow: GREEN_GLOW,
                        }}
                      >
                        TSK-38
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Nav hints */}
            <div
              style={{
                fontSize: 10,
                color: MUTED,
                marginTop: 6,
                opacity: navHintsOpacity,
              }}
            >
              <span style={{ color: PURPLE }}>[j/k]</span>
              {' navigate  '}
              <span style={{ color: PURPLE }}>[enter]</span>
              {' open  '}
              <span style={{ color: PURPLE }}>[m]</span>
              {' move  '}
              <span style={{ color: PURPLE }}>[q]</span>
              {' quit'}
            </div>
          </div>
        )}

        {/* ── Final blinking cursor ── */}
        {showFinalCursor && (
          <div style={{ fontSize: 13, marginTop: 6, lineHeight: '20px' }}>
            <Prompt />
            <Cursor frame={frame} visible={true} />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
