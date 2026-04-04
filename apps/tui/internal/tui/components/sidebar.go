package components

import (
	"fmt"
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
	Active   string
	Selected string
	Focused  bool
	Height   int
	// Badges maps nav keys to notification counts (e.g. "a" -> 3)
	Badges map[string]int
}

// NewSidebar creates a new sidebar with a default active item.
func NewSidebar() SidebarModel {
	return SidebarModel{Active: "d", Selected: "d", Focused: true, Badges: make(map[string]int)}
}

// SetActive changes the active navigation item.
func (s *SidebarModel) SetActive(key string) {
	s.Active = key
	if s.Selected == "" {
		s.Selected = key
	}
}

// SetSelected changes the currently highlighted sidebar item.
func (s *SidebarModel) SetSelected(key string) {
	s.Selected = key
}

// SyncSelectionToActive resets the highlighted item to the active page.
func (s *SidebarModel) SyncSelectionToActive() {
	s.Selected = s.Active
}

// SelectedKey returns the currently highlighted sidebar key.
func (s SidebarModel) SelectedKey() string {
	if s.Selected != "" {
		return s.Selected
	}
	return s.Active
}

// Move changes the highlighted sidebar item by delta.
func (s *SidebarModel) Move(delta int) {
	keys := navKeys()
	if len(keys) == 0 {
		return
	}

	current := 0
	selected := s.SelectedKey()
	for i, key := range keys {
		if key == selected {
			current = i
			break
		}
	}

	next := current + delta
	if next < 0 {
		next = 0
	}
	if next >= len(keys) {
		next = len(keys) - 1
	}
	s.Selected = keys[next]
}

// Active item style: left bar + background highlight
var sidebarActiveItemStyle = lipgloss.NewStyle().
	Background(theme.BgHighlight).
	Bold(true).
	Foreground(theme.TextPrimary)

var sidebarActiveBarStyle = lipgloss.NewStyle().
	Foreground(theme.Indigo).
	Background(theme.BgHighlight).
	Bold(true)

// View renders the sidebar.
func (s SidebarModel) View() string {
	var b strings.Builder

	b.WriteString("\n") // Top padding

	itemWidth := theme.SidebarWidth - 3 // -3 for border + padding

	for gi, group := range NavGroups {
		for _, item := range group {
			isActive := false

			switch {
			case s.Focused && item.Key == s.SelectedKey():
				isActive = true
			case !s.Focused && item.Key == s.Active:
				isActive = true
			case s.Focused && item.Key == s.Active && item.Key != s.SelectedKey():
				// Active page but cursor is elsewhere - subtle indicator
				marker := theme.TextDimStyle.Render(theme.SymDot) + " "
				label := theme.TextSecondaryStyle.Render(item.Label)
				badge := s.renderBadge(item.Key)
				b.WriteString(marker + label + badge + "\n")
				continue
			}

			if isActive {
				// Render: ▌ Label      [badge]  with BgHighlight background
				bar := sidebarActiveBarStyle.Render(theme.SymBar)
				label := " " + item.Label
				badge := ""
				if count, ok := s.Badges[item.Key]; ok && count > 0 {
					badge = fmt.Sprintf(" %d", count)
				}
				content := label + badge
				padW := itemWidth - lipgloss.Width(content)
				if padW < 0 {
					padW = 0
				}
				content += strings.Repeat(" ", padW)
				rendered := sidebarActiveItemStyle.Render(content)
				b.WriteString(bar + rendered + "\n")
			} else {
				marker := "  "
				label := theme.SidebarInactiveStyle.Render(item.Label)
				badge := s.renderBadge(item.Key)
				b.WriteString(marker + label + badge + "\n")
			}
		}
		if gi < len(NavGroups)-1 {
			b.WriteString("\n")
		}
	}

	content := b.String()

	// Count lines used by nav items
	lines := strings.Count(content, "\n")

	// Reserve 2 lines at bottom for brand text
	bottomPad := s.Height - lines - 2
	if bottomPad < 0 {
		bottomPad = 0
	}
	for i := 0; i < bottomPad; i++ {
		content += "\n"
	}

	// Brand at bottom of sidebar
	content += "\n" + theme.TextDimStyle.Render(" LTF1") + "\n"

	return theme.SidebarStyle.Height(s.Height).Render(content)
}

func (s SidebarModel) renderBadge(key string) string {
	count, ok := s.Badges[key]
	if !ok || count <= 0 {
		return ""
	}
	return "  " + theme.WarningBoldStyle.Render(fmt.Sprintf("%d", count))
}

func navKeys() []string {
	keys := make([]string, 0, len(NavGroups)*4)
	for _, group := range NavGroups {
		for _, item := range group {
			keys = append(keys, item.Key)
		}
	}
	return keys
}
