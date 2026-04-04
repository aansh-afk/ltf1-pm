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

		raw, err := p.client.Query("tasks/queries:getProjectTasks", map[string]interface{}{"projectId": p.projectID})
		if err == nil {
			json.Unmarshal(raw, &data.Tasks)
		}

		raw, err = p.client.Query("sprints/queries:getCurrentSprint", map[string]interface{}{"projectId": p.projectID})
		if err == nil && string(raw) != "null" {
			var sprint api.Sprint
			if json.Unmarshal(raw, &sprint) == nil {
				data.Sprint = &sprint
			}
		}

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
	return components.KeyHints(components.KeyHint("r", "refresh"))
}

func (p *dashboardPage) KeyBinds() []string {
	return nil
}

func (p *dashboardPage) HasModal() bool { return false }

func (p *dashboardPage) View() string {
	if p.client == nil {
		return components.EmptyState("Not connected. Run ltf auth login first.", p.width, p.height)
	}
	if p.loading {
		return components.EmptyState("Loading dashboard...", p.width, p.height)
	}

	contentW := p.width - 2
	if contentW < 20 {
		contentW = 20
	}

	var b strings.Builder
	b.WriteString("\n")

	// ── ACTIVE SPRINT (bordered) ──────────────────────
	sprintContent := p.renderSprintContent()
	b.WriteString(components.BorderedSection("ACTIVE SPRINT", sprintContent, contentW))
	b.WriteString("\n\n")

	// ── MY TASKS + WORKSPACE STATS (60/40 bordered split) ──
	leftW := int(float64(contentW) * 0.6)
	rightW := contentW - leftW - 3 // 3 for gap

	tasksContent := p.renderTasksContent(leftW - 4)
	taskCount := len(p.data.Tasks)
	tasksBox := components.BorderedSection(fmt.Sprintf("MY TASKS (%d)", taskCount), tasksContent, leftW)

	statsContent := p.renderStatsContent(rightW - 4)
	statsBox := components.BorderedSection("WORKSPACE STATS", statsContent, rightW)

	// Join side by side
	b.WriteString(lipgloss.JoinHorizontal(lipgloss.Top, tasksBox, "   ", statsBox))
	b.WriteString("\n\n")

	// ── AGENT ACTIVITY (bordered) ──────────────────────
	activityContent := p.renderActivityContent(contentW - 4)
	b.WriteString(components.BorderedSection("AGENT ACTIVITY", activityContent, contentW))

	return b.String()
}

func (p *dashboardPage) renderSprintContent() string {
	if p.data.Sprint == nil {
		return theme.TextMutedStyle.Render(theme.SymDotEmpty + " No active sprint")
	}

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

	var lines []string
	barW := p.width - 16
	if barW < 20 {
		barW = 20
	}
	lines = append(lines, components.ProgressBar(pct, barW, theme.Cyan))
	return strings.Join(lines, "\n")
}

func (p *dashboardPage) renderTasksContent(innerW int) string {
	if len(p.data.Tasks) == 0 {
		return theme.TextMutedStyle.Render(theme.SymDotEmpty + " No tasks found")
	}

	var lines []string
	limit := 8
	if len(p.data.Tasks) < limit {
		limit = len(p.data.Tasks)
	}
	for i := 0; i < limit; i++ {
		t := p.data.Tasks[i]
		dot := components.StatusDot(t.Status)
		title := theme.TextPrimaryStyle.Render(t.Title)
		lines = append(lines, dot+" "+title)
	}
	return strings.Join(lines, "\n")
}

func (p *dashboardPage) renderStatsContent(innerW int) string {
	total := len(p.data.Tasks)
	done := 0
	inProgress := 0
	blocked := 0
	for _, t := range p.data.Tasks {
		switch strings.ToLower(t.Status) {
		case "done", "completed":
			done++
		case "in_progress", "in progress", "active":
			inProgress++
		case "blocked":
			blocked++
		}
	}

	labelW := 14
	label := lipgloss.NewStyle().Foreground(theme.TextMuted).Width(labelW)
	val := lipgloss.NewStyle().Foreground(theme.TextPrimary).Bold(true)

	var lines []string
	lines = append(lines, label.Render("Total Tasks:")+val.Render(fmt.Sprintf("%d", total)))
	lines = append(lines, label.Render("Completed:")+val.Render(fmt.Sprintf("%d", done)))
	lines = append(lines, label.Render("In Progress:")+val.Render(fmt.Sprintf("%d", inProgress)))
	lines = append(lines, label.Render("Blocked:")+val.Render(fmt.Sprintf("%d", blocked)))
	return strings.Join(lines, "\n")
}

func (p *dashboardPage) renderActivityContent(innerW int) string {
	if len(p.data.Activity) == 0 {
		return theme.TextMutedStyle.Render(theme.SymDotEmpty + " No recent activity")
	}

	var lines []string
	limit := 5
	if len(p.data.Activity) < limit {
		limit = len(p.data.Activity)
	}
	for i := 0; i < limit; i++ {
		a := p.data.Activity[i]
		dot := theme.WarningTextStyle.Render(theme.SymDot)
		desc := theme.TextSecondaryStyle.Render(a.Description)
		timestamp := theme.TextMutedStyle.Render(a.Type)

		// Right-align timestamp
		line := dot + " " + desc
		visW := lipgloss.Width(line)
		tsW := lipgloss.Width(timestamp)
		gap := innerW - visW - tsW
		if gap < 2 {
			gap = 2
		}
		lines = append(lines, line+strings.Repeat(" ", gap)+timestamp)
	}
	return strings.Join(lines, "\n")
}
