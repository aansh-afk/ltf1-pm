/**
 * CLI Authentication Page
 *
 * Handles authentication for the LTF CLI tool.
 * Flow:
 * 1. CLI opens browser to /cli-auth?callback=http://localhost:PORT/callback
 * 2. If not signed in, redirect to sign-in with return URL
 * 3. Once signed in, get the session token from Clerk
 * 4. Redirect to CLI callback with token, userId, and email
 */

import { useEffect, useState } from 'react'
import { useSearchParams, Navigate } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import BrutalistLoader from '../components/common/BrutalistLoader'

export default function CLIAuthPage() {
  const [searchParams] = useSearchParams()
  const { isSignedIn, isLoaded, getToken } = useAuth()
  const { user } = useUser()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const callbackUrl = searchParams.get('callback')

  useEffect(() => {
    async function handleAuth() {
      // Validate callback URL
      if (!callbackUrl) {
        setStatus('error')
        setErrorMessage('Missing callback URL. Please use the CLI to authenticate.')
        return
      }

      // Validate callback is from localhost (security)
      try {
        const url = new URL(callbackUrl)
        if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
          setStatus('error')
          setErrorMessage('Invalid callback URL. Only localhost callbacks are allowed.')
          return
        }
      } catch {
        setStatus('error')
        setErrorMessage('Invalid callback URL format.')
        return
      }

      // Wait for auth to load
      if (!isLoaded) return

      // If not signed in, we'll redirect to sign-in
      if (!isSignedIn) return

      try {
        // Get the session token with Convex template
        // This ensures the JWT has the correct issuer and audience for Convex
        const token = await getToken({ template: 'convex' })

        if (!token) {
          setStatus('error')
          setErrorMessage('Failed to get authentication token. Make sure the Convex JWT template is configured in Clerk.')
          return
        }

        // Build callback URL with token
        const redirectUrl = new URL(callbackUrl)
        redirectUrl.searchParams.set('token', token)
        if (user?.id) {
          redirectUrl.searchParams.set('userId', user.id)
        }
        if (user?.primaryEmailAddress?.emailAddress) {
          redirectUrl.searchParams.set('email', user.primaryEmailAddress.emailAddress)
        }

        setStatus('success')

        // Redirect to CLI callback
        window.location.href = redirectUrl.toString()
      } catch (error) {
        console.error('CLI auth error:', error)
        setStatus('error')
        setErrorMessage('Failed to complete authentication. Please try again.')
      }
    }

    handleAuth()
  }, [isLoaded, isSignedIn, getToken, user, callbackUrl])

  // Not loaded yet
  if (!isLoaded) {
    return <BrutalistLoader />
  }

  // Not signed in - redirect to sign-in with return URL
  if (!isSignedIn) {
    const returnUrl = `/cli-auth?callback=${encodeURIComponent(callbackUrl || '')}`
    return <Navigate to={`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`} replace />
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[var(--theme-background)] flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="border-3 border-red-500 p-10 bg-[var(--theme-background-secondary)]">
            <div className="text-6xl text-center mb-6">✕</div>
            <h1 className="text-2xl font-bold text-red-500 uppercase tracking-wider text-center mb-4">
              Authentication Failed
            </h1>
            <p className="text-[var(--theme-foreground-muted)] text-center mb-6 leading-relaxed">
              {errorMessage}
            </p>
            <div className="border-t border-[var(--theme-border)] pt-4">
              <p className="text-xs text-[var(--theme-foreground-muted)] uppercase tracking-widest text-center">
                Close this window and try again
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state (brief - will redirect)
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[var(--theme-background)] flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="border-3 border-[var(--theme-primary)] p-10 bg-[var(--theme-background-secondary)]">
            <div className="text-6xl text-center mb-6">✓</div>
            <h1 className="text-2xl font-bold text-[var(--theme-primary)] uppercase tracking-wider text-center mb-4">
              Authenticated
            </h1>
            {user?.primaryEmailAddress?.emailAddress && (
              <div className="bg-[var(--theme-background)] border border-[var(--theme-border)] px-4 py-3 mb-6 text-center">
                <span className="text-sm text-[var(--theme-foreground-muted)] font-mono">
                  {user.primaryEmailAddress.emailAddress}
                </span>
              </div>
            )}
            <p className="text-[var(--theme-foreground-muted)] text-center leading-relaxed mb-6">
              Return to your terminal to continue.<br />
              This window will close automatically.
            </p>
            <div className="border-t border-[var(--theme-border)] pt-4">
              <p className="text-xs text-[var(--theme-foreground-muted)] uppercase tracking-widest text-center">
                Redirecting...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  return (
    <div className="min-h-screen bg-[var(--theme-background)] flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="border-3 border-[var(--theme-border)] p-10 bg-[var(--theme-background-secondary)]">
          <div className="flex justify-center mb-6">
            <div className="animate-spin h-12 w-12 border-3 border-[var(--theme-primary)] border-t-transparent" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--theme-foreground)] uppercase tracking-wider text-center mb-4">
            CLI Authentication
          </h1>
          <p className="text-[var(--theme-foreground-muted)] text-center leading-relaxed">
            Connecting to LTF CLI...
          </p>
        </div>
      </div>
    </div>
  )
}
