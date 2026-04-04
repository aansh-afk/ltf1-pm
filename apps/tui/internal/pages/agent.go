package pages

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/theme"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
)

// --- messages ---

type triageQueueMsg struct {
	items []api.TriageSuggestion
	tasks map[string]api.Task
}

type triageStatsMsg struct {
	pending      int
	accepted     float64
	autoApplied  int
}

type agentActivityMsg struct {
	activities []api.AgentActivity
}

type agentErrMsg struct {
	err error
}

type triageActionDoneMsg struct {
	id     string
	action string
}

// --- model ---

// AgentModel is the inbox-zero triage page with amber accent.
type AgentModel struct {
	queue      []api.TriageSuggestion
	tasks      map[string]api.Task // taskID -> Task for display
	stats      triageStatsMsg
	activities []api.AgentActivity
	cursor     int
	width      int
	height     int
	loading    bool
	err        error
	client     *api.ConvexClient
	focusPanel int // 0=queue, 1=activity
}

func NewAgentModel(client *api.ConvexClient) *AgentModel {
	return &AgentModel{
		tasks:   make(map[string]api.Task),
		loading: true,
		client:  client,
	}
}

// --- PageModel interface ---

func (m *AgentModel) Init() tea.Cmd {
	return tea.Batch(m.loadQueue(), m.loadStats(), m.loadActivity())
}

func (m *AgentModel) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil

	case triageQueueMsg:
		m.queue = msg.items
		m.tasks = msg.tasks
		m.loading = false
		if m.cursor >= len(m.queue) && len(m.queue) > 0 {
			m.cursor = len(m.queue) - 1
		}
		return m, nil

	case triageStatsMsg:
		m.stats = msg
		return m, nil

	case agentActivityMsg:
		m.activities = msg.activities
		return m, nil

	case agentErrMsg:
		m.err = msg.err
		m.loading = false
		return m, nil

	case triageActionDoneMsg:
		// Reload queue and stats after action
		return m, tea.Batch(m.loadQueue(), m.loadStats(), m.loadActivity())

	case tea.KeyMsg:
		if m.loading {
			return m, nil
		}
		switch msg.String() {
		case "j", "down":
			if m.focusPanel == 0 && m.cursor < len(m.queue)-1 {
				m.cursor++
			}
		case "k", "up":
			if m.focusPanel == 0 && m.cursor > 0 {
				m.cursor--
			}
		case "tab":
			m.focusPanel = (m.focusPanel + 1) % 2
		case "a":
			if len(m.queue) > 0 && m.cursor < len(m.queue) {
				return m, m.acceptSuggestion(m.queue[m.cursor].ID)
			}
		case "r":
			if len(m.queue) > 0 && m.cursor < len(m.queue) {
				return m, m.rejectSuggestion(m.queue[m.cursor].ID)
			}
		case "R":
			m.loading = true
			m.err = nil
			return m, tea.Batch(m.loadQueue(), m.loadStats(), m.loadActivity())
		}
	}

	return m, nil
}

func (m *AgentModel) View(width, height int) string {
	m.width = width
	m.height = height

	amber := lipgloss.NewStyle().Foreground(theme.AmberColor).Bold(true)
	muted := lipgloss.NewStyle().Foreground(theme.TextMuted)
	secondary := lipgloss.NewStyle().Foreground(theme.TextSecondary)

	if m.loading {
		return amber.Render("AGENT") + "\n\n" +
			secondary.Render("  Loading triage queue...")
	}

	if m.err != nil {
		return amber.Render("AGENT") + "\n\n" +
			theme.ErrorStyle.Render("  Error: "+m.err.Error()) + "\n" +
			muted.Render("  Press R to retry")
	}

	contentWidth := width - 4
	if contentWidth < 50 {
		contentWidth = 60
	}

	var b strings.Builder

	// Header
	b.WriteString(amber.Render("AGENT"))
	b.WriteString("  ")
	b.WriteString(muted.Render("inbox-zero triage"))
	b.WriteString("\n\n")

	// Stats panel
	b.WriteString(m.viewStats(contentWidth))
	b.WriteString("\n\n")

	// Triage queue
	b.WriteString(m.viewQueue(contentWidth))
	b.WriteString("\n\n")

	// Recent activity
	b.WriteString(m.viewActivity(contentWidth))

	return b.String()
}

func (m *AgentModel) SetSize(width, height int) {
	m.width = width
	m.height = height
}

func (m *AgentModel) ShortHelp() string {
	return "j/k: navigate | a: accept | r: reject | tab: focus | R: refresh"
}

// --- view helpers ---

func (m *AgentModel) viewStats(contentWidth int) string {
	amber := lipgloss.NewStyle().Foreground(theme.AmberColor)
	amberBold := amber.Bold(true)

	statsBox := theme.LeftBorderPanel(theme.AmberColor).Width(contentWidth)

	pendingLabel := lipgloss.NewStyle().Foreground(theme.TextMuted).Render("Pending: ")
	pendingVal := amberBold.Render(fmt.Sprintf("%d", m.stats.pending))

	acceptLabel := lipgloss.NewStyle().Foreground(theme.TextMuted).Render("Accepted: ")
	acceptVal := theme.SuccessStyle.Render(fmt.Sprintf("%.0f%%", m.stats.accepted*100))

	autoLabel := lipgloss.NewStyle().Foreground(theme.TextMuted).Render("Auto-applied: ")
	autoVal := lipgloss.NewStyle().Foreground(theme.CyanColor).Render(fmt.Sprintf("%d", m.stats.autoApplied))

	header := lipgloss.NewStyle().Foreground(theme.AmberColor).Bold(true).Render("TRIAGE STATS")
	content := fmt.Sprintf("%s\n  %s%s     %s%s     %s%s",
		header, pendingLabel, pendingVal, acceptLabel, acceptVal, autoLabel, autoVal)

	return statsBox.Render(content)
}

func (m *AgentModel) viewQueue(contentWidth int) string {
	var box lipgloss.Style
	if m.focusPanel == 0 {
		box = theme.LeftBorderPanel(theme.AmberColor).Width(contentWidth)
	} else {
		box = theme.SubtlePanel.Width(contentWidth)
	}

	header := lipgloss.NewStyle().Foreground(theme.AmberColor).Bold(true).
		Render(fmt.Sprintf("TRIAGE QUEUE (%d)", len(m.queue)))

	if len(m.queue) == 0 {
		empty := lipgloss.NewStyle().Foreground(theme.TextMuted).Render("  No items — inbox zero!")
		return box.Render(header + "\n" + empty)
	}

	var rows strings.Builder
	rows.WriteString(header)
	rows.WriteString("\n")

	maxItems := 8
	if maxItems > len(m.queue) {
		maxItems = len(m.queue)
	}

	for i := 0; i < maxItems; i++ {
		item := m.queue[i]
		task := m.tasks[item.TaskID]

		cursor := "  "
		bolt := lipgloss.NewStyle().Foreground(theme.TextMuted).Render("\u25c7") // ◇
		if i == m.cursor {
			cursor = lipgloss.NewStyle().Foreground(theme.AmberColor).Render("> ")
			bolt = lipgloss.NewStyle().Foreground(theme.AmberColor).Render("\u26a1") // ⚡
		}

		title := lipgloss.NewStyle().Foreground(theme.TextColor).Render(truncate(task.Title, 45))

		// Detail line
		typeStr := item.SuggestedType
		if typeStr == "" {
			typeStr = "task"
		}
		priorityStr := item.SuggestedPriority
		if priorityStr == "" {
			priorityStr = "medium"
		}

		typeStyle := lipgloss.NewStyle().Foreground(theme.CyanColor)
		priorityStyle := theme.PriorityStyle(priorityStr)
		confStyle := lipgloss.NewStyle().Foreground(theme.TextMuted)

		confPct := fmt.Sprintf("%.0f%%", item.Confidence*100)

		detail := fmt.Sprintf("      \u2192 %s | %s | confidence: %s",
			typeStyle.Render(typeStr),
			priorityStyle.Render(priorityStr),
			confStyle.Render(confPct))

		rows.WriteString(fmt.Sprintf("%s%s %s\n", cursor, bolt, title))
		rows.WriteString(detail)
		if i < maxItems-1 {
			rows.WriteString("\n")
		}
	}

	if len(m.queue) > maxItems {
		rows.WriteString("\n")
		more := lipgloss.NewStyle().Foreground(theme.TextMuted).
			Render(fmt.Sprintf("  ... and %d more", len(m.queue)-maxItems))
		rows.WriteString(more)
	}

	return box.Render(rows.String())
}

func (m *AgentModel) viewActivity(contentWidth int) string {
	var box lipgloss.Style
	if m.focusPanel == 1 {
		box = theme.LeftBorderPanel(theme.AmberColor).Width(contentWidth)
	} else {
		box = theme.SubtlePanel.Width(contentWidth)
	}

	header := lipgloss.NewStyle().Foreground(theme.AmberColor).Bold(true).
		Render("RECENT ACTIVITY")

	if len(m.activities) == 0 {
		empty := lipgloss.NewStyle().Foreground(theme.TextMuted).Render("  No recent activity")
		return box.Render(header + "\n" + empty)
	}

	var rows strings.Builder
	rows.WriteString(header)
	rows.WriteString("\n")

	maxItems := 5
	if maxItems > len(m.activities) {
		maxItems = len(m.activities)
	}

	for i := 0; i < maxItems; i++ {
		act := m.activities[i]

		icon := lipgloss.NewStyle().Foreground(theme.GreenColor).Render("\u2713") // ✓
		if act.Type == "skill_run" {
			icon = lipgloss.NewStyle().Foreground(theme.PurpleColor).Render("\u25c6") // ◆
		}

		desc := lipgloss.NewStyle().Foreground(theme.TextSecondary).Render(truncate(act.Description, 45))
		ago := lipgloss.NewStyle().Foreground(theme.TextMuted).Render(timeAgo(act.CreatedAt))

		row := fmt.Sprintf("  %s %s  %s", icon, desc, ago)
		rows.WriteString(row)
		if i < maxItems-1 {
			rows.WriteString("\n")
		}
	}

	return box.Render(rows.String())
}

// --- commands ---

func (m *AgentModel) loadQueue() tea.Cmd {
	return func() tea.Msg {
		if m.client == nil {
			return triageQueueMsg{items: sampleTriageQueue(), tasks: sampleTriageTasks()}
		}

		raw, err := m.client.Query("agent/queries:getTriageQueue", nil)
		if err != nil {
			return agentErrMsg{err: err}
		}

		var items []api.TriageSuggestion
		if err := json.Unmarshal(raw, &items); err != nil {
			return agentErrMsg{err: fmt.Errorf("parse queue: %w", err)}
		}

		// Load task details for each suggestion
		tasks := make(map[string]api.Task)
		for _, item := range items {
			if item.TaskID == "" {
				continue
			}
			taskRaw, err := m.client.Query("tasks/queries:getTask", map[string]interface{}{
				"taskId": item.TaskID,
			})
			if err == nil {
				var task api.Task
				if json.Unmarshal(taskRaw, &task) == nil {
					tasks[item.TaskID] = task
				}
			}
		}

		return triageQueueMsg{items: items, tasks: tasks}
	}
}

func (m *AgentModel) loadStats() tea.Cmd {
	return func() tea.Msg {
		if m.client == nil {
			return triageStatsMsg{pending: 3, accepted: 0.87, autoApplied: 12}
		}

		raw, err := m.client.Query("agent/queries:getTriageStats", nil)
		if err != nil {
			return triageStatsMsg{pending: 0, accepted: 0, autoApplied: 0}
		}

		var stats struct {
			Pending     int     `json:"pending"`
			Accepted    float64 `json:"acceptanceRate"`
			AutoApplied int     `json:"autoApplied"`
		}
		if err := json.Unmarshal(raw, &stats); err != nil {
			return triageStatsMsg{}
		}

		return triageStatsMsg{
			pending:     stats.Pending,
			accepted:    stats.Accepted,
			autoApplied: stats.AutoApplied,
		}
	}
}

func (m *AgentModel) loadActivity() tea.Cmd {
	return func() tea.Msg {
		if m.client == nil {
			return agentActivityMsg{activities: sampleAgentActivity()}
		}

		raw, err := m.client.Query("agent/queries:getAgentActivityFeed", nil)
		if err != nil {
			return agentActivityMsg{activities: nil}
		}

		var activities []api.AgentActivity
		if err := json.Unmarshal(raw, &activities); err != nil {
			return agentActivityMsg{activities: nil}
		}

		return agentActivityMsg{activities: activities}
	}
}

func (m *AgentModel) acceptSuggestion(id string) tea.Cmd {
	return func() tea.Msg {
		if m.client == nil {
			return triageActionDoneMsg{id: id, action: "accepted"}
		}
		_, err := m.client.Mutation("agent/triageMutations:acceptTriageSuggestion", map[string]interface{}{
			"suggestionId": id,
		})
		if err != nil {
			return agentErrMsg{err: err}
		}
		return triageActionDoneMsg{id: id, action: "accepted"}
	}
}

func (m *AgentModel) rejectSuggestion(id string) tea.Cmd {
	return func() tea.Msg {
		if m.client == nil {
			return triageActionDoneMsg{id: id, action: "rejected"}
		}
		_, err := m.client.Mutation("agent/triageMutations:rejectTriageSuggestion", map[string]interface{}{
			"suggestionId": id,
		})
		if err != nil {
			return agentErrMsg{err: err}
		}
		return triageActionDoneMsg{id: id, action: "rejected"}
	}
}

// --- sample data ---

func sampleTriageQueue() []api.TriageSuggestion {
	return []api.TriageSuggestion{
		{ID: "s1", TaskID: "t1", SuggestedType: "bug", SuggestedPriority: "high", Confidence: 0.92, Status: "pending"},
		{ID: "s2", TaskID: "t2", SuggestedType: "feature", SuggestedPriority: "medium", Confidence: 0.78, Status: "pending"},
		{ID: "s3", TaskID: "t3", SuggestedType: "chore", SuggestedPriority: "low", Confidence: 0.65, Status: "pending"},
	}
}

func sampleTriageTasks() map[string]api.Task {
	return map[string]api.Task{
		"t1": {ID: "t1", Title: "Fix login timeout bug", Status: "backlog"},
		"t2": {ID: "t2", Title: "Add dark mode toggle", Status: "backlog"},
		"t3": {ID: "t3", Title: "Update CI pipeline config", Status: "backlog"},
	}
}

func sampleAgentActivity() []api.AgentActivity {
	now := float64(time.Now().UnixMilli())
	return []api.AgentActivity{
		{ID: "a1", CreatedAt: now - 300000, Type: "triage", Description: "Triaged PROJ-44 \u2192 bug, high, @mike"},
		{ID: "a2", CreatedAt: now - 3600000, Type: "skill_run", Description: "Ran \"deploy-checklist\" \u2192 5 tasks"},
		{ID: "a3", CreatedAt: now - 7200000, Type: "triage", Description: "Triaged PROJ-41 \u2192 feature, medium"},
	}
}

// --- helpers ---

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max-1] + "\u2026"
}

func timeAgo(createdAtMs float64) string {
	created := time.UnixMilli(int64(createdAtMs))
	d := time.Since(created)

	switch {
	case d < time.Minute:
		return "just now"
	case d < time.Hour:
		return fmt.Sprintf("%dm ago", int(d.Minutes()))
	case d < 24*time.Hour:
		return fmt.Sprintf("%dh ago", int(d.Hours()))
	default:
		return fmt.Sprintf("%dd ago", int(d.Hours()/24))
	}
}
