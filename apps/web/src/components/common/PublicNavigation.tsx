import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'

const NAV_LINKS = [
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/contact', label: 'Contact' },
]

export default function PublicNavigation() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const handleHashClick = useCallback((e: React.MouseEvent, to: string) => {
    if (!to.startsWith('/#')) return
    const hash = to.slice(1)
    if (location.pathname === '/') {
      e.preventDefault()
      const el = document.querySelector(hash)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    } else {
      e.preventDefault()
      navigate('/')
      setTimeout(() => {
        const el = document.querySelector(hash)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
    setMenuOpen(false)
  }, [location.pathname, navigate])

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#050505]/80 backdrop-blur-xl border-b border-[#1F1F23]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16 md:h-[72px]">
            {/* Logo */}
            <Link
              to="/"
              className="font-['Inter',sans-serif] text-xl md:text-2xl font-bold text-[#F9FAFB] hover:text-[#6366F1] transition-colors duration-300"
            >
              LTF1
            </Link>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={(e) => handleHashClick(e, link.to)}
                  className="px-4 py-2 text-sm font-['Inter',sans-serif] font-medium text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors duration-200"
                >
                  {link.label}
                </Link>
              ))}

              <span className="w-px h-5 bg-[#2E2E35] mx-3" />

              <Link
                to="/sign-in"
                className="px-4 py-2 text-sm font-['Inter',sans-serif] font-medium text-[#9CA3AF] hover:text-[#F9FAFB] border-2 border-[#2E2E35] hover:border-[#6366F1] bg-transparent hover:bg-[#111111] rounded-lg transition-all duration-300"
              >
                Sign In
              </Link>

              <Link
                to="/sign-up"
                className="ml-2 px-6 py-2 text-sm font-['Inter',sans-serif] font-semibold bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-lg border-2 border-[#4F46E5] shadow-[3px_3px_0px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-300"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="md:hidden w-11 h-11 flex flex-col items-center justify-center gap-[5px]"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <span
                className={`block w-5 h-0.5 bg-[#F9FAFB] transition-all duration-200 origin-center ${
                  menuOpen ? 'rotate-45 translate-y-[7px]' : ''
                }`}
              />
              <span
                className={`block w-5 h-0.5 bg-[#F9FAFB] transition-all duration-200 ${
                  menuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block w-5 h-0.5 bg-[#F9FAFB] transition-all duration-200 origin-center ${
                  menuOpen ? '-rotate-45 -translate-y-[7px]' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-16 md:h-[72px]" />

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-[#050505] flex flex-col">
          <div className="h-16 shrink-0" />

          <div className="flex-1 flex flex-col px-6 py-8">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={(e) => handleHashClick(e, link.to)}
                  className="py-4 px-4 text-base font-['Inter',sans-serif] font-medium text-[#9CA3AF] active:text-[#F9FAFB] border-b border-[#1F1F23]/30 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-auto flex flex-col gap-4">
              <Link
                to="/sign-in"
                onClick={() => setMenuOpen(false)}
                className="py-3 text-center text-sm font-['Inter',sans-serif] font-medium text-[#9CA3AF] border-2 border-[#2E2E35] hover:border-[#6366F1] rounded-lg transition-all duration-300"
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                onClick={() => setMenuOpen(false)}
                className="py-3 text-center text-sm font-['Inter',sans-serif] font-semibold bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-lg border-2 border-[#4F46E5] shadow-[3px_3px_0px_rgba(0,0,0,0.4)] transition-all duration-300"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
