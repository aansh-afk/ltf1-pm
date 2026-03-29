package components

import (
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

// RenderListItem renders a generic list item with title, metadata, and selection state.
func RenderListItem(title, metadata string, isSelected bool) string {
	if isSelected {
		titleStyle := lipgloss.NewStyle().
			Bold(true).
			Foreground(theme.TextPrimary)

		metaStyle := lipgloss.NewStyle().
			Foreground(theme.TextSecondary)

		line := theme.SymBar + " " + titleStyle.Render(title)
		if metadata != "" {
			line += "  " + metaStyle.Render(metadata)
		}
		return theme.ListItemSelected.Render(line)
	}

	titleStyle := lipgloss.NewStyle().
		Foreground(theme.TextSecondary)

	metaStyle := lipgloss.NewStyle().
		Foreground(theme.TextMuted)

	line := "  " + titleStyle.Render(title)
	if metadata != "" {
		line += "  " + metaStyle.Render(metadata)
	}
	return theme.ListItemStyle.Render(line)
}
