import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'

type AnimationMode = 'typewriter' | 'line-reveal' | 'glitch' | 'pulse' | 'static'

interface AnimatedAsciiProps {
  art: string[]
  mode?: AnimationMode
  color?: string
  speed?: number
  delay?: number
  className?: string
}

const GLITCH_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`'

export default function AnimatedAscii({
  art,
  mode = 'static',
  color = 'text-brutal-info',
  speed = 1,
  delay = 0,
  className = '',
}: AnimatedAsciiProps) {
  const ref = useRef<HTMLPreElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [displayedText, setDisplayedText] = useState<string[]>([])
  const [started, setStarted] = useState(false)

  // Handle delay
  useEffect(() => {
    if (!isInView) return
    if (delay > 0) {
      const timer = setTimeout(() => setStarted(true), delay * 1000)
      return () => clearTimeout(timer)
    }
    setStarted(true)
  }, [isInView, delay])

  // Typewriter animation
  const runTypewriter = useCallback(() => {
    const fullText = art.join('\n')
    let charIndex = 0
    const interval = setInterval(() => {
      charIndex++
      const revealed = fullText.slice(0, charIndex)
      setDisplayedText(revealed.split('\n'))
      if (charIndex >= fullText.length) {
        clearInterval(interval)
      }
    }, Math.max(5, 20 / speed))
    return () => clearInterval(interval)
  }, [art, speed])

  // Glitch animation
  const runGlitch = useCallback(() => {
    const totalIterations = Math.ceil(12 / speed)
    let iteration = 0
    const interval = setInterval(() => {
      iteration++
      const progress = iteration / totalIterations
      const lines = art.map((line) =>
        line
          .split('')
          .map((char, i) => {
            if (char === ' ') return ' '
            const charProgress = (i / line.length) * 0.5 + progress * 0.5
            if (charProgress > progress) {
              return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
            }
            return char
          })
          .join('')
      )
      setDisplayedText(lines)
      if (iteration >= totalIterations) {
        clearInterval(interval)
        setDisplayedText([...art])
      }
    }, Math.max(30, 60 / speed))
    return () => clearInterval(interval)
  }, [art, speed])

  useEffect(() => {
    if (!started) return

    if (mode === 'static' || mode === 'line-reveal' || mode === 'pulse') {
      setDisplayedText([...art])
      return
    }

    if (mode === 'typewriter') {
      return runTypewriter()
    }

    if (mode === 'glitch') {
      return runGlitch()
    }
  }, [started, mode, art, runTypewriter, runGlitch])

  // Static mode - immediate render
  if (mode === 'static') {
    return (
      <pre
        ref={ref}
        aria-hidden="true"
        className={`font-mono text-xs sm:text-sm leading-tight select-none whitespace-pre ${color} ${className}`}
      >
        {art.join('\n')}
      </pre>
    )
  }

  // Pulse mode
  if (mode === 'pulse') {
    return (
      <pre
        ref={ref}
        aria-hidden="true"
        className={`font-mono text-xs sm:text-sm leading-tight select-none whitespace-pre ascii-glow ${color} ${className}`}
      >
        {art.join('\n')}
      </pre>
    )
  }

  // Line-reveal mode - each line staggers in
  if (mode === 'line-reveal') {
    return (
      <pre
        ref={ref}
        aria-hidden="true"
        className={`font-mono text-xs sm:text-sm leading-tight select-none whitespace-pre ${color} ${className}`}
      >
        {art.map((line, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={started ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: i * (0.1 / speed), duration: 0.3 }}
            className="block"
          >
            {line}
          </motion.span>
        ))}
      </pre>
    )
  }

  // Typewriter + glitch modes
  return (
    <pre
      ref={ref}
      aria-hidden="true"
      className={`font-mono text-xs sm:text-sm leading-tight select-none whitespace-pre ${color} ${className}`}
    >
      {displayedText.length > 0 ? displayedText.join('\n') : '\u00A0'}
      {mode === 'typewriter' && displayedText.join('').length < art.join('').length && (
        <span className="ascii-cursor" />
      )}
    </pre>
  )
}
