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
	case "review", "in_review":
		c = theme.Purple
	default:
		c = theme.TextMuted
	}

	dot := theme.ColorTextStyle(c).Render(theme.SymDot)
	label := theme.ColorTextStyle(c).Render(status)
	return dot + " " + label
}

// PriorityBadge renders a colored bold label for a priority level.
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
		c = theme.TextMuted
	default:
		c = theme.TextMuted
	}

	return theme.ColorBoldStyle(c).Render(priority)
}
