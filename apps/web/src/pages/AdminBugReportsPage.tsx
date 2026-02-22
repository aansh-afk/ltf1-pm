import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useEnsureUser } from "../hooks/useEnsureUser";

type Status = "new" | "triaged" | "in_progress" | "resolved" | "closed";
type Severity = "critical" | "high" | "medium" | "low";

const STATUSES: Array<{ value: Status | "all"; label: string }> = [
  { value: "all", label: "ALL" },
  { value: "new", label: "NEW" },
  { value: "triaged", label: "TRIAGED" },
  { value: "in_progress", label: "IN PROGRESS" },
  { value: "resolved", label: "RESOLVED" },
  { value: "closed", label: "CLOSED" },
];

const SEVERITIES: Array<{ value: Severity | "all"; label: string }> = [
  { value: "all", label: "ALL" },
  { value: "critical", label: "CRITICAL" },
  { value: "high", label: "HIGH" },
  { value: "medium", label: "MEDIUM" },
  { value: "low", label: "LOW" },
];

const severityColor: Record<Severity, string> = {
  critical: "var(--theme-error, #EF4444)",
  high: "var(--theme-warning, #F59E0B)",
  medium: "var(--theme-accent, #6366F1)",
  low: "var(--theme-success, #22C55E)",
};

const statusColor: Record<Status, string> = {
  new: "var(--theme-accent, #6366F1)",
  triaged: "var(--theme-warning, #F59E0B)",
  in_progress: "#06B6D4",
  resolved: "var(--theme-success, #22C55E)",
  closed: "var(--theme-text-tertiary, #6B7280)",
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ExpandedRow({ reportId }: { reportId: Id<"bugReports"> }) {
  const data = useQuery(api.bugReports.getBugReport, { id: reportId });
  const updateStatus = useMutation(api.bugReports.updateBugReportStatus);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (!data) return <div style={{ padding: "16px", color: "var(--theme-text-secondary)" }}>Loading...</div>;

  const { report, screenshotUrls } = data;
  const nextStatuses: Status[] = ["new", "triaged", "in_progress", "resolved", "closed"];

  return (
    <div style={{ padding: "16px 24px", background: "var(--theme-background, #050505)", borderTop: "1px solid var(--theme-border-subtle, #1F1F23)" }}>
      {/* Description */}
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--theme-text-tertiary, #6B7280)", textTransform: "uppercase", letterSpacing: "0.05em" }}>DESCRIPTION</span>
        <p style={{ color: "var(--theme-text-secondary, #9CA3AF)", marginTop: 4, fontSize: 13, lineHeight: 1.5 }}>{report.description}</p>
      </div>

      {/* Auto-context */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--theme-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>BROWSER</span>
          <p style={{ color: "var(--theme-text-secondary)", fontSize: 12, marginTop: 2 }}>{report.browserInfo}</p>
        </div>
        <div>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--theme-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>VIEWPORT</span>
          <p style={{ color: "var(--theme-text-secondary)", fontSize: 12, marginTop: 2 }}>{report.viewportSize}</p>
        </div>
      </div>

      {/* Console errors */}
      {report.consoleErrors.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--theme-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>CONSOLE ERRORS ({report.consoleErrors.length})</span>
          <div style={{ marginTop: 4, background: "var(--theme-background-secondary, #0A0A0A)", border: "1px solid var(--theme-border-subtle, #1F1F23)", maxHeight: 150, overflowY: "auto", padding: 8 }}>
            {report.consoleErrors.map((err, i) => (
              <div key={i} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--theme-error, #EF4444)", marginBottom: 4 }}>
                {err.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Screenshots */}
      {screenshotUrls.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--theme-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>SCREENSHOTS ({screenshotUrls.length})</span>
          <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            {screenshotUrls.map((url, i) =>
              url ? (
                <img
                  key={i}
                  src={url}
                  alt={`Screenshot ${i + 1}`}
                  style={{ width: 120, height: 80, objectFit: "cover", border: "2px solid var(--theme-border, #2E2E35)", cursor: "pointer" }}
                  onClick={() => setLightboxUrl(url)}
                />
              ) : null,
            )}
          </div>
        </div>
      )}

      {/* Recorded steps */}
      {report.recordedSteps.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--theme-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>RECORDED STEPS ({report.recordedSteps.length})</span>
          <div style={{ marginTop: 4 }}>
            {report.recordedSteps.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 0", borderBottom: "1px solid var(--theme-border-subtle, #1F1F23)" }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--theme-text-tertiary)", minWidth: 24 }}>{i + 1}.</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--theme-accent, #6366F1)", minWidth: 80, textTransform: "uppercase" }}>{step.type}</span>
                <span style={{ fontSize: 12, color: "var(--theme-text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{step.target}</span>
                {step.value && <span style={{ fontSize: 11, color: "var(--theme-text-tertiary)" }}>= {step.value}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {nextStatuses
          .filter((s) => s !== report.status)
          .map((s) => (
            <button
              key={s}
              onClick={() => updateStatus({ id: reportId, status: s })}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                padding: "6px 12px",
                background: "transparent",
                color: statusColor[s],
                border: `2px solid ${statusColor[s]}`,
                cursor: "pointer",
              }}
            >
              → {s.replace("_", " ")}
            </button>
          ))}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            cursor: "pointer",
          }}
        >
          <img src={lightboxUrl} alt="Screenshot enlarged" style={{ maxWidth: "90vw", maxHeight: "90vh", border: "2px solid var(--theme-border, #2E2E35)" }} />
        </div>
      )}
    </div>
  );
}

export default function AdminBugReportsPage() {
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [expandedId, setExpandedId] = useState<Id<"bugReports"> | null>(null);

  const { user, isLoading: userLoading } = useEnsureUser();
  const isAdmin = user?.role === "admin";

  const reports = useQuery(
    api.bugReports.listBugReports,
    isAdmin ? { status: statusFilter === "all" ? undefined : statusFilter } : "skip",
  );

  const filtered = reports?.filter((r) => severityFilter === "all" || r.severity === severityFilter);

  if (userLoading) return <div style={{ padding: 64, textAlign: "center", color: "var(--theme-text-tertiary)" }}>Loading...</div>;

  if (!isAdmin) {
    return (
      <div style={{ padding: 64, textAlign: "center" }}>
        <h1 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, color: "var(--theme-error, #EF4444)", letterSpacing: "0.05em" }}>ACCESS DENIED</h1>
        <p style={{ color: "var(--theme-text-tertiary, #6B7280)", marginTop: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>Admin access required to view bug reports.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 24, fontWeight: 700, color: "var(--theme-text-primary, #F9FAFB)", letterSpacing: "0.05em" }}>
          BUG REPORTS
        </h1>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: "var(--theme-text-tertiary, #6B7280)" }}>
          {filtered ? filtered.length : "..."} REPORTS
        </span>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 24, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                padding: "4px 10px",
                background: statusFilter === s.value ? "var(--theme-accent, #6366F1)" : "transparent",
                color: statusFilter === s.value ? "#fff" : "var(--theme-text-secondary, #9CA3AF)",
                border: `2px solid ${statusFilter === s.value ? "var(--theme-accent, #6366F1)" : "var(--theme-border, #2E2E35)"}`,
                cursor: "pointer",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {SEVERITIES.map((s) => (
            <button
              key={s.value}
              onClick={() => setSeverityFilter(s.value)}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                padding: "4px 10px",
                background: severityFilter === s.value ? "var(--theme-accent, #6366F1)" : "transparent",
                color: severityFilter === s.value ? "#fff" : "var(--theme-text-secondary, #9CA3AF)",
                border: `2px solid ${severityFilter === s.value ? "var(--theme-accent, #6366F1)" : "var(--theme-border, #2E2E35)"}`,
                cursor: "pointer",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ border: "2px solid var(--theme-border, #2E2E35)", background: "var(--theme-background-secondary, #0A0A0A)" }}>
        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 180px 200px 100px 140px", padding: "10px 16px", borderBottom: "2px solid var(--theme-border, #2E2E35)", background: "var(--theme-background, #050505)" }}>
          {["SEV", "TITLE", "REPORTER", "PAGE", "STATUS", "CREATED"].map((h) => (
            <span key={h} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--theme-text-tertiary, #6B7280)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {!filtered ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--theme-text-tertiary)" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--theme-text-tertiary)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>NO REPORTS FOUND</div>
        ) : (
          filtered.map((report) => (
            <div key={report._id}>
              <div
                onClick={() => setExpandedId(expandedId === report._id ? null : report._id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 180px 200px 100px 140px",
                  padding: "10px 16px",
                  borderBottom: "1px solid var(--theme-border-subtle, #1F1F23)",
                  cursor: "pointer",
                  alignItems: "center",
                  background: expandedId === report._id ? "var(--theme-background, #050505)" : "transparent",
                }}
              >
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: severityColor[report.severity], textTransform: "uppercase" }}>
                  {report.severity}
                </span>
                <span style={{ fontSize: 13, color: "var(--theme-text-primary, #F9FAFB)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 12 }}>
                  {report.title}
                </span>
                <span style={{ fontSize: 12, color: "var(--theme-text-secondary, #9CA3AF)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {report.userEmail || "—"}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--theme-text-tertiary, #6B7280)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {report.url}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: statusColor[report.status], textTransform: "uppercase" }}>
                  {report.status.replace("_", " ")}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--theme-text-tertiary, #6B7280)" }}>
                  {formatDate(report.createdAt)}
                </span>
              </div>
              {expandedId === report._id && <ExpandedRow reportId={report._id} />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
