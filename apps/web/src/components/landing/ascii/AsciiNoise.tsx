import { useMemo } from 'react'
import { noiseChars } from './asciiArt'

interface AsciiNoiseProps {
  density?: number // chars per 100px
  opacity?: number // 0-1
  className?: string
  color?: string
}

/**
 * Generates a faint background of random code characters.
 * Purely decorative ambient texture at very low opacity.
 * Inspired by Firecrawl's dot-pattern backgrounds.
 */
export default function AsciiNoise({
  density = 3,
  opacity = 0.04,
  className = '',
  color = 'text-brutal-info',
}: AsciiNoiseProps) {
  const chars = useMemo(() => {
    const rows = 40
    const cols = 80
    const result: string[] = []
    for (let r = 0; r < rows; r++) {
      let line = ''
      for (let c = 0; c < cols; c++) {
        if (Math.random() < density / 10) {
          line += noiseChars[Math.floor(Math.random() * noiseChars.length)]
        } else {
          line += ' '
        }
      }
      result.push(line)
    }
    return result.join('\n')
  }, [density])

  return (
    <pre
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none font-mono text-[10px] leading-[1.4] whitespace-pre ${color} ${className}`}
      style={{ opacity }}
    >
      {chars}
    </pre>
  )
}
