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

// Internal messages
type tasksDataMsg struct {
	Tasks []api.Task
	Err   error
}

type taskCreatedMsg struct{ Err error }
type taskDeletedMsg struct{ Err error }
type taskUpdatedMsg struct{ Err error }

// Modal modes
type taskModalMode int

const (
	taskModalNone taskModalMode = iota
	taskModalDetail
	taskModalCreate
	taskModalDelete
)

type tasksPage struct {
	width, height int
	client        *api.ConvexClient
	workspaceID   string
	projectID     string
	tasks         []api.Task
	cursor        int
	loading       bool

	// Modal state
	modalMode  taskModalMode
	createInput components.InputModel

	// For status cycling
	statusCycle []string
}

var defaultStatusCycle = []string{"todo", "in_progress", "done"}

func NewTasksPage(client *api.ConvexClient, workspaceID, projectID string) PageModel {
	input := components.NewInput("Task title...")
	return &tasksPage{
		client:      client,
		workspaceID: workspaceID,
		projectID:   projectID,
		loading:     true,
		createInput: input,
		statusCycle: defaultStatusCycle,
	}
}

func (p *tasksPage) Init() tea.Cmd {
	if p.client == nil {
		return nil
	}
	return p.fetchTasks()
}

func (p *tasksPage) fetchTasks() tea.Cmd {
	return func() tea.Msg {
		raw, err := p.client.Query("tasks/queries:getProjectTasks", map[string]interface{}{
			"projectId": p.projectID,
		})
		if err != nil {
			return tasksDataMsg{Err: err}
		}
		var tasks []api.Task
		json.Unmarshal(raw, &tasks)
		return tasksDataMsg{Tasks: tasks}
	}
}

func (p *tasksPage) createTask(title string) tea.Cmd {
	client := p.client
	projectID := p.projectID
	return func() tea.Msg {
		if client == nil {
			return taskCreatedMsg{Err: fmt.Errorf("not connected")}
		}
		_, err := client.Mutation("tasks/mutations:createTask", map[string]interface{}{
			"projectId": projectID,
			"title":     title,
			"type":      "task",
		})
		return taskCreatedMsg{Err: err}
	}
}

func (p *tasksPage) deleteTask(taskID string) tea.Cmd {
	client := p.client
	return func() tea.Msg {
		if client == nil {
			return taskDeletedMsg{Err: fmt.Errorf("not connected")}
		}
		_, err := client.Mutation("tasks/mutations:deleteTask", map[string]interface{}{
			"taskId": taskID,
		})
		return taskDeletedMsg{Err: err}
	}
}

func (p *tasksPage) updateTaskStatus(taskID, status string) tea.Cmd {
	client := p.client
	return func() tea.Msg {
		if client == nil {
			return taskUpdatedMsg{Err: fmt.Errorf("not connected")}
		}
		_, err := client.Mutation("tasks/mutations:updateTask", map[string]interface{}{
			"taskId": taskID,
			"status": status,
		})
		return taskUpdatedMsg{Err: err}
	}
}

func (p *tasksPage) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case tasksDataMsg:
		if msg.Err != nil {
			return p, func() tea.Msg {
				return ShowToastMsg{Message: "Failed to load tasks: " + msg.Err.Error(), IsError: true}
			}
		}
		p.tasks = msg.Tasks
		p.loading = false

	case taskCreatedMsg:
		p.modalMode = taskModalNone
		if msg.Err != nil {
			return p, func() tea.Msg {
				return ShowToastMsg{Message: "Failed to create task: " + msg.Err.Error(), IsError: true}
			}
		}
		return p, tea.Batch(
			p.fetchTasks(),
			func() tea.Msg { return ShowToastMsg{Message: "Task created"} },
		)

	case taskDeletedMsg:
		p.modalMode = taskModalNone
		if msg.Err != nil {
			return p, func() tea.Msg {
				return ShowToastMsg{Message: "Failed to delete task: " + msg.Err.Error(), IsError: true}
			}
		}
		return p, tea.Batch(
			p.fetchTasks(),
			func() tea.Msg { return ShowToastMsg{Message: "Task deleted"} },
		)

	case taskUpdatedMsg:
		if msg.Err != nil {
			return p, func() tea.Msg {
				return ShowToastMsg{Message: "Failed to update task: " + msg.Err.Error(), IsError: true}
			}
		}
		return p, tea.Batch(
			p.fetchTasks(),
			func() tea.Msg { return ShowToastMsg{Message: "Status updated"} },
		)

	case tea.KeyMsg:
		return p.handleKey(msg)
	}

	// Forward to input if creating
	if p.modalMode == taskModalCreate {
		var cmd tea.Cmd
		p.createInput, cmd = p.createInput.Update(msg)
		if cmd != nil {
			cmds = append(cmds, cmd)
		}
	}

	return p, tea.Batch(cmds...)
}

func (p *tasksPage) handleKey(msg tea.KeyMsg) (PageModel, tea.Cmd) {
	key := msg.String()

	// Handle modals first
	switch p.modalMode {
	case taskModalCreate:
		switch key {
		case "enter":
			title := strings.TrimSpace(p.createInput.Value())
			if title == "" {
				return p, nil
			}
			p.createInput.SetValue("")
			return p, p.createTask(title)
		case "esc":
			p.modalMode = taskModalNone
			p.createInput.Blur()
			p.createInput.SetValue("")
			return p, nil
		default:
			var cmd tea.Cmd
			p.createInput, cmd = p.createInput.Update(msg)
			return p, cmd
		}

	case taskModalDetail:
		switch key {
		case "esc", "q":
			p.modalMode = taskModalNone
			return p, nil
		case "e":
			// Could open edit modal - for now just close
			p.modalMode = taskModalNone
			return p, nil
		case "x":
			p.modalMode = taskModalDelete
			return p, nil
		case "m", " ":
			// Toggle status from detail view
			if p.cursor >= 0 && p.cursor < len(p.tasks) {
				t := p.tasks[p.cursor]
				newStatus := p.nextStatus(t.Status)
				p.modalMode = taskModalNone
				return p, p.updateTaskStatus(t.ID, newStatus)
			}
		}
		return p, nil

	case taskModalDelete:
		switch key {
		case "y", "enter":
			if p.cursor >= 0 && p.cursor < len(p.tasks) {
				t := p.tasks[p.cursor]
				return p, p.deleteTask(t.ID)
			}
			p.modalMode = taskModalNone
			return p, nil
		case "n", "esc":
			p.modalMode = taskModalNone
			return p, nil
		}
		return p, nil
	}

	// Normal mode keybinds
	switch key {
	case "j", "down":
		if p.cursor < len(p.tasks)-1 {
			p.cursor++
		}
	case "k", "up":
		if p.cursor > 0 {
			p.cursor--
		}
	case "c":
		p.modalMode = taskModalCreate
		p.createInput.SetValue("")
		return p, p.createInput.Focus()
	case "enter":
		if len(p.tasks) > 0 {
			p.modalMode = taskModalDetail
		}
	case "x":
		if len(p.tasks) > 0 {
			p.modalMode = taskModalDelete
		}
	case " ":
		// Quick toggle status
		if p.cursor >= 0 && p.cursor < len(p.tasks) {
			t := p.tasks[p.cursor]
			newStatus := p.nextStatus(t.Status)
			return p, p.updateTaskStatus(t.ID, newStatus)
		}
	}
	return p, nil
}

func (p *tasksPage) nextStatus(current string) string {
	lower := strings.ToLower(current)
	for i, s := range p.statusCycle {
		if s == lower {
			return p.statusCycle[(i+1)%len(p.statusCycle)]
		}
	}
	return "todo"
}

func (p *tasksPage) SetSize(w, h int) {
	p.width = w
	p.height = h
}

func (p *tasksPage) ShortHelp() string {
	return components.KeyHints(
		components.KeyHint("c", "create"),
		components.KeyHint("enter", "open"),
		components.KeyHint("space", "toggle"),
		components.KeyHint("x", "delete"),
	)
}

func (p *tasksPage) KeyBinds() []string {
	return []string{"j", "k", "up", "down", "c", "e", "x", "enter", " "}
}

func (p *tasksPage) HasModal() bool { return p.modalMode != taskModalNone }

func (p *tasksPage) renderList() string {
	var b strings.Builder
	b.WriteString("\n")

	header := theme.SectionHeader.Render("TASKS")
	count := theme.TextMutedStyle.Render(fmt.Sprintf(" (%d)", len(p.tasks)))
	b.WriteString(header + count + "\n\n")

	b.WriteString(renderFilterBar() + "\n\n")

	if len(p.tasks) == 0 {
		b.WriteString(components.EmptyState("No tasks yet. Press [c] to create one.", p.width, p.height-8))
		return b.String()
	}

	visible := p.height - 10
	if visible < 1 {
		visible = 1
	}

	start := 0
	if p.cursor >= visible {
		start = p.cursor - visible + 1
	}

	for i := start; i < len(p.tasks) && i < start+visible; i++ {
		t := p.tasks[i]
		b.WriteString(components.RenderTaskRow(t.Title, t.Priority, t.Status, "", i == p.cursor, p.width-2) + "\n")
	}

	return b.String()
}

func (p *tasksPage) View() string {
	if p.client == nil {
		return components.EmptyState("Not connected", p.width, p.height)
	}
	if p.loading {
		return components.EmptyState("Loading tasks...", p.width, p.height)
	}

	bg := p.renderList()

	switch p.modalMode {
	case taskModalCreate:
		return p.viewCreateModal(bg)
	case taskModalDetail:
		return p.viewDetailModal(bg)
	case taskModalDelete:
		return p.viewDeleteModal(bg)
	}

	return bg
}

func (p *tasksPage) viewCreateModal(bg string) string {
	inputW := (p.width * 2 / 3) - 10
	if inputW < 30 {
		inputW = 30
	}
	if inputW > 70 {
		inputW = 70
	}
	p.createInput.SetWidth(inputW)

	var lines []string
	lines = append(lines, theme.BrandTextStyle.Render("CREATE TASK"))
	lines = append(lines, "")
	lines = append(lines, p.createInput.View())
	lines = append(lines, "")
	lines = append(lines, components.KeyHints(
		components.KeyHint("enter", "create"),
		components.KeyHint("esc", "cancel"),
	))

	return components.OverlayModal(bg, strings.Join(lines, "\n"), p.width, p.height, theme.Indigo)
}

func (p *tasksPage) viewDetailModal(bg string) string {
	if p.cursor < 0 || p.cursor >= len(p.tasks) {
		return bg
	}
	t := p.tasks[p.cursor]

	var lines []string
	lines = append(lines, theme.BrandTextStyle.Render(strings.ToUpper(t.Title)))

	statusLine := components.StatusBadge(t.Status)
	if t.Priority != "" {
		statusLine += theme.TextDimStyle.Render(" "+theme.SymBullet+" ") + components.PriorityBadgePlain(t.Priority)
	}
	lines = append(lines, statusLine)
	lines = append(lines, "")

	if t.Type != "" {
		lines = append(lines, theme.TextMutedStyle.Render("Type: ")+theme.TextPrimaryStyle.Render(t.Type))
	}
	if t.Estimate > 0 {
		lines = append(lines, theme.TextMutedStyle.Render("Estimate: ")+theme.TextPrimaryStyle.Render(fmt.Sprintf("%.0f pts", t.Estimate)))
	}

	if t.Description != "" {
		lines = append(lines, "")
		lines = append(lines, theme.TextSecondaryStyle.Render(t.Description))
	}

	lines = append(lines, "")
	lines = append(lines, components.KeyHints(
		components.KeyHint("space", "toggle status"),
		components.KeyHint("x", "delete"),
		components.KeyHint("esc", "close"),
	))

	return components.OverlayModal(bg, strings.Join(lines, "\n"), p.width, p.height, theme.BorderDefault)
}

func (p *tasksPage) viewDeleteModal(bg string) string {
	if p.cursor < 0 || p.cursor >= len(p.tasks) {
		return bg
	}
	t := p.tasks[p.cursor]

	var lines []string
	lines = append(lines, theme.BrandTextStyle.Render("DELETE TASK"))
	lines = append(lines, "")
	lines = append(lines, theme.TextSecondaryStyle.Render(fmt.Sprintf("%q will be permanently deleted.", t.Title)))
	lines = append(lines, "")
	lines = append(lines, components.KeyHints(
		components.KeyHint("y", "yes"),
		components.KeyHint("n", "no"),
	))

	return components.OverlayModal(bg, strings.Join(lines, "\n"), p.width, p.height, theme.Red)
}

func renderFilterBar() string {
	filters := []struct {
		label string
		value string
	}{
		{"Status", "All"},
		{"Priority", "All"},
		{"Assignee", "Me"},
	}

	var parts []string
	for _, f := range filters {
		label := theme.FilterLabelStyle.Render(f.label + ": ")
		value := theme.FilterValueStyle.Render(f.value)
		parts = append(parts, theme.TextDimStyle.Render("[")+label+value+theme.TextDimStyle.Render("]"))
	}
	return "  " + strings.Join(parts, "  ")
}
