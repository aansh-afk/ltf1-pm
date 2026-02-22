import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";
import React, { lazy, Suspense, useState, useEffect } from "react";
import { LazyMotion, domAnimation } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

import ErrorBoundary from "./components/common/ErrorBoundary";
import BetaBanner from "./components/common/BetaBanner";

import { OptionalConvexProvider } from "./providers/OptionalConvexProvider";
import { PostHogProvider } from "./providers/PostHogProvider";
import { ShortcutProvider } from "./contexts/ShortcutContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/layout/DashboardLayout";
import RequireAuth from "./components/common/RequireAuth";

// Eager imports - public pages that need fast initial load
import LandingPage from "./pages/LandingPage";
import PricingPage from "./pages/PricingPage";
import ContactPage from "./pages/ContactPage";
import FeatureDetailPage from "./pages/FeatureDetailPage";
import FeaturesPage from "./pages/FeaturesPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ChangelogPage from "./pages/ChangelogPage";

// Lazy imports - authenticated/secondary pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const WorkspacesPage = lazy(() => import("./pages/WorkspacesPage"));
const WorkspaceManagementPage = lazy(
  () => import("./pages/WorkspaceManagementPage"),
);
const ProjectManagementPage = lazy(
  () => import("./pages/ProjectManagementPage"),
);
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const SprintPage = lazy(() => import("./pages/SprintPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const TeamsPage = lazy(() => import("./pages/TeamsPage"));
const MyProfilePage = lazy(() => import("./pages/MyProfilePage"));
const WhiteboardPage = lazy(() => import("./pages/WhiteboardPage"));
const CustomFieldsPage = lazy(() => import("./pages/CustomFieldsPage"));
const WorkspaceSettingsPage = lazy(
  () => import("./pages/WorkspaceSettingsPage"),
);
const JoinProjectPage = lazy(() => import("./pages/JoinProjectPage"));
const GitHubCallbackPage = lazy(() => import("./pages/GitHubCallbackPage"));
const CLIAuthPage = lazy(() => import("./pages/CLIAuthPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const ComingSoonPage = lazy(() => import("./pages/ComingSoonPage"));
const DesignReferencePage = lazy(() => import("./pages/DesignReferencePage"));
const TimeReportPage = lazy(() => import("./pages/TimeReportPage"));
import { useEnsureUser } from "./hooks/useEnsureUser";
import { DataMigrationBanner } from "./components/admin/DataMigrationBanner";
import CommandPalette from "./components/shortcuts/CommandPalette";
import ShortcutHelp from "./components/shortcuts/ShortcutHelp";
import OnboardingFlow from "./components/onboarding/OnboardingFlow";
import BrutalistLoader from "./components/common/BrutalistLoader";
import PageTransition from "./components/common/PageTransition";
import FeedbackWidget from "./components/features/feedback/FeedbackWidget";
import NpsSurveyModal from "./components/features/nps/NpsSurveyModal";

// Create a wrapper component that handles authentication state
function AuthenticatedAppContent() {
  const { isLoading, isFirstTimeUser, user } = useEnsureUser();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNps, setShowNps] = useState(false);
  const updatePreferences = useMutation(api.auth.users.updateUserPreferences);
  const npsCompleted = useQuery(api.nps.hasCompletedNps);

  // Check session storage to see if we've already shown/completed onboarding this session
  const getOnboardingDismissed = () => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("ltf1_onboarding_dismissed") === "true";
    }
    return false;
  };

  // Show onboarding for first-time users (only if not dismissed this session)
  React.useEffect(() => {
    const wasOnboardingDismissed = getOnboardingDismissed();

    if (isFirstTimeUser && user && !wasOnboardingDismissed) {
      setShowOnboarding(true);
    } else if (!isFirstTimeUser || wasOnboardingDismissed) {
      setShowOnboarding(false);
    }
  }, [isFirstTimeUser, user]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);

    if (typeof window !== "undefined") {
      sessionStorage.setItem("ltf1_onboarding_dismissed", "true");
    }

    if (user) {
      updatePreferences({
        preferences: {
          ...user.preferences,
          hasCompletedOnboarding: true,
        },
      })
        .then(() => {
          console.log("Onboarding preferences saved successfully");
        })
        .catch((error) => {
          console.error("Error updating onboarding preferences:", error);
        });
    }
  };

  // NPS survey trigger: show 7 days after account creation
  useEffect(() => {
    if (!user || npsCompleted === undefined) return;
    if (npsCompleted) return;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (user.createdAt < Date.now() - sevenDays) {
      setShowNps(true);
    }
  }, [user, npsCompleted]);

  if (isLoading) {
    return <BrutalistLoader />;
  }

  return (
    <>
      <BetaBanner />
      <DataMigrationBanner />
      {showOnboarding && (
        <OnboardingFlow
          isOpen={showOnboarding}
          onComplete={handleOnboardingComplete}
        />
      )}
      <NpsSurveyModal isOpen={showNps} onClose={() => setShowNps(false)} />
      <AppRoutes isAuthenticated={true} />
    </>
  );
}

// Unauthenticated version that doesn't use Convex hooks
function UnauthenticatedAppContent() {
  return <AppRoutes isAuthenticated={false} />;
}

// Main app content that decides whether to use authenticated or unauthenticated version
function AppContent() {
  const { isSignedIn } = useAuth();

  // Use the appropriate content based on authentication state
  if (isSignedIn) {
    return <AuthenticatedAppContent />;
  }

  return <UnauthenticatedAppContent />;
}

// Separate component for routes that can be used by both authenticated and unauthenticated users
function AppRoutes({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { isSignedIn } = useAuth();

  return (
    <Suspense fallback={<BrutalistLoader />}>
      <div className="min-h-screen bg-[var(--theme-background)]">
        {/* Global Shortcut Components - only if authenticated */}
        {isAuthenticated && (
          <>
            <CommandPalette />
            <ShortcutHelp />
          </>
        )}

        <Routes>
          <Route
            path="/"
            element={
              isSignedIn ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LandingPage />
              )
            }
          />

          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/changelog" element={<ChangelogPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/features/:slug" element={<FeatureDetailPage />} />
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="/coming-soon" element={<ComingSoonPage />} />
          <Route path="/design/ref" element={<DesignReferencePage />} />

          {/* Join Project Routes - accessible by anyone */}
          <Route path="/join-project" element={<JoinProjectPage />} />
          <Route
            path="/join-project/:inviteCode"
            element={<JoinProjectPage />}
          />

          {/* GitHub OAuth Callback */}
          <Route
            path="/api/auth/github/callback"
            element={<GitHubCallbackPage />}
          />

          {/* CLI Authentication */}
          <Route path="/cli-auth" element={<CLIAuthPage />} />

          {/* Protected routes - require authentication */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="profile" element={<MyProfilePage />} />
            <Route path="workspaces" element={<WorkspacesPage />} />
            <Route
              path="workspace/:workspaceId"
              element={<WorkspaceManagementPage />}
            />
            <Route
              path="workspace/:workspaceId/project/:projectId"
              element={<ProjectManagementPage />}
            />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="teams" element={<TeamsPage />} />
            <Route path="team" element={<TeamPage />} />{" "}
            {/* Keeping existing TeamPage for now, might be redundant */}
            <Route path="sprints" element={<SprintPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="whiteboard" element={<WhiteboardPage />} />
            <Route path="custom-fields" element={<CustomFieldsPage />} />
            <Route path="time-report" element={<TimeReportPage />} />
          </Route>

          {/* 404 Page - Catch all unmatched routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        {isAuthenticated && <FeedbackWidget />}

        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "var(--theme-background-secondary)",
              color: "var(--theme-foreground)",
              border: "2px solid var(--theme-border)",
              borderRadius: "0",
              boxShadow: "var(--theme-box-shadow)",
              fontFamily: "var(--theme-font-family)",
              textTransform: "var(--theme-text-transform)" as any,
              letterSpacing: "var(--theme-letter-spacing)",
            },
            success: {
              iconTheme: {
                primary: "var(--theme-success)",
                secondary: "var(--theme-background)",
              },
            },
            error: {
              iconTheme: {
                primary: "var(--theme-error)",
                secondary: "var(--theme-background)",
              },
            },
          }}
        />
      </div>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <OptionalConvexProvider>
        <Router>
          <PageTransition />
          <LazyMotion features={domAnimation}>
            <ThemeProvider>
              <PostHogProvider>
                <ShortcutProvider>
                  <AppContent />
                </ShortcutProvider>
              </PostHogProvider>
            </ThemeProvider>
          </LazyMotion>
        </Router>
      </OptionalConvexProvider>
    </ErrorBoundary>
  );
}

export default App;
