import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SignIn, SignUp, SignedIn, SignedOut } from '@clerk/clerk-react'
import { Toaster } from 'react-hot-toast'
import { ConvexClientProvider } from './providers/ConvexClientProvider'
import { ShortcutProvider } from './contexts/ShortcutContext'
import { ThemeProvider } from './contexts/ThemeContext'
import DashboardLayout from './components/layout/DashboardLayout'
import LandingPage from './pages/LandingPage'
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
import { useEnsureUser } from './hooks/useEnsureUser'
import { DataMigrationBanner } from './components/admin/DataMigrationBanner'
import CommandPalette from './components/shortcuts/CommandPalette'
import ShortcutHelp from './components/shortcuts/ShortcutHelp'

function AppContent() {
  // Ensure user is synced with Convex
  const { isLoading } = useEnsureUser()
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--theme-background)] flex items-center justify-center">
        <div className="text-[var(--theme-primary)] font-mono uppercase tracking-widest">
          Syncing user...
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-[var(--theme-background)]">
      <SignedIn>
        <DataMigrationBanner />
      </SignedIn>
      
      {/* Global Shortcut Components */}
      <CommandPalette />
      <ShortcutHelp />
      
      <Routes>
        <Route path="/" element={
          <>
            <SignedOut>
              <LandingPage />
            </SignedOut>
            <SignedIn>
              <Navigate to="/dashboard" replace />
            </SignedIn>
          </>
        } />
        
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

        <Route path="/" element={
          <>
            <SignedIn>
              <DashboardLayout />
            </SignedIn>
            <SignedOut>
              <Navigate to="/sign-in" replace />
            </SignedOut>
          </>
        }>
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
    <ConvexClientProvider>
      <Router>
        <ThemeProvider>
          <ShortcutProvider>
            <AppContent />
          </ShortcutProvider>
        </ThemeProvider>
      </Router>
    </ConvexClientProvider>
  )
}

export default App