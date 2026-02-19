import { SignIn } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import { m } from 'framer-motion'
import PublicNavigation from '../components/common/PublicNavigation'
import { usePageTitle } from '../hooks/usePageTitle'

const clerkAppearance = {
  variables: {
    colorPrimary: '#6366F1',
    colorBackground: '#0A0A0A',
    colorText: '#F9FAFB',
    colorTextSecondary: '#9CA3AF',
    colorInputBackground: '#111111',
    colorInputText: '#F9FAFB',
    borderRadius: '0px',
    fontFamily: "'IBM Plex Mono', monospace",
  },
  elements: {
    card: { backgroundColor: '#0A0A0A', border: '2px solid #2E2E35', borderRadius: '0', boxShadow: 'none' },
    headerTitle: { color: '#F9FAFB' },
    headerSubtitle: { color: '#6B7280' },
    formButtonPrimary: { backgroundColor: '#6366F1', borderRadius: '0', fontFamily: "'IBM Plex Mono', monospace" },
    formFieldInput: { backgroundColor: '#111111', border: '2px solid #2E2E35', borderRadius: '0', color: '#F9FAFB' },
    footerActionLink: { color: '#6366F1' },
    socialButtonsBlockButton: { border: '2px solid #2E2E35', borderRadius: '0', backgroundColor: '#111111', color: '#F9FAFB' },
    dividerLine: { backgroundColor: '#2E2E35' },
    dividerText: { color: '#6B7280' },
    footer: { display: 'none' },
  },
}

export default function SignInPage() {
  usePageTitle('Sign In')
  return (
    <div className="min-h-screen bg-[#050505]">
      <PublicNavigation />

      <div className="flex min-h-[calc(100vh-72px)]">
        {/* Left panel — image (hidden on mobile) */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="hidden md:block md:w-1/2 relative overflow-hidden border-r border-[#2E2E35]"
        >
          <img
            src="/images/sign-in.webp"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dark overlay for contrast */}
          <div className="absolute inset-0 bg-[#050505]/40" />
        </m.div>

        {/* Right panel — Clerk Sign In */}
        <m.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full md:w-1/2 flex flex-col items-center justify-center px-6 py-12"
          style={{
            backgroundImage: 'linear-gradient(rgba(46,46,53,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(46,46,53,0.18) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          <SignIn
            routing="path"
            path="/sign-in"
            appearance={clerkAppearance}
          />

          <p className="mt-6 text-sm text-[#6B7280] font-['IBM_Plex_Mono',monospace]">
            Don&apos;t have an account?{' '}
            <Link to="/sign-up" className="text-[#6366F1] hover:underline">
              Sign up
            </Link>
          </p>
        </m.div>
      </div>
    </div>
  )
}
