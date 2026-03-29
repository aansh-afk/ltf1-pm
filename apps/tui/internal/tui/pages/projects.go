package pages

import (
	"encoding/json"
	"strings"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/components"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

type projectsDataMsg struct {
	Projects []api.Project
	Err      error
}

type projectsPage struct {
	width, height int
	client        *api.ConvexClient
	workspaceID   string
	projectID     string
	projects      []api.Project
	cursor        int
	activeID      string
	loading       bool
}

func NewProjectsPage(client *api.ConvexClient, workspaceID, projectID string) PageModel {
	return &projectsPage{client: client, workspaceID: workspaceID, projectID: projectID, loading: true}
}

func (p *projectsPage) Init() tea.Cmd {
	if p.client == nil {
		return nil
	}
	return p.fetchProjects()
}

func (p *projectsPage) fetchProjects() tea.Cmd {
	return func() tea.Msg {
		raw, err := p.client.Query("projects/queries:getWorkspaceProjects", map[string]interface{}{"workspaceId": p.workspaceID})
		if err != nil {
			return projectsDataMsg{Err: err}
		}
		var projects []api.Project
		json.Unmarshal(raw, &projects)
		return projectsDataMsg{Projects: projects}
	}
}

func (p *projectsPage) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case projectsDataMsg:
		p.projects = msg.Projects
		p.loading = false
	case tea.KeyMsg:
		switch msg.String() {
		case "j", "down":
			if p.cursor < len(p.projects)-1 {
				p.cursor++
			}
		case "k", "up":
			if p.cursor > 0 {
				p.cursor--
			}
		case "enter":
			if p.cursor < len(p.projects) {
				p.activeID = p.projects[p.cursor].ID
			}
		}
	}
	return p, nil
}

func (p *projectsPage) SetSize(w, h int) {
	p.width = w
	p.height = h
}

func (p *projectsPage) ShortHelp() string {
	return "j/k navigate  enter select"
}

func (p *projectsPage) KeyBinds() []string {
	return []string{"j", "k", "up", "down", "enter"}
}

func (p *projectsPage) View() string {
	if p.client == nil {
		return components.EmptyState("Not connected", p.width, p.height)
	}
	if p.loading {
		return components.EmptyState("Loading projects...", p.width, p.height)
	}

	var b strings.Builder
	b.WriteString(theme.SectionHeader.Render("PROJECTS") + "\n\n")

	if len(p.projects) == 0 {
		b.WriteString(components.EmptyState("No projects found", p.width, p.height-4))
		return b.String()
	}

	for i, proj := range p.projects {
		meta := lipgloss.NewStyle().Foreground(theme.TextMuted).Render(proj.Key)
		if proj.ID == p.activeID {
			meta += "  " + lipgloss.NewStyle().Foreground(theme.Green).Render(theme.SymDot + " active")
		}
		b.WriteString(components.RenderListItem(proj.Name, meta, i == p.cursor) + "\n")
	}

	return b.String()
}
