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

type tasksDataMsg struct {
	Tasks []api.Task
	Err   error
}

type tasksPage struct {
	width, height int
	client        *api.ConvexClient
	workspaceID   string
	projectID     string
	tasks         []api.Task
	cursor        int
	loading       bool
}

func NewTasksPage(client *api.ConvexClient, workspaceID, projectID string) PageModel {
	return &tasksPage{client: client, workspaceID: workspaceID, projectID: projectID, loading: true}
}

func (p *tasksPage) Init() tea.Cmd {
	if p.client == nil {
		return nil
	}
	return p.fetchTasks()
}

func (p *tasksPage) fetchTasks() tea.Cmd {
	return func() tea.Msg {
		raw, err := p.client.Query("tasks/queries:getMyTasks", map[string]interface{}{})
		if err != nil {
			return tasksDataMsg{Err: err}
		}
		var tasks []api.Task
		json.Unmarshal(raw, &tasks)
		return tasksDataMsg{Tasks: tasks}
	}
}

func (p *tasksPage) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tasksDataMsg:
		p.tasks = msg.Tasks
		p.loading = false
	case tea.KeyMsg:
		switch msg.String() {
		case "j", "down":
			if p.cursor < len(p.tasks)-1 {
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

func (p *tasksPage) SetSize(w, h int) {
	p.width = w
	p.height = h
}

func (p *tasksPage) ShortHelp() string {
	return "j/k navigate  c create  e edit  x delete"
}

func (p *tasksPage) KeyBinds() []string {
	return []string{"j", "k", "up", "down", "c", "e", "x"}
}

func (p *tasksPage) View() string {
	if p.client == nil {
		return components.EmptyState("Not connected", p.width, p.height)
	}
	if p.loading {
		return components.EmptyState("Loading tasks...", p.width, p.height)
	}

	var b strings.Builder

	header := theme.SectionHeader.Render("TASKS")
	count := theme.TextMutedStyle.Render(fmt.Sprintf("(%d)", len(p.tasks)))
	b.WriteString(header + " " + count + "\n\n")

	if len(p.tasks) == 0 {
		b.WriteString(components.EmptyState("No tasks yet. Press c to create one.", p.width, p.height-4))
		return b.String()
	}

	visible := p.height - 4
	if visible < 1 {
		visible = 1
	}

	start := 0
	if p.cursor >= visible {
		start = p.cursor - visible + 1
	}

	for i := start; i < len(p.tasks) && i < start+visible; i++ {
		t := p.tasks[i]
		meta := components.StatusBadge(t.Status)
		if t.Priority != "" {
			meta += "  " + components.PriorityBadge(t.Priority)
		}
		b.WriteString(components.RenderListItem(t.Title, meta, i == p.cursor) + "\n")
	}

	return b.String()
}
