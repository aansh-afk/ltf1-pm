package pages

import (
	"encoding/json"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/theme"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
)

// --- messages ---

type sprintDataMsg struct {
	sprint     *api.Sprint
	tasks      []api.Task
	backlog    []api.Task
	totalPts   float64
	donePts    float64
}

type sprintErrMsg struct{ err error }

type sprintTaskAddedMsg struct{}

// --- model ---

type sprintView int

const (
	sprintViewMain sprintView = iota
	sprintViewBacklog
)

// SprintModel shows sprint progress and task management.
type SprintModel struct {
	width  int
	height int

	loading bool
	err     error
	client  *api.ConvexClient

	sprint   *api.Sprint
	tasks    []api.Task
	backlog  []api.Task
	totalPts float64
	donePts  float64

	cursor       int
	scrollOffset int
	view         sprintView

	// backlog view
	backlogCursor int
	backlogScroll int
}

// NewSprintModel creates a new sprint page.
func NewSprintModel(client *api.ConvexClient) *SprintModel {
	return &SprintModel{
		loading: true,
		client:  client,
	}
}

func (m *SprintModel) Init() tea.Cmd {
	return m.loadSprint()
}

func (m *SprintModel) SetSize(width, height int) {
	m.width = width
	m.height = height
}

func (m *SprintModel) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil

	case sprintDataMsg:
		m.loading = false
		m.sprint = msg.sprint
		m.tasks = msg.tasks
		m.backlog = msg.backlog
		m.totalPts = msg.totalPts
		m.donePts = msg.donePts
		return m, nil

	case sprintErrMsg:
		m.loading = false
		m.err = msg.err
		return m, nil

	case sprintTaskAddedMsg:
		m.loading = true
		return m, m.loadSprint()

	case tea.KeyPressMsg:
		if m.loading {
			return m, nil
		}
		return m.handleKey(tea.Key(msg))
	}
	return m, nil
}

func (m *SprintModel) handleKey(key tea.Key) (PageModel, tea.Cmd) {
	if m.view == sprintViewBacklog {
		return m.handleBacklogKey(key)
	}

	switch key.Code {
	case 'j', tea.KeyDown:
		if m.cursor < len(m.tasks)-1 {
			m.cursor++
			m.ensureTaskVisible()
		}
	case 'k', tea.KeyUp:
		if m.cursor > 0 {
			m.cursor--
			m.ensureTaskVisible()
		}
	case 'b':
		m.view = sprintViewBacklog
		m.backlogCursor = 0
		m.backlogScroll = 0
	case 'r':
		m.loading = true
		m.err = nil
		return m, m.loadSprint()
	}

	return m, nil
}

func (m *SprintModel) handleBacklogKey(key tea.Key) (PageModel, tea.Cmd) {
	switch key.Code {
	case 'j', tea.KeyDown:
		if m.backlogCursor < len(m.backlog)-1 {
			m.backlogCursor++
			m.ensureBacklogVisible()
		}
	case 'k', tea.KeyUp:
		if m.backlogCursor > 0 {
			m.backlogCursor--
			m.ensureBacklogVisible()
		}
	case 'a':
		if m.backlogCursor < len(m.backlog) && m.sprint != nil {
			task := m.backlog[m.backlogCursor]
			return m, m.addToSprint(task.ID)
		}
	case tea.KeyEscape, 'q', 'b':
		m.view = sprintViewMain
	}
	return m, nil
}

func (m *SprintModel) View(width, height int) string {
	headerStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(theme.AccentColor).
		PaddingBottom(1)

	if m.loading && m.sprint == nil {
		return headerStyle.Render("SPRINT") + "\n\n" +
			lipgloss.NewStyle().Foreground(theme.TextSecondary).Render("  Loading sprint data...")
	}

	if m.err != nil {
		return headerStyle.Render("SPRINT") + "\n\n" +
			lipgloss.NewStyle().Foreground(theme.RedColor).Render("  Error: "+m.err.Error()) + "\n" +
			lipgloss.NewStyle().Foreground(theme.TextMuted).Render("  Press r to retry")
	}

	contentWidth := m.width - 4
	if contentWidth < 60 {
		contentWidth = 60
	}

	var b strings.Builder
	b.WriteString(headerStyle.Render("SPRINT"))
	b.WriteString("\n")

	if m.sprint == nil {
		panel := theme.SubtlePanel.Width(contentWidth)
		b.WriteString(panel.Render(
			lipgloss.NewStyle().Foreground(theme.TextMuted).Render("  No active sprint"),
		))
		return b.String()
	}

	// ── SPRINT OVERVIEW ──
	b.WriteString(m.renderOverview(contentWidth))
	b.WriteString("\n")

	// ── SPRINT TASKS or BACKLOG ──
	if m.view == sprintViewBacklog {
		b.WriteString(m.renderBacklog(contentWidth))
	} else {
		b.WriteString(m.renderSprintTasks(contentWidth))
	}

	// footer
	b.WriteString("\n\n")
	b.WriteString(m.renderHints())

	return b.String()
}

func (m *SprintModel) ShortHelp() string {
	if m.view == sprintViewBacklog {
		return "j/k: navigate | a: add to sprint | esc: back | r: refresh"
	}
	return "j/k: navigate | b: backlog | r: refresh"
}

func (m *SprintModel) FullHelp() string {
	return m.ShortHelp()
}

// --- render helpers ---

func (m *SprintModel) renderOverview(width int) string {
	boxStyle := theme.ActivePanel.Width(width)

	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(theme.AccentColor)
	label := lipgloss.NewStyle().Foreground(theme.TextMuted)

	sp := m.sprint

	// date formatting
	startT := time.Unix(int64(sp.StartDate), 0)
	endT := time.Unix(int64(sp.EndDate), 0)
	startStr := startT.Format("Jan 2")
	endStr := endT.Format("Jan 2")
	dLeft := daysUntil(sp.EndDate)

	// task progress
	taskPct := 0
	doneCount := 0
	for _, t := range m.tasks {
		if t.Status == "done" {
			doneCount++
		}
	}
	if len(m.tasks) > 0 {
		taskPct = int(math.Round(float64(doneCount) * 100 / float64(len(m.tasks))))
	}

	// point progress
	ptsPct := 0
	if m.totalPts > 0 {
		ptsPct = int(math.Round(m.donePts * 100 / m.totalPts))
	}

	barWidth := width - 36
	if barWidth < 10 {
		barWidth = 10
	}

	var content strings.Builder
	content.WriteString(titleStyle.Render("CURRENT SPRINT"))
	content.WriteString("\n")
	content.WriteString(fmt.Sprintf("  %s\n",
		lipgloss.NewStyle().Bold(true).Foreground(theme.TextColor).Render(sp.Name),
	))
	content.WriteString(fmt.Sprintf("  %s \u2192 %s (%s left)\n",
		label.Render(startStr),
		label.Render(endStr),
		lipgloss.NewStyle().Foreground(theme.AmberColor).Render(dLeft),
	))
	content.WriteString(fmt.Sprintf("  %s  %s %d%%  (%d/%d done)\n",
		label.Render("Tasks:"),
		progressBar(taskPct, barWidth),
		taskPct,
		doneCount, len(m.tasks),
	))
	if m.totalPts > 0 {
		content.WriteString(fmt.Sprintf("  %s  %s %d%%  (%.0f/%.0f pts)",
			label.Render("Points:"),
			progressBar(ptsPct, barWidth),
			ptsPct,
			m.donePts, m.totalPts,
		))
	}

	return boxStyle.Render(content.String())
}

func (m *SprintModel) renderSprintTasks(width int) string {
	boxStyle := theme.SubtlePanel.Width(width)

	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(theme.AccentColor)

	var content strings.Builder
	content.WriteString(titleStyle.Render(fmt.Sprintf("SPRINT TASKS (%d)", len(m.tasks))))
	content.WriteString("\n")

	if len(m.tasks) == 0 {
		content.WriteString(lipgloss.NewStyle().Foreground(theme.TextMuted).Render("  No tasks in sprint"))
		return boxStyle.Render(content.String())
	}

	visibleCount := m.height - 18
	if visibleCount < 5 {
		visibleCount = 10
	}

	start := m.scrollOffset
	end := start + visibleCount
	if end > len(m.tasks) {
		end = len(m.tasks)
	}

	for i := start; i < end; i++ {
		t := m.tasks[i]
		cursor := "  "
		if i == m.cursor {
			cursor = lipgloss.NewStyle().Foreground(theme.AccentColor).Render("> ")
		}

		icon := statusIcon(t.Status)
		pri := priorityTag(t.Priority)

		titleW := width - 24
		if titleW < 10 {
			titleW = 10
		}
		title := truncate(t.Title, titleW)

		titleSt := lipgloss.NewStyle().Foreground(theme.TextColor)
		if i == m.cursor {
			titleSt = titleSt.Bold(true)
		}

		content.WriteString(fmt.Sprintf("%s%s %s  %s\n", cursor, icon, titleSt.Width(titleW).Render(title), pri))
	}

	return boxStyle.Render(strings.TrimRight(content.String(), "\n"))
}

func (m *SprintModel) renderBacklog(width int) string {
	boxStyle := theme.LeftBorderPanel(theme.PurpleColor).Width(width)

	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(theme.PurpleColor)

	var content strings.Builder
	content.WriteString(titleStyle.Render(fmt.Sprintf("BACKLOG (%d)", len(m.backlog))))
	content.WriteString("\n")

	if len(m.backlog) == 0 {
		content.WriteString(lipgloss.NewStyle().Foreground(theme.TextMuted).Render("  No tasks in backlog"))
		return boxStyle.Render(content.String())
	}

	visibleCount := m.height - 18
	if visibleCount < 5 {
		visibleCount = 10
	}

	start := m.backlogScroll
	end := start + visibleCount
	if end > len(m.backlog) {
		end = len(m.backlog)
	}

	for i := start; i < end; i++ {
		t := m.backlog[i]
		cursor := "  "
		if i == m.backlogCursor {
			cursor = lipgloss.NewStyle().Foreground(theme.PurpleColor).Render("> ")
		}

		icon := statusIcon(t.Status)
		pri := priorityTag(t.Priority)
		typeBadge := taskTypeBadge(t.Type)

		titleW := width - 30
		if titleW < 10 {
			titleW = 10
		}
		title := truncate(t.Title, titleW)

		titleSt := lipgloss.NewStyle().Foreground(theme.TextColor)
		if i == m.backlogCursor {
			titleSt = titleSt.Bold(true)
		}

		content.WriteString(fmt.Sprintf("%s%s %s  %s  %s\n", cursor, icon, titleSt.Width(titleW).Render(title), pri, typeBadge))
	}

	return boxStyle.Render(strings.TrimRight(content.String(), "\n"))
}

func (m *SprintModel) renderHints() string {
	hintStyle := lipgloss.NewStyle().Foreground(theme.TextMuted)
	keyStyle := lipgloss.NewStyle().Foreground(theme.AccentColor)

	var b strings.Builder
	b.WriteString("  ")
	b.WriteString(keyStyle.Render("j/k"))
	b.WriteString(hintStyle.Render(" navigate  "))

	if m.view == sprintViewBacklog {
		b.WriteString(keyStyle.Render("a"))
		b.WriteString(hintStyle.Render(" add to sprint  "))
		b.WriteString(keyStyle.Render("esc"))
		b.WriteString(hintStyle.Render(" back  "))
	} else {
		b.WriteString(keyStyle.Render("b"))
		b.WriteString(hintStyle.Render(" backlog  "))
	}

	b.WriteString(keyStyle.Render("r"))
	b.WriteString(hintStyle.Render(" refresh"))

	return b.String()
}

// --- scroll helpers ---

func (m *SprintModel) ensureTaskVisible() {
	visibleCount := m.height - 18
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

func (m *SprintModel) ensureBacklogVisible() {
	visibleCount := m.height - 18
	if visibleCount < 5 {
		visibleCount = 10
	}
	if m.backlogCursor < m.backlogScroll {
		m.backlogScroll = m.backlogCursor
	}
	if m.backlogCursor >= m.backlogScroll+visibleCount {
		m.backlogScroll = m.backlogCursor - visibleCount + 1
	}
}

// --- data fetching ---

func (m *SprintModel) loadSprint() tea.Cmd {
	return func() tea.Msg {
		if m.client == nil {
			return sampleSprintData()
		}

		var sprint *api.Sprint
		var tasks []api.Task
		var backlog []api.Task
		var totalPts, donePts float64

		// Fetch active sprint
		if raw, err := m.client.Query("sprints/queries:getCurrentSprint", nil); err == nil {
			var sp api.Sprint
			if json.Unmarshal(raw, &sp) == nil && sp.ID != "" {
				sprint = &sp
			}
		}

		if sprint == nil {
			return sprintDataMsg{}
		}

		// Fetch sprint tasks
		if raw, err := m.client.Query("tasks/queries:getProjectTasks", map[string]interface{}{"sprintId": sprint.ID}); err == nil {
			_ = json.Unmarshal(raw, &tasks)
		}

		// Calculate points
		for _, t := range tasks {
			totalPts += t.Estimate
			if t.Status == "done" {
				donePts += t.Estimate
			}
		}

		// Fetch backlog (tasks not in any sprint)
		if raw, err := m.client.Query("sprints/queries:getBacklogTasks", nil); err == nil {
			_ = json.Unmarshal(raw, &backlog)
		}

		return sprintDataMsg{
			sprint:   sprint,
			tasks:    tasks,
			backlog:  backlog,
			totalPts: totalPts,
			donePts:  donePts,
		}
	}
}

func (m *SprintModel) addToSprint(taskID string) tea.Cmd {
	return func() tea.Msg {
		if m.client == nil || m.sprint == nil {
			return sprintTaskAddedMsg{}
		}
		_, err := m.client.Mutation("tasks/mutations:updateTask", map[string]interface{}{
			"taskId":   taskID,
			"sprintId": m.sprint.ID,
		})
		if err != nil {
			return sprintErrMsg{err: err}
		}
		return sprintTaskAddedMsg{}
	}
}

// --- sample data ---

func sampleSprintData() sprintDataMsg {
	now := time.Now()
	return sprintDataMsg{
		sprint: &api.Sprint{
			ID:        "sp1",
			Name:      "Sprint 3: Ship Auth",
			Status:    "active",
			StartDate: float64(now.AddDate(0, 0, -10).Unix()),
			EndDate:   float64(now.AddDate(0, 0, 4).Unix()),
		},
		tasks: []api.Task{
			{ID: "101", Title: "Implement auth flow", Status: "in_progress", Priority: "high", Estimate: 8},
			{ID: "102", Title: "Review PR #45", Status: "in_review", Priority: "medium", Estimate: 3},
			{ID: "103", Title: "Fix header layout", Status: "done", Priority: "high", Estimate: 5},
			{ID: "104", Title: "Add CSRF protection", Status: "done", Priority: "urgent", Estimate: 5},
			{ID: "105", Title: "Write auth tests", Status: "todo", Priority: "medium", Estimate: 5},
			{ID: "106", Title: "Update login UI", Status: "done", Priority: "high", Estimate: 8},
			{ID: "107", Title: "OAuth integration", Status: "in_progress", Priority: "high", Estimate: 8},
			{ID: "108", Title: "Session management", Status: "todo", Priority: "medium", Estimate: 5},
			{ID: "109", Title: "Password reset flow", Status: "backlog", Priority: "low", Estimate: 3},
		},
		backlog: []api.Task{
			{ID: "201", Title: "Design onboarding wizard", Status: "backlog", Priority: "medium", Type: "feature"},
			{ID: "202", Title: "Add dark mode toggle", Status: "backlog", Priority: "low", Type: "feature"},
			{ID: "203", Title: "Optimize bundle size", Status: "backlog", Priority: "high", Type: "improvement"},
			{ID: "204", Title: "Update API docs", Status: "backlog", Priority: "low", Type: "task"},
		},
		totalPts: 50,
		donePts:  26,
	}
}
