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

import { useEffect, useReducer } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";

interface CLIAuthState {
  status: "loading" | "success" | "error";
  errorMessage: string;
}

type CLIAuthAction =
  | { type: "SUCCESS" }
  | { type: "ERROR"; message: string };

function cliAuthReducer(state: CLIAuthState, action: CLIAuthAction): CLIAuthState {
  switch (action.type) {
    case "SUCCESS":
      return { status: "success", errorMessage: "" };
    case "ERROR":
      return { status: "error", errorMessage: action.message };
    default:
      return state;
  }
}

export default function CLIAuthPage() {
  const [searchParams] = useSearchParams();
  const { isSignedIn, isLoaded, getToken, sessionId } = useAuth();
  const { user } = useUser();
  const [{ status, errorMessage }, dispatch] = useReducer(cliAuthReducer, {
    status: "loading",
    errorMessage: "",
  });

  const callbackUrl = searchParams.get("callback");
  const state = searchParams.get("state");

  useEffect(() => {
    async function handleAuth() {
      // Validate callback URL
      if (!callbackUrl) {
        dispatch({
          type: "ERROR",
          message: "Missing callback URL. Please use the CLI to authenticate.",
        });
        return;
      }

      // Validate callback is from localhost or ltf1.dev (security)
      try {
        const url = new URL(callbackUrl);
        const allowedHosts = ["localhost", "127.0.0.1", "ltf1.dev"];
        if (!allowedHosts.includes(url.hostname)) {
          dispatch({
            type: "ERROR",
            message: "Invalid callback URL. Only localhost and ltf1.dev callbacks are allowed.",
          });
          return;
        }
      } catch {
        dispatch({
          type: "ERROR",
          message: "Invalid callback URL format.",
        });
        return;
      }

      // Wait for auth to load
      if (!isLoaded) return;

      // If not signed in, we'll redirect to sign-in
      if (!isSignedIn) return;

      try {
        // Get the session token with Convex template
        // This ensures the JWT has the correct issuer and audience for Convex
        const token = await getToken({ template: "convex" });

        if (!token) {
          dispatch({
            type: "ERROR",
            message: "Failed to get authentication token. Make sure the Convex JWT template is configured in Clerk.",
          });
          return;
        }

        // Build callback URL with token
        const redirectUrl = new URL(callbackUrl);
        redirectUrl.searchParams.set("token", token);
        if (state) {
          redirectUrl.searchParams.set("state", state);
        }
        if (user?.id) {
          redirectUrl.searchParams.set("userId", user.id);
        }
        if (user?.primaryEmailAddress?.emailAddress) {
          redirectUrl.searchParams.set(
            "email",
            user.primaryEmailAddress.emailAddress,
          );
        }
        if (sessionId) {
          redirectUrl.searchParams.set("sessionId", sessionId);
        }

        dispatch({ type: "SUCCESS" });

        // Redirect to CLI callback
        window.location.href = redirectUrl.toString();
      } catch (error) {
        console.error("CLI auth error:", error);
        dispatch({
          type: "ERROR",
          message: "Failed to complete authentication. Please try again.",
        });
      }
    }

    handleAuth();
  }, [isLoaded, isSignedIn, getToken, user, callbackUrl, state, sessionId]);

  // Not loaded yet
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[var(--theme-background)] flex items-center justify-center p-6">
        <div className="max-w-[400px] w-full">
          <div className="bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] rounded-xl p-10 text-center">
            <div className="w-8 h-8 border-2 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="font-['IBM_Plex_Mono',monospace] text-[11px] tracking-[.08em] text-[var(--theme-foreground-tertiary)] mb-5">
              LTF1 CLI
            </p>
            <p className="text-sm text-[var(--theme-foreground-tertiary)]">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not signed in - redirect to sign-in with return URL
  if (!isSignedIn) {
    const returnUrl = `/cli-auth?callback=${encodeURIComponent(callbackUrl || "")}${state ? `&state=${encodeURIComponent(state)}` : ""}`;
    return (
      <Navigate
        to={`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`}
        replace
      />
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="min-h-screen bg-[var(--theme-background)] flex items-center justify-center p-6">
        <div className="max-w-[400px] w-full animate-[fadeIn_.4s_ease-out]">
          <div className="bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] rounded-xl p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-[rgba(239,68,68,.1)] border-[1.5px] border-[rgba(239,68,68,.25)] flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-6 h-6 text-[var(--theme-error)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>
            <p className="font-['IBM_Plex_Mono',monospace] text-[11px] tracking-[.08em] text-[var(--theme-foreground-tertiary)] mb-5">
              LTF1 CLI
            </p>
            <h1 className="text-lg font-semibold text-[var(--theme-foreground)] mb-3">
              Authentication Failed
            </h1>
            <p className="text-[.8125rem] text-[var(--theme-foreground-secondary)] leading-relaxed mb-6">
              {errorMessage}
            </p>
            <div className="h-px bg-[var(--theme-border)] mb-4" />
            <p className="font-['IBM_Plex_Mono',monospace] text-[.6875rem] tracking-[.04em] text-[var(--theme-foreground-tertiary)]">
              Close this window and try again
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state (brief - will redirect to CLI callback)
  if (status === "success") {
    return (
      <div className="min-h-screen bg-[var(--theme-background)] flex items-center justify-center p-6">
        <div className="max-w-[400px] w-full animate-[fadeIn_.4s_ease-out]">
          <div className="bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] rounded-xl p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-[rgba(34,197,94,.1)] border-[1.5px] border-[rgba(34,197,94,.25)] flex items-center justify-center mx-auto mb-6 animate-[scaleIn_.35s_ease-out_.15s_both]">
              <svg
                className="w-6 h-6 text-[var(--theme-success)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <p className="font-['IBM_Plex_Mono',monospace] text-[11px] tracking-[.08em] text-[var(--theme-foreground-tertiary)] mb-5">
              LTF1 CLI
            </p>
            <h1 className="text-lg font-semibold text-[var(--theme-foreground)] mb-3">
              Authenticated
            </h1>
            {user?.primaryEmailAddress?.emailAddress && (
              <div className="font-['IBM_Plex_Mono',monospace] text-[.8125rem] text-[var(--theme-foreground-secondary)] bg-[var(--theme-background-tertiary)] border border-[var(--theme-border)] rounded-md px-4 py-2.5 mb-5 break-all">
                {user.primaryEmailAddress.emailAddress}
              </div>
            )}
            <p className="text-[.8125rem] text-[var(--theme-foreground-tertiary)] leading-relaxed mb-6">
              Redirecting to your terminal...
            </p>
            <div className="h-px bg-[var(--theme-border)] mb-4" />
            <p className="font-['IBM_Plex_Mono',monospace] text-[.6875rem] tracking-[.04em] text-[var(--theme-foreground-tertiary)]">
              Completing authentication
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading / authenticating state
  return (
    <div className="min-h-screen bg-[var(--theme-background)] flex items-center justify-center p-6">
      <div className="max-w-[400px] w-full animate-[fadeIn_.4s_ease-out]">
        <div className="bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] rounded-xl p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-[rgba(99,102,241,.1)] border-[1.5px] border-[rgba(99,102,241,.25)] flex items-center justify-center mx-auto mb-6">
            <div className="w-5 h-5 border-2 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="font-['IBM_Plex_Mono',monospace] text-[11px] tracking-[.08em] text-[var(--theme-foreground-tertiary)] mb-5">
            LTF1 CLI
          </p>
          <h1 className="text-lg font-semibold text-[var(--theme-foreground)] mb-3">
            Authenticating
          </h1>
          <p className="text-[.8125rem] text-[var(--theme-foreground-tertiary)] leading-relaxed">
            Connecting to LTF1 CLI...
          </p>
        </div>
      </div>
    </div>
  );
}
