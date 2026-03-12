import { type RecordedStep } from '@/hooks/useStepRecorder';
import BrutalModal from '@/components/ui/BrutalModal';
import { getCapturedErrors } from '@/utils/consoleCapture';

type Severity = 'critical' | 'high' | 'medium' | 'low';

interface BugReporterModalProps {
  isOpen: boolean;
  step: number;
  setStep: (s: number) => void;
  formData: { title: string; description: string; severity: Severity };
  setFormData: (d: { title: string; description: string; severity: Severity }) => void;
  screenshotUrls: string[];
  isSubmitting: boolean;
  isCapturing: boolean;
  isRecording: boolean;
  recordedSteps: RecordedStep[];
  onClose: () => void;
  onTakeScreenshot: () => void;
  onRemoveScreenshot: (i: number) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSubmit: () => void;
}

const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string }> = {
  critical: { label: 'CRITICAL', color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  high: { label: 'HIGH', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  medium: { label: 'MEDIUM', color: '#6366F1', bg: 'rgba(99,102,241,0.15)' },
  low: { label: 'LOW', color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
};

const STEP_LABELS = ['DESCRIBE', 'EVIDENCE', 'REVIEW'];

export default function BugReporterModal({
  isOpen,
  step,
  setStep,
  formData,
  setFormData,
  screenshotUrls,
  isSubmitting,
  isCapturing,
  recordedSteps,
  onClose,
  onTakeScreenshot,
  onRemoveScreenshot,
  onStartRecording,
  onSubmit,
}: BugReporterModalProps) {
  const canProceedStep0 = formData.title.trim().length > 0;
  const consoleErrors = getCapturedErrors();

  return (
    <div data-bug-reporter>
      <BrutalModal isOpen={isOpen} onClose={onClose} title="REPORT BUG" size="lg">
        {/* Step indicator */}
        <div className="flex gap-2 mb-6" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          {STEP_LABELS.map((label, i) => (
            <button
              key={label}
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className="flex items-center gap-1.5 text-[11px] tracking-wider"
              style={{
                color: i === step ? '#6366F1' : i < step ? '#22C55E' : '#6B7280',
                cursor: i < step ? 'pointer' : 'default',
              }}
            >
              <span
                className="w-5 h-5 flex items-center justify-center border text-[10px] font-bold"
                style={{
                  borderColor: i === step ? '#6366F1' : i < step ? '#22C55E' : '#2E2E35',
                  backgroundColor: i < step ? 'rgba(34,197,94,0.15)' : 'transparent',
                }}
              >
                {i < step ? '✓' : i + 1}
              </span>
              {label}
            </button>
          ))}
        </div>

        {/* Step 0: Describe */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#9CA3AF] mb-1.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief description of the bug"
                className="w-full bg-[#0A0A0A] border-2 border-[#2E2E35] px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:border-[#6366F1] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#9CA3AF] mb-1.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What happened? What did you expect?"
                rows={4}
                className="w-full bg-[#0A0A0A] border-2 border-[#2E2E35] px-3 py-2 text-sm text-[#F9FAFB] placeholder-[#6B7280] focus:border-[#6366F1] focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#9CA3AF] mb-1.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Severity
              </label>
              <div className="flex gap-2">
                {(Object.keys(SEVERITY_CONFIG) as Severity[]).map((sev) => {
                  const cfg = SEVERITY_CONFIG[sev];
                  const active = formData.severity === sev;
                  return (
                    <button
                      key={sev}
                      onClick={() => setFormData({ ...formData, severity: sev })}
                      className="px-3 py-1.5 text-[11px] font-bold tracking-wider border-2 transition-colors"
                      style={{
                        borderColor: active ? cfg.color : '#2E2E35',
                        backgroundColor: active ? cfg.bg : 'transparent',
                        color: active ? cfg.color : '#6B7280',
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep(1)}
                disabled={!canProceedStep0}
                className="px-4 py-2 text-[12px] font-bold uppercase tracking-wider border-2 transition-colors"
                style={{
                  borderColor: canProceedStep0 ? '#6366F1' : '#2E2E35',
                  backgroundColor: canProceedStep0 ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: canProceedStep0 ? '#6366F1' : '#6B7280',
                  cursor: canProceedStep0 ? 'pointer' : 'not-allowed',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                NEXT →
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Evidence */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Screenshots */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#9CA3AF] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Screenshots
              </label>
              <button
                onClick={onTakeScreenshot}
                disabled={isCapturing}
                className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border-2 border-[#2E2E35] hover:border-[#6366F1] transition-colors text-[#9CA3AF] hover:text-[#6366F1]"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {isCapturing ? 'CAPTURING...' : '📸 CAPTURE SCREENSHOT'}
              </button>
              {screenshotUrls.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {screenshotUrls.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt={`Screenshot ${i + 1}`} className="w-24 h-16 object-cover border border-[#2E2E35]" />
                      <button
                        onClick={() => onRemoveScreenshot(i)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#EF4444] text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step Recording */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[#9CA3AF] mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Record Steps
              </label>
              <button
                onClick={onStartRecording}
                className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border-2 border-[#2E2E35] hover:border-[#EF4444] transition-colors text-[#9CA3AF] hover:text-[#EF4444]"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                🔴 RECORD STEPS
              </button>
              {recordedSteps.length > 0 && (
                <div className="mt-2 border border-[#2E2E35] max-h-32 overflow-y-auto">
                  {recordedSteps.map((s, i) => (
                    <div key={i} className="px-2 py-1 text-[11px] text-[#9CA3AF] border-b border-[#1F1F23] last:border-0" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                      <span className="text-[#6366F1]">{s.type}</span> → {s.target}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(0)}
                className="px-4 py-2 text-[12px] font-bold uppercase tracking-wider border-2 border-[#2E2E35] text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                ← BACK
              </button>
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-[12px] font-bold uppercase tracking-wider border-2 border-[#6366F1] text-[#6366F1] transition-colors"
                style={{ backgroundColor: 'rgba(99,102,241,0.15)', fontFamily: "'IBM Plex Mono', monospace" }}
              >
                NEXT →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Review & Submit */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="border border-[#2E2E35] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Title</span>
                <span className="text-sm text-[#F9FAFB]">{formData.title}</span>
              </div>
              {formData.description && (
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Description</span>
                  <p className="text-sm text-[#9CA3AF] mt-0.5">{formData.description}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-[#9CA3AF]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Severity</span>
                <span className="text-[11px] font-bold" style={{ color: SEVERITY_CONFIG[formData.severity].color, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {SEVERITY_CONFIG[formData.severity].label}
                </span>
              </div>
            </div>

            {/* Auto-captured context */}
            <div className="border border-[#2E2E35] p-3 space-y-1.5">
              <span className="text-[11px] uppercase tracking-wider text-[#6366F1] font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>AUTO-CAPTURED</span>
              <div className="text-[11px] text-[#9CA3AF] space-y-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                <div><span className="text-[#6B7280]">URL:</span> {window.location.href}</div>
                <div><span className="text-[#6B7280]">Viewport:</span> {window.innerWidth}x{window.innerHeight}</div>
                <div><span className="text-[#6B7280]">Browser:</span> {navigator.userAgent.slice(0, 80)}...</div>
                <div><span className="text-[#6B7280]">Console errors:</span> {consoleErrors.length}</div>
              </div>
            </div>

            {/* Attachments summary */}
            <div className="flex gap-4 text-[11px] text-[#9CA3AF]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              <span>📸 {screenshotUrls.length} screenshot{screenshotUrls.length !== 1 ? 's' : ''}</span>
              <span>🔴 {recordedSteps.length} recorded step{recordedSteps.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-[12px] font-bold uppercase tracking-wider border-2 border-[#2E2E35] text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                ← BACK
              </button>
              <button
                onClick={onSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 text-[12px] font-bold uppercase tracking-wider border-2 transition-colors"
                style={{
                  borderColor: '#22C55E',
                  backgroundColor: isSubmitting ? 'transparent' : 'rgba(34,197,94,0.15)',
                  color: '#22C55E',
                  cursor: isSubmitting ? 'wait' : 'pointer',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {isSubmitting ? 'SUBMITTING...' : 'SUBMIT REPORT'}
              </button>
            </div>
          </div>
        )}
      </BrutalModal>
    </div>
  );
}
