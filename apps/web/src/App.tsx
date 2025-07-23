import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SignIn, SignUp, SignedIn, SignedOut } from '@clerk/clerk-react'
import { Toaster } from 'react-hot-toast'
import { ConvexClientProvider } from './providers/ConvexClientProvider'
import DashboardLayout from './components/layout/DashboardLayout'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import WorkspacesPage from './pages/WorkspacesPage'
import ProjectsPage from './pages/ProjectsPage'
import TasksPage from './pages/TasksPage'
import MeetingsPage from './pages/MeetingsPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <ConvexClientProvider>
      <Router>
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

            <Route element={
              <SignedIn>
                <DashboardLayout />
              </SignedIn>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/workspaces" element={<WorkspacesPage />} />
              <Route path="/workspace/:workspaceId/projects" element={<ProjectsPage />} />
              <Route path="/workspace/:workspaceId/tasks" element={<TasksPage />} />
              <Route path="/workspace/:workspaceId/meetings" element={<MeetingsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
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
      </Router>
    </ConvexClientProvider>
  )
}

export default App