import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, useAnimation } from 'framer-motion'

const COLUMNS = 6
const STAGGER = 0.04
const FALL_DURATION = 0.25
const RISE_DURATION = 0.25
const HOLD = 0.12

// Workspace/app routes where the monolith transition should be skipped
const APP_ROUTE_PREFIXES = [
  '/dashboard', '/profile', '/workspaces', '/workspace/',
  '/projects', '/tasks', '/teams', '/team',
  '/sprints', '/settings', '/whiteboard', '/custom-fields',
  '/cli-auth',
]

function isAppRoute(path: string): boolean {
  return APP_ROUTE_PREFIXES.some(prefix => path.startsWith(prefix))
}

function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

export default function PageTransition() {
  const navigate = useNavigate()
  const location = useLocation()
  const controls = useAnimation()
  const [active, setActive] = useState(false)
  const animating = useRef(false)
  const locationRef = useRef(location.pathname)
  // Track whether the current navigation was initiated by our click interceptor
  const interceptedNav = useRef(false)

  const reveal = useCallback(async () => {
    // Scroll to top while covered
    scrollToTop()

    // Brief hold for new page to mount
    await new Promise((r) => setTimeout(r, HOLD * 1000))

    // Lift columns up
    await controls.start((i: number) => ({
      y: '-100%',
      transition: {
        duration: RISE_DURATION,
        delay: i * STAGGER,
        ease: [0.76, 0, 0.24, 1],
      },
    }))

    // Ensure scroll is still at top after reveal
    scrollToTop()

    setActive(false)
    animating.current = false
  }, [controls])

  // Full transition: cover → navigate → reveal (used by click interceptor)
  const runTransition = useCallback(
    async (to: string) => {
      if (animating.current) return
      if (to === locationRef.current) return

      const toPath = to.split('?')[0].split('#')[0]
      const fromPath = locationRef.current

      // Skip monolith animation for navigation within workspace/app routes
      if (isAppRoute(fromPath) && isAppRoute(toPath)) {
        interceptedNav.current = true
        navigate(to)
        locationRef.current = toPath
        return
      }

      animating.current = true
      interceptedNav.current = true
      setActive(true)

      // Columns fall from above to cover the screen
      await controls.start((i: number) => ({
        y: '0%',
        transition: {
          duration: FALL_DURATION,
          delay: i * STAGGER,
          ease: [0.76, 0, 0.24, 1],
        },
      }))

      // Navigate while fully covered
      navigate(to)
      locationRef.current = toPath

      await reveal()
    },
    [controls, navigate, reveal],
  )

  // Handle back/forward (popstate) and any other navigation we didn't intercept.
  // When location changes without our interceptor, the page has already swapped —
  // instantly cover, then reveal.
  useLayoutEffect(() => {
    const newPath = location.pathname
    if (newPath === locationRef.current) return
    const previousPath = locationRef.current
    locationRef.current = newPath

    // If this navigation came from our interceptor, it's already handled
    if (interceptedNav.current) {
      interceptedNav.current = false
      return
    }

    // Skip monolith for app-to-app back/forward navigation
    if (isAppRoute(newPath) && isAppRoute(previousPath)) {
      return
    }

    // Popstate / programmatic navigation — page already rendered underneath.
    // Instantly snap columns into covering position, then reveal.
    if (animating.current) return
    animating.current = true
    setActive(true)
    controls.set({ y: '0%' }) // instant cover (no animation, hides the flash)
    reveal()
  }, [location.pathname, controls, reveal])

  // Intercept clicks on internal <a> elements in capture phase
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return

      const anchor = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href) return

      if (
        href.startsWith('http') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href === '#'
      )
        return

      if (anchor.target && anchor.target !== '_self') return

      const url = new URL(href, window.location.origin)

      // Skip same-page navigation
      if (url.pathname === locationRef.current) return

      e.preventDefault()
      e.stopPropagation()

      runTransition(url.pathname + url.search + url.hash)
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [runTransition])

  return (
    <div
      className="fixed inset-0 z-[9999] flex"
      style={{ pointerEvents: active ? 'all' : 'none' }}
    >
      {Array.from({ length: COLUMNS }).map((_, i) => (
        <motion.div
          key={i}
          custom={i}
          animate={controls}
          initial={{ y: '-100%' }}
          className="flex-1 h-full"
          style={{ backgroundColor: i % 2 === 0 ? '#0A0A0A' : '#111111' }}
        />
      ))}
    </div>
  )
}
