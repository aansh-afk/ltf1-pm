package app

import (
	"time"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/pages"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/theme"
)

// tickMsg is sent on every poll interval.
type tickMsg time.Time

// Model is the top-level Bubble Tea model for the TUI shell.
type Model struct {
	page   pages.Page
	width  int
	height int

	client *api.ConvexClient
	config *api.AuthConfig

	// Page models
	pageModels map[pages.Page]pages.PageModel

	// Shared state
	connected bool
	ready     bool
}

// New creates a new App model.
func New(client *api.ConvexClient, config *api.AuthConfig) Model {
	m := Model{
		page:       pages.PageDashboard,
		client:     client,
		config:     config,
		connected:  client != nil && config != nil && api.IsAuthenticated(config),
		pageModels: make(map[pages.Page]pages.PageModel),
	}

	// Initialize all page stubs
	m.pageModels[pages.PageDashboard] = pages.NewDashboardPage(client, config)
	m.pageModels[pages.PageTasks] = pages.NewTasksPage(client, config)
	m.pageModels[pages.PageSprint] = pages.NewSprintPage(client, config)
	m.pageModels[pages.PageAgent] = pages.NewAgentPage(client, config)
	m.pageModels[pages.PageSkills] = pages.NewSkillsPage(client, config)
	m.pageModels[pages.PageGit] = pages.NewGitPage(client, config)
	m.pageModels[pages.PageProjects] = pages.NewProjectsPage(client, config)
	m.pageModels[pages.PageSearch] = pages.NewSearchPage(client, config)
	m.pageModels[pages.PageNotifications] = pages.NewNotificationsPage(client, config)
	m.pageModels[pages.PageSettings] = pages.NewSettingsPage(client, config)
	m.pageModels[pages.PageHelp] = pages.NewHelpPage(client, config)

	return m
}

func (m Model) currentPage() pages.PageModel {
	if p, ok := m.pageModels[m.page]; ok {
		return p
	}
	return pages.NewStubPage(m.page, m.client, m.config)
}

func tickEvery() tea.Cmd {
	return tea.Every(10*time.Second, func(t time.Time) tea.Msg {
		return tickMsg(t)
	})
}

func (m Model) Init() tea.Cmd {
	var cmds []tea.Cmd

	// Initialize all pages
	for _, pm := range m.pageModels {
		if cmd := pm.Init(); cmd != nil {
			cmds = append(cmds, cmd)
		}
	}

	// Start background polling
	cmds = append(cmds, tickEvery())

	return tea.Batch(cmds...)
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.ready = true

		// Inform all pages of the content area size
		contentW, contentH := m.contentSize()
		for _, pm := range m.pageModels {
			pm.SetSize(contentW, contentH)
		}

		return m, nil

	case tickMsg:
		// Background polling — pages can use this to refresh data
		return m, tickEvery()

	case tea.KeyPressMsg:
		// Global shortcuts (only when not in a focused input)
		key := tea.Key(msg)

		// Quit
		if key.Code == 'q' && key.Mod == 0 {
			return m, tea.Quit
		}
		if key.Code == tea.KeyEscape {
			return m, tea.Quit
		}

		// Navigation shortcuts
		if key.Mod == 0 {
			if newPage, ok := m.navKeyToPage(key.Code); ok {
				m.page = newPage
				return m, nil
			}
		}

		// Forward to active page
		updated, cmd := m.currentPage().Update(msg)
		m.pageModels[m.page] = updated
		return m, cmd
	}

	// Forward other messages to active page
	updated, cmd := m.currentPage().Update(msg)
	m.pageModels[m.page] = updated
	return m, cmd
}

// navKeyToPage maps a key rune to a page for global navigation.
func (m Model) navKeyToPage(code rune) (pages.Page, bool) {
	switch code {
	case 'd':
		return pages.PageDashboard, true
	case 't':
		return pages.PageTasks, true
	case 's':
		return pages.PageSprint, true
	case 'a':
		return pages.PageAgent, true
	case 'k':
		return pages.PageSkills, true
	case 'g':
		return pages.PageGit, true
	case 'p':
		return pages.PageProjects, true
	case 'n':
		return pages.PageNotifications, true
	case ',':
		return pages.PageSettings, true
	case '?':
		return pages.PageHelp, true
	default:
		return 0, false
	}
}

// contentSize returns the width and height available for the page content area.
func (m Model) contentSize() (int, int) {
	// Header = 1 line, StatusBar = 1 line, borders ~2
	headerHeight := 1
	statusBarHeight := 1

	contentHeight := m.height - headerHeight - statusBarHeight
	if contentHeight < 1 {
		contentHeight = 1
	}

	// Sidebar takes sidebarWidth + 1 for border
	contentWidth := m.width - sidebarWidth - 1
	if contentWidth < 1 {
		contentWidth = 1
	}

	return contentWidth, contentHeight
}

func (m Model) View() tea.View {
	if !m.ready {
		v := tea.NewView("  Loading...")
		v.AltScreen = true
		v.MouseMode = tea.MouseModeCellMotion
		return v
	}

	header := m.renderHeader()

	contentW, contentH := m.contentSize()
	sidebar := m.renderSidebar(contentH)
	content := m.currentPage().View(contentW, contentH)

	statusbar := m.renderStatusBar()

	// Join sidebar and content horizontally
	body := lipgloss.JoinHorizontal(lipgloss.Top, sidebar, content)

	// Stack vertically: header + body + statusbar
	screen := lipgloss.JoinVertical(lipgloss.Left, header, body, statusbar)

	// Apply background
	full := lipgloss.NewStyle().
		Background(theme.BgColor).
		Width(m.width).
		Height(m.height).
		Render(screen)

	view := tea.NewView(full)
	view.AltScreen = true
	view.MouseMode = tea.MouseModeCellMotion
	return view
}

// SetPage allows external code to switch the active page.
func (m *Model) SetPage(p pages.Page) {
	m.page = p
}

// SetPageModel replaces a page model (used when agents implement real pages).
func (m *Model) SetPageModel(p pages.Page, pm pages.PageModel) {
	m.pageModels[p] = pm
}
