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

type agentDataMsg struct {
	Suggestions []api.TriageSuggestion
	Activity    []api.AgentActivity
	Err         error
}

type agentPage struct {
	width, height int
	client        *api.ConvexClient
	workspaceID   string
	projectID     string
	suggestions   []api.TriageSuggestion
	activity      []api.AgentActivity
	cursor        int
	loading       bool
}

func NewAgentPage(client *api.ConvexClient, workspaceID, projectID string) PageModel {
	return &agentPage{client: client, workspaceID: workspaceID, projectID: projectID, loading: true}
}

func (p *agentPage) Init() tea.Cmd {
	if p.client == nil {
		return nil
	}
	return p.fetchData()
}

func (p *agentPage) fetchData() tea.Cmd {
	return func() tea.Msg {
		var data agentDataMsg

		raw, err := p.client.Query("agent/queries:getTriageQueue", map[string]interface{}{"workspaceId": p.workspaceID})
		if err == nil {
			json.Unmarshal(raw, &data.Suggestions)
		}

		raw, err = p.client.Query("agent:recentActivity", nil)
		if err == nil {
			json.Unmarshal(raw, &data.Activity)
		}

		return data
	}
}

func (p *agentPage) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case agentDataMsg:
		p.suggestions = msg.Suggestions
		p.activity = msg.Activity
		p.loading = false
	case tea.KeyMsg:
		switch msg.String() {
		case "j", "down":
			if p.cursor < len(p.suggestions)-1 {
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

func (p *agentPage) SetSize(w, h int) {
	p.width = w
	p.height = h
}

func (p *agentPage) ShortHelp() string {
	return components.KeyHints(
		components.KeyHint("a", "accept"),
		components.KeyHint("r", "reject"),
		components.KeyHint("m", "modify"),
	)
}

func (p *agentPage) KeyBinds() []string {
	return []string{"j", "k", "up", "down", "a", "r", "m"}
}

func (p *agentPage) View() string {
	if p.client == nil {
		return components.EmptyState("Not connected", p.width, p.height)
	}
	if p.loading {
		return components.EmptyState("Loading agent...", p.width, p.height)
	}

	contentW := p.width - 2
	if contentW < 20 {
		contentW = 20
	}

	var b strings.Builder
	b.WriteString("\n")

	// ── AGENT STATS (bordered) ──────────────────────
	triaged := 0
	pending := 0
	for _, s := range p.suggestions {
		if s.Status == "accepted" || s.Status == "rejected" {
			triaged++
		}
		if s.Status == "pending" {
			pending++
		}
	}

	labelW := 16
	label := lipgloss.NewStyle().Foreground(theme.TextMuted).Width(labelW)
	val := lipgloss.NewStyle().Foreground(theme.TextPrimary).Bold(true)

	statsLines := []string{
		label.Render("Triaged today:") + val.Render(fmt.Sprintf("%d", triaged)),
		label.Render("Pending:") + val.Render(fmt.Sprintf("%d", pending)),
	}
	statsContent := strings.Join(statsLines, "\n")
	b.WriteString(components.BorderedSection("AGENT STATS", statsContent, contentW))
	b.WriteString("\n\n")

	// ── PENDING TRIAGE (bordered) ──────────────────────
	pendingCount := 0
	for _, s := range p.suggestions {
		if s.Status == "pending" {
			pendingCount++
		}
	}

	triageContent := p.renderTriageContent(contentW - 4)
	b.WriteString(components.BorderedSection(
		fmt.Sprintf("PENDING TRIAGE (%d)", pendingCount),
		triageContent,
		contentW,
	))

	// Action hints for triage
	if pendingCount > 0 {
		b.WriteString("\n")
		b.WriteString("  " + components.KeyHints(
			components.KeyHint("a", "accept"),
			components.KeyHint("r", "reject"),
			components.KeyHint("m", "modify"),
		))
	}
	b.WriteString("\n\n")

	// ── RECENT ACTIVITY (bordered) ──────────────────────
	activityContent := p.renderActivityContent(contentW - 4)
	b.WriteString(components.BorderedSection("RECENT ACTIVITY", activityContent, contentW))

	return b.String()
}

func (p *agentPage) renderTriageContent(innerW int) string {
	var pendingSuggestions []api.TriageSuggestion
	for _, s := range p.suggestions {
		if s.Status == "pending" {
			pendingSuggestions = append(pendingSuggestions, s)
		}
	}

	if len(pendingSuggestions) == 0 {
		return theme.TextMutedStyle.Render(theme.SymDotEmpty + " No pending suggestions")
	}

	var lines []string
	for i, s := range pendingSuggestions {
		isSelected := i == p.cursor

		// Build triage card content
		title := fmt.Sprintf("%q", s.TaskID)
		if s.SuggestedType != "" {
			title = fmt.Sprintf("%q", s.TaskID)
		}

		if isSelected {
			// Selected card: show expanded info
			cardLines := []string{
				theme.BrandTextStyle.Render(title),
			}
			if s.SuggestedType != "" {
				cardLines = append(cardLines,
					theme.TextMutedStyle.Render("Suggested: ")+
						theme.WarningTextStyle.Render(s.SuggestedType))
			}
			conf := s.Confidence * 100
			confStyle := theme.TextMutedStyle
			if conf >= 80 {
				confStyle = theme.SuccessTextStyle
			} else if conf >= 50 {
				confStyle = theme.WarningTextStyle
			}
			cardLines = append(cardLines,
				theme.TextMutedStyle.Render("Confidence: ")+
					confStyle.Render(fmt.Sprintf("%.0f%%", conf)))

			cardContent := strings.Join(cardLines, "\n")
			// Highlight with amber border
			cardStyle := lipgloss.NewStyle().
				Background(theme.BgHighlight).
				Padding(0, 1).
				Width(innerW)
			lines = append(lines, cardStyle.Render(cardContent))
		} else {
			line := theme.TextSecondaryStyle.Render(title)
			if s.SuggestedType != "" {
				line += "  " + theme.WarningTextStyle.Render(s.SuggestedType)
			}
			lines = append(lines, line)
		}
	}

	return strings.Join(lines, "\n")
}

func (p *agentPage) renderActivityContent(innerW int) string {
	if len(p.activity) == 0 {
		return theme.TextMutedStyle.Render(theme.SymDotEmpty + " No recent activity")
	}

	var lines []string
	limit := 5
	if len(p.activity) < limit {
		limit = len(p.activity)
	}
	for i := 0; i < limit; i++ {
		a := p.activity[i]
		dot := theme.WarningTextStyle.Render(theme.SymDot)
		desc := theme.TextSecondaryStyle.Render(a.Description)
		lines = append(lines, dot+" "+desc)
	}
	return strings.Join(lines, "\n\n")
}
