package pages

import (
	"fmt"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/theme"
)

// StubPage is a placeholder page that displays the page name.
// Other agents will replace these with full implementations.
type StubPage struct {
	page   Page
	width  int
	height int
	Client *api.ConvexClient
	Config *api.AuthConfig
}

// NewStubPage creates a new stub page for the given page type.
func NewStubPage(page Page, client *api.ConvexClient, config *api.AuthConfig) *StubPage {
	return &StubPage{
		page:   page,
		Client: client,
		Config: config,
	}
}

func (s *StubPage) Init() tea.Cmd { return nil }

func (s *StubPage) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	return s, nil
}

func (s *StubPage) View(width, height int) string {
	name := PageName(s.page)

	title := theme.AccentStyle.Render(fmt.Sprintf("  %s", name))
	subtitle := theme.MutedStyle.Render("  Page not yet implemented")
	hint := theme.DimStyle.Render("  Press ? for help")

	content := lipgloss.JoinVertical(lipgloss.Left,
		"",
		title,
		"",
		subtitle,
		"",
		hint,
		"",
	)

	style := theme.PanelStyle.
		Width(width).
		Height(height)

	return style.Render(content)
}

func (s *StubPage) SetSize(width, height int) {
	s.width = width
	s.height = height
}

func (s *StubPage) ShortHelp() string {
	return "? help"
}

// Convenience constructors for each page type.

func NewDashboardPage(client *api.ConvexClient, config *api.AuthConfig) PageModel {
	return NewDashboardModel(client)
}

func NewTasksPage(client *api.ConvexClient, config *api.AuthConfig) PageModel {
	return NewTasksModel(client)
}

func NewSprintPage(client *api.ConvexClient, config *api.AuthConfig) PageModel {
	return NewSprintModel(client)
}

func NewAgentPage(client *api.ConvexClient, config *api.AuthConfig) PageModel {
	return NewAgentModel(client)
}

func NewSkillsPage(client *api.ConvexClient, config *api.AuthConfig) PageModel {
	return NewSkillsModel(client)
}

func NewGitPage(client *api.ConvexClient, config *api.AuthConfig) PageModel {
	return NewGitModel(client)
}

// NewProjectsPage — see projects.go
// NewSearchPage — see search.go
// NewNotificationsPage — see notifications.go
// NewSettingsPage — see settings.go
// NewHelpPage — see help.go
