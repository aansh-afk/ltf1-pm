package pages

import (
	"encoding/json"
	"fmt"
	"image/color"
	"strings"
	"time"

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
		return components.EmptyState("Not connected. Run ltf1 auth login first.", p.width, p.height)
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

	// ── ROW 1: ACTIVE SPRINT (full width) ─────────────────
	sprintContent := p.renderSprintContent(contentW - 4)
	b.WriteString(components.BorderedSection("ACTIVE SPRINT", sprintContent, contentW))
	b.WriteString("\n\n")

	// ── ROW 2: MY TASKS (55%) + TASK DISTRIBUTION (45%) ───
	leftW := int(float64(contentW) * 0.55)
	rightW := contentW - leftW - 3
	if leftW < 20 {
		leftW = 20
	}
	if rightW < 20 {
		rightW = 20
	}

	tasksContent := p.renderTasksContent(leftW - 4)
	taskCount := len(p.data.Tasks)
	tasksBox := components.BorderedSection(fmt.Sprintf("MY TASKS (%d)", taskCount), tasksContent, leftW)

	distContent := p.renderDistributionContent(rightW - 4)
	distBox := components.BorderedSection("TASK DISTRIBUTION", distContent, rightW)

	b.WriteString(lipgloss.JoinHorizontal(lipgloss.Top, tasksBox, "   ", distBox))
	b.WriteString("\n\n")

	// ── ROW 3: WORKSPACE STATS (full width, 4 colored blocks) ─
	statsContent := p.renderStatsContent(contentW - 4)
	b.WriteString(components.BorderedSection("WORKSPACE STATS", statsContent, contentW))
	b.WriteString("\n\n")

	// ── ROW 4: AGENT ACTIVITY (full width, 7-day bars) ───
	activityContent := p.renderActivityContent(contentW - 4)
	b.WriteString(components.BorderedSection("AGENT ACTIVITY · 7D", activityContent, contentW))

	return b.String()
}

func (p *dashboardPage) renderSprintContent(innerW int) string {
	if innerW < 20 {
		innerW = 20
	}

	if p.data.Sprint == nil {
		empty := theme.TextMutedStyle.Render(theme.SymDotEmpty + " No active sprint")
		hint := theme.TextDimStyle.Render("Create one with ltf1 sprint create")
		return empty + "\n" + hint
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

	nameStyle := lipgloss.NewStyle().Foreground(theme.Indigo).Bold(true)
	name := nameStyle.Render(p.data.Sprint.Name)

	var lines []string
	headerLine := name
	if p.data.Sprint.Goal != "" {
		goal := theme.TextMutedStyle.Render("  " + theme.SymBullet + " " + p.data.Sprint.Goal)
		headerLine = name + goal
	}
	lines = append(lines, headerLine)

	barW := innerW - 2
	if barW < 20 {
		barW = 20
	}
	lines = append(lines, components.ProgressBar(pct, barW, theme.Cyan))
	return strings.Join(lines, "\n")
}

func (p *dashboardPage) renderTasksContent(innerW int) string {
	if len(p.data.Tasks) == 0 {
		empty := theme.TextMutedStyle.Render(theme.SymDotEmpty + " No tasks found")
		hint := theme.TextDimStyle.Render("Create one with ltf1 task create")
		return empty + "\n" + hint
	}

	var lines []string
	limit := 6
	if len(p.data.Tasks) < limit {
		limit = len(p.data.Tasks)
	}

	for i := 0; i < limit; i++ {
		t := p.data.Tasks[i]
		dot := components.StatusDot(t.Status)

		var titleStyle lipgloss.Style
		if strings.ToLower(t.Status) == "in_progress" || strings.ToLower(t.Status) == "in progress" {
			titleStyle = theme.TextPrimaryStyle
		} else {
			titleStyle = theme.TextSecondaryStyle
		}

		// Right-aligned priority badge
		prio := strings.ToUpper(t.Priority)
		var prioRendered string
		switch strings.ToLower(t.Priority) {
		case "urgent", "critical":
			prioRendered = theme.ColorBoldStyle(theme.Red).Render(prio)
		case "high":
			prioRendered = theme.ColorBoldStyle(theme.Amber).Render(prio)
		case "medium":
			prioRendered = theme.TextMutedStyle.Render("MED")
			prio = "MED"
		case "low":
			prioRendered = theme.TextMutedStyle.Render("LOW")
			prio = "LOW"
		default:
			prioRendered = ""
			prio = ""
		}

		// Build the line: dot + " " + title ...... prio
		leftPart := dot + " " + titleStyle.Render(t.Title)
		leftW := lipgloss.Width(leftPart)
		prioW := lipgloss.Width(prioRendered)

		// Truncate title if it doesn't fit
		maxTitleW := innerW - 2 - prioW - 2 // dot + space + gap + prio
		fullDotW := lipgloss.Width(dot + " ")
		if lipgloss.Width(titleStyle.Render(t.Title))+fullDotW > innerW-prioW-2 {
			// Truncate title
			runes := []rune(t.Title)
			truncW := maxTitleW
			if truncW < 5 {
				truncW = 5
			}
			if len(runes) > truncW {
				runes = runes[:truncW-1]
				t.Title = string(runes) + theme.SymEllipsis
				leftPart = dot + " " + titleStyle.Render(t.Title)
				leftW = lipgloss.Width(leftPart)
			}
		}

		gap := innerW - leftW - prioW
		if gap < 1 {
			gap = 1
		}
		line := leftPart + strings.Repeat(" ", gap) + prioRendered
		lines = append(lines, line)
	}

	return strings.Join(lines, "\n")
}

func (p *dashboardPage) renderDistributionContent(innerW int) string {
	counts := map[string]int{}
	for _, t := range p.data.Tasks {
		key := strings.ToLower(t.Status)
		switch key {
		case "in progress":
			key = "in_progress"
		case "in review", "review":
			key = "in_review"
		case "completed":
			key = "done"
		case "canceled":
			key = "cancelled"
		case "pending":
			key = "todo"
		}
		counts[key]++
	}
	return components.StackedTaskBars(counts, innerW)
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
			continue
		}
		// Also detect blocked via labels
		for _, l := range t.Labels {
			if strings.Contains(strings.ToLower(l), "blocked") {
				blocked++
				break
			}
		}
	}

	// 4 blocks separated by 3-space gutter = 3 gutters of 3 chars = 9
	gutter := 3
	blockW := (innerW - gutter*3) / 4
	if blockW < 6 {
		blockW = 6
	}

	var indigoC color.Color = theme.Indigo
	var greenC color.Color = theme.Green
	var amberC color.Color = theme.Amber
	var redC color.Color = theme.Red

	b1 := components.StatBlock("Total", total, indigoC, blockW)
	b2 := components.StatBlock("Completed", done, greenC, blockW)
	b3 := components.StatBlock("In Progress", inProgress, amberC, blockW)
	b4 := components.StatBlock("Blocked", blocked, redC, blockW)

	gap := strings.Repeat(" ", gutter)
	return lipgloss.JoinHorizontal(lipgloss.Top, b1, gap, b2, gap, b3, gap, b4)
}

func (p *dashboardPage) renderActivityContent(innerW int) string {
	// Bucket activity into 7 daily buckets: index 0 = 6 days ago, 6 = today.
	values := make([]int, 7)
	now := time.Now()
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	autoActions := 0
	for _, a := range p.data.Activity {
		// CreatedAt is in milliseconds since epoch.
		sec := int64(a.CreatedAt / 1000)
		nsec := int64((a.CreatedAt - float64(sec*1000)) * 1e6)
		ts := time.Unix(sec, nsec)
		// Days ago relative to todayStart.
		daysAgo := int(todayStart.Sub(time.Date(ts.Year(), ts.Month(), ts.Day(), 0, 0, 0, 0, ts.Location())).Hours() / 24)
		if daysAgo < 0 {
			daysAgo = 0
		}
		if daysAgo >= 0 && daysAgo < 7 {
			bucket := 6 - daysAgo
			values[bucket]++
			autoActions++
		}
	}

	var lines []string

	// Activity bars row (2 lines: bar + day labels).
	lines = append(lines, components.ActivityBars(values, innerW))

	// Summary line.
	var summary string
	if autoActions == 0 {
		summary = theme.TextMutedStyle.Render(theme.SymDotEmpty + " No recent activity")
	} else {
		summary = theme.TextSecondaryStyle.Render(
			fmt.Sprintf("%d auto-actions this week", autoActions),
		)
	}
	lines = append(lines, "")
	lines = append(lines, summary)

	// Most recent 3 activities.
	if len(p.data.Activity) > 0 {
		limit := 3
		if len(p.data.Activity) < limit {
			limit = len(p.data.Activity)
		}
		for i := 0; i < limit; i++ {
			a := p.data.Activity[i]
			dot := theme.ColorTextStyle(theme.Purple).Render(theme.SymDot)
			desc := theme.TextSecondaryStyle.Render(a.Description)
			ts := relativeTime(a.CreatedAt)
			tsRendered := theme.TextMutedStyle.Render(ts)

			left := dot + " " + desc
			leftW := lipgloss.Width(left)
			tsW := lipgloss.Width(tsRendered)
			gap := innerW - leftW - tsW
			if gap < 2 {
				gap = 2
			}
			lines = append(lines, left+strings.Repeat(" ", gap)+tsRendered)
		}
	}

	return strings.Join(lines, "\n")
}

// relativeTime formats a millis-since-epoch timestamp as e.g. "2h", "3d".
func relativeTime(ms float64) string {
	if ms <= 0 {
		return ""
	}
	sec := int64(ms / 1000)
	t := time.Unix(sec, 0)
	d := time.Since(t)
	switch {
	case d < time.Minute:
		return "now"
	case d < time.Hour:
		return fmt.Sprintf("%dm", int(d.Minutes()))
	case d < 24*time.Hour:
		return fmt.Sprintf("%dh", int(d.Hours()))
	default:
		return fmt.Sprintf("%dd", int(d.Hours()/24))
	}
}
