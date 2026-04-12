package output

import "strings"

// FormatStatus returns a colored, padded status badge.
func FormatStatus(status string) string {
	switch strings.ToLower(status) {
	case "backlog":
		return Colorize(Gray, "BACKLOG")
	case "todo":
		return Colorize(Blue, "TODO")
	case "in_progress":
		return Colorize(Yellow, "IN_PROGRESS")
	case "in_review":
		return Colorize(Magenta, "IN_REVIEW")
	case "done":
		return Colorize(Green, "DONE")
	case "cancelled":
		return Colorize(Gray, "CANCELLED")
	default:
		return strings.ToUpper(status)
	}
}

// StatusIcon returns a single-character icon for a task status.
func StatusIcon(status string) string {
	switch strings.ToLower(status) {
	case "backlog":
		return Colorize(Gray, "◌")
	case "todo":
		return Colorize(Blue, "○")
	case "in_progress":
		return Colorize(Yellow, "●")
	case "in_review":
		return Colorize(Magenta, "◉")
	case "done":
		return Colorize(Green, "✓")
	case "cancelled":
		return Colorize(Gray, "✕")
	default:
		return "·"
	}
}

// FormatPriority returns a colored priority badge.
func FormatPriority(priority string) string {
	switch strings.ToLower(priority) {
	case "urgent":
		return Colorize(BoldRed, "URGENT")
	case "high":
		return Colorize(Red, "HIGH")
	case "medium":
		return Colorize(Yellow, "MEDIUM")
	case "low":
		return Colorize(Gray, "LOW")
	default:
		return strings.ToUpper(priority)
	}
}

// FormatType returns a colored task type badge.
func FormatType(taskType string) string {
	switch strings.ToLower(taskType) {
	case "feature":
		return Colorize(Green, "FEATURE")
	case "bug":
		return Colorize(Red, "BUG")
	case "improvement":
		return Colorize(Blue, "IMPROVEMENT")
	case "task":
		return Colorize(Gray, "TASK")
	case "epic":
		return Colorize(Magenta, "EPIC")
	default:
		return strings.ToUpper(taskType)
	}
}

// FormatTaskKey returns "PROJ-123" formatted with bold.
func FormatTaskKey(projectKey string, number int) string {
	return Colorize(Bold, projectKey+"-"+itoa(number))
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	digits := []byte{}
	negative := n < 0
	if negative {
		n = -n
	}
	for n > 0 {
		digits = append([]byte{byte('0' + n%10)}, digits...)
		n /= 10
	}
	if negative {
		digits = append([]byte{'-'}, digits...)
	}
	return string(digits)
}
