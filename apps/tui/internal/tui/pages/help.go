package pages

import (
	"strings"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

type helpPage struct {
	width, height int
}

func NewHelpPage() PageModel {
	return &helpPage{}
}

func (p *helpPage) Init() tea.Cmd { return nil }

func (p *helpPage) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	return p, nil
}

func (p *helpPage) SetSize(w, h int) {
	p.width = w
	p.height = h
}

func (p *helpPage) ShortHelp() string {
	return "q quit"
}

func (p *helpPage) KeyBinds() []string {
	return nil
}

func (p *helpPage) View() string {
	header := theme.SectionHeader.Render("KEYBINDINGS")

	groups := []struct {
		title string
		keys  [][2]string
	}{
		{
			title: "NAVIGATION (global)",
			keys: [][2]string{
				{"d", "Dashboard"},
				{"t", "Tasks"},
				{"s", "Sprint"},
				{"a", "Agent (or accept on Agent page)"},
				{"g", "Git"},
				{"p", "Projects"},
				{"k", "Skills (or up on list pages)"},
				{"/", "Search"},
				{"n", "Notifications"},
				{",", "Settings"},
				{"?", "Help"},
			},
		},
		{
			title: "ACTIONS (global)",
			keys: [][2]string{
				{"r", "Refresh (or reject on Agent page)"},
				{"q", "Quit"},
				{"esc", "Back / Cancel"},
				{"enter", "Select / Confirm"},
			},
		},
		{
			title: "LIST PAGES (tasks, agent, git, ...)",
			keys: [][2]string{
				{"j/k", "Navigate up/down"},
				{"c", "Create (tasks) / Commit (git)"},
				{"e", "Edit task"},
				{"x", "Delete task"},
			},
		},
		{
			title: "AGENT PAGE",
			keys: [][2]string{
				{"a", "Accept suggestion"},
				{"r", "Reject suggestion"},
				{"m", "Modify suggestion"},
			},
		},
		{
			title: "GIT PAGE",
			keys: [][2]string{
				{"space", "Stage / Unstage"},
				{"c", "Commit"},
			},
		},
	}

	keyStyle := theme.KeyHintKey
	descStyle := theme.KeyHintDesc
	sectionStyle := lipgloss.NewStyle().Foreground(theme.Indigo).Bold(true)

	var b strings.Builder
	b.WriteString(header + "\n\n")

	colWidth := p.width / 2
	if colWidth < 30 {
		colWidth = p.width
	}

	for i, group := range groups {
		b.WriteString(sectionStyle.Render(group.title) + "\n")
		for _, kv := range group.keys {
			key := keyStyle.Render(lipgloss.NewStyle().Width(8).Render(kv[0]))
			desc := descStyle.Render(kv[1])
			b.WriteString("  " + key + " " + desc + "\n")
		}
		if i < len(groups)-1 {
			b.WriteString("\n")
		}
	}

	return b.String()
}
