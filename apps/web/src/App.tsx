import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SignIn, SignUp, SignedIn, SignedOut } from '@clerk/clerk-react'
import { Toaster } from 'react-hot-toast'
import { ConvexClientProvider } from './providers/ConvexClientProvider'
import DashboardLayout from './components/layout/DashboardLayout'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import WorkspacesPage from './pages/WorkspacesPage'
import WorkspaceManagementPage from './pages/WorkspaceManagementPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectManagementPage from './pages/ProjectManagementPage'
import TasksPage from './pages/TasksPage'
import MeetingsPage from './pages/MeetingsPage'
import SprintPage from './pages/SprintPage'
import WorkspaceSettingsPage from './pages/WorkspaceSettingsPage'
import SettingsPage from './pages/SettingsPage'
import { useEnsureUser } from './hooks/useEnsureUser'

function AppContent() {
  // Ensure user is synced with Convex
  const { isLoading } = useEnsureUser()
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-event-horizon flex items-center justify-center">
        <div className="text-primary-brutalist font-mono uppercase tracking-widest">
          Syncing user...
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-event-horizon" data-theme="brutalist">
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
          <Route path="workspaces" element={<WorkspacesPage />} />
          <Route path="workspace/:workspaceId" element={<WorkspaceManagementPage />} />
          <Route path="workspace/:workspaceId/project/:projectId" element={<ProjectManagementPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="meetings" element={<MeetingsPage />} />
          <Route path="sprints" element={<SprintPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={
          <>
            <SignedIn>
              <Navigate to="/dashboard" replace />
            </SignedIn>
            <SignedOut>
              <Navigate to="/" replace />
            </SignedOut>
          </>
        } />
      </Routes>
      
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0A0A0A',
            color: '#F5F5F5',
            border: '2px solid #333333',
            borderRadius: '0',
            boxShadow: '5px 5px 0px #000000',
            fontFamily: 'IBM Plex Mono, monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
          success: {
            iconTheme: {
              primary: '#FFFF00',
              secondary: '#000000',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF0000',
              secondary: '#000000',
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
        <AppContent />
      </Router>
    </ConvexClientProvider>
  )
}

export default App