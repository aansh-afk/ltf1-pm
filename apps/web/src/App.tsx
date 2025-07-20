import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ClerkProvider, SignIn, SignUp, SignedIn, SignedOut } from '@clerk/clerk-react'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { Toaster } from 'react-hot-toast'
import DashboardLayout from './components/layout/DashboardLayout'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import WorkspacesPage from './pages/WorkspacesPage'
import ProjectsPage from './pages/ProjectsPage'
import TasksPage from './pages/TasksPage'
import MeetingsPage from './pages/MeetingsPage'
import SettingsPage from './pages/SettingsPage'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <ConvexProvider client={convex}>
        <Router>
          <div className="min-h-screen bg-base-100">
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
                  background: '#38040E',
                  color: '#fff',
                  border: '1px solid #640D14',
                },
                success: {
                  iconTheme: {
                    primary: '#4CAF50',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#FF5252',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </ConvexProvider>
    </ClerkProvider>
  )
}

export default App