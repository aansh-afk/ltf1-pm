import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'

const NAV_LINKS = [
  { to: '/#features', label: 'FEATURES' },
  { to: '/pricing', label: 'PRICING' },
  { to: '/blog', label: 'BLOG' },
  { to: '/contact', label: 'CONTACT' },
]

export default function PublicNavigation() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleHashClick = useCallback((e: React.MouseEvent, to: string) => {
    if (!to.startsWith('/#')) return
    const hash = to.slice(1) // e.g. "#features"
    if (location.pathname === '/') {
      // Already on home page — just scroll
      e.preventDefault()
      const el = document.querySelector(hash)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    } else {
      // Navigate to home, then scroll after render
      e.preventDefault()
      navigate('/')
      setTimeout(() => {
        const el = document.querySelector(hash)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
    setMenuOpen(false)
  }, [location.pathname, navigate])

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Track scroll for subtle border brightening
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const isActive = (path: string) =>
    path.startsWith('/#')
      ? location.pathname === '/' && location.hash === path.slice(1)
      : location.pathname === path

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 bg-event-horizon/95 backdrop-blur-sm transition-colors duration-200 ${
          scrolled ? 'border-b-2 border-basalt-border' : 'border-b-2 border-transparent'
        }`}
      >
        <div className="marketing-container px-24px">
          <div className="flex items-center justify-between h-[56px] md:h-[64px]">
            {/* Logo */}
            <Link
              to="/"
              className="font-mono text-lg md:text-xl font-bold text-cathode-white hover:text-brutal-info transition-colors"
            >
              LTF1
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-4px">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={(e) => handleHashClick(e, link.to)}
                  className={`px-16px py-8px text-xs font-mono uppercase tracking-wider transition-colors ${
                    isActive(link.to)
                      ? 'text-brutal-info'
                      : 'text-cathode-white/50 hover:text-cathode-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <span className="w-[1px] h-[20px] bg-basalt-border mx-8px" />

              <Link
                to="/sign-in"
                className="px-16px py-8px text-xs font-mono uppercase tracking-wider text-cathode-white/50 hover:text-cathode-white transition-colors"
              >
                SIGN IN
              </Link>

              <Link
                to="/sign-up"
                className="ml-8px px-24px py-8px text-xs font-mono uppercase tracking-wider font-bold bg-brutal-info text-event-horizon border-2 border-brutal-info hover:bg-transparent hover:text-brutal-info transition-colors"
              >
                JOIN WAITLIST
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="md:hidden w-[44px] h-[44px] flex flex-col items-center justify-center gap-[5px]"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <span
                className={`block w-[20px] h-[2px] bg-cathode-white transition-all duration-200 origin-center ${
                  menuOpen ? 'rotate-45 translate-y-[7px]' : ''
                }`}
              />
              <span
                className={`block w-[20px] h-[2px] bg-cathode-white transition-all duration-200 ${
                  menuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block w-[20px] h-[2px] bg-cathode-white transition-all duration-200 origin-center ${
                  menuOpen ? '-rotate-45 -translate-y-[7px]' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-[56px] md:h-[64px]" />

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-event-horizon flex flex-col">
          {/* Skip past the nav height */}
          <div className="h-[56px] shrink-0" />

          <div className="flex-1 flex flex-col px-24px py-32px">
            {/* Nav links */}
            <div className="flex flex-col gap-4px">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={(e) => handleHashClick(e, link.to)}
                  className={`py-16px px-16px text-sm font-mono uppercase tracking-wider border-b border-basalt-border/30 transition-colors ${
                    isActive(link.to)
                      ? 'text-brutal-info'
                      : 'text-cathode-white/70 active:text-cathode-white'
                  }`}
                >
                  {isActive(link.to) && (
                    <span className="text-brutal-info/50 mr-8px">&gt;</span>
                  )}
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth actions */}
            <div className="mt-auto flex flex-col gap-16px">
              <Link
                to="/sign-in"
                onClick={() => setMenuOpen(false)}
                className="py-16px text-center text-sm font-mono uppercase tracking-wider text-cathode-white/50 border-2 border-basalt-border"
              >
                SIGN IN
              </Link>
              <Link
                to="/sign-up"
                onClick={() => setMenuOpen(false)}
                className="py-16px text-center text-sm font-mono uppercase tracking-wider font-bold bg-brutal-info text-event-horizon border-2 border-brutal-info"
              >
                JOIN WAITLIST
              </Link>
            </div>

            {/* Bottom tagline */}
            <p className="mt-24px text-center text-[10px] font-mono uppercase tracking-wider text-cathode-white/15">
              YOUR REPO IS THE SOURCE OF TRUTH
            </p>
          </div>
        </div>
      )}
    </>
  )
}
