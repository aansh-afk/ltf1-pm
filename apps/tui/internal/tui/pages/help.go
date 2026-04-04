package pages

import (
	"strings"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/components"
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
	return components.KeyHint("q", "quit")
}

func (p *helpPage) KeyBinds() []string {
	return nil
}

func (p *helpPage) HasModal() bool { return false }

func (p *helpPage) View() string {
	contentW := p.width - 2
	if contentW < 40 {
		contentW = 40
	}

	var b strings.Builder
	b.WriteString("\n")
	b.WriteString(theme.SectionHeader.Render("HELP & SHORTCUTS") + "\n\n")

	// Two-column layout: GLOBAL (left) + NAVIGATION (right)
	colW := (contentW - 3) / 2
	if colW < 20 {
		colW = 20
	}

	globalTable := renderKeyTable("GLOBAL", [][2]string{
		{"[d]", "Dashboard"},
		{"[t]", "Tasks"},
		{"[s]", "Sprint"},
		{"[/]", "Search"},
		{"[q]", "Quit App"},
	}, colW)

	navTable := renderKeyTable("NAVIGATION", [][2]string{
		{"[j/↓]", "Move Down"},
		{"[k/↑]", "Move Up"},
		{"[enter]", "Select/Open"},
		{"[esc]", "Back/Close"},
	}, colW)

	b.WriteString(lipgloss.JoinHorizontal(lipgloss.Top, globalTable, "   ", navTable))
	b.WriteString("\n\n")

	// Task Management table
	taskTable := renderKeyTable("TASK MANAGEMENT", [][2]string{
		{"[c]", "Create New"},
		{"[e]", "Edit Selected"},
		{"[space]", "Toggle Status"},
	}, colW)

	b.WriteString(taskTable)

	// Version footer
	b.WriteString("\n\n")
	b.WriteString(theme.TextMutedStyle.Render("Version v0.1.9") +
		theme.TextDimStyle.Render(" "+theme.SymBullet+" ") +
		theme.TextMutedStyle.Render("Documentation: ltf1.dev"))

	return b.String()
}

// renderKeyTable renders a bordered table with Action | Action columns.
func renderKeyTable(title string, keys [][2]string, width int) string {
	keyColW := 12
	actionColW := width - keyColW - 7 // borders + padding
	if actionColW < 10 {
		actionColW = 10
	}

	// Header row
	headerStyle := lipgloss.NewStyle().Foreground(theme.TextMuted)
	var rows []string
	rows = append(rows, headerStyle.Render(padRight("Action", keyColW))+
		theme.TextDimStyle.Render(theme.BoxV)+" "+
		headerStyle.Render("Action"))

	// Data rows
	for _, kv := range keys {
		key := theme.AccentTextStyle.Render(padRight(kv[0], keyColW))
		action := theme.TextPrimaryStyle.Render(kv[1])
		rows = append(rows, key+theme.TextDimStyle.Render(theme.BoxV)+" "+action)
	}

	content := strings.Join(rows, "\n")
	return components.BorderedSection(title, content, width)
}

func padRight(s string, w int) string {
	if len(s) >= w {
		return s
	}
	return s + strings.Repeat(" ", w-len(s))
}
