package components

import (
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

// StatusBarModel holds status bar state.
type StatusBarModel struct {
	GitBranch string
	Path      string
	Version   string
	Width     int
}

// NewStatusBar creates a new status bar.
func NewStatusBar() StatusBarModel {
	return StatusBarModel{Version: "0.8.0"}
}

// View renders the status bar.
func (s StatusBarModel) View() string {
	branchStyle := lipgloss.NewStyle().Foreground(theme.Green)
	pathStyle := lipgloss.NewStyle().Foreground(theme.TextDim)
	accentStyle := lipgloss.NewStyle().Foreground(theme.Indigo)

	left := ""
	if s.GitBranch != "" {
		left = branchStyle.Render(s.GitBranch)
		if s.Path != "" {
			left += " " + pathStyle.Render(s.Path)
		}
	}

	right := accentStyle.Render(theme.SymDot) + " LTF1 v" + s.Version

	leftWidth := lipgloss.Width(left)
	rightWidth := lipgloss.Width(right)
	gap := s.Width - leftWidth - rightWidth - 2
	if gap < 1 {
		gap = 1
	}

	row := " " + left + lipgloss.NewStyle().Width(gap).Render("") + right + " "

	return theme.StatusBarStyle.Width(s.Width).Render(row)
}
