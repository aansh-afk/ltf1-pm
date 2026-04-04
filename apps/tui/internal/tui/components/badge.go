package components

import (
	"image/color"
	"strings"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

// StatusBadge renders a colored dot + label for a task status.
func StatusBadge(status string) string {
	var c color.Color
	switch strings.ToLower(status) {
	case "done", "completed":
		c = theme.Green
	case "in_progress", "in progress", "active":
		c = theme.Indigo
	case "todo", "backlog", "pending":
		c = theme.TextMuted
	case "blocked":
		c = theme.Red
	case "review", "in_review", "in review":
		c = theme.Amber
	default:
		c = theme.TextMuted
	}

	dot := theme.ColorTextStyle(c).Render(theme.SymDot)
	label := theme.TextSecondaryStyle.Render(" " + formatStatus(status))
	return dot + label
}

// StatusDot renders just the colored dot for a status.
func StatusDot(status string) string {
	var c color.Color
	switch strings.ToLower(status) {
	case "done", "completed":
		c = theme.Green
	case "in_progress", "in progress", "active":
		c = theme.Indigo
	case "todo", "backlog", "pending":
		c = theme.TextMuted
	case "blocked":
		c = theme.Red
	case "review", "in_review", "in review":
		c = theme.Amber
	default:
		c = theme.TextMuted
	}
	return theme.ColorTextStyle(c).Render(theme.SymDot)
}

// PriorityBadge renders a colored [PRIORITY] label in bracket notation.
func PriorityBadge(priority string) string {
	var c color.Color
	switch strings.ToLower(priority) {
	case "urgent", "critical":
		c = theme.Red
	case "high":
		c = theme.Amber
	case "medium":
		c = theme.Indigo
	case "low":
		c = theme.Green
	default:
		c = theme.TextMuted
	}

	return theme.ColorBoldStyle(c).Render("[" + strings.ToUpper(priority) + "]")
}

// PriorityBadgePlain renders priority without brackets (for compact views).
func PriorityBadgePlain(priority string) string {
	var c color.Color
	switch strings.ToLower(priority) {
	case "urgent", "critical":
		c = theme.Red
	case "high":
		c = theme.Amber
	case "medium":
		c = theme.Indigo
	case "low":
		c = theme.TextMuted
	default:
		c = theme.TextMuted
	}

	return theme.ColorBoldStyle(c).Render(priority)
}

func formatStatus(status string) string {
	switch strings.ToLower(status) {
	case "in_progress":
		return "In Progress"
	case "in_review":
		return "In Review"
	case "todo":
		return "Todo"
	case "done", "completed":
		return "Done"
	case "blocked":
		return "Blocked"
	case "backlog":
		return "Backlog"
	default:
		return status
	}
}
