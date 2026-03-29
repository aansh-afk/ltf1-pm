package app

import (
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/theme"
)

// renderHeader renders the top header bar — single line, minimal.
func (m Model) renderHeader() string {
	logo := lipgloss.NewStyle().
		Foreground(theme.AccentColor).
		Bold(true).
		Render("LTF1")

	// Workspace/project in muted
	ctx := ""
	if m.config != nil {
		ws := m.config.Context.WorkspaceName
		proj := m.config.Context.ProjectName
		if ws != "" && proj != "" {
			ctx = lipgloss.NewStyle().Foreground(theme.TextMuted).Render("  " + ws + " / " + proj)
		} else if ws != "" {
			ctx = lipgloss.NewStyle().Foreground(theme.TextMuted).Render("  " + ws)
		}
	}

	left := logo + ctx

	// Connection dot
	var dot string
	if m.connected {
		dot = lipgloss.NewStyle().Foreground(theme.GreenColor).Render("\u25cf") // ●
	} else {
		dot = lipgloss.NewStyle().Foreground(theme.RedColor).Render("\u25cf") // ●
	}
	right := dot

	// Pad between left and right
	leftWidth := lipgloss.Width(left)
	rightWidth := lipgloss.Width(right)
	gap := m.width - leftWidth - rightWidth - 2 // -2 for padding
	if gap < 0 {
		gap = 0
	}
	padding := lipgloss.NewStyle().Width(gap).Render("")

	bar := left + padding + right

	style := lipgloss.NewStyle().
		Background(theme.SurfaceColor).
		Width(m.width).
		Padding(0, 1)

	return style.Render(bar)
}
