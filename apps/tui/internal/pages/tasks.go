package pages

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/theme"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
)

// --- filter state ---

type statusFilter int

const (
	statusAll statusFilter = iota
	statusBacklog
	statusTodo
	statusInProgress
	statusInReview
	statusDone
	statusCancelled
	statusFilterCount // sentinel
)

func (s statusFilter) String() string {
	switch s {
	case statusAll:
		return "All"
	case statusBacklog:
		return "Backlog"
	case statusTodo:
		return "Todo"
	case statusInProgress:
		return "In Progress"
	case statusInReview:
		return "In Review"
	case statusDone:
		return "Done"
	case statusCancelled:
		return "Cancelled"
	default:
		return "All"
	}
}

func (s statusFilter) matches(status string) bool {
	switch s {
	case statusAll:
		return true
	case statusBacklog:
		return status == "backlog"
	case statusTodo:
		return status == "todo"
	case statusInProgress:
		return status == "in_progress"
	case statusInReview:
		return status == "in_review"
	case statusDone:
		return status == "done"
	case statusCancelled:
		return status == "cancelled"
	default:
		return true
	}
}

type priorityFilter int

const (
	priorityAll priorityFilter = iota
	priorityUrgent
	priorityHigh
	priorityMedium
	priorityLow
	priorityFilterCount // sentinel
)

func (p priorityFilter) String() string {
	switch p {
	case priorityAll:
		return "All"
	case priorityUrgent:
		return "Urgent"
	case priorityHigh:
		return "High"
	case priorityMedium:
		return "Medium"
	case priorityLow:
		return "Low"
	default:
		return "All"
	}
}

func (p priorityFilter) matches(priority string) bool {
	switch p {
	case priorityAll:
		return true
	case priorityUrgent:
		return priority == "urgent"
	case priorityHigh:
		return priority == "high"
	case priorityMedium:
		return priority == "medium"
	case priorityLow:
		return priority == "low"
	default:
		return true
	}
}

// --- messages ---

type tasksLoadedMsg struct {
	tasks []api.Task
}

type tasksErrMsg struct {
	err error
}

type taskStatusChangedMsg struct{}
type taskDeletedMsg struct{}

// --- view modes ---

type tasksViewMode int

const (
	tasksList tasksViewMode = iota
	tasksDetail
	tasksStatusPicker
	tasksDeleteConfirm
)

// --- model ---

// TasksModel is the full task management page.
type TasksModel struct {
	width  int
	height int

	loading bool
	err     error
	client  *api.ConvexClient

	allTasks     []api.Task
	filtered     []api.Task
	cursor       int
	scrollOffset int

	statusF   statusFilter
	priorityF priorityFilter
	myTasks   bool

	viewMode tasksViewMode

	// status picker
	statusCursor int
}

// NewTasksModel creates a new tasks page.
func NewTasksModel(client *api.ConvexClient) *TasksModel {
	return &TasksModel{
		loading: true,
		client:  client,
	}
}

func (m *TasksModel) Init() tea.Cmd {
	return m.loadTasks()
}

func (m *TasksModel) SetSize(width, height int) {
	m.width = width
	m.height = height
}

func (m *TasksModel) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil

	case tasksLoadedMsg:
		m.loading = false
		m.allTasks = msg.tasks
		m.applyFilters()
		return m, nil

	case tasksErrMsg:
		m.loading = false
		m.err = msg.err
		return m, nil

	case taskStatusChangedMsg, taskDeletedMsg:
		m.loading = true
		return m, m.loadTasks()

	case tea.KeyPressMsg:
		if m.loading {
			return m, nil
		}
		return m.handleKey(tea.Key(msg))
	}
	return m, nil
}

func (m *TasksModel) handleKey(key tea.Key) (PageModel, tea.Cmd) {
	// mode-specific handling
	switch m.viewMode {
	case tasksStatusPicker:
		return m.handleStatusPicker(key)
	case tasksDeleteConfirm:
		return m.handleDeleteConfirm(key)
	case tasksDetail:
		if key.Code == tea.KeyEscape || key.Code == 'q' {
			m.viewMode = tasksList
		}
		return m, nil
	}

	// list mode
	switch key.Code {
	case 'j', tea.KeyDown:
		if m.cursor < len(m.filtered)-1 {
			m.cursor++
			m.ensureVisible()
		}
	case 'k', tea.KeyUp:
		if m.cursor > 0 {
			m.cursor--
			m.ensureVisible()
		}
	case tea.KeyTab:
		if key.Mod.Contains(tea.ModShift) {
			m.priorityF = (m.priorityF + 1) % priorityFilterCount
			m.applyFilters()
		} else {
			m.statusF = (m.statusF + 1) % statusFilterCount
			m.applyFilters()
		}
	case 'm':
		m.myTasks = !m.myTasks
		m.applyFilters()
	case tea.KeyEnter:
		if len(m.filtered) > 0 {
			m.viewMode = tasksDetail
		}
	case 's':
		if len(m.filtered) > 0 {
			m.viewMode = tasksStatusPicker
			m.statusCursor = 0
		}
	case 'd':
		if len(m.filtered) > 0 {
			m.viewMode = tasksDeleteConfirm
		}
	case 'r':
		m.loading = true
		m.err = nil
		return m, m.loadTasks()
	}

	return m, nil
}

func (m *TasksModel) handleStatusPicker(key tea.Key) (PageModel, tea.Cmd) {
	statuses := []string{"backlog", "todo", "in_progress", "in_review", "done", "cancelled"}
	switch key.Code {
	case 'j', tea.KeyDown:
		if m.statusCursor < len(statuses)-1 {
			m.statusCursor++
		}
	case 'k', tea.KeyUp:
		if m.statusCursor > 0 {
			m.statusCursor--
		}
	case tea.KeyEnter:
		if m.cursor < len(m.filtered) {
			task := m.filtered[m.cursor]
			newStatus := statuses[m.statusCursor]
			m.viewMode = tasksList
			return m, m.changeStatus(task.ID, newStatus)
		}
	case tea.KeyEscape, 'q':
		m.viewMode = tasksList
	}
	return m, nil
}

func (m *TasksModel) handleDeleteConfirm(key tea.Key) (PageModel, tea.Cmd) {
	switch key.Code {
	case 'y':
		if m.cursor < len(m.filtered) {
			task := m.filtered[m.cursor]
			m.viewMode = tasksList
			return m, m.deleteTask(task.ID)
		}
	case 'n', tea.KeyEscape, 'q':
		m.viewMode = tasksList
	}
	return m, nil
}

func (m *TasksModel) View(width, height int) string {
	headerStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(theme.AccentColor).
		PaddingBottom(1)

	if m.loading && len(m.allTasks) == 0 {
		return headerStyle.Render("TASKS") + "\n\n" +
			lipgloss.NewStyle().Foreground(theme.TextSecondary).Render("  Loading tasks...")
	}

	if m.err != nil {
		return headerStyle.Render("TASKS") + "\n\n" +
			lipgloss.NewStyle().Foreground(theme.RedColor).Render("  Error: "+m.err.Error()) + "\n" +
			lipgloss.NewStyle().Foreground(theme.TextMuted).Render("  Press r to retry")
	}

	contentWidth := m.width - 4
	if contentWidth < 60 {
		contentWidth = 60
	}

	var b strings.Builder
	b.WriteString(headerStyle.Render("TASKS"))
	b.WriteString("\n")

	// ── FILTER BAR ──
	b.WriteString(m.renderFilters(contentWidth))
	b.WriteString("\n")

	// ── TASK LIST / DETAIL / STATUS PICKER ──
	switch m.viewMode {
	case tasksDetail:
		b.WriteString(m.renderDetail(contentWidth))
	case tasksStatusPicker:
		b.WriteString(m.renderTaskList(contentWidth))
		b.WriteString("\n")
		b.WriteString(m.renderStatusPicker(contentWidth))
	case tasksDeleteConfirm:
		b.WriteString(m.renderTaskList(contentWidth))
		b.WriteString("\n")
		b.WriteString(m.renderDeleteConfirm())
	default:
		b.WriteString(m.renderTaskList(contentWidth))
	}

	// footer
	b.WriteString("\n\n")
	b.WriteString(m.renderHints())

	return b.String()
}

func (m *TasksModel) ShortHelp() string {
	return "j/k: navigate | tab/shift+tab: filter | enter: detail | s: status | d: delete | r: refresh"
}

func (m *TasksModel) FullHelp() string {
	return m.ShortHelp()
}

// --- render helpers ---

func (m *TasksModel) renderFilters(width int) string {
	boxStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(theme.BorderColor).
		Padding(0, 1).
		Width(width)

	label := lipgloss.NewStyle().Foreground(theme.TextMuted)
	active := lipgloss.NewStyle().Foreground(theme.AccentColor).Bold(true)

	myDot := lipgloss.NewStyle().Foreground(theme.TextMuted).Render("\u25cb") // ○
	if m.myTasks {
		myDot = lipgloss.NewStyle().Foreground(theme.GreenColor).Render("\u25cf") // ●
	}

	content := fmt.Sprintf("  %s [%s]   %s [%s]   [My Tasks: %s]",
		label.Render("Status:"),
		active.Render(m.statusF.String()),
		label.Render("Priority:"),
		active.Render(m.priorityF.String()),
		myDot,
	)

	return boxStyle.Render(content)
}

func (m *TasksModel) renderTaskList(width int) string {
	boxStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(theme.BorderColor).
		Padding(0, 1).
		Width(width)

	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(theme.AccentColor)

	var content strings.Builder
	content.WriteString(titleStyle.Render(fmt.Sprintf("TASKS (%d)", len(m.filtered))))
	content.WriteString("\n")

	if len(m.filtered) == 0 {
		content.WriteString(lipgloss.NewStyle().Foreground(theme.TextMuted).Render("  No tasks match filters"))
		return boxStyle.Render(content.String())
	}

	// calculate visible window
	visibleCount := m.height - 16
	if visibleCount < 5 {
		visibleCount = 10
	}

	start := m.scrollOffset
	end := start + visibleCount
	if end > len(m.filtered) {
		end = len(m.filtered)
	}

	for i := start; i < end; i++ {
		t := m.filtered[i]
		cursor := "  "
		if i == m.cursor {
			cursor = lipgloss.NewStyle().Foreground(theme.AccentColor).Render("> ")
		}

		icon := statusIcon(t.Status)
		pri := priorityTag(t.Priority)
		typeBadge := taskTypeBadge(t.Type)

		titleW := width - 28
		if titleW < 10 {
			titleW = 10
		}
		title := truncate(t.Title, titleW)

		titleStyle := lipgloss.NewStyle().Foreground(theme.TextColor)
		if i == m.cursor {
			titleStyle = titleStyle.Bold(true)
		}

		content.WriteString(fmt.Sprintf("%s%s %s  %s  %s\n",
			cursor,
			icon,
			titleStyle.Width(titleW).Render(title),
			pri,
			typeBadge,
		))
	}

	return boxStyle.Render(strings.TrimRight(content.String(), "\n"))
}

func (m *TasksModel) renderDetail(width int) string {
	if m.cursor >= len(m.filtered) {
		return ""
	}
	t := m.filtered[m.cursor]

	boxStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(theme.AccentColor).
		Padding(0, 1).
		Width(width)

	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(theme.TextColor)
	label := lipgloss.NewStyle().Foreground(theme.TextMuted).Width(14)
	val := lipgloss.NewStyle().Foreground(theme.TextColor)

	var content strings.Builder
	content.WriteString(titleStyle.Render(t.Title))
	content.WriteString("\n\n")
	content.WriteString(fmt.Sprintf("  %s %s\n", label.Render("Status:"), theme.StatusStyle(t.Status).Render(t.Status)))
	content.WriteString(fmt.Sprintf("  %s %s\n", label.Render("Priority:"), theme.PriorityStyle(t.Priority).Render(t.Priority)))
	content.WriteString(fmt.Sprintf("  %s %s\n", label.Render("Type:"), val.Render(t.Type)))

	if t.Description != "" {
		content.WriteString(fmt.Sprintf("\n  %s\n", label.Render("Description:")))
		content.WriteString(fmt.Sprintf("  %s\n", lipgloss.NewStyle().Foreground(theme.TextSecondary).Render(t.Description)))
	}

	if len(t.Labels) > 0 {
		content.WriteString(fmt.Sprintf("  %s %s\n", label.Render("Labels:"), val.Render(strings.Join(t.Labels, ", "))))
	}

	content.WriteString(fmt.Sprintf("\n  %s",
		lipgloss.NewStyle().Foreground(theme.TextMuted).Render("Press esc to go back")))

	return boxStyle.Render(content.String())
}

func (m *TasksModel) renderStatusPicker(width int) string {
	boxStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(theme.AmberColor).
		Padding(0, 1).
		Width(40)

	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(theme.AmberColor)

	statuses := []string{"backlog", "todo", "in_progress", "in_review", "done", "cancelled"}

	var content strings.Builder
	content.WriteString(titleStyle.Render("SET STATUS"))
	content.WriteString("\n")

	for i, s := range statuses {
		cursor := "  "
		if i == m.statusCursor {
			cursor = lipgloss.NewStyle().Foreground(theme.AccentColor).Render("> ")
		}
		icon := statusIcon(s)
		label := theme.StatusStyle(s).Render(s)
		content.WriteString(fmt.Sprintf("%s%s %s\n", cursor, icon, label))
	}

	content.WriteString(lipgloss.NewStyle().Foreground(theme.TextMuted).Render("\n  enter: select  esc: cancel"))

	return boxStyle.Render(content.String())
}

func (m *TasksModel) renderDeleteConfirm() string {
	style := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(theme.RedColor).
		Padding(0, 1).
		Width(40)

	warn := lipgloss.NewStyle().Bold(true).Foreground(theme.RedColor)
	hint := lipgloss.NewStyle().Foreground(theme.TextMuted)

	return style.Render(
		warn.Render("Delete this task?") + "\n" +
			hint.Render("  y: yes  n: no"),
	)
}

func (m *TasksModel) renderHints() string {
	hintStyle := lipgloss.NewStyle().Foreground(theme.TextMuted)
	keyStyle := lipgloss.NewStyle().Foreground(theme.AccentColor)

	var b strings.Builder
	b.WriteString("  ")
	b.WriteString(keyStyle.Render("j/k"))
	b.WriteString(hintStyle.Render(" navigate  "))
	b.WriteString(keyStyle.Render("tab"))
	b.WriteString(hintStyle.Render(" status filter  "))
	b.WriteString(keyStyle.Render("shift+tab"))
	b.WriteString(hintStyle.Render(" priority  "))
	b.WriteString(keyStyle.Render("m"))
	b.WriteString(hintStyle.Render(" my tasks  "))
	b.WriteString(keyStyle.Render("s"))
	b.WriteString(hintStyle.Render(" status  "))
	b.WriteString(keyStyle.Render("d"))
	b.WriteString(hintStyle.Render(" delete  "))
	b.WriteString(keyStyle.Render("r"))
	b.WriteString(hintStyle.Render(" refresh"))

	return b.String()
}

// --- filter logic ---

func (m *TasksModel) applyFilters() {
	m.filtered = nil
	for _, t := range m.allTasks {
		if !m.statusF.matches(t.Status) {
			continue
		}
		if !m.priorityF.matches(t.Priority) {
			continue
		}
		// myTasks filter: skip if no assignees (simplified — real impl would check current user)
		if m.myTasks && len(t.AssigneeIDs) == 0 {
			continue
		}
		m.filtered = append(m.filtered, t)
	}
	if m.cursor >= len(m.filtered) {
		m.cursor = 0
	}
	m.scrollOffset = 0
}

func (m *TasksModel) ensureVisible() {
	visibleCount := m.height - 16
	if visibleCount < 5 {
		visibleCount = 10
	}
	if m.cursor < m.scrollOffset {
		m.scrollOffset = m.cursor
	}
	if m.cursor >= m.scrollOffset+visibleCount {
		m.scrollOffset = m.cursor - visibleCount + 1
	}
}

// --- data fetching ---

func (m *TasksModel) loadTasks() tea.Cmd {
	return func() tea.Msg {
		if m.client == nil {
			return tasksLoadedMsg{tasks: sampleTasksFull()}
		}

		raw, err := m.client.Query("tasks/queries:getProjectTasks", nil)
		if err != nil {
			return tasksErrMsg{err: err}
		}
		var tasks []api.Task
		if err := json.Unmarshal(raw, &tasks); err != nil {
			return tasksErrMsg{err: err}
		}
		return tasksLoadedMsg{tasks: tasks}
	}
}

func (m *TasksModel) changeStatus(taskID, status string) tea.Cmd {
	return func() tea.Msg {
		if m.client == nil {
			return taskStatusChangedMsg{}
		}
		_, err := m.client.Mutation("tasks/mutations:updateTask", map[string]interface{}{
			"taskId": taskID,
			"status": status,
		})
		if err != nil {
			return tasksErrMsg{err: err}
		}
		return taskStatusChangedMsg{}
	}
}

func (m *TasksModel) deleteTask(taskID string) tea.Cmd {
	return func() tea.Msg {
		if m.client == nil {
			return taskDeletedMsg{}
		}
		_, err := m.client.Mutation("tasks/mutations:deleteTask", map[string]interface{}{
			"taskId": taskID,
		})
		if err != nil {
			return tasksErrMsg{err: err}
		}
		return taskDeletedMsg{}
	}
}

// --- helpers ---

func taskTypeBadge(t string) string {
	switch t {
	case "bug":
		return lipgloss.NewStyle().Foreground(theme.RedColor).Render("bug")
	case "feature":
		return lipgloss.NewStyle().Foreground(theme.CyanColor).Render("feature")
	case "improvement":
		return lipgloss.NewStyle().Foreground(theme.PurpleColor).Render("improve")
	case "epic":
		return lipgloss.NewStyle().Foreground(theme.AmberColor).Render("epic")
	default:
		return lipgloss.NewStyle().Foreground(theme.TextMuted).Render("task")
	}
}

// --- sample data ---

func sampleTasksFull() []api.Task {
	return []api.Task{
		{ID: "101", Title: "Implement auth flow", Status: "in_progress", Priority: "high", Type: "feature", AssigneeIDs: []string{"u1"}},
		{ID: "102", Title: "Review PR #45", Status: "in_review", Priority: "medium", Type: "task", AssigneeIDs: []string{"u1"}},
		{ID: "103", Title: "Add input validation", Status: "todo", Priority: "low", Type: "improvement"},
		{ID: "104", Title: "Write unit tests", Status: "todo", Priority: "medium", Type: "task", AssigneeIDs: []string{"u1"}},
		{ID: "105", Title: "Fix header layout", Status: "done", Priority: "high", Type: "bug", AssigneeIDs: []string{"u2"}},
		{ID: "106", Title: "Design onboarding wizard", Status: "backlog", Priority: "medium", Type: "feature"},
		{ID: "107", Title: "Optimize bundle size", Status: "todo", Priority: "high", Type: "improvement", AssigneeIDs: []string{"u1"}},
		{ID: "108", Title: "Add dark mode toggle", Status: "backlog", Priority: "low", Type: "feature"},
		{ID: "109", Title: "Fix mobile nav overflow", Status: "in_progress", Priority: "urgent", Type: "bug", AssigneeIDs: []string{"u1"}},
		{ID: "110", Title: "Update API docs", Status: "todo", Priority: "low", Type: "task"},
	}
}
