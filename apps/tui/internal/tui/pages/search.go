package pages

import (
	"strings"

	tea "charm.land/bubbletea/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/components"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

type searchPage struct {
	width, height int
	client        *api.ConvexClient
	input         components.InputModel
	results       []searchResult
	cursor        int
}

type searchResult struct {
	Type  string
	Title string
	ID    string
}

func NewSearchPage(client *api.ConvexClient) PageModel {
	input := components.NewInput("Search tasks, projects, skills...")
	return &searchPage{client: client, input: input}
}

func (p *searchPage) Init() tea.Cmd {
	return nil
}

func (p *searchPage) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg.(type) {
	case PageFocusedMsg:
		return p, p.input.Focus()
	case PageBlurredMsg:
		p.input.Blur()
		return p, nil
	}

	var cmd tea.Cmd
	p.input, cmd = p.input.Update(msg)

	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "j", "down":
			if !p.input.Focused && p.cursor < len(p.results)-1 {
				p.cursor++
			}
		case "k", "up":
			if !p.input.Focused && p.cursor > 0 {
				p.cursor--
			}
		}
	}

	return p, cmd
}

func (p *searchPage) SetSize(w, h int) {
	p.width = w
	p.height = h
}

func (p *searchPage) ShortHelp() string {
	return "type to search  esc cancel"
}

func (p *searchPage) KeyBinds() []string {
	// Search claims all keys since input is focused
	return []string{"j", "k", "up", "down", "enter"}
}

func (p *searchPage) View() string {
	var b strings.Builder

	b.WriteString("\n")
	b.WriteString(theme.SectionHeader.Render("SEARCH") + "\n")
	b.WriteString("\n")
	b.WriteString("  " + p.input.View() + "\n")
	b.WriteString("\n")

	if len(p.results) == 0 {
		if p.input.Value() != "" {
			b.WriteString("  " + theme.TextMutedStyle.Render(theme.SymDotEmpty+" No results found") + "\n")
		} else {
			b.WriteString("  " + theme.TextDimStyle.Render("Start typing to search...") + "\n")
		}
		return b.String()
	}

	for i, r := range p.results {
		meta := theme.TextDimStyle.Render(r.Type)
		b.WriteString(components.RenderListItem(r.Title, meta, i == p.cursor) + "\n")
	}

	return b.String()
}
