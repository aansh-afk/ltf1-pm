package app

import (
	"fmt"
	"strings"

	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/pages"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/theme"
)

const sidebarWidth = 18

type navItem struct {
	icon string
	name string
	page pages.Page
}

var navItems = []navItem{
	{icon: "~", name: "Dashboard", page: pages.PageDashboard},
	{icon: "#", name: "Tasks", page: pages.PageTasks},
	{icon: "@", name: "Sprint", page: pages.PageSprint},
	{icon: "*", name: "Agent", page: pages.PageAgent},
	{icon: "+", name: "Skills", page: pages.PageSkills},
	{icon: "&", name: "Git", page: pages.PageGit},
	{icon: ">", name: "Projects", page: pages.PageProjects},
	{icon: "/", name: "Search", page: pages.PageSearch},
	{icon: "!", name: "Notifs", page: pages.PageNotifications},
	{icon: "%", name: "Settings", page: pages.PageSettings},
	{icon: "?", name: "Help", page: pages.PageHelp},
}

// renderSidebar renders the left navigation panel.
func (m Model) renderSidebar(height int) string {
	var b strings.Builder

	for _, item := range navItems {
		active := item.page == m.page

		icon := item.icon
		name := item.name

		var line string
		if active {
			prefix := lipgloss.NewStyle().
				Foreground(theme.AccentColor).
				Bold(true).
				Render(fmt.Sprintf(" %s ", icon))
			label := lipgloss.NewStyle().
				Foreground(theme.TextColor).
				Bold(true).
				Render(name)
			line = prefix + label
		} else {
			prefix := theme.DimStyle.Render(fmt.Sprintf(" %s ", icon))
			label := theme.MutedStyle.Render(name)
			line = prefix + label
		}

		b.WriteString(line)
		b.WriteString("\n")
	}

	style := lipgloss.NewStyle().
		Width(sidebarWidth).
		Height(height).
		BorderRight(true).
		BorderStyle(lipgloss.Border{Right: "│"}).
		BorderForeground(theme.BorderSubtle).
		Background(theme.BgColor)

	return style.Render(b.String())
}
