package pages

import (
	"fmt"
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
	Type   string // "task", "project", "file"
	Title  string
	ID     string
	Status string // for tasks
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
	return components.KeyHints(
		components.KeyHint("enter", "select"),
		components.KeyHint("esc", "clear"),
		components.KeyHint("up/down", "navigate"),
	)
}

func (p *searchPage) KeyBinds() []string {
	return []string{"j", "k", "up", "down", "enter"}
}

func (p *searchPage) View() string {
	var b strings.Builder

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

	// Group results by type
	groups := []struct {
		typeName string
		label    string
	}{
		{"task", "TASKS"},
		{"project", "PROJECTS"},
		{"file", "FILES"},
	}

	globalIdx := 0
	for _, g := range groups {
		var groupResults []searchResult
		var groupIndices []int
		for i, r := range p.results {
			if r.Type == g.typeName {
				groupResults = append(groupResults, r)
				groupIndices = append(groupIndices, i)
			}
		}

		if len(groupResults) == 0 {
			continue
		}

		// Section header with count
		b.WriteString(theme.SectionHeader.Render(fmt.Sprintf("%s (%d)", g.label, len(groupResults))) + "\n\n")

		for j, r := range groupResults {
			_ = j
			isSelected := groupIndices[j] == p.cursor

			// Right-aligned metadata based on type
			var meta string
			switch r.Type {
			case "task":
				if r.Status != "" {
					meta = components.StatusBadge(r.Status)
				}
			case "project":
				meta = theme.TextPrimaryStyle.Render(r.Type)
			default:
				meta = theme.TextSecondaryStyle.Render(r.Type)
			}

			b.WriteString(components.RenderListItem(r.Title, meta, isSelected, p.width-4) + "\n")
			globalIdx++
		}
		b.WriteString("\n")
	}

	return b.String()
}
