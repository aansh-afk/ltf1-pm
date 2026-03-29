package components

import (
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

// EmptyState renders a centered empty state with a symbol and message.
func EmptyState(message string, width, height int) string {
	style := lipgloss.NewStyle().
		Foreground(theme.TextMuted).
		Align(lipgloss.Center).
		Width(width)

	content := theme.SymDotEmpty + "\n" + message

	rendered := style.Render(content)

	// Vertical centering
	lines := lipgloss.Height(rendered)
	padTop := (height - lines) / 2
	if padTop < 0 {
		padTop = 0
	}

	return lipgloss.NewStyle().
		PaddingTop(padTop).
		Width(width).
		Render(rendered)
}
