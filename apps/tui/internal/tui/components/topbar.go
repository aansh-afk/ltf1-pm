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
	left := theme.BrandTextStyle.Render("LTF1")
	if t.Workspace != "" {
		sep := theme.TextDimStyle.Render(" " + theme.SymBullet + " ")
		left += sep + theme.TopBarContextStyle.Render(t.Workspace)
		if t.Project != "" {
			left += theme.TextDimStyle.Render(" / ") + theme.TopBarContextStyle.Render(t.Project)
		}
	}

	// Connection indicator
	dotColor := theme.Red
	connLabel := "disconnected"
	if t.Connected {
		dotColor = theme.Green
		connLabel = "connected"
	}
	right := theme.ColorTextStyle(dotColor).Render(theme.SymDot) + " " + theme.TextDimStyle.Render(connLabel)

	// Calculate gap
	leftWidth := lipgloss.Width(left)
	rightWidth := lipgloss.Width(right)
	gap := t.Width - leftWidth - rightWidth - 4
	if gap < 1 {
		gap = 1
	}

	row := left + theme.WidthStyle(gap).Render("") + right

	return theme.TopBarStyle.Width(t.Width).Render(row)
}
