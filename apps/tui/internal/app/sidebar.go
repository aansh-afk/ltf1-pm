package app

import (
	"fmt"
	"strings"

	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/pages"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/theme"
)

const sidebarWidth = 16

type navItem struct {
	name string
	page pages.Page
}

// Clean nav items — no icons, just text like OpenCode's sidebar
var navItems = []navItem{
	{name: "Dashboard", page: pages.PageDashboard},
	{name: "Tasks", page: pages.PageTasks},
	{name: "Sprint", page: pages.PageSprint},
	{name: "Agent", page: pages.PageAgent},
	{name: "Skills", page: pages.PageSkills},
	{name: "Git", page: pages.PageGit},
	{name: "Projects", page: pages.PageProjects},
	{name: "Search", page: pages.PageSearch},
	{name: "Notifs", page: pages.PageNotifications},
	{name: "Settings", page: pages.PageSettings},
}

// renderSidebar renders the left navigation panel — clean text, no icons.
func (m Model) renderSidebar(height int) string {
	var b strings.Builder

	b.WriteString("\n")

	for _, item := range navItems {
		active := item.page == m.page

		if active {
			// Active: bold white text
			label := lipgloss.NewStyle().
				Foreground(theme.TextColor).
				Bold(true).
				Render(fmt.Sprintf("  %s", item.name))
			b.WriteString(label)
		} else {
			// Inactive: dim gray text
			label := lipgloss.NewStyle().
				Foreground(theme.TextDim).
				Render(fmt.Sprintf("  %s", item.name))
			b.WriteString(label)
		}

		b.WriteString("\n")
	}

	// Fill remaining space
	remaining := height - len(navItems) - 3
	if remaining > 0 {
		b.WriteString(strings.Repeat("\n", remaining))
	}

	// Version at bottom like OpenCode
	version := lipgloss.NewStyle().
		Foreground(theme.TextDim).
		Render("  LTF1 v0.8.0")
	b.WriteString(version + "\n")

	style := lipgloss.NewStyle().
		Width(sidebarWidth).
		Height(height).
		BorderStyle(lipgloss.NormalBorder()).
		BorderRight(true).
		BorderTop(false).
		BorderBottom(false).
		BorderLeft(false).
		BorderForeground(theme.BorderSubtle)

	return style.Render(b.String())
}
