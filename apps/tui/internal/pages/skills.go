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

// --- messages ---

type skillsLoadedMsg struct {
	skills []api.Skill
}

type skillsErrMsg struct {
	err error
}

type skillToggleDoneMsg struct {
	id string
}

type skillRunDoneMsg struct {
	id string
}

// --- model ---

// SkillsModel is the skills management page with purple accent.
type SkillsModel struct {
	skills  []api.Skill
	cursor  int
	width   int
	height  int
	loading bool
	err     error
	client  *api.ConvexClient
}

func NewSkillsModel(client *api.ConvexClient) *SkillsModel {
	return &SkillsModel{
		loading: true,
		client:  client,
	}
}

// --- PageModel interface ---

func (m *SkillsModel) Init() tea.Cmd {
	return m.loadSkills()
}

func (m *SkillsModel) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil

	case skillsLoadedMsg:
		m.skills = msg.skills
		m.loading = false
		if m.cursor >= len(m.skills) && len(m.skills) > 0 {
			m.cursor = len(m.skills) - 1
		}
		return m, nil

	case skillsErrMsg:
		m.err = msg.err
		m.loading = false
		return m, nil

	case skillToggleDoneMsg, skillRunDoneMsg:
		return m, m.loadSkills()

	case tea.KeyMsg:
		if m.loading {
			return m, nil
		}
		switch msg.String() {
		case "j", "down":
			if m.cursor < len(m.skills)-1 {
				m.cursor++
			}
		case "k", "up":
			if m.cursor > 0 {
				m.cursor--
			}
		case "t":
			if len(m.skills) > 0 && m.cursor < len(m.skills) {
				return m, m.toggleSkill(m.skills[m.cursor].ID)
			}
		case "r":
			if len(m.skills) > 0 && m.cursor < len(m.skills) {
				return m, m.runSkill(m.skills[m.cursor].ID)
			}
		case "R":
			m.loading = true
			m.err = nil
			return m, m.loadSkills()
		}
	}

	return m, nil
}

func (m *SkillsModel) View(width, height int) string {
	m.width = width
	m.height = height

	purple := lipgloss.NewStyle().Foreground(theme.PurpleColor).Bold(true)
	muted := lipgloss.NewStyle().Foreground(theme.TextMuted)
	secondary := lipgloss.NewStyle().Foreground(theme.TextSecondary)

	if m.loading {
		return purple.Render("SKILLS") + "\n\n" +
			secondary.Render("  Loading skills...")
	}

	if m.err != nil {
		return purple.Render("SKILLS") + "\n\n" +
			theme.ErrorStyle.Render("  Error: "+m.err.Error()) + "\n" +
			muted.Render("  Press R to retry")
	}

	contentWidth := width - 4
	if contentWidth < 50 {
		contentWidth = 60
	}

	var b strings.Builder

	// Header
	b.WriteString(purple.Render("SKILLS"))
	b.WriteString("  ")
	b.WriteString(muted.Render("agent automation"))
	b.WriteString("\n\n")

	// Skills list
	b.WriteString(m.viewSkillList(contentWidth))

	// Footer hints
	b.WriteString("\n\n")
	hintStyle := muted
	keyStyle := lipgloss.NewStyle().Foreground(theme.PurpleColor)
	b.WriteString(hintStyle.Render("  "))
	b.WriteString(keyStyle.Render("j/k"))
	b.WriteString(hintStyle.Render(" navigate  "))
	b.WriteString(keyStyle.Render("t"))
	b.WriteString(hintStyle.Render(" toggle  "))
	b.WriteString(keyStyle.Render("r"))
	b.WriteString(hintStyle.Render(" run  "))
	b.WriteString(keyStyle.Render("R"))
	b.WriteString(hintStyle.Render(" refresh"))

	return b.String()
}

func (m *SkillsModel) SetSize(width, height int) {
	m.width = width
	m.height = height
}

func (m *SkillsModel) ShortHelp() string {
	return "j/k: navigate | t: toggle | r: run | R: refresh"
}

// --- view helpers ---

func (m *SkillsModel) viewSkillList(contentWidth int) string {
	box := theme.LeftBorderPanel(theme.PurpleColor).Width(contentWidth)

	header := lipgloss.NewStyle().Foreground(theme.PurpleColor).Bold(true).
		Render(fmt.Sprintf("YOUR SKILLS (%d)", len(m.skills)))

	if len(m.skills) == 0 {
		empty := lipgloss.NewStyle().Foreground(theme.TextMuted).
			Render("  No skills configured. Create one in the web app.")
		return box.Render(header + "\n" + empty)
	}

	var rows strings.Builder
	rows.WriteString(header)
	rows.WriteString("\n")

	for i, skill := range m.skills {
		cursor := "  "
		icon := lipgloss.NewStyle().Foreground(theme.TextMuted).Render("\u25c7") // ◇
		if i == m.cursor {
			cursor = lipgloss.NewStyle().Foreground(theme.PurpleColor).Render("> ")
			icon = lipgloss.NewStyle().Foreground(theme.PurpleColor).Render("\u26a1") // ⚡
		}

		// Name
		name := skill.DisplayName
		if name == "" {
			name = skill.Name
		}
		nameStyle := lipgloss.NewStyle().Foreground(theme.TextColor).Width(22)

		// Trigger badge
		triggerStyle := triggerBadgeStyle(skill.Trigger)
		triggerBadge := triggerStyle.Render(fmt.Sprintf("%-6s", strings.ToUpper(skill.Trigger)))

		// Active status
		var statusDot string
		if skill.IsActive {
			statusDot = lipgloss.NewStyle().Foreground(theme.GreenColor).Render("\u25cf Active  ")
		} else {
			statusDot = lipgloss.NewStyle().Foreground(theme.TextMuted).Render("\u25cb Inactive")
		}

		// Usage count
		usageStyle := lipgloss.NewStyle().Foreground(theme.TextMuted)
		usage := usageStyle.Render(fmt.Sprintf("Used: %dx", skill.UsageCount))

		row := fmt.Sprintf("%s%s %s  %s  %s  %s",
			cursor, icon, nameStyle.Render(name), triggerBadge, statusDot, usage)
		rows.WriteString(row)
		if i < len(m.skills)-1 {
			rows.WriteString("\n")
		}
	}

	return box.Render(rows.String())
}

func triggerBadgeStyle(trigger string) lipgloss.Style {
	switch strings.ToLower(trigger) {
	case "auto":
		return lipgloss.NewStyle().Foreground(theme.GreenColor).Bold(true)
	case "manual":
		return lipgloss.NewStyle().Foreground(theme.AmberColor).Bold(true)
	case "both":
		return lipgloss.NewStyle().Foreground(theme.CyanColor).Bold(true)
	default:
		return lipgloss.NewStyle().Foreground(theme.TextMuted)
	}
}

// --- commands ---

func (m *SkillsModel) loadSkills() tea.Cmd {
	return func() tea.Msg {
		if m.client == nil {
			return skillsLoadedMsg{skills: sampleSkills()}
		}

		raw, err := m.client.Query("skills/queries:getWorkspaceSkills", nil)
		if err != nil {
			return skillsErrMsg{err: err}
		}

		var skills []api.Skill
		if err := json.Unmarshal(raw, &skills); err != nil {
			return skillsErrMsg{err: fmt.Errorf("parse skills: %w", err)}
		}

		return skillsLoadedMsg{skills: skills}
	}
}

func (m *SkillsModel) toggleSkill(id string) tea.Cmd {
	return func() tea.Msg {
		if m.client == nil {
			return skillToggleDoneMsg{id: id}
		}

		_, err := m.client.Mutation("skills/mutations:toggleSkill", map[string]interface{}{
			"skillId": id,
		})
		if err != nil {
			return skillsErrMsg{err: err}
		}

		return skillToggleDoneMsg{id: id}
	}
}

func (m *SkillsModel) runSkill(id string) tea.Cmd {
	return func() tea.Msg {
		if m.client == nil {
			return skillRunDoneMsg{id: id}
		}

		_, err := m.client.Action("skills/execution:executeSkill", map[string]interface{}{
			"skillId": id,
		})
		if err != nil {
			return skillsErrMsg{err: err}
		}

		return skillRunDoneMsg{id: id}
	}
}

// --- sample data ---

func sampleSkills() []api.Skill {
	return []api.Skill{
		{ID: "sk1", Name: "bug-triage", DisplayName: "Bug Triage", Description: "Auto-triage bug reports", Trigger: "auto", IsActive: true, IsBuiltIn: true, UsageCount: 23},
		{ID: "sk2", Name: "deploy-checklist", DisplayName: "Deploy Checklist", Description: "Run deployment checklist", Trigger: "manual", IsActive: true, UsageCount: 8},
		{ID: "sk3", Name: "sprint-planning", DisplayName: "Sprint Planning", Description: "AI-assisted sprint planning", Trigger: "manual", IsActive: false, UsageCount: 3},
		{ID: "sk4", Name: "pr-review", DisplayName: "PR Review", Description: "Automated PR review", Trigger: "manual", IsActive: true, UsageCount: 15},
	}
}
