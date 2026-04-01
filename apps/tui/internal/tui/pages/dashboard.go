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
	workspaceID   string
	projectID     string
	data          dashboardData
	loading       bool
}

func NewDashboardPage(client *api.ConvexClient, workspaceID, projectID string) PageModel {
	return &dashboardPage{client: client, workspaceID: workspaceID, projectID: projectID, loading: true}
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
		raw, err := p.client.Query("tasks/queries:getMyTasks", map[string]interface{}{})
		if err == nil {
			json.Unmarshal(raw, &data.Tasks)
		}

		// Fetch active sprint
		raw, err = p.client.Query("sprints/queries:getCurrentSprint", map[string]interface{}{"projectId": p.projectID})
		if err == nil && string(raw) != "null" {
			var sprint api.Sprint
			if json.Unmarshal(raw, &sprint) == nil {
				data.Sprint = &sprint
			}
		}

		// Fetch agent activity
		raw, err = p.client.Query("agent/queries:getAgentActivityFeed", map[string]interface{}{"workspaceId": p.workspaceID})
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
	return "r refresh"
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

	b.WriteString("\n")

	// ── ACTIVE SPRINT ──────────────────────────
	b.WriteString(theme.SectionHeader.Render("ACTIVE SPRINT") + "\n")
	b.WriteString("\n")
	if p.data.Sprint != nil {
		b.WriteString("  " + theme.BrandTextStyle.Render(p.data.Sprint.Name) + "\n")

		// Calculate progress from tasks
		total := 0
		done := 0
		inProgress := 0
		for _, t := range p.data.Tasks {
			if t.SprintID == p.data.Sprint.ID {
				total++
				if t.Status == "done" || t.Status == "completed" {
					done++
				}
				if t.Status == "in_progress" || t.Status == "active" {
					inProgress++
				}
			}
		}
		pct := 0.0
		if total > 0 {
			pct = float64(done) / float64(total) * 100
		}
		b.WriteString("  " + components.ProgressBar(pct, 40, theme.Indigo) + "\n")
		b.WriteString("  " + theme.TextDimStyle.Render(
			fmt.Sprintf("%d done  %s%d in progress  %s%d total",
				done,
				theme.SymBullet+" ", inProgress,
				theme.SymBullet+" ", total)) + "\n")
	} else {
		b.WriteString("  " + theme.TextMutedStyle.Render(theme.SymDotEmpty+" No active sprint") + "\n")
	}
	b.WriteString("\n\n")

	// ── MY TASKS ──────────────────────────
	b.WriteString(theme.SectionHeader.Render("MY TASKS") + "\n")
	b.WriteString("\n")
	if len(p.data.Tasks) == 0 {
		b.WriteString("  " + theme.TextMutedStyle.Render(theme.SymDotEmpty+" No tasks found") + "\n")
	} else {
		limit := 8
		if len(p.data.Tasks) < limit {
			limit = len(p.data.Tasks)
		}
		for i := 0; i < limit; i++ {
			t := p.data.Tasks[i]
			status := components.StatusBadge(t.Status)
			priority := ""
			if t.Priority != "" {
				priority = "  " + components.PriorityBadge(t.Priority)
			}
			meta := status + priority
			b.WriteString(components.RenderListItem(t.Title, meta, false) + "\n")
		}
	}
	b.WriteString("\n\n")

	// ── AGENT ACTIVITY ──────────────────────────
	b.WriteString(theme.SectionHeader.Render("AGENT ACTIVITY") + "\n")
	b.WriteString("\n")
	if len(p.data.Activity) == 0 {
		b.WriteString("  " + theme.TextMutedStyle.Render(theme.SymDotEmpty+" No recent activity") + "\n")
	} else {
		limit := 5
		if len(p.data.Activity) < limit {
			limit = len(p.data.Activity)
		}
		for i := 0; i < limit; i++ {
			a := p.data.Activity[i]
			typeLabel := theme.WarningBoldStyle.Render(a.Type)
			b.WriteString("  " + theme.WarningTextStyle.Render(theme.SymDot) + " " +
				typeLabel + "  " +
				theme.TextSecondaryStyle.Render(a.Description) + "\n")
		}
	}

	return b.String()
}
