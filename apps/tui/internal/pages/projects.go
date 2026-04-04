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

// --- data types ---

type projectItem struct {
	ID        string
	Name      string
	Key       string
	TaskCount int
	Sprint    string
	HasRepo   bool
}

// --- messages ---

type projectsLoadedMsg struct {
	projects []projectItem
}

type projectsErrMsg struct {
	err error
}

// --- model ---

type projectsModel struct {
	projects []projectItem
	cursor   int
	selected int // index of active project, -1 = none
	showInfo bool
	width    int
	height   int
	loading  bool
	err      error
	client   *api.ConvexClient
	config   *api.AuthConfig
}

func NewProjectsPage(client *api.ConvexClient, config *api.AuthConfig) PageModel {
	return &projectsModel{
		selected: -1,
		loading:  true,
		client:   client,
		config:   config,
	}
}

// PageModel interface

func (m *projectsModel) Init() tea.Cmd {
	return m.loadProjects()
}

func (m *projectsModel) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil

	case projectsLoadedMsg:
		m.projects = msg.projects
		m.loading = false
		return m, nil

	case projectsErrMsg:
		m.err = msg.err
		m.loading = false
		return m, nil

	case tea.KeyMsg:
		if m.loading {
			return m, nil
		}
		switch msg.String() {
		case "j", "down":
			if m.cursor < len(m.projects)-1 {
				m.cursor++
			}
		case "k", "up":
			if m.cursor > 0 {
				m.cursor--
			}
		case "enter":
			if len(m.projects) > 0 {
				m.selected = m.cursor
			}
		case "i":
			if len(m.projects) > 0 {
				m.showInfo = !m.showInfo
			}
		case "r":
			m.loading = true
			m.err = nil
			return m, m.loadProjects()
		}
	}

	return m, nil
}

func (m *projectsModel) View(width, height int) string {
	header := theme.AccentStyle.Render("  PROJECTS")

	if m.loading {
		return lipgloss.JoinVertical(lipgloss.Left, "", header, "",
			theme.MutedStyle.Render("  Loading projects..."))
	}

	if m.err != nil {
		return lipgloss.JoinVertical(lipgloss.Left, "", header, "",
			theme.ErrorStyle.Render("  Error: "+m.err.Error()), "",
			theme.DimStyle.Render("  Press r to retry"))
	}

	if len(m.projects) == 0 {
		return lipgloss.JoinVertical(lipgloss.Left, "", header, "",
			theme.MutedStyle.Render("  No projects found."))
	}

	contentWidth := width - 4
	if contentWidth < 40 {
		contentWidth = 60
	}

	var rows []string
	for i, p := range m.projects {
		cursor := "  "
		diamond := theme.MutedStyle.Render("\u25c7") // ◇
		if i == m.cursor {
			cursor = lipgloss.NewStyle().Foreground(theme.AccentColor).Render("> ")
			diamond = lipgloss.NewStyle().Foreground(theme.AccentColor).Render("\u25c6") // ◆
		}
		if i == m.selected {
			diamond = lipgloss.NewStyle().Foreground(theme.GreenColor).Render("\u25c6") // ◆ green = active
		}

		name := lipgloss.NewStyle().Foreground(theme.TextColor).Width(20).Render(p.Name)
		tasks := lipgloss.NewStyle().Foreground(theme.TextSecondary).Width(12).Render(fmt.Sprintf("%d tasks", p.TaskCount))

		sprint := theme.DimStyle.Width(12).Render("\u2014") // —
		if p.Sprint != "" {
			sprint = lipgloss.NewStyle().Foreground(theme.CyanColor).Width(12).Render(p.Sprint)
		}

		repo := theme.MutedStyle.Render("\u25cb no repo") // ○
		if p.HasRepo {
			repo = lipgloss.NewStyle().Foreground(theme.GreenColor).Render("\u2299 linked") // ⊙
		}

		rows = append(rows, fmt.Sprintf("%s%s %s %s %s %s", cursor, diamond, name, tasks, sprint, repo))
	}

	listBox := theme.SubtlePanel.Width(contentWidth).Render(strings.Join(rows, "\n"))

	parts := []string{"", header, "", listBox}

	// info panel
	if m.showInfo && m.cursor < len(m.projects) {
		p := m.projects[m.cursor]
		label := lipgloss.NewStyle().Foreground(theme.TextMuted).Width(14)
		val := lipgloss.NewStyle().Foreground(theme.TextColor)

		sprintVal := "\u2014"
		if p.Sprint != "" {
			sprintVal = p.Sprint
		}
		repoVal := "no"
		if p.HasRepo {
			repoVal = "yes"
		}

		info := fmt.Sprintf("  %s %s\n  %s %s\n  %s %s\n  %s %s",
			label.Render("Name:"), val.Render(p.Name),
			label.Render("Tasks:"), val.Render(fmt.Sprintf("%d", p.TaskCount)),
			label.Render("Sprint:"), val.Render(sprintVal),
			label.Render("Linked repo:"), val.Render(repoVal),
		)

		infoBox := theme.SubtlePanel.Width(contentWidth).Render(info)

		parts = append(parts, "", infoBox)
	}

	// footer hints
	hintKey := lipgloss.NewStyle().Foreground(theme.AccentColor)
	hint := theme.DimStyle
	footer := fmt.Sprintf("  %s %s  %s %s  %s %s  %s %s",
		hintKey.Render("j/k"), hint.Render("navigate"),
		hintKey.Render("enter"), hint.Render("select"),
		hintKey.Render("i"), hint.Render("info"),
		hintKey.Render("r"), hint.Render("refresh"))
	parts = append(parts, "", footer)

	return lipgloss.JoinVertical(lipgloss.Left, parts...)
}

func (m *projectsModel) SetSize(width, height int) {
	m.width = width
	m.height = height
}

func (m *projectsModel) ShortHelp() string {
	return "j/k navigate | enter select | i info | r refresh"
}

// --- commands ---

func (m *projectsModel) loadProjects() tea.Cmd {
	return func() tea.Msg {
		if m.client == nil {
			return projectsLoadedMsg{projects: sampleProjects()}
		}

		// Fetch projects from Convex
		raw, err := m.client.Query("projects/queries:getWorkspaceProjects", nil)
		if err != nil {
			return projectsErrMsg{err: err}
		}

		var apiProjects []api.Project
		if err := json.Unmarshal(raw, &apiProjects); err != nil {
			return projectsErrMsg{err: fmt.Errorf("parse projects: %w", err)}
		}

		var projects []projectItem
		for _, p := range apiProjects {
			projects = append(projects, projectItem{
				ID:   p.ID,
				Name: p.Name,
				Key:  p.Key,
			})
		}
		if len(projects) == 0 {
			return projectsLoadedMsg{projects: sampleProjects()}
		}
		return projectsLoadedMsg{projects: projects}
	}
}

func sampleProjects() []projectItem {
	return []projectItem{
		{ID: "1", Name: "LTF1-Core", Key: "CORE", TaskCount: 12, Sprint: "Sprint 3", HasRepo: true},
		{ID: "2", Name: "LTF1-Docs", Key: "DOCS", TaskCount: 4, Sprint: "", HasRepo: false},
		{ID: "3", Name: "LTF1-Mobile", Key: "MOB", TaskCount: 8, Sprint: "Sprint 1", HasRepo: true},
	}
}
