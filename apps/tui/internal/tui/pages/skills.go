package pages

import (
	"encoding/json"
	"strings"

	tea "charm.land/bubbletea/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/components"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

type skillsDataMsg struct {
	Skills []api.Skill
	Err    error
}

type skillsPage struct {
	width, height int
	client        *api.ConvexClient
	workspaceID   string
	projectID     string
	skills        []api.Skill
	cursor        int
	loading       bool
}

func NewSkillsPage(client *api.ConvexClient, workspaceID, projectID string) PageModel {
	return &skillsPage{client: client, workspaceID: workspaceID, projectID: projectID, loading: true}
}

func (p *skillsPage) Init() tea.Cmd {
	if p.client == nil {
		return nil
	}
	return p.fetchSkills()
}

func (p *skillsPage) fetchSkills() tea.Cmd {
	return func() tea.Msg {
		raw, err := p.client.Query("skills/queries:getWorkspaceSkills", map[string]interface{}{"workspaceId": p.workspaceID})
		if err != nil {
			return skillsDataMsg{Err: err}
		}
		var skills []api.Skill
		json.Unmarshal(raw, &skills)
		return skillsDataMsg{Skills: skills}
	}
}

func (p *skillsPage) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case skillsDataMsg:
		p.skills = msg.Skills
		p.loading = false
	case tea.KeyMsg:
		switch msg.String() {
		case "j", "down":
			if p.cursor < len(p.skills)-1 {
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

func (p *skillsPage) SetSize(w, h int) {
	p.width = w
	p.height = h
}

func (p *skillsPage) ShortHelp() string {
	return components.KeyHints(
		components.KeyHint("space", "toggle"),
		components.KeyHint("enter", "details"),
		components.KeyHint("r", "refresh"),
	)
}

func (p *skillsPage) KeyBinds() []string {
	return []string{"j", "k", "up", "down", " "}
}

func (p *skillsPage) View() string {
	if p.client == nil {
		return components.EmptyState("Not connected", p.width, p.height)
	}
	if p.loading {
		return components.EmptyState("Loading skills...", p.width, p.height)
	}

	var b strings.Builder

	b.WriteString("\n")
	b.WriteString(theme.SectionHeader.Render("SKILLS") + "\n")
	b.WriteString(theme.TextMutedStyle.Render("Configure the AI agent's capabilities for this workspace.") + "\n")
	b.WriteString("\n")

	if len(p.skills) == 0 {
		b.WriteString(components.EmptyState("No skills configured", p.width, p.height-6))
		return b.String()
	}

	for i, skill := range p.skills {
		// Status badge: "Enabled ✓" or "Disabled ○"
		var meta string
		if skill.IsActive {
			meta = theme.SuccessTextStyle.Render("Enabled ") + theme.SuccessTextStyle.Render(theme.SymCheck)
		} else {
			meta = theme.TextMutedStyle.Render("Disabled ") + theme.TextMutedStyle.Render(theme.SymDotEmpty)
		}

		b.WriteString(components.RenderListItem(skill.DisplayName, meta, i == p.cursor, p.width-2) + "\n")
	}

	return b.String()
}
