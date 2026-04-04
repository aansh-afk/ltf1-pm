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

type sprintDataMsg struct {
	Sprint *api.Sprint
	Tasks  []api.Task
	Err    error
}

type sprintPage struct {
	width, height int
	client        *api.ConvexClient
	workspaceID   string
	projectID     string
	sprint        *api.Sprint
	tasks         []api.Task
	loading       bool
}

func NewSprintPage(client *api.ConvexClient, workspaceID, projectID string) PageModel {
	return &sprintPage{client: client, workspaceID: workspaceID, projectID: projectID, loading: true}
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

		raw, err := p.client.Query("sprints/queries:getCurrentSprint", map[string]interface{}{"projectId": p.projectID})
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
	return components.KeyHints(components.KeyHint("r", "refresh"))
}

func (p *sprintPage) KeyBinds() []string {
	return nil
}

func (p *sprintPage) HasModal() bool { return false }

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

	contentW := p.width - 2
	if contentW < 20 {
		contentW = 20
	}

	var b strings.Builder
	b.WriteString("\n")

	// Sprint header
	b.WriteString("  " + theme.BrandTextStyle.Render(p.sprint.Name) + "\n")
	if p.sprint.Status != "" {
		b.WriteString("  " + theme.TextMutedStyle.Render(p.sprint.Status) + "\n")
	}
	b.WriteString("\n")

	// Filter tasks for this sprint
	var sprintTasks []api.Task
	for _, t := range p.tasks {
		if t.SprintID == p.sprint.ID {
			sprintTasks = append(sprintTasks, t)
		}
	}

	// Progress bar
	total := len(sprintTasks)
	done := 0
	for _, t := range sprintTasks {
		if strings.ToLower(t.Status) == "done" || strings.ToLower(t.Status) == "completed" {
			done++
		}
	}
	pct := 0.0
	if total > 0 {
		pct = float64(done) / float64(total) * 100
	}

	barW := contentW - 10
	if barW < 20 {
		barW = 20
	}
	b.WriteString("  " + components.ProgressBar(pct, barW, theme.Cyan) + "\n")
	b.WriteString("\n\n")

	// Kanban columns
	groups := []struct {
		label  string
		status []string
	}{
		{"TODO", []string{"todo", "backlog", "pending"}},
		{"IN PROGRESS", []string{"in_progress", "in progress", "active"}},
		{"DONE", []string{"done", "completed"}},
	}

	// Build column contents
	colW := (contentW - 6) / 3 // 6 for gaps between 3 columns
	if colW < 15 {
		colW = 15
	}

	var columns []string
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

		// Build column content
		var colContent string
		if len(groupTasks) == 0 {
			colContent = theme.TextMutedStyle.Render(theme.SymDotEmpty + " Empty")
		} else {
			var lines []string
			for _, t := range groupTasks {
				prefix := "  "
				if g.label == "DONE" {
					prefix = theme.SuccessTextStyle.Render(theme.SymCheck) + " "
				}
				lines = append(lines, prefix+theme.TextPrimaryStyle.Render(t.Title))
			}
			colContent = strings.Join(lines, "\n")
		}

		header := fmt.Sprintf("%s (%d)", g.label, len(groupTasks))
		col := components.BorderedSection(header, colContent, colW)
		columns = append(columns, col)
	}

	b.WriteString(lipgloss.JoinHorizontal(lipgloss.Top, columns[0], "  ", columns[1], "  ", columns[2]))

	return b.String()
}
