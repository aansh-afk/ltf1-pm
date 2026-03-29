package components

import (
	"strings"

	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

// NavItem represents a single sidebar navigation entry.
type NavItem struct {
	Key   string
	Label string
}

// NavGroups defines the sidebar navigation layout.
var NavGroups = [][]NavItem{
	// Core
	{
		{Key: "d", Label: "Dashboard"},
		{Key: "t", Label: "Tasks"},
		{Key: "s", Label: "Sprint"},
		{Key: "a", Label: "Agent"},
		{Key: "g", Label: "Git"},
	},
	// Secondary
	{
		{Key: "p", Label: "Projects"},
		{Key: "k", Label: "Skills"},
		{Key: "/", Label: "Search"},
		{Key: "n", Label: "Notifications"},
	},
	// Meta
	{
		{Key: ",", Label: "Settings"},
		{Key: "?", Label: "Help"},
	},
}

// SidebarModel holds sidebar state.
type SidebarModel struct {
	Active string
	Height int
}

// NewSidebar creates a new sidebar with a default active item.
func NewSidebar() SidebarModel {
	return SidebarModel{Active: "d"}
}

// SetActive changes the active navigation item.
func (s *SidebarModel) SetActive(key string) {
	s.Active = key
}

// View renders the sidebar.
func (s SidebarModel) View() string {
	var b strings.Builder

	activeStyle := lipgloss.NewStyle().
		Foreground(theme.Indigo).
		Bold(true)

	inactiveStyle := lipgloss.NewStyle().
		Foreground(theme.TextMuted)

	for gi, group := range NavGroups {
		for _, item := range group {
			if item.Key == s.Active {
				b.WriteString(theme.SymBar + " " + activeStyle.Render(item.Label))
			} else {
				b.WriteString("  " + inactiveStyle.Render(item.Label))
			}
			b.WriteString("\n")
		}
		if gi < len(NavGroups)-1 {
			b.WriteString("\n")
		}
	}

	content := b.String()

	// Pad to fill height
	lines := strings.Count(content, "\n")
	for i := lines; i < s.Height; i++ {
		content += "\n"
	}

	return theme.SidebarStyle.Height(s.Height).Render(content)
}
