package components

import (
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

// TopBarModel holds top bar state.
type TopBarModel struct {
	Workspace string
	Project   string
	Connected bool
	Width     int
}

// NewTopBar creates a new top bar.
func NewTopBar() TopBarModel {
	return TopBarModel{Connected: false}
}

// View renders the top bar.
func (t TopBarModel) View() string {
	titleStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(theme.TextPrimary)

	contextStyle := lipgloss.NewStyle().
		Foreground(theme.TextMuted)

	left := titleStyle.Render("LTF1")
	if t.Workspace != "" {
		ctx := t.Workspace
		if t.Project != "" {
			ctx += " / " + t.Project
		}
		left += "  " + contextStyle.Render(ctx)
	}

	dotColor := theme.Red
	if t.Connected {
		dotColor = theme.Green
	}
	right := lipgloss.NewStyle().Foreground(dotColor).Render(theme.SymDot)

	// Calculate gap
	leftWidth := lipgloss.Width(left)
	rightWidth := lipgloss.Width(right)
	gap := t.Width - leftWidth - rightWidth - 4 // 4 for padding
	if gap < 1 {
		gap = 1
	}

	row := left + lipgloss.NewStyle().Width(gap).Render("") + right

	return theme.TopBarStyle.Width(t.Width).Render(row)
}
