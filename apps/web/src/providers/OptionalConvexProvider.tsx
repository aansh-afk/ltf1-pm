import { ReactNode } from 'react'
import { ConvexReactClient } from 'convex/react'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { ConvexProvider } from 'convex/react'

// Create Convex client only if URL is available
const convexUrl = import.meta.env.VITE_CONVEX_URL
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null

interface OptionalConvexProviderProps {
  children: ReactNode
}

// Provider that works with or without authentication
export function OptionalConvexProvider({ children }: OptionalConvexProviderProps) {
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  
  // If no Convex URL, just render children
  if (!convex) {
    console.warn('Convex URL not configured - running in offline mode')
    return <>{children}</>
  }
  
  // If Clerk key is available, use authenticated provider
  if (clerkKey) {
    return (
      <ClerkProvider 
        publishableKey={clerkKey}
        appearance={{
          signIn: { 
            routing: 'path',
            path: '/sign-in'
          },
          signUp: {
            routing: 'path', 
            path: '/sign-up'
          }
        }}
      >
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          {children}
        </ConvexProviderWithClerk>
      </ClerkProvider>
    )
  }
  
  // Otherwise use unauthenticated provider
  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  )
}