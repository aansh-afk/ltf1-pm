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
	left := ""
	if s.GitBranch != "" {
		left = theme.StatusBarBranchStyle.Render(s.GitBranch)
		if s.Path != "" {
			left += " " + theme.StatusBarPathStyle.Render(s.Path)
		}
	}

	right := theme.StatusBarAccentStyle.Render(theme.SymDot) + " LTF1 v" + s.Version

	leftWidth := lipgloss.Width(left)
	rightWidth := lipgloss.Width(right)
	gap := s.Width - leftWidth - rightWidth - 2
	if gap < 1 {
		gap = 1
	}

	row := " " + left + theme.WidthStyle(gap).Render("") + right + " "

	return theme.StatusBarStyle.Width(s.Width).Render(row)
}
