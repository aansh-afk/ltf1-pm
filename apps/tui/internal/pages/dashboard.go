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

type dashDataMsg struct {
	tasks      []api.Task
	sprint     *api.Sprint
	sprintDone int
	sprintAll  int
	activities []api.AgentActivity
	projects   int
	members    int
	totalTasks int
}

type dashErrMsg struct{ err error }

type dashTickMsg struct{}

// --- model ---

// DashboardModel is the main landing page showing workspace overview.
type DashboardModel struct {
	width  int
	height int

	loading bool
	err     error
	client  *api.ConvexClient

	// data
	myTasks    []api.Task
	sprint     *api.Sprint
	sprintDone int
	sprintAll  int
	activities []api.AgentActivity
	projects   int
	members    int
	totalTasks int
}

// NewDashboardModel creates a new dashboard page.
func NewDashboardModel(client *api.ConvexClient) *DashboardModel {
	return &DashboardModel{
		loading: true,
		client:  client,
	}
}

func (m *DashboardModel) Init() tea.Cmd {
	return tea.Batch(m.loadData(), m.tickCmd())
}

func (m *DashboardModel) SetSize(width, height int) {
	m.width = width
	m.height = height
}

func (m *DashboardModel) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil

	case dashDataMsg:
		m.loading = false
		m.myTasks = msg.tasks
		m.sprint = msg.sprint
		m.sprintDone = msg.sprintDone
		m.sprintAll = msg.sprintAll
		m.activities = msg.activities
		m.projects = msg.projects
		m.members = msg.members
		m.totalTasks = msg.totalTasks
		return m, nil

	case dashErrMsg:
		m.loading = false
		m.err = msg.err
		return m, nil

	case dashTickMsg:
		return m, tea.Batch(m.loadData(), m.tickCmd())

	case tea.KeyPressMsg:
		switch tea.Key(msg).Code {
		case 'r':
			m.loading = true
			m.err = nil
			return m, m.loadData()
		}
	}
	return m, nil
}

func (m *DashboardModel) View(width, height int) string {
	headerStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(theme.AccentColor).
		PaddingBottom(1)

	if m.loading && m.sprint == nil {
		return headerStyle.Render("DASHBOARD") + "\n\n" +
			lipgloss.NewStyle().Foreground(theme.TextSecondary).Render("  Loading workspace data...")
	}

	if m.err != nil {
		return headerStyle.Render("DASHBOARD") + "\n\n" +
			lipgloss.NewStyle().Foreground(theme.RedColor).Render("  Error: "+m.err.Error()) + "\n" +
			lipgloss.NewStyle().Foreground(theme.TextMuted).Render("  Press r to retry")
	}

	contentWidth := m.width - 4
	if contentWidth < 60 {
		contentWidth = 60
	}

	var b strings.Builder
	b.WriteString(headerStyle.Render("DASHBOARD"))
	b.WriteString("\n")

	// ── ACTIVE SPRINT ──
	b.WriteString(m.renderSprint(contentWidth))
	b.WriteString("\n")

	// ── MY TASKS + WORKSPACE STATS (side by side) ──
	leftWidth := (contentWidth - 3) / 2
	rightWidth := contentWidth - leftWidth - 3

	tasksPanel := m.renderMyTasks(leftWidth)
	statsPanel := m.renderStats(rightWidth)

	b.WriteString(lipgloss.JoinHorizontal(lipgloss.Top, tasksPanel, "   ", statsPanel))
	b.WriteString("\n")

	// ── AGENT ACTIVITY ──
	b.WriteString(m.renderActivity(contentWidth))

	// footer
	b.WriteString("\n\n")
	hintStyle := lipgloss.NewStyle().Foreground(theme.TextMuted)
	keyStyle := lipgloss.NewStyle().Foreground(theme.AccentColor)
	b.WriteString("  ")
	b.WriteString(keyStyle.Render("r"))
	b.WriteString(hintStyle.Render(" refresh"))

	return b.String()
}

func (m *DashboardModel) ShortHelp() string {
	return "r: refresh"
}

func (m *DashboardModel) FullHelp() string {
	return m.ShortHelp()
}

// --- render helpers ---

func (m *DashboardModel) renderSprint(width int) string {
	boxStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(theme.BorderColor).
		Padding(0, 1).
		Width(width)

	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(theme.AccentColor)
	label := lipgloss.NewStyle().Foreground(theme.TextMuted)

	if m.sprint == nil {
		return boxStyle.Render(
			titleStyle.Render("ACTIVE SPRINT") + "\n" +
				label.Render("  No active sprint"),
		)
	}

	pct := 0
	if m.sprintAll > 0 {
		pct = int(math.Round(float64(m.sprintDone) * 100 / float64(m.sprintAll)))
	}

	bar := progressBar(pct, width-30)
	daysLeft := daysUntil(m.sprint.EndDate)

	var content strings.Builder
	content.WriteString(titleStyle.Render("ACTIVE SPRINT"))
	content.WriteString("\n")
	content.WriteString(fmt.Sprintf("  %s     %d/%d tasks     %s %d%%",
		lipgloss.NewStyle().Bold(true).Foreground(theme.TextColor).Render(m.sprint.Name),
		m.sprintDone, m.sprintAll,
		bar, pct,
	))
	content.WriteString("\n")
	content.WriteString(label.Render(fmt.Sprintf("  Ends in %s", daysLeft)))

	return boxStyle.Render(content.String())
}

func (m *DashboardModel) renderMyTasks(width int) string {
	boxStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(theme.BorderColor).
		Padding(0, 1).
		Width(width)

	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(theme.AccentColor)

	var content strings.Builder
	content.WriteString(titleStyle.Render("MY TASKS"))
	content.WriteString("\n")

	if len(m.myTasks) == 0 {
		content.WriteString(lipgloss.NewStyle().Foreground(theme.TextMuted).Render("  No tasks assigned"))
	}

	limit := 5
	if len(m.myTasks) < limit {
		limit = len(m.myTasks)
	}

	for i := 0; i < limit; i++ {
		t := m.myTasks[i]
		icon := statusIcon(t.Status)
		pri := priorityTag(t.Priority)
		titleW := width - 16
		if titleW < 10 {
			titleW = 10
		}
		title := truncate(t.Title, titleW)
		content.WriteString(fmt.Sprintf("  %s %s %s\n", icon, lipgloss.NewStyle().Foreground(theme.TextColor).Width(titleW).Render(title), pri))
	}

	return boxStyle.Render(strings.TrimRight(content.String(), "\n"))
}

func (m *DashboardModel) renderStats(width int) string {
	boxStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(theme.BorderColor).
		Padding(0, 1).
		Width(width)

	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(theme.AccentColor)
	label := lipgloss.NewStyle().Foreground(theme.TextMuted).Width(14)
	val := lipgloss.NewStyle().Foreground(theme.TextColor)

	var content strings.Builder
	content.WriteString(titleStyle.Render("WORKSPACE STATS"))
	content.WriteString("\n")
	content.WriteString(fmt.Sprintf("  %s %s\n", label.Render("Projects:"), val.Render(fmt.Sprintf("%d", m.projects))))
	content.WriteString(fmt.Sprintf("  %s %s\n", label.Render("Members:"), val.Render(fmt.Sprintf("%d", m.members))))
	content.WriteString(fmt.Sprintf("  %s %s", label.Render("Tasks:"), val.Render(fmt.Sprintf("%d", m.totalTasks))))

	return boxStyle.Render(content.String())
}

func (m *DashboardModel) renderActivity(width int) string {
	boxStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(theme.BorderColor).
		Padding(0, 1).
		Width(width)

	titleStyle := lipgloss.NewStyle().Bold(true).Foreground(theme.AmberColor)

	var content strings.Builder
	content.WriteString(titleStyle.Render("AGENT ACTIVITY"))
	content.WriteString("\n")

	if len(m.activities) == 0 {
		content.WriteString(lipgloss.NewStyle().Foreground(theme.TextMuted).Render("  No recent agent activity"))
	}

	limit := 4
	if len(m.activities) < limit {
		limit = len(m.activities)
	}

	for i := 0; i < limit; i++ {
		a := m.activities[i]
		icon := lipgloss.NewStyle().Foreground(theme.AmberColor).Render("\u26a1") // ⚡
		desc := lipgloss.NewStyle().Foreground(theme.TextSecondary).Render(truncate(a.Description, width-20))
		ago := lipgloss.NewStyle().Foreground(theme.TextMuted).Render(relativeTime(time.Unix(int64(a.CreatedAt), 0)))
		content.WriteString(fmt.Sprintf("  %s %s  %s\n", icon, desc, ago))
	}

	return boxStyle.Render(strings.TrimRight(content.String(), "\n"))
}

// --- data fetching ---

func (m *DashboardModel) loadData() tea.Cmd {
	return func() tea.Msg {
		if m.client == nil {
			return dashDataMsg{
				tasks:      sampleTasks(),
				sprint:     &api.Sprint{Name: "Sprint 3: Ship Auth", Status: "active", StartDate: float64(time.Now().AddDate(0, 0, -10).Unix()), EndDate: float64(time.Now().AddDate(0, 0, 4).Unix())},
				sprintDone: 7,
				sprintAll:  12,
				activities: sampleActivities(),
				projects:   4,
				members:    7,
				totalTasks: 89,
			}
		}

		var tasks []api.Task
		var sprint *api.Sprint
		var activities []api.AgentActivity
		sprintDone := 0
		sprintAll := 0
		projects := 0
		members := 0
		totalTasks := 0

		// Fetch my tasks
		if raw, err := m.client.Query("tasks/queries:getMyTasks", nil); err == nil {
			_ = json.Unmarshal(raw, &tasks)
		}

		// Fetch active sprint
		if raw, err := m.client.Query("sprints/queries:getActiveSprint", nil); err == nil {
			var sp api.Sprint
			if json.Unmarshal(raw, &sp) == nil && sp.ID != "" {
				sprint = &sp
				// Fetch sprint tasks for progress
				if raw2, err := m.client.Query("tasks/queries:getSprintTasks", map[string]interface{}{"sprintId": sp.ID}); err == nil {
					var spTasks []api.Task
					if json.Unmarshal(raw2, &spTasks) == nil {
						sprintAll = len(spTasks)
						for _, t := range spTasks {
							if t.Status == "done" {
								sprintDone++
							}
						}
					}
				}
			}
		}

		// Fetch agent activity
		if raw, err := m.client.Query("agent/queries:getRecentActivity", nil); err == nil {
			_ = json.Unmarshal(raw, &activities)
		}

		// Fetch workspace stats
		if raw, err := m.client.Query("dashboard/queries:getStats", nil); err == nil {
			var stats struct {
				Projects int `json:"projects"`
				Members  int `json:"members"`
				Tasks    int `json:"tasks"`
			}
			if json.Unmarshal(raw, &stats) == nil {
				projects = stats.Projects
				members = stats.Members
				totalTasks = stats.Tasks
			}
		}

		return dashDataMsg{
			tasks:      tasks,
			sprint:     sprint,
			sprintDone: sprintDone,
			sprintAll:  sprintAll,
			activities: activities,
			projects:   projects,
			members:    members,
			totalTasks: totalTasks,
		}
	}
}

func (m *DashboardModel) tickCmd() tea.Cmd {
	return tea.Tick(10*time.Second, func(t time.Time) tea.Msg {
		return dashTickMsg{}
	})
}

// --- shared helpers ---

func statusIcon(status string) string {
	c, ok := theme.StatusColors[status]
	if !ok {
		c = theme.TextMuted
	}
	style := lipgloss.NewStyle().Foreground(c)
	switch status {
	case "done":
		return style.Render("\u2713") // ✓
	case "cancelled":
		return style.Render("\u2715") // ✕
	case "in_progress":
		return style.Render("\u25c9") // ◉
	case "in_review":
		return style.Render("\u25d0") // ◐
	case "todo":
		return style.Render("\u25cb") // ○
	default:
		return style.Render("\u25cc") // ◌
	}
}

func priorityTag(priority string) string {
	c, ok := theme.PriorityColors[priority]
	if !ok {
		c = theme.TextMuted
	}
	style := lipgloss.NewStyle().Foreground(c)
	switch priority {
	case "urgent":
		return style.Render("U")
	case "high":
		return style.Render("H")
	case "medium":
		return style.Render("M")
	case "low":
		return style.Render("L")
	default:
		return style.Render("-")
	}
}

func progressBar(pct, width int) string {
	if width < 5 {
		width = 10
	}
	filled := pct * width / 100
	empty := width - filled
	bar := strings.Repeat("\u2588", filled) + strings.Repeat("\u2591", empty) // █░
	barStyle := lipgloss.NewStyle().Foreground(theme.GreenColor)
	return barStyle.Render(bar)
}


func daysUntil(epochSec float64) string {
	t := time.Unix(int64(epochSec), 0)
	d := time.Until(t)
	days := int(math.Ceil(d.Hours() / 24))
	if days <= 0 {
		return "ended"
	}
	if days == 1 {
		return "1 day"
	}
	return fmt.Sprintf("%d days", days)
}

// --- sample data ---

func sampleTasks() []api.Task {
	return []api.Task{
		{ID: "1", Title: "Fix login redirect bug", Status: "in_progress", Priority: "high", Type: "bug"},
		{ID: "2", Title: "Review PR #45", Status: "in_review", Priority: "medium", Type: "task"},
		{ID: "3", Title: "Add input validation", Status: "todo", Priority: "low", Type: "improvement"},
		{ID: "4", Title: "Write unit tests", Status: "todo", Priority: "medium", Type: "task"},
		{ID: "5", Title: "Fix header layout", Status: "done", Priority: "high", Type: "bug"},
	}
}

func sampleActivities() []api.AgentActivity {
	now := float64(time.Now().Unix())
	return []api.AgentActivity{
		{ID: "1", CreatedAt: now - 120, Type: "triage", Description: "Triaged PROJ-127 \u2192 bug, high, @sarah"},
		{ID: "2", CreatedAt: now - 900, Type: "skill", Description: "Ran \"deploy-checklist\" \u2192 5 tasks created"},
		{ID: "3", CreatedAt: now - 3600, Type: "triage", Description: "Triaged PROJ-128 \u2192 feature, medium, @john"},
	}
}
