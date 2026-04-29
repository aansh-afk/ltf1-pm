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

type triageActionMsg struct {
	Action string // "accept", "reject"
	Err    error
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

		raw, err = p.client.Query("agent/queries:getAgentActivityFeed", map[string]interface{}{"workspaceId": p.workspaceID})
		if err == nil {
			json.Unmarshal(raw, &data.Activity)
		}

		return data
	}
}

func (p *agentPage) acceptSuggestion(suggestionID string) tea.Cmd {
	client := p.client
	return func() tea.Msg {
		_, err := client.Mutation("agent/triageMutations:acceptTriageSuggestion", map[string]interface{}{
			"suggestionId": suggestionID,
		})
		return triageActionMsg{Action: "accept", Err: err}
	}
}

func (p *agentPage) rejectSuggestion(suggestionID string) tea.Cmd {
	client := p.client
	return func() tea.Msg {
		_, err := client.Mutation("agent/triageMutations:rejectTriageSuggestion", map[string]interface{}{
			"suggestionId": suggestionID,
		})
		return triageActionMsg{Action: "reject", Err: err}
	}
}

func (p *agentPage) pendingSuggestions() []api.TriageSuggestion {
	var result []api.TriageSuggestion
	for _, s := range p.suggestions {
		if s.Status == "pending" {
			result = append(result, s)
		}
	}
	return result
}

func (p *agentPage) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case agentDataMsg:
		p.suggestions = msg.Suggestions
		p.activity = msg.Activity
		p.loading = false

	case triageActionMsg:
		if msg.Err != nil {
			return p, func() tea.Msg {
				return ShowToastMsg{Message: "Triage failed: " + msg.Err.Error(), IsError: true}
			}
		}
		action := msg.Action
		return p, tea.Batch(
			p.fetchData(),
			func() tea.Msg {
				label := "Accepted"
				if action == "reject" {
					label = "Rejected"
				}
				return ShowToastMsg{Message: label}
			},
		)

	case tea.KeyMsg:
		pending := p.pendingSuggestions()
		switch msg.String() {
		case "j", "down":
			if p.cursor < len(pending)-1 {
				p.cursor++
			}
		case "k", "up":
			if p.cursor > 0 {
				p.cursor--
			}
		case "a":
			if p.cursor >= 0 && p.cursor < len(pending) {
				return p, p.acceptSuggestion(pending[p.cursor].ID)
			}
		case "r":
			if p.cursor >= 0 && p.cursor < len(pending) {
				return p, p.rejectSuggestion(pending[p.cursor].ID)
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

func (p *agentPage) HasModal() bool { return false }

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

	// AGENT STATS
	triaged := 0
	pending := p.pendingSuggestions()
	for _, s := range p.suggestions {
		if s.Status == "accepted" || s.Status == "rejected" {
			triaged++
		}
	}

	labelW := 16
	label := lipgloss.NewStyle().Foreground(theme.TextMuted).Width(labelW)
	val := lipgloss.NewStyle().Foreground(theme.TextPrimary).Bold(true)

	statsLines := []string{
		label.Render("Triaged today:") + val.Render(fmt.Sprintf("%d", triaged)),
		label.Render("Pending:") + val.Render(fmt.Sprintf("%d", len(pending))),
	}
	b.WriteString(components.BorderedSection("AGENT STATS", strings.Join(statsLines, "\n"), contentW))
	b.WriteString("\n\n")

	// PENDING TRIAGE
	triageContent := p.renderTriageContent(contentW-4, pending)
	b.WriteString(components.BorderedSection(
		fmt.Sprintf("PENDING TRIAGE (%d)", len(pending)),
		triageContent,
		contentW,
	))

	if len(pending) > 0 {
		b.WriteString("\n")
		b.WriteString("  " + components.KeyHints(
			components.KeyHint("a", "accept"),
			components.KeyHint("r", "reject"),
			components.KeyHint("m", "modify"),
		))
	}
	b.WriteString("\n\n")

	// RECENT ACTIVITY
	activityContent := p.renderActivityContent(contentW - 4)
	b.WriteString(components.BorderedSection("RECENT ACTIVITY", activityContent, contentW))

	return b.String()
}

func (p *agentPage) renderTriageContent(innerW int, pending []api.TriageSuggestion) string {
	if len(pending) == 0 {
		return theme.TextMutedStyle.Render(theme.SymDotEmpty + " No pending suggestions")
	}

	var lines []string
	for i, s := range pending {
		isSelected := i == p.cursor
		title := fmt.Sprintf("%q", s.TaskID)

		if isSelected {
			cardLines := []string{
				theme.BrandTextStyle.Render(title),
			}
			if s.SuggestedType != "" {
				cardLines = append(cardLines,
					theme.TextMutedStyle.Render("Suggested: ")+theme.WarningTextStyle.Render(s.SuggestedType))
			}
			if s.SuggestedPriority != "" {
				cardLines = append(cardLines,
					theme.TextMutedStyle.Render("Priority: ")+components.PriorityBadgePlain(s.SuggestedPriority))
			}
			conf := s.Confidence * 100
			confStyle := theme.TextMutedStyle
			if conf >= 80 {
				confStyle = theme.SuccessTextStyle
			} else if conf >= 50 {
				confStyle = theme.WarningTextStyle
			}
			cardLines = append(cardLines,
				theme.TextMutedStyle.Render("Confidence: ")+confStyle.Render(fmt.Sprintf("%.0f%%", conf)))

			cardContent := strings.Join(cardLines, "\n")
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
