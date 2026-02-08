import { useAuth } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth()

  if (!isLoaded) {
    return null
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="bg-[#0A0A0A] border-2 border-[#2E2E35] p-10">
            {/* Terminal prompt */}
            <pre className="font-['IBM_Plex_Mono',monospace] text-[11px] text-[#6B7280] leading-relaxed mb-8 text-left select-none">
{`  $ ltf1 access --workspace

  {error} UNAUTHORIZED

  this page requires authentication.
  sign in or create an account to
  access your workspace.

  > status: restricted
  > session: none`}
            </pre>

            <div className="border-t border-[#2E2E35] pt-8 space-y-3">
              <Link
                to="/sign-in"
                className="block w-full bg-[#F9FAFB] text-[#050505] font-['Inter',sans-serif] font-semibold text-sm py-3 px-6 border-2 border-[#4F46E5] hover:-translate-y-0.5 transition-transform duration-200"
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                className="block w-full text-[#9CA3AF] font-['Inter',sans-serif] font-semibold text-sm py-3 px-6 border border-[#2E2E35] hover:border-[#6366F1] hover:text-[#F9FAFB] transition-all duration-200"
              >
                Create Account
              </Link>
            </div>

            <Link
              to="/"
              className="inline-block mt-6 text-xs font-['IBM_Plex_Mono',monospace] text-[#6B7280] hover:text-[#6366F1] transition-colors duration-200"
            >
              &larr; back to home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
