import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { m } from "framer-motion";
import PublicNavigation from "../common/PublicNavigation";
import Footer from "../common/Footer";

interface LegalLayoutProps {
  title: string;
  summary: string;
  effectiveDate: string;
  lastUpdated: string;
  children: ReactNode;
}

const LEGAL_LINKS = [
  { to: "/terms", label: "Terms" },
  { to: "/privacy", label: "Privacy" },
  { to: "/cookies", label: "Cookies" },
  { to: "/acceptable-use", label: "Acceptable Use" },
  { to: "/refunds", label: "Refunds" },
  { to: "/dpa", label: "DPA" },
];

export default function LegalLayout({
  title,
  summary,
  effectiveDate,
  lastUpdated,
  children,
}: LegalLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#050505] text-[#F9FAFB]">
      <PublicNavigation />

      <main className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(46,46,53,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(46,46,53,0.25) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <section className="relative mx-auto max-w-5xl px-4 pb-16 pt-28 md:px-6 md:pb-24 md:pt-36">
          <m.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <span className="font-['IBM_Plex_Mono',monospace] text-[11px] uppercase tracking-[0.2em] text-[#6B7280]">
              Legal
            </span>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-[#F9FAFB] md:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#9CA3AF] md:text-base">
              {summary}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-['IBM_Plex_Mono',monospace] text-[#6B7280]">
              <span className="border border-[#2E2E35] bg-[#0C0C0C] px-2.5 py-1">
                Effective: {effectiveDate}
              </span>
              <span className="border border-[#2E2E35] bg-[#0C0C0C] px-2.5 py-1">
                Last updated: {lastUpdated}
              </span>
            </div>
          </m.div>

          <m.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="mt-10 border border-[#2E2E35] bg-[#0A0A0A]/95 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
          >
            <div className="space-y-8 p-6 text-sm leading-relaxed text-[#CBD5E1] md:p-8 md:text-[15px]">
              {children}
            </div>
          </m.article>

          <div className="mt-8 border border-[#2E2E35] bg-[#0A0A0A]/85 p-5">
            <h2 className="font-['IBM_Plex_Mono',monospace] text-xs uppercase tracking-[0.18em] text-[#6B7280]">
              Other legal documents
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {LEGAL_LINKS.map((item) => {
                const isActive = location.pathname === item.to;

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`border px-3 py-1.5 text-xs font-['IBM_Plex_Mono',monospace] uppercase tracking-[0.08em] transition-colors ${
                      isActive
                        ? "border-[#6366F1] bg-[#6366F1]/10 text-[#A5B4FC]"
                        : "border-[#2E2E35] text-[#9CA3AF] hover:text-[#F9FAFB]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
