import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SignIn, SignUp, SignedIn, SignedOut, useAuth } from '@clerk/clerk-react'
import { Toaster } from 'react-hot-toast'
import React, { useState, useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { OptionalConvexProvider } from './providers/OptionalConvexProvider'
import { ShortcutProvider } from './contexts/ShortcutContext'
import { ThemeProvider } from './contexts/ThemeContext'
import DashboardLayout from './components/layout/DashboardLayout'
import LandingPage from './pages/LandingPage'
import PricingPage from './pages/PricingPage'
import ContactPage from './pages/ContactPage'
import BlogPage from './pages/BlogPage'
import Dashboard from './pages/Dashboard'
import WorkspacesPage from './pages/WorkspacesPage'
import WorkspaceManagementPage from './pages/WorkspaceManagementPage'
import ProjectManagementPage from './pages/ProjectManagementPage'
import ProjectsPage from './pages/ProjectsPage'
import TasksPage from './pages/TasksPage'
import MeetingsPage from './pages/MeetingsPage'
import SprintPage from './pages/SprintPage'
import WorkspaceSettingsPage from './pages/WorkspaceSettingsPage'
import SettingsPage from './pages/SettingsPage'
import TeamPage from './pages/TeamPage'
import JoinProjectPage from './pages/JoinProjectPage'
import MyProfilePage from './pages/MyProfilePage'
import GitHubCallbackPage from './pages/GitHubCallbackPage'
import TestCheckbox from './pages/TestCheckbox'
import TestAI from './pages/TestAI'
import NotFoundPage from './pages/NotFoundPage'
import AutomationPage from './pages/AutomationPage'
import WhiteboardPage from './pages/WhiteboardPage'
import VideoPage from './pages/VideoPage'
import CustomFieldsPage from './pages/CustomFieldsPage'
import SlackPage from './pages/SlackPage'
import { useEnsureUser } from './hooks/useEnsureUser'
import { DataMigrationBanner } from './components/admin/DataMigrationBanner'
import CommandPalette from './components/shortcuts/CommandPalette'
import ShortcutHelp from './components/shortcuts/ShortcutHelp'
import OnboardingFlow from './components/onboarding/OnboardingFlow'
import BrutalistLoader from './components/common/BrutalistLoader'

// Create a wrapper component that handles authentication state
function AuthenticatedAppContent() {
  const { isLoading, isFirstTimeUser, user } = useEnsureUser()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const updatePreferences = useMutation(api.auth.users.updateUserPreferences)
  
  // Check session storage to see if we've already shown/completed onboarding this session
  const getOnboardingDismissed = () => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('ltf1_onboarding_dismissed') === 'true'
    }
    return false
  }
  
  // Show onboarding for first-time users (only if not dismissed this session)
  React.useEffect(() => {
    const wasOnboardingDismissed = getOnboardingDismissed()
    
    if (isFirstTimeUser && user && !wasOnboardingDismissed) {
      setShowOnboarding(true)
    } else if (!isFirstTimeUser || wasOnboardingDismissed) {
      setShowOnboarding(false)
    }
  }, [isFirstTimeUser, user])
  
  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ltf1_onboarding_dismissed', 'true')
    }
    
    if (user) {
      updatePreferences({ 
        preferences: { 
          ...user.preferences,
          hasCompletedOnboarding: true 
        } 
      }).then(() => {
        console.log('Onboarding preferences saved successfully')
      }).catch(error => {
        console.error('Error updating onboarding preferences:', error)
      })
    }
  }
  
  if (isLoading) {
    return <BrutalistLoader />
  }
  
  return (
    <>
      <DataMigrationBanner />
      {showOnboarding && (
        <OnboardingFlow 
          isOpen={showOnboarding} 
          onComplete={handleOnboardingComplete} 
        />
      )}
      <AppRoutes isAuthenticated={true} />
    </>
  )
}

// Unauthenticated version that doesn't use Convex hooks
function UnauthenticatedAppContent() {
  return <AppRoutes isAuthenticated={false} />
}

// Main app content that decides whether to use authenticated or unauthenticated version
function AppContent() {
  const { isSignedIn } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)
  
  // Use the appropriate content based on authentication state
  if (isSignedIn) {
    return <AuthenticatedAppContent />
  }
  
  return <UnauthenticatedAppContent />
}

// Separate component for routes that can be used by both authenticated and unauthenticated users
function AppRoutes({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { isSignedIn } = useAuth()
  
  return (
    <div className="min-h-screen bg-[var(--theme-background)]">
      {/* Global Shortcut Components - only if authenticated */}
      {isAuthenticated && (
        <>
          <CommandPalette />
          <ShortcutHelp />
        </>
      )}
      
      <Routes>
        <Route path="/" element={
          isSignedIn ? <Navigate to="/dashboard" replace /> : <LandingPage />
        } />
        
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/blog" element={<BlogPage />} />
        
        <Route path="/sign-in/*" element={
          <div className="flex items-center justify-center min-h-screen">
            <SignIn routing="path" path="/sign-in" />
          </div>
        } />
        
        <Route path="/sign-up/*" element={
          <div className="flex items-center justify-center min-h-screen">
            <SignUp routing="path" path="/sign-up" />
          </div>
        } />

        {/* Join Project Routes - accessible by anyone */}
        <Route path="/join-project" element={<JoinProjectPage />} />
        <Route path="/join-project/:inviteCode" element={<JoinProjectPage />} />
        
        {/* GitHub OAuth Callback */}
        <Route path="/api/auth/github/callback" element={<GitHubCallbackPage />} />

        {/* Protected routes - show without authentication requirement */}
        <Route path="/" element={<DashboardLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<MyProfilePage />} />
          <Route path="workspaces" element={<WorkspacesPage />} />
          <Route path="workspace/:workspaceId" element={<WorkspaceManagementPage />} />
          <Route path="workspace/:workspaceId/project/:projectId" element={<ProjectManagementPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="meetings" element={<MeetingsPage />} />
          <Route path="sprints" element={<SprintPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="automation" element={<AutomationPage />} />
          <Route path="whiteboard" element={<WhiteboardPage />} />
          <Route path="video" element={<VideoPage />} />
          <Route path="video/:meetingId" element={<VideoPage />} />
          <Route path="custom-fields" element={<CustomFieldsPage />} />
          <Route path="slack" element={<SlackPage />} />
          <Route path="test-checkbox" element={<TestCheckbox />} />
          <Route path="test-ai" element={<TestAI />} />
        </Route>

        {/* 404 Page - Catch all unmatched routes */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--theme-background-secondary)',
            color: 'var(--theme-foreground)',
            border: '2px solid var(--theme-border)',
            borderRadius: '0',
            boxShadow: 'var(--theme-box-shadow)',
            fontFamily: 'var(--theme-font-family)',
            textTransform: 'var(--theme-text-transform)' as any,
            letterSpacing: 'var(--theme-letter-spacing)',
          },
          success: {
            iconTheme: {
              primary: 'var(--theme-success)',
              secondary: 'var(--theme-background)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--theme-error)',
              secondary: 'var(--theme-background)',
            },
          },
        }}
      />
    </div>
  )
}

function App() {
  return (
    <OptionalConvexProvider>
      <Router>
        <ThemeProvider>
          <ShortcutProvider>
            <AppContent />
          </ShortcutProvider>
        </ThemeProvider>
      </Router>
    </OptionalConvexProvider>
  )
}

export default App