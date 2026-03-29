package pages

import (
	"encoding/json"
	"strings"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/components"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

type dashboardData struct {
	Tasks    []api.Task
	Sprint   *api.Sprint
	Activity []api.AgentActivity
	Err      error
}

type dashboardDataMsg dashboardData

type dashboardPage struct {
	width, height int
	client        *api.ConvexClient
	data          dashboardData
	loading       bool
}

func NewDashboardPage(client *api.ConvexClient) PageModel {
	return &dashboardPage{client: client, loading: true}
}

func (p *dashboardPage) Init() tea.Cmd {
	if p.client == nil {
		return nil
	}
	return p.fetchData()
}

func (p *dashboardPage) fetchData() tea.Cmd {
	return func() tea.Msg {
		var data dashboardData

		// Fetch tasks
		raw, err := p.client.Query("tasks:list", nil)
		if err == nil {
			json.Unmarshal(raw, &data.Tasks)
		}

		// Fetch active sprint
		raw, err = p.client.Query("sprints:getActive", nil)
		if err == nil && string(raw) != "null" {
			var sprint api.Sprint
			if json.Unmarshal(raw, &sprint) == nil {
				data.Sprint = &sprint
			}
		}

		// Fetch agent activity
		raw, err = p.client.Query("agent:recentActivity", nil)
		if err == nil {
			json.Unmarshal(raw, &data.Activity)
		}

		return dashboardDataMsg(data)
	}
}

func (p *dashboardPage) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case dashboardDataMsg:
		p.data = dashboardData(msg)
		p.loading = false
	}
	return p, nil
}

func (p *dashboardPage) SetSize(w, h int) {
	p.width = w
	p.height = h
}

func (p *dashboardPage) ShortHelp() string {
	return "r refresh  d dashboard"
}

func (p *dashboardPage) KeyBinds() []string {
	return nil
}

func (p *dashboardPage) View() string {
	if p.client == nil {
		return components.EmptyState("Not connected. Run ltf auth login first.", p.width, p.height)
	}
	if p.loading {
		return components.EmptyState("Loading dashboard...", p.width, p.height)
	}

	var b strings.Builder

	// Active Sprint section
	b.WriteString(theme.SectionHeader.Render("ACTIVE SPRINT") + "\n")
	if p.data.Sprint != nil {
		nameStyle := lipgloss.NewStyle().Foreground(theme.TextPrimary).Bold(true)
		b.WriteString(nameStyle.Render(p.data.Sprint.Name) + "\n")

		// Calculate progress from tasks
		total := 0
		done := 0
		for _, t := range p.data.Tasks {
			if t.SprintID == p.data.Sprint.ID {
				total++
				if t.Status == "done" || t.Status == "completed" {
					done++
				}
			}
		}
		pct := 0.0
		if total > 0 {
			pct = float64(done) / float64(total) * 100
		}
		b.WriteString(components.ProgressBar(pct, 40, theme.Indigo) + "\n")
	} else {
		b.WriteString(theme.TextMutedStyle.Render("No active sprint") + "\n")
	}
	b.WriteString("\n")

	// My Tasks section
	b.WriteString(theme.SectionHeader.Render("MY TASKS") + "\n")
	if len(p.data.Tasks) == 0 {
		b.WriteString(theme.TextMutedStyle.Render("No tasks found") + "\n")
	} else {
		limit := 8
		if len(p.data.Tasks) < limit {
			limit = len(p.data.Tasks)
		}
		for i := 0; i < limit; i++ {
			t := p.data.Tasks[i]
			meta := components.StatusBadge(t.Status)
			if t.Priority != "" {
				meta += "  " + components.PriorityBadge(t.Priority)
			}
			b.WriteString(components.RenderListItem(t.Title, meta, false) + "\n")
		}
	}
	b.WriteString("\n")

	// Agent Activity section
	b.WriteString(theme.SectionHeader.Render("AGENT ACTIVITY") + "\n")
	if len(p.data.Activity) == 0 {
		b.WriteString(theme.TextMutedStyle.Render("No recent activity") + "\n")
	} else {
		limit := 5
		if len(p.data.Activity) < limit {
			limit = len(p.data.Activity)
		}
		for i := 0; i < limit; i++ {
			a := p.data.Activity[i]
			typeStyle := lipgloss.NewStyle().Foreground(theme.Amber)
			b.WriteString("  " + typeStyle.Render(a.Type) + " " +
				theme.TextSecondaryStyle.Render(a.Description) + "\n")
		}
	}

	return b.String()
}
