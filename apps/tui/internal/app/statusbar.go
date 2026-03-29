package app

import (
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/pages"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/theme"
)

const version = "v0.8.0"

// renderStatusBar renders the bottom status bar.
func (m Model) renderStatusBar() string {
	// Left: page-specific shortcuts
	shortcuts := m.currentPage().ShortHelp()
	left := theme.DimStyle.Render(" " + shortcuts)

	// Right: connection + version
	var connStatus string
	if m.connected {
		connStatus = lipgloss.NewStyle().Foreground(theme.GreenColor).Render("connected")
	} else {
		connStatus = lipgloss.NewStyle().Foreground(theme.RedColor).Render("disconnected")
	}

	pageName := pages.PageName(m.page)
	right := theme.DimStyle.Render(pageName+" ") +
		connStatus +
		theme.DimStyle.Render(" "+version+" ")

	// Pad the middle
	leftWidth := lipgloss.Width(left)
	rightWidth := lipgloss.Width(right)
	gap := m.width - leftWidth - rightWidth
	if gap < 0 {
		gap = 0
	}
	padding := lipgloss.NewStyle().Width(gap).Render("")

	bar := left + padding + right

	style := lipgloss.NewStyle().
		Background(theme.SurfaceColor).
		Width(m.width)

	return style.Render(bar)
}
