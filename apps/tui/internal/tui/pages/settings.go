package pages

import (
	"strings"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

type settingsPage struct {
	width, height int
	config        *api.AuthConfig
}

func NewSettingsPage(config *api.AuthConfig) PageModel {
	return &settingsPage{config: config}
}

func (p *settingsPage) Init() tea.Cmd { return nil }

func (p *settingsPage) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	return p, nil
}

func (p *settingsPage) SetSize(w, h int) {
	p.width = w
	p.height = h
}

func (p *settingsPage) ShortHelp() string {
	return ""
}

func (p *settingsPage) KeyBinds() []string {
	return nil
}

func (p *settingsPage) View() string {
	var b strings.Builder

	b.WriteString(theme.SectionHeader.Render("SETTINGS") + "\n\n")

	labelStyle := lipgloss.NewStyle().Foreground(theme.TextMuted).Width(20)
	valueStyle := lipgloss.NewStyle().Foreground(theme.TextPrimary)

	row := func(label, value string) {
		b.WriteString(labelStyle.Render(label) + valueStyle.Render(value) + "\n")
	}

	// Connection info
	sectionStyle := lipgloss.NewStyle().Foreground(theme.Indigo).Bold(true)
	b.WriteString(sectionStyle.Render("CONNECTION") + "\n")

	if p.config != nil {
		row("Email", p.config.Auth.Email)
		row("Workspace", p.config.Context.WorkspaceName)
		row("Project", p.config.Context.ProjectName)

		if api.IsAuthenticated(p.config) {
			row("Status", lipgloss.NewStyle().Foreground(theme.Green).Render("Authenticated"))
		} else {
			row("Status", lipgloss.NewStyle().Foreground(theme.Red).Render("Token expired"))
		}
	} else {
		row("Status", lipgloss.NewStyle().Foreground(theme.Red).Render("Not configured"))
	}

	b.WriteString("\n")

	// Version info
	b.WriteString(sectionStyle.Render("VERSION") + "\n")
	row("TUI", "v0.8.0")
	row("Build", "development")

	return b.String()
}
