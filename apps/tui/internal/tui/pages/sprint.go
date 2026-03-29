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

type sprintDataMsg struct {
	Sprint *api.Sprint
	Tasks  []api.Task
	Err    error
}

type sprintPage struct {
	width, height int
	client        *api.ConvexClient
	sprint        *api.Sprint
	tasks         []api.Task
	loading       bool
}

func NewSprintPage(client *api.ConvexClient) PageModel {
	return &sprintPage{client: client, loading: true}
}

func (p *sprintPage) Init() tea.Cmd {
	if p.client == nil {
		return nil
	}
	return p.fetchData()
}

func (p *sprintPage) fetchData() tea.Cmd {
	return func() tea.Msg {
		var data sprintDataMsg

		raw, err := p.client.Query("sprints:getActive", nil)
		if err == nil && string(raw) != "null" {
			var sprint api.Sprint
			if json.Unmarshal(raw, &sprint) == nil {
				data.Sprint = &sprint
			}
		}

		raw, err = p.client.Query("tasks:list", nil)
		if err == nil {
			json.Unmarshal(raw, &data.Tasks)
		}

		return data
	}
}

func (p *sprintPage) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case sprintDataMsg:
		p.sprint = msg.Sprint
		p.tasks = msg.Tasks
		p.loading = false
	}
	return p, nil
}

func (p *sprintPage) SetSize(w, h int) {
	p.width = w
	p.height = h
}

func (p *sprintPage) ShortHelp() string {
	return "r refresh"
}

func (p *sprintPage) View() string {
	if p.client == nil {
		return components.EmptyState("Not connected", p.width, p.height)
	}
	if p.loading {
		return components.EmptyState("Loading sprint...", p.width, p.height)
	}
	if p.sprint == nil {
		return components.EmptyState("No active sprint", p.width, p.height)
	}

	var b strings.Builder

	// Sprint header
	b.WriteString(theme.SectionHeader.Render("SPRINT") + "\n")
	nameStyle := lipgloss.NewStyle().Foreground(theme.TextPrimary).Bold(true)
	b.WriteString(nameStyle.Render(p.sprint.Name) + "\n")

	statusStyle := lipgloss.NewStyle().Foreground(theme.Amber)
	b.WriteString(statusStyle.Render(p.sprint.Status) + "\n\n")

	// Filter tasks for this sprint
	var sprintTasks []api.Task
	for _, t := range p.tasks {
		if t.SprintID == p.sprint.ID {
			sprintTasks = append(sprintTasks, t)
		}
	}

	// Progress bars
	total := len(sprintTasks)
	done := 0
	totalPoints := 0.0
	donePoints := 0.0
	for _, t := range sprintTasks {
		if t.Status == "done" || t.Status == "completed" {
			done++
			donePoints += t.Estimate
		}
		totalPoints += t.Estimate
	}

	taskPct := 0.0
	if total > 0 {
		taskPct = float64(done) / float64(total) * 100
	}
	pointsPct := 0.0
	if totalPoints > 0 {
		pointsPct = donePoints / totalPoints * 100
	}

	b.WriteString(theme.TextSecondaryStyle.Render("Tasks") + "\n")
	b.WriteString(components.ProgressBar(taskPct, 40, theme.Indigo) + "\n")
	b.WriteString(theme.TextSecondaryStyle.Render("Points") + "\n")
	b.WriteString(components.ProgressBar(pointsPct, 40, theme.Green) + "\n\n")

	// Tasks grouped by status
	groups := []struct {
		label  string
		status []string
	}{
		{"TODO", []string{"todo", "backlog", "pending"}},
		{"IN PROGRESS", []string{"in_progress", "in progress", "active"}},
		{"DONE", []string{"done", "completed"}},
	}

	for _, g := range groups {
		statusSet := make(map[string]bool)
		for _, s := range g.status {
			statusSet[s] = true
		}

		var groupTasks []api.Task
		for _, t := range sprintTasks {
			if statusSet[strings.ToLower(t.Status)] {
				groupTasks = append(groupTasks, t)
			}
		}

		if len(groupTasks) == 0 {
			continue
		}

		sectionStyle := lipgloss.NewStyle().Foreground(theme.Indigo).Bold(true)
		b.WriteString(sectionStyle.Render(g.label) + "\n")
		for _, t := range groupTasks {
			b.WriteString(components.RenderListItem(t.Title, components.PriorityBadge(t.Priority), false) + "\n")
		}
		b.WriteString("\n")
	}

	return b.String()
}
