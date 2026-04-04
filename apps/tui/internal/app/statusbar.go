package app

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/theme"
)

const version = "v0.8.0"

// renderStatusBar — clean bottom bar like OpenCode: path:branch left, version right.
func (m Model) renderStatusBar() string {
	dim := lipgloss.NewStyle().Foreground(theme.TextDim)

	// Left: path:branch
	pathStr := shortPath()
	branch := gitBranch()
	left := dim.Render(pathStr)
	if branch != "" {
		left += dim.Render(":" + branch)
	}

	// Right: bullet + LTF1 version
	right := lipgloss.NewStyle().Foreground(theme.AccentColor).Render("• ") +
		dim.Render("LTF1 " + version)

	// Spacing
	leftW := lipgloss.Width(left)
	rightW := lipgloss.Width(right)
	gap := m.width - leftW - rightW - 2
	if gap < 0 {
		gap = 0
	}

	bar := " " + left + lipgloss.NewStyle().Width(gap).Render("") + right + " "

	style := lipgloss.NewStyle().
		Width(m.width).
		BorderStyle(lipgloss.NormalBorder()).
		BorderTop(true).
		BorderBottom(false).
		BorderLeft(false).
		BorderRight(false).
		BorderForeground(theme.BorderSubtle)

	return style.Render(bar)
}

func shortPath() string {
	dir, err := os.Getwd()
	if err != nil {
		return "~"
	}
	home, err := os.UserHomeDir()
	if err == nil && strings.HasPrefix(dir, home) {
		dir = "~" + dir[len(home):]
	}
	parts := strings.Split(dir, string(filepath.Separator))
	if len(parts) > 3 {
		dir = "~/" + strings.Join(parts[len(parts)-2:], "/")
	}
	return dir
}

func gitBranch() string {
	cmd := exec.Command("git", "branch", "--show-current")
	out, err := cmd.Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(out))
}
