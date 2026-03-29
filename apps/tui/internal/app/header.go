package app

import (
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/theme"
)

// renderHeader renders the top header bar.
func (m Model) renderHeader() string {
	logo := lipgloss.NewStyle().
		Foreground(theme.AccentColor).
		Bold(true).
		Render("LTF1")

	sep := theme.DimStyle.Render(" > ")

	workspace := theme.TextColor
	workspaceName := "No Workspace"
	if m.config != nil && m.config.Project.WorkspaceName != "" {
		workspaceName = m.config.Project.WorkspaceName
	}
	ws := lipgloss.NewStyle().Foreground(workspace).Render(workspaceName)

	projectName := "No Project"
	if m.config != nil && m.config.Project.ProjectName != "" {
		projectName = m.config.Project.ProjectName
	}
	proj := lipgloss.NewStyle().Foreground(theme.TextSecondary).Render(projectName)

	left := logo + sep + ws + sep + proj

	// Connection status dot
	var dot string
	if m.connected {
		dot = lipgloss.NewStyle().Foreground(theme.GreenColor).Render("●")
	} else {
		dot = lipgloss.NewStyle().Foreground(theme.RedColor).Render("●")
	}
	right := dot + " "

	// Calculate padding
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
		Width(m.width).
		Padding(0, 1)

	return style.Render(bar)
}
