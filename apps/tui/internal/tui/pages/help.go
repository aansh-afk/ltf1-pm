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
	header := theme.SectionHeader.Render("KEYBINDINGS")

	groups := []struct {
		title string
		keys  [][2]string
	}{
		{
			title: "SIDEBAR",
			keys: [][2]string{
				{"j/k", "Move between pages"},
				{"enter", "Open selected page"},
				{"right/l", "Open selected page"},
				{"d t s a ...", "Jump sidebar selection by key"},
				{"q", "Quit"},
			},
		},
		{
			title: "PAGE FOCUS",
			keys: [][2]string{
				{"esc", "Return focus to sidebar"},
				{"r", "Refresh current page"},
				{"q", "Quit"},
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
	var b strings.Builder
	b.WriteString(header + "\n\n")

	for i, group := range groups {
		b.WriteString(theme.AccentTextStyle.Render(group.title) + "\n")
		for _, kv := range group.keys {
			key := keyStyle.Render(theme.KeyColumnStyle.Render(kv[0]))
			desc := descStyle.Render(kv[1])
			b.WriteString("  " + key + " " + desc + "\n")
		}
		if i < len(groups)-1 {
			b.WriteString("\n")
		}
	}

	return b.String()
}
