package pages

import (
	"encoding/json"
	"fmt"
	"strings"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/components"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

type agentDataMsg struct {
	Suggestions []api.TriageSuggestion
	Activity    []api.AgentActivity
	Err         error
}

type agentPage struct {
	width, height int
	client        *api.ConvexClient
	suggestions   []api.TriageSuggestion
	activity      []api.AgentActivity
	cursor        int
	loading       bool
}

func NewAgentPage(client *api.ConvexClient) PageModel {
	return &agentPage{client: client, loading: true}
}

func (p *agentPage) Init() tea.Cmd {
	if p.client == nil {
		return nil
	}
	return p.fetchData()
}

func (p *agentPage) fetchData() tea.Cmd {
	return func() tea.Msg {
		var data agentDataMsg

		raw, err := p.client.Query("agent:pendingSuggestions", nil)
		if err == nil {
			json.Unmarshal(raw, &data.Suggestions)
		}

		raw, err = p.client.Query("agent:recentActivity", nil)
		if err == nil {
			json.Unmarshal(raw, &data.Activity)
		}

		return data
	}
}

func (p *agentPage) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case agentDataMsg:
		p.suggestions = msg.Suggestions
		p.activity = msg.Activity
		p.loading = false
	case tea.KeyMsg:
		switch msg.String() {
		case "j", "down":
			if p.cursor < len(p.suggestions)-1 {
				p.cursor++
			}
		case "k", "up":
			if p.cursor > 0 {
				p.cursor--
			}
		}
	}
	return p, nil
}

func (p *agentPage) SetSize(w, h int) {
	p.width = w
	p.height = h
}

func (p *agentPage) ShortHelp() string {
	return "j/k navigate  a accept  r reject  m modify"
}

func (p *agentPage) View() string {
	if p.client == nil {
		return components.EmptyState("Not connected", p.width, p.height)
	}
	if p.loading {
		return components.EmptyState("Loading agent...", p.width, p.height)
	}

	amberStyle := lipgloss.NewStyle().Foreground(theme.Amber)
	var b strings.Builder

	// Stats
	b.WriteString(theme.SectionHeader.Render("AGENT") + "\n")

	triaged := 0
	pending := 0
	for _, s := range p.suggestions {
		if s.Status == "accepted" || s.Status == "rejected" {
			triaged++
		}
		if s.Status == "pending" {
			pending++
		}
	}

	stats := fmt.Sprintf("Triaged: %s  Pending: %s",
		amberStyle.Render(fmt.Sprintf("%d", triaged)),
		amberStyle.Render(fmt.Sprintf("%d", pending)))
	b.WriteString(stats + "\n\n")

	// Triage queue
	b.WriteString(theme.SectionHeader.Render("TRIAGE QUEUE") + "\n")

	if len(p.suggestions) == 0 {
		b.WriteString(theme.TextMutedStyle.Render("No pending suggestions") + "\n")
	} else {
		for i, s := range p.suggestions {
			title := s.TaskID
			if s.SuggestedType != "" {
				title += " " + theme.SymArrowRight + " " + s.SuggestedType
			}
			meta := fmt.Sprintf("%.0f%% confidence", s.Confidence*100)
			b.WriteString(components.RenderListItem(title, meta, i == p.cursor) + "\n")
		}
	}
	b.WriteString("\n")

	// Activity feed
	b.WriteString(theme.SectionHeader.Render("ACTIVITY") + "\n")
	if len(p.activity) == 0 {
		b.WriteString(theme.TextMutedStyle.Render("No recent activity") + "\n")
	} else {
		limit := 5
		if len(p.activity) < limit {
			limit = len(p.activity)
		}
		for i := 0; i < limit; i++ {
			a := p.activity[i]
			b.WriteString("  " + amberStyle.Render(a.Type) + " " +
				theme.TextSecondaryStyle.Render(a.Description) + "\n")
		}
	}

	return b.String()
}
