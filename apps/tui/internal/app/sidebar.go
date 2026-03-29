package app

import (
	"fmt"
	"strings"

	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/pages"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/theme"
)

const sidebarWidth = 14

type navItem struct {
	icon string
	key  string
	name string
	page pages.Page
}

var navItems = []navItem{
	{icon: "\u25cb", key: "d", name: "Dashboard", page: pages.PageDashboard},  // ○
	{icon: "\u2610", key: "t", name: "Tasks", page: pages.PageTasks},          // ☐
	{icon: "\u27f3", key: "s", name: "Sprint", page: pages.PageSprint},        // ⟳
	{icon: "\u26a1", key: "a", name: "Agent", page: pages.PageAgent},          // ⚡
	{icon: "\u2726", key: "k", name: "Skills", page: pages.PageSkills},        // ✦
	{icon: "\u2387", key: "g", name: "Git", page: pages.PageGit},              // ⎇
	{icon: "\u25a0", key: "p", name: "Projects", page: pages.PageProjects},    // ■
	{icon: "\u2315", key: "/", name: "Search", page: pages.PageSearch},        // ⌕
	{icon: "\u2022", key: "n", name: "Notifs", page: pages.PageNotifications}, // •
	{icon: "\u2699", key: ",", name: "Settings", page: pages.PageSettings},    // ⚙
	{icon: "?", key: "?", name: "Help", page: pages.PageHelp},
}

// renderSidebar renders the left navigation panel.
func (m Model) renderSidebar(height int) string {
	var b strings.Builder

	b.WriteString("\n")

	for _, item := range navItems {
		active := item.page == m.page

		if active {
			// Active: left indicator + accent text
			indicator := lipgloss.NewStyle().
				Foreground(theme.AccentColor).
				Render("\u258c") // ▌
			label := lipgloss.NewStyle().
				Foreground(theme.AccentColor).
				Bold(true).
				Render(fmt.Sprintf("%s %s", item.icon, item.name))
			b.WriteString(indicator + label)
		} else {
			// Inactive: dim text, no indicator
			label := lipgloss.NewStyle().
				Foreground(theme.TextDim).
				Render(fmt.Sprintf("  %s %s", item.icon, item.name))
			b.WriteString(label)
		}

		b.WriteString("\n")
	}

	// Help hint at bottom
	remaining := height - len(navItems) - 2 // 1 for top padding, 1 for hint
	if remaining > 0 {
		b.WriteString(strings.Repeat("\n", remaining))
	}
	hint := lipgloss.NewStyle().
		Foreground(theme.TextDim).
		Render("  ? help")
	b.WriteString(hint)

	style := lipgloss.NewStyle().
		Width(sidebarWidth).
		Height(height).
		Background(theme.SidebarBg)

	return style.Render(b.String())
}
