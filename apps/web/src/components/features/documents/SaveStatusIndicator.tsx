import clsx from "clsx"

interface SaveStatusIndicatorProps {
  status: "saved" | "saving" | "unsaved" | "error"
}

export default function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  const config = {
    saved: { label: "SAVED", color: "text-[var(--theme-success)]" },
    saving: { label: "SAVING...", color: "text-[var(--theme-warning)]" },
    unsaved: { label: "UNSAVED", color: "text-[var(--theme-foreground)]/50" },
    error: { label: "ERROR", color: "text-[var(--theme-error)]" },
  }

  const { label, color } = config[status]

  return (
    <span
      className={clsx(
        "text-[11px] font-mono tracking-wider",
        color
      )}
    >
      {status === "saving" && (
        <span className="inline-block w-2 h-2 border border-current border-t-transparent rounded-full animate-spin mr-1 align-middle" />
      )}
      {label}
    </span>
  )
}
