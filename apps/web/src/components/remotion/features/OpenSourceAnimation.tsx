import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

const FONT = "'IBM Plex Mono', monospace";
const mono: React.CSSProperties = { fontFamily: FONT };

const BG = '#050505';
const SURFACE = '#0A0A0A';
const CARD = '#111111';
const TEXT_PRIMARY = '#F9FAFB';
const TEXT_SECONDARY = '#9CA3AF';
const TEXT_TERTIARY = '#6B7280';
const BORDER = '#2E2E35';
const GREEN = '#22C55E';
const AMBER = '#F59E0B';
const PURPLE = '#8B5CF6';
const CYAN = '#06B6D4';

const licenseRows = [
  { label: 'source', value: 'fully available' },
  { label: 'modify', value: 'AGPL permitted' },
  { label: 'self-host', value: 'Docker+k8s' },
  { label: 'lock-in', value: 'none' },
  { label: 'data', value: 'export anytime' },
];

const services = [
  { name: 'ltf1-web', port: ':3000' },
  { name: 'ltf1-api', port: ':8080' },
  { name: 'ltf1-db', port: ':5432' },
  { name: 'ltf1-worker', port: '' },
];

const communityStats = [
  { target: 2400, label: 'stars', suffix: '+', color: AMBER },
  { target: 45, label: 'contributors', suffix: '+', color: PURPLE },
  { target: null, label: 'latest', display: 'v0.9.2', color: GREEN },
  { target: 8, label: 'first issues', suffix: '', color: CYAN },
];

const spinnerChars = ['|', '/', '—', '\\'];

function typeText(text: string, frame: number, startFrame: number, charsPerFrame = 0.6): string {
  const elapsed = Math.max(0, frame - startFrame);
  const chars = Math.floor(elapsed * charsPerFrame);
  return text.slice(0, Math.min(chars, text.length));
}

function countUp(target: number, frame: number, startFrame: number, duration: number): number {
  const progress = Math.min(1, Math.max(0, (frame - startFrame) / duration));
  const eased = 1 - Math.pow(1 - progress, 3);
  return Math.round(target * eased);
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

export default function OpenSourceAnimation() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === FRAME 0-30: Title, badge, star count ===
  const titleOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const titleY = interpolate(frame, [0, 12], [20, 0], { extrapolateRight: 'clamp' });

  const badgeScale = spring({ frame: frame - 8, fps, config: { damping: 12, stiffness: 200 } });

  const starOpacity = interpolate(frame, [12, 20], [0, 1], { extrapolateRight: 'clamp' });
  const starCount = countUp(2400, frame, 5, 25);
  const starDisplay = starCount < 2400 ? formatNumber(Math.max(2380, starCount)) : '2,400';

  // === FRAME 90-100: Divider ===
  // === FRAME 100-180: Docker typing ===
  const dockerCmd = '$ docker compose up -d';
  const dockerTyped = typeText(dockerCmd, frame, 104, 0.8);

  // === FRAME 240-270: Tagline ===
  const taglineParts = ['your data', 'your infra', 'your rules'];
  const taglineStartFrames = [240, 252, 264];

  return (
    <AbsoluteFill
      style={{
        ...mono,
        backgroundColor: BG,
        color: TEXT_PRIMARY,
        padding: '20px 28px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* === HEADER === */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: TEXT_PRIMARY }}>
            OPEN SOURCE
          </span>
          <div
            style={{
              transform: `scale(${badgeScale})`,
              backgroundColor: SURFACE,
              border: `2px solid ${BORDER}`,
              padding: '3px 10px',
              fontSize: 12,
              fontWeight: 600,
              color: GREEN,
            }}
          >
            AGPL-3.0
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: starOpacity,
            fontSize: 13,
            color: AMBER,
          }}
        >
          <span style={{ fontSize: 16 }}>&#9733;</span>
          <span style={{ fontWeight: 600 }}>{starDisplay}</span>
        </div>
      </div>

      {/* === TWO COLUMNS: License + Deploy === */}
      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
        {/* LEFT: License features */}
        <div style={{ flex: 1, border: `2px solid ${BORDER}`, backgroundColor: CARD, padding: '12px 14px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            WHAT YOU GET
          </div>
          <div style={{ flex: 1 }}>
            {licenseRows.map((row, i) => {
              const rowStart = 30 + i * 10;
              const rowOpacity = interpolate(frame, [rowStart, rowStart + 8], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const rowX = interpolate(frame, [rowStart, rowStart + 8], [-40, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              return (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, opacity: rowOpacity, transform: `translateX(${rowX}px)`, fontSize: 12 }}>
                  <span style={{ color: GREEN, fontWeight: 700, fontSize: 14 }}>+</span>
                  <span style={{ color: TEXT_SECONDARY, minWidth: 70 }}>{row.label}</span>
                  <span style={{ color: TEXT_PRIMARY, fontWeight: 500 }}>{row.value}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Deploy terminal */}
        <div style={{ flex: 1, border: `2px solid ${BORDER}`, backgroundColor: CARD, padding: '12px 14px', display: 'flex', flexDirection: 'column', opacity: interpolate(frame, [90, 100], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            SELF-HOST
          </div>
          {/* Docker command */}
          <div style={{ fontSize: 12, marginBottom: 8, display: 'flex', alignItems: 'center' }}>
            <span style={{ color: GREEN }}>{dockerTyped}</span>
            {frame >= 100 && frame < 130 && (
              <span style={{ display: 'inline-block', width: 7, height: 14, backgroundColor: GREEN, marginLeft: 2, opacity: frame % 16 < 8 ? 1 : 0 }} />
            )}
          </div>

          {/* Services */}
          <div style={{ flex: 1 }}>
            {services.map((svc, i) => {
              const svcStart = 124 + i * 10;
              const svcOpacity = interpolate(frame, [svcStart, svcStart + 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
              const elapsed = frame - svcStart;
              const isDone = elapsed >= 12;
              const statusColor = isDone ? GREEN : AMBER;
              const statusText = isDone ? 'running' : 'starting...';
              const statusIcon = isDone ? '+' : spinnerChars[frame % 4];
              return (
                <div key={svc.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, opacity: svcOpacity, fontSize: 12 }}>
                  <span style={{ color: statusColor, fontWeight: 700, width: 12, textAlign: 'center', fontSize: 13 }}>{statusIcon}</span>
                  <span style={{ color: TEXT_PRIMARY, minWidth: 100 }}>{svc.name}{svc.port && <span style={{ color: TEXT_TERTIARY }}> {svc.port}</span>}</span>
                  <span style={{ color: statusColor, fontSize: 11 }}>{statusText}</span>
                </div>
              );
            })}
          </div>

          {/* Ready */}
          {frame >= 172 && (
            <div style={{ fontSize: 12, marginTop: 4 }}>
              <span style={{ color: GREEN }}>{typeText('ready at localhost:3000', frame, 172, 0.7)}</span>
            </div>
          )}
        </div>
      </div>

      {/* === COMMUNITY STATS === */}
      <div style={{ display: 'flex', gap: 10, marginTop: 10, flexShrink: 0 }}>
        {communityStats.map((stat, i) => {
          const cardStart = 180 + i * 8;
          const cardScale = spring({ frame: frame - cardStart, fps, config: { damping: 14, stiffness: 180 } });
          const cardOpacity = interpolate(frame, [cardStart, cardStart + 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          let displayValue: string;
          if (stat.target !== null) {
            const counted = countUp(stat.target, frame, cardStart, 30);
            displayValue = formatNumber(counted) + (stat.suffix || '');
          } else {
            displayValue = stat.display || '';
          }
          return (
            <div key={stat.label} style={{ flex: 1, backgroundColor: SURFACE, border: `2px solid ${BORDER}`, padding: '8px 10px', transform: `scale(${cardScale})`, opacity: cardOpacity, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: stat.color, marginBottom: 2 }}>{displayValue}</div>
              <div style={{ fontSize: 9, color: TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* === TAGLINE === */}
      {frame >= 240 && (
        <div style={{ textAlign: 'center', fontSize: 13, color: TEXT_SECONDARY, marginTop: 8, flexShrink: 0 }}>
          {taglineParts.map((part, i) => {
            const partStart = taglineStartFrames[i];
            const typed = typeText(part, frame, partStart, 0.8);
            const showSep = i < taglineParts.length - 1 && typed.length === part.length;
            return (
              <span key={part}>
                <span style={{ color: TEXT_PRIMARY, fontWeight: 500 }}>{typed}</span>
                {showSep && <span style={{ color: TEXT_TERTIARY, margin: '0 8px' }}>&middot;</span>}
              </span>
            );
          })}
        </div>
      )}
    </AbsoluteFill>
  );
}
