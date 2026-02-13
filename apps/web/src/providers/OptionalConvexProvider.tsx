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
          },
          userButton: {
            variables: {
              colorPrimary: '#6366F1',
              colorBackground: '#0A0A0A',
              colorText: '#F9FAFB',
              colorTextSecondary: '#9CA3AF',
              borderRadius: '0px',
              fontFamily: "'IBM Plex Mono', monospace",
            },
            elements: {
              userButtonPopoverCard: {
                backgroundColor: '#0A0A0A',
                border: '2px solid #2E2E35',
                borderRadius: '0',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.5)',
              },
              userButtonPopoverActionButton: {
                color: '#9CA3AF',
                '&:hover': {
                  backgroundColor: '#111111',
                  color: '#F9FAFB',
                },
              },
              userButtonPopoverActionButtonText: {
                color: 'inherit',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '12px',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.05em',
              },
              userButtonPopoverActionButtonIcon: {
                color: '#6B7280',
              },
              userPreviewMainIdentifier: {
                color: '#F9FAFB',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '13px',
              },
              userPreviewSecondaryIdentifier: {
                color: '#6B7280',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '11px',
              },
              userButtonPopoverFooter: {
                display: 'none',
              },
            },
          },
          userProfile: {
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
              card: {
                backgroundColor: '#0A0A0A',
                border: '2px solid #2E2E35',
                borderRadius: '0',
                boxShadow: 'none',
              },
              navbar: {
                backgroundColor: '#050505',
                borderRight: '1px solid #2E2E35',
              },
              navbarButton: {
                color: '#9CA3AF',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '12px',
                textTransform: 'uppercase' as const,
                '&:hover': {
                  backgroundColor: '#111111',
                  color: '#F9FAFB',
                },
              },
              pageScrollBox: {
                backgroundColor: '#0A0A0A',
              },
              formButtonPrimary: {
                backgroundColor: '#6366F1',
                borderRadius: '0',
                fontFamily: "'IBM Plex Mono', monospace",
              },
              formFieldInput: {
                backgroundColor: '#111111',
                border: '2px solid #2E2E35',
                borderRadius: '0',
                color: '#F9FAFB',
              },
              headerTitle: { color: '#F9FAFB' },
              headerSubtitle: { color: '#6B7280' },
              footer: { display: 'none' },
            },
          },
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