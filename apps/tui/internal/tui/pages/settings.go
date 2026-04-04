package pages

import (
	"encoding/json"
	"os"
	"strings"

	tea "charm.land/bubbletea/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/components"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

// LogoutMsg tells the app to quit after clearing auth
type LogoutMsg struct{}

type settingsPage struct {
	width, height int
	config        *api.AuthConfig
	cursor        int
	items         []string
}

func NewSettingsPage(config *api.AuthConfig) PageModel {
	return &settingsPage{
		config: config,
		items:  []string{"Logout"},
	}
}

func (p *settingsPage) Init() tea.Cmd { return nil }

func (p *settingsPage) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "j", "down":
			if p.cursor < len(p.items)-1 {
				p.cursor++
			}
		case "k", "up":
			if p.cursor > 0 {
				p.cursor--
			}
		case "enter":
			if p.items[p.cursor] == "Logout" {
				// Clear the config file
				configPath := api.GetConfigPath()
				if configPath != "" {
					// Write empty JSON to clear auth
					emptyConfig := map[string]interface{}{}
					data, _ := json.Marshal(emptyConfig)
					os.WriteFile(configPath, data, 0644)
				}
				return p, func() tea.Msg { return LogoutMsg{} }
			}
		}
	}
	return p, nil
}

func (p *settingsPage) SetSize(w, h int) {
	p.width = w
	p.height = h
}

func (p *settingsPage) ShortHelp() string {
	return components.KeyHints(components.KeyHint("enter", "select"))
}

func (p *settingsPage) KeyBinds() []string {
	return []string{"j", "k", "up", "down", "enter"}
}

func (p *settingsPage) HasModal() bool { return false }

func (p *settingsPage) View() string {
	var b strings.Builder

	b.WriteString("\n")
	b.WriteString(theme.SectionHeader.Render("SETTINGS") + "\n")
	b.WriteString("\n")

	row := func(label, value string) {
		b.WriteString("  " + theme.FieldLabelStyle.Render(label) + theme.FieldValueStyle.Render(value) + "\n")
	}

	// Connection info
	b.WriteString("  " + theme.SectionHeader.Render("CONNECTION") + "\n")
	b.WriteString("\n")

	if p.config != nil {
		row("Email", p.config.Auth.Email)
		row("Workspace", p.config.Context.WorkspaceName)
		row("Project", p.config.Context.ProjectName)

		if api.IsAuthenticated(p.config) {
			row("Status", theme.SuccessTextStyle.Render(theme.SymDot+" Authenticated"))
		} else if api.CanRefreshSession(p.config) {
			row("Status", theme.WarningTextStyle.Render(theme.SymDot+" Refreshing on demand"))
		} else {
			row("Status", theme.ErrorTextStyle.Render(theme.SymDot+" Token expired"))
		}
	} else {
		row("Status", theme.ErrorTextStyle.Render(theme.SymDot+" Not configured"))
	}

	b.WriteString("\n\n")

	// Version info
	b.WriteString("  " + theme.SectionHeader.Render("VERSION") + "\n")
	b.WriteString("\n")
	row("TUI", "v0.1.8")
	b.WriteString("\n\n")

	// Actions
	b.WriteString("  " + theme.SectionHeader.Render("ACTIONS") + "\n")
	b.WriteString("\n")
	for i, item := range p.items {
		if i == p.cursor {
			b.WriteString("  " + theme.ErrorTextStyle.Bold(true).Render(theme.SymBar+" "+item) + "\n")
		} else {
			b.WriteString("    " + theme.TextMutedStyle.Render(item) + "\n")
		}
	}

	return b.String()
}
