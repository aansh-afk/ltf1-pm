import { SignUp } from "@clerk/clerk-react";
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { Link } from "react-router-dom";
import { m } from "framer-motion";
import { usePageTitle } from "@/hooks/usePageTitle";

const clerkAppearance = {
  variables: {
    colorPrimary: "#6366F1",
    colorBackground: "transparent",
    colorText: "#F9FAFB",
    colorTextSecondary: "#6B7280",
    colorInputBackground: "#0B1020",
    colorInputText: "#F9FAFB",
    borderRadius: "0px",
    fontFamily: "'IBM Plex Mono', monospace",
  },
  elements: {
    rootBox: { width: "100%" },
    card: {
      backgroundColor: "transparent",
      border: "none",
      borderRadius: "0px",
      boxShadow: "none",
      width: "100%",
    },
    headerTitle: { display: "none" },
    headerSubtitle: { display: "none" },
    socialButtonsBlockButton: {
      backgroundColor: "#141A28",
      border: "1px solid #2A344A",
      borderRadius: "0px",
      color: "#F9FAFB",
      height: "46px",
      boxShadow: "none",
      fontFamily: "'IBM Plex Mono', monospace",
      transition: "all 0.2s ease",
    },
    socialButtonsBlockButtonText: { fontSize: "14px", fontWeight: "500" },
    socialButtonsProviderIcon: {
      filter: "brightness(0) invert(1)",
    },
    socialButtonsProviderIcon__google: {
      filter: "none",
    },
    dividerLine: { backgroundColor: "#2E2E35" },
    dividerText: {
      color: "#6B7280",
      fontSize: "11px",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
    formFieldLabel: {
      color: "#E5E7EB",
      fontSize: "13px",
      fontFamily: "'IBM Plex Mono', monospace",
    },
    formFieldInput: {
      backgroundColor: "#0B0F18",
      border: "1px solid #232C3F",
      borderRadius: "0px",
      color: "#F9FAFB",
      height: "42px",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
    },
    formButtonPrimary: {
      backgroundColor: "#6366F1",
      border: "1px solid #4F46E5",
      borderRadius: "0px",
      color: "#FFFFFF",
      height: "50px",
      fontFamily: "'IBM Plex Mono', monospace",
      fontWeight: "600",
      boxShadow: "0 12px 24px rgba(79,70,229,0.36)",
    },
    footerActionLink: { color: "#6366F1" },
    footer: { display: "none" },
  },
};

export default function SignUpPage() {
  usePageTitle("Sign Up — Start Free");

  return (
    <ErrorBoundary>
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-[#F9FAFB]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(249,250,251,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(249,250,251,0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="pointer-events-none absolute inset-4 border border-[#2E2E35]/90 shadow-[0_0_0_1px_rgba(99,102,241,0.10),0_28px_95px_rgba(0,0,0,0.62)] md:inset-6" />
      <div className="pointer-events-none absolute inset-8 border border-[#1B2230]/70 md:inset-10" />

      <m.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 flex min-h-screen items-start justify-center px-4 pb-12 pt-24 md:px-8 md:pt-28"
      >
        <div className="w-full max-w-[1160px]">
          <div className="flex flex-col items-center">
            <h1 className="font-['IBM_Plex_Mono',monospace] text-[40px] font-semibold tracking-[-0.02em] text-[#F9FAFB] md:text-[62px]">
              Start with LTF1
            </h1>
          </div>

          <div className="mx-auto mt-14 w-full max-w-[380px]">
            <m.div
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.08 }}
              className="w-full max-w-[380px]"
            >
              <SignUp
                routing="path"
                path="/sign-up"
                appearance={clerkAppearance}
              />
            </m.div>
          </div>

          <p className="mt-14 text-center font-['IBM_Plex_Mono',monospace] text-[13px] text-[#6B7280]">
            Already have an account?{" "}
            <Link
              to="/sign-in"
              className="text-[#6366F1] transition-colors hover:text-[#4F46E5]"
            >
              Sign in
            </Link>
          </p>
        </div>
      </m.main>
    </div>
    </ErrorBoundary>
  );
}
