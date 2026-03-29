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

// renderStatusBar renders the bottom status bar — OpenCode style.
func (m Model) renderStatusBar() string {
	muted := lipgloss.NewStyle().Foreground(theme.TextDim)

	// Left: path:branch
	pathStr := shortPath()
	branch := gitBranch()
	left := muted.Render(" " + pathStr)
	if branch != "" {
		left += muted.Render(":" + branch)
	}

	// Center: page shortcuts
	center := muted.Render(m.currentPage().ShortHelp())

	// Right: version
	right := muted.Render("LTF1 " + version + " ")

	// Calculate spacing
	leftW := lipgloss.Width(left)
	centerW := lipgloss.Width(center)
	rightW := lipgloss.Width(right)

	totalContent := leftW + centerW + rightW
	totalGap := m.width - totalContent
	if totalGap < 2 {
		// Not enough space — just left + right
		gap := m.width - leftW - rightW
		if gap < 0 {
			gap = 0
		}
		bar := left + lipgloss.NewStyle().Width(gap).Render("") + right
		return lipgloss.NewStyle().
			Background(theme.SurfaceColor).
			Width(m.width).
			Render(bar)
	}

	gapLeft := totalGap / 2
	gapRight := totalGap - gapLeft

	bar := left +
		lipgloss.NewStyle().Width(gapLeft).Render("") +
		center +
		lipgloss.NewStyle().Width(gapRight).Render("") +
		right

	style := lipgloss.NewStyle().
		Background(theme.SurfaceColor).
		Width(m.width)

	return style.Render(bar)
}

// shortPath returns a short working directory path.
func shortPath() string {
	dir, err := os.Getwd()
	if err != nil {
		return "~"
	}
	home, err := os.UserHomeDir()
	if err == nil && strings.HasPrefix(dir, home) {
		dir = "~" + dir[len(home):]
	}
	// Shorten to last 2 components
	parts := strings.Split(dir, string(filepath.Separator))
	if len(parts) > 3 {
		dir = "~/" + strings.Join(parts[len(parts)-2:], "/")
	}
	return dir
}

// gitBranch returns the current git branch, or empty string.
func gitBranch() string {
	cmd := exec.Command("git", "branch", "--show-current")
	out, err := cmd.Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(out))
}
