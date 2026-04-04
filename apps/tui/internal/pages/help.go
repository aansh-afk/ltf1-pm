package pages

import (
	"strings"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/theme"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
)

// --- data types ---

type helpSection struct {
	Title string
	Keys  []helpBinding
}

type helpBinding struct {
	Key  string
	Desc string
}

// --- model ---

type helpModel struct {
	sections []helpSection
	scroll   int
	width    int
	height   int
	client   *api.ConvexClient
	config   *api.AuthConfig
}

func NewHelpPage(client *api.ConvexClient, config *api.AuthConfig) PageModel {
	return &helpModel{
		sections: defaultHelpSections(),
		client:   client,
		config:   config,
	}
}

// PageModel interface

func (m *helpModel) Init() tea.Cmd {
	return nil
}

func (m *helpModel) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil

	case tea.KeyMsg:
		switch msg.String() {
		case "j", "down":
			m.scroll++
		case "k", "up":
			if m.scroll > 0 {
				m.scroll--
			}
		case "g":
			m.scroll = 0
		}
	}

	return m, nil
}

func (m *helpModel) View(width, height int) string {
	header := theme.AccentStyle.Render("  HELP")

	contentWidth := width - 4
	if contentWidth < 40 {
		contentWidth = 70
	}

	keyStyle := lipgloss.NewStyle().Foreground(theme.AccentColor).Width(12)
	descStyle := lipgloss.NewStyle().Foreground(theme.TextColor)
	sectionTitle := lipgloss.NewStyle().Bold(true).Foreground(theme.TextSecondary)

	// Build all section boxes
	var sectionBoxes []string
	for _, section := range m.sections {
		var rows []string
		// Two-column layout
		for i := 0; i < len(section.Keys); i += 2 {
			left := keyStyle.Render(section.Keys[i].Key) + descStyle.Render(section.Keys[i].Desc)

			if i+1 < len(section.Keys) {
				leftPadded := lipgloss.NewStyle().Width(contentWidth/2 - 4).Render(left)
				right := keyStyle.Render(section.Keys[i+1].Key) + descStyle.Render(section.Keys[i+1].Desc)
				rows = append(rows, "  "+leftPadded+right)
			} else {
				rows = append(rows, "  "+left)
			}
		}

		content := sectionTitle.Render(section.Title) + "\n" + strings.Join(rows, "\n")
		box := theme.SubtlePanel.Width(contentWidth).Render(content)
		sectionBoxes = append(sectionBoxes, box)
	}

	// Join all content lines
	allContent := strings.Join(sectionBoxes, "\n")
	allLines := strings.Split(allContent, "\n")

	// Apply scrolling
	visibleHeight := height - 6
	if visibleHeight < 10 {
		visibleHeight = 30
	}
	maxScroll := len(allLines) - visibleHeight
	if maxScroll < 0 {
		maxScroll = 0
	}
	if m.scroll > maxScroll {
		m.scroll = maxScroll
	}

	start := m.scroll
	end := start + visibleHeight
	if end > len(allLines) {
		end = len(allLines)
	}

	visible := strings.Join(allLines[start:end], "\n")

	parts := []string{"", header, "", visible}

	// scroll indicator
	if len(allLines) > visibleHeight {
		scrollHint := theme.DimStyle.Render("  j/k scroll | g top")
		parts = append(parts, "", scrollHint)
	}

	return lipgloss.JoinVertical(lipgloss.Left, parts...)
}

func (m *helpModel) SetSize(width, height int) {
	m.width = width
	m.height = height
}

func (m *helpModel) ShortHelp() string {
	return "j/k scroll | g top"
}

// --- help content ---

func defaultHelpSections() []helpSection {
	return []helpSection{
		{
			Title: "GLOBAL",
			Keys: []helpBinding{
				{Key: "q", Desc: "Quit"},
				{Key: "esc", Desc: "Go back"},
				{Key: "d", Desc: "Dashboard"},
				{Key: "t", Desc: "Tasks"},
				{Key: "s", Desc: "Sprint"},
				{Key: "a", Desc: "Agent"},
				{Key: "k", Desc: "Skills"},
				{Key: "g", Desc: "Git"},
				{Key: "p", Desc: "Projects"},
				{Key: "/", Desc: "Search"},
				{Key: "n", Desc: "Notifications"},
				{Key: ",", Desc: "Settings"},
				{Key: "?", Desc: "Help"},
			},
		},
		{
			Title: "DASHBOARD",
			Keys: []helpBinding{
				{Key: "r", Desc: "Refresh"},
				{Key: "enter", Desc: "Open item"},
			},
		},
		{
			Title: "TASKS",
			Keys: []helpBinding{
				{Key: "j/\u2193", Desc: "Move down"},
				{Key: "k/\u2191", Desc: "Move up"},
				{Key: "c", Desc: "Create"},
				{Key: "e", Desc: "Edit"},
				{Key: "d", Desc: "Delete"},
				{Key: "s", Desc: "Status"},
				{Key: "a", Desc: "Assign"},
				{Key: "f", Desc: "Filter"},
			},
		},
		{
			Title: "SPRINT",
			Keys: []helpBinding{
				{Key: "j/\u2193", Desc: "Move down"},
				{Key: "k/\u2191", Desc: "Move up"},
				{Key: "enter", Desc: "View sprint"},
				{Key: "n", Desc: "New sprint"},
				{Key: "s", Desc: "Start sprint"},
				{Key: "e", Desc: "End sprint"},
			},
		},
		{
			Title: "AGENT",
			Keys: []helpBinding{
				{Key: "enter", Desc: "Send command"},
				{Key: "tab", Desc: "Toggle focus"},
				{Key: "c", Desc: "Clear log"},
				{Key: "r", Desc: "Refresh"},
			},
		},
		{
			Title: "SKILLS",
			Keys: []helpBinding{
				{Key: "j/\u2193", Desc: "Move down"},
				{Key: "k/\u2191", Desc: "Move up"},
				{Key: "enter", Desc: "Toggle skill"},
				{Key: "i", Desc: "Skill info"},
				{Key: "r", Desc: "Refresh"},
			},
		},
		{
			Title: "GIT",
			Keys: []helpBinding{
				{Key: "j/\u2193", Desc: "Move down"},
				{Key: "k/\u2191", Desc: "Move up"},
				{Key: "enter", Desc: "View commit"},
				{Key: "r", Desc: "Refresh"},
				{Key: "d", Desc: "Diff view"},
				{Key: "b", Desc: "Branches"},
			},
		},
		{
			Title: "SEARCH",
			Keys: []helpBinding{
				{Key: "enter", Desc: "Search / Open"},
				{Key: "tab", Desc: "Toggle results"},
				{Key: "j/\u2193", Desc: "Move down"},
				{Key: "k/\u2191", Desc: "Move up"},
			},
		},
		{
			Title: "NOTIFICATIONS",
			Keys: []helpBinding{
				{Key: "j/\u2193", Desc: "Move down"},
				{Key: "k/\u2191", Desc: "Move up"},
				{Key: "enter", Desc: "Mark read"},
				{Key: "a", Desc: "Mark all read"},
				{Key: "r", Desc: "Refresh"},
			},
		},
		{
			Title: "SETTINGS",
			Keys: []helpBinding{
				{Key: "j/\u2193", Desc: "Move down"},
				{Key: "k/\u2191", Desc: "Move up"},
				{Key: "enter", Desc: "Select mode"},
				{Key: "space", Desc: "Select mode"},
			},
		},
	}
}
