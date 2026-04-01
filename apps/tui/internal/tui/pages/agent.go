package pages

import (
	"encoding/json"
	"fmt"
	"strings"

	tea "charm.land/bubbletea/v2"
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
	workspaceID   string
	projectID     string
	suggestions   []api.TriageSuggestion
	activity      []api.AgentActivity
	cursor        int
	loading       bool
}

func NewAgentPage(client *api.ConvexClient, workspaceID, projectID string) PageModel {
	return &agentPage{client: client, workspaceID: workspaceID, projectID: projectID, loading: true}
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

		raw, err := p.client.Query("agent/queries:getTriageQueue", map[string]interface{}{"workspaceId": p.workspaceID})
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

func (p *agentPage) KeyBinds() []string {
	return []string{"j", "k", "up", "down", "a", "r", "m"}
}

func (p *agentPage) View() string {
	if p.client == nil {
		return components.EmptyState("Not connected", p.width, p.height)
	}
	if p.loading {
		return components.EmptyState("Loading agent...", p.width, p.height)
	}

	var b strings.Builder

	b.WriteString("\n")

	// Stats header
	b.WriteString(theme.SectionHeader.Render("AGENT") + "\n")
	b.WriteString("\n")

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

	b.WriteString("  " + theme.WarningTextStyle.Render(theme.SymDot) + " " +
		theme.TextSecondaryStyle.Render("Triaged ") +
		theme.WarningBoldStyle.Render(fmt.Sprintf("%d", triaged)) +
		theme.TextDimStyle.Render("  "+theme.SymBullet+"  ") +
		theme.TextSecondaryStyle.Render("Pending ") +
		theme.WarningBoldStyle.Render(fmt.Sprintf("%d", pending)) + "\n")
	b.WriteString("\n\n")

	// Triage queue
	b.WriteString(theme.SectionHeader.Render("TRIAGE QUEUE") + "\n")
	b.WriteString("\n")

	if len(p.suggestions) == 0 {
		b.WriteString("  " + theme.TextMutedStyle.Render(theme.SymDotEmpty+" No pending suggestions") + "\n")
	} else {
		for i, s := range p.suggestions {
			title := s.TaskID
			if s.SuggestedType != "" {
				title += " " + theme.ColorTextStyle(theme.Amber).Render(theme.SymArrowRight) + " " + s.SuggestedType
			}
			conf := s.Confidence * 100
			confStyle := theme.TextMutedStyle
			if conf >= 80 {
				confStyle = theme.SuccessTextStyle
			} else if conf >= 50 {
				confStyle = theme.WarningTextStyle
			}
			meta := confStyle.Render(fmt.Sprintf("%.0f%%", conf))
			b.WriteString(components.RenderListItem(title, meta, i == p.cursor) + "\n")
		}
	}
	b.WriteString("\n\n")

	// Activity feed
	b.WriteString(theme.SectionHeader.Render("ACTIVITY") + "\n")
	b.WriteString("\n")
	if len(p.activity) == 0 {
		b.WriteString("  " + theme.TextMutedStyle.Render(theme.SymDotEmpty+" No recent activity") + "\n")
	} else {
		limit := 5
		if len(p.activity) < limit {
			limit = len(p.activity)
		}
		for i := 0; i < limit; i++ {
			a := p.activity[i]
			b.WriteString("  " + theme.WarningTextStyle.Render(theme.SymDot) + " " +
				theme.WarningBoldStyle.Render(a.Type) + "  " +
				theme.TextSecondaryStyle.Render(a.Description) + "\n")
		}
	}

	return b.String()
}
