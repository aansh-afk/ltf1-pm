package app

import (
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/theme"
)

// renderHeader renders a minimal top bar — just context info, no chrome.
func (m Model) renderHeader() string {
	logo := lipgloss.NewStyle().
		Foreground(theme.TextColor).
		Bold(true).
		Render("LTF1")

	// Workspace/project in dim
	ctx := ""
	if m.config != nil {
		ws := m.config.Context.WorkspaceName
		proj := m.config.Context.ProjectName
		if ws != "" && proj != "" {
			ctx = lipgloss.NewStyle().Foreground(theme.TextDim).Render("  " + ws + " / " + proj)
		} else if ws != "" {
			ctx = lipgloss.NewStyle().Foreground(theme.TextDim).Render("  " + ws)
		}
	}

	left := logo + ctx

	style := lipgloss.NewStyle().
		Width(m.width).
		Padding(0, 1).
		BorderStyle(lipgloss.NormalBorder()).
		BorderBottom(true).
		BorderTop(false).
		BorderLeft(false).
		BorderRight(false).
		BorderForeground(theme.BorderSubtle)

	return style.Render(left)
}
