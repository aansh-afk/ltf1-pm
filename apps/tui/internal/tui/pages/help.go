package pages

import (
	"strings"

	tea "charm.land/bubbletea/v2"
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
	var b strings.Builder

	b.WriteString("\n")
	b.WriteString(theme.SectionHeader.Render("KEYBINDINGS") + "\n")
	b.WriteString("\n")

	groups := []struct {
		title string
		keys  [][2]string
	}{
		{
			title: "NAVIGATION",
			keys: [][2]string{
				{"j/k", "Move between items"},
				{"enter", "Open / select"},
				{"l", "Open selected page"},
				{"esc", "Back to sidebar"},
				{"r", "Refresh current page"},
				{"q", "Quit"},
			},
		},
		{
			title: "SIDEBAR",
			keys: [][2]string{
				{"d", "Dashboard"},
				{"t", "Tasks"},
				{"s", "Sprint"},
				{"a", "Agent"},
				{"g", "Git"},
				{"p", "Projects"},
				{"k", "Skills"},
				{"/", "Search"},
				{"n", "Notifications"},
				{",", "Settings"},
				{"?", "Help"},
			},
		},
		{
			title: "TASKS",
			keys: [][2]string{
				{"c", "Create task"},
				{"e", "Edit task"},
				{"x", "Delete task"},
			},
		},
		{
			title: "AGENT",
			keys: [][2]string{
				{"a", "Accept suggestion"},
				{"r", "Reject suggestion"},
				{"m", "Modify suggestion"},
			},
		},
		{
			title: "GIT",
			keys: [][2]string{
				{"space", "Stage / Unstage"},
				{"c", "Commit staged changes"},
			},
		},
	}

	keyCol := theme.KeyColumnStyle.Width(12)
	for i, group := range groups {
		b.WriteString("  " + theme.AccentTextStyle.Render(group.title) + "\n")
		b.WriteString("\n")
		for _, kv := range group.keys {
			key := theme.KeyHintKey.Render(keyCol.Render(kv[0]))
			desc := theme.KeyHintDesc.Render(kv[1])
			b.WriteString("    " + key + desc + "\n")
		}
		if i < len(groups)-1 {
			b.WriteString("\n")
		}
	}

	return b.String()
}
