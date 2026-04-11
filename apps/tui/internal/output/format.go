package output

import (
	"fmt"
	"time"
)

// RelativeTime formats a millisecond timestamp as "5m ago", "2h ago", etc.
func RelativeTime(msTimestamp float64) string {
	if msTimestamp == 0 {
		return ""
	}
	t := time.UnixMilli(int64(msTimestamp))
	diff := time.Since(t)
	switch {
	case diff < time.Minute:
		return "just now"
	case diff < time.Hour:
		return fmt.Sprintf("%dm ago", int(diff.Minutes()))
	case diff < 24*time.Hour:
		return fmt.Sprintf("%dh ago", int(diff.Hours()))
	case diff < 7*24*time.Hour:
		return fmt.Sprintf("%dd ago", int(diff.Hours()/24))
	default:
		return t.Format("2006-01-02")
	}
}

// FormatDate formats a millisecond timestamp as YYYY-MM-DD.
func FormatDate(msTimestamp float64) string {
	if msTimestamp == 0 {
		return ""
	}
	return time.UnixMilli(int64(msTimestamp)).Format("2006-01-02")
}

// FormatDateTime formats a millisecond timestamp as YYYY-MM-DD HH:MM.
func FormatDateTime(msTimestamp float64) string {
	if msTimestamp == 0 {
		return ""
	}
	return time.UnixMilli(int64(msTimestamp)).Format("2006-01-02 15:04")
}

// Truncate truncates s to maxLen, adding "…" if it was truncated.
func Truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	if maxLen <= 1 {
		return "…"
	}
	return s[:maxLen-1] + "…"
}

// FormatDuration formats a millisecond duration as "1h 23m" or "45m".
func FormatDuration(ms int64) string {
	d := time.Duration(ms) * time.Millisecond
	hours := int(d.Hours())
	minutes := int(d.Minutes()) % 60
	if hours > 0 {
		return fmt.Sprintf("%dh %dm", hours, minutes)
	}
	return fmt.Sprintf("%dm", minutes)
}
