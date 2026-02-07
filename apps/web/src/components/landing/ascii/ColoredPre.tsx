/**
 * Renders ASCII art with inline color markup.
 *
 * Syntax: {x:text} where x is a color code:
 *   g = green (#22C55E)  — commands, success, positive
 *   r = red (#EF4444)    — errors, critical, negative
 *   y = amber (#F59E0B)  — warnings, moderate
 *   c = cyan (#06B6D4)   — labels, identifiers
 *   w = white (#F9FAFB)  — important values, headers
 *   p = purple (#8B5CF6) — numbers, metrics, data
 *
 * Everything else renders as the default text color.
 */

const colorMap: Record<string, string> = {
  g: '#22C55E',
  r: '#EF4444',
  y: '#F59E0B',
  c: '#06B6D4',
  w: '#F9FAFB',
  p: '#8B5CF6',
}

const TOKEN_RE = /(\{[grycwp]:[^}]*\})/g
const PARSE_RE = /^\{([grycwp]):([^}]*)\}$/

export default function ColoredPre({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const parts = text.split(TOKEN_RE)

  return (
    <pre className={className}>
      {parts.map((part, i) => {
        const m = part.match(PARSE_RE)
        if (m) {
          return (
            <span key={i} style={{ color: colorMap[m[1]] }}>
              {m[2]}
            </span>
          )
        }
        return part
      })}
    </pre>
  )
}
