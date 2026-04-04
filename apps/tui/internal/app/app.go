package app

import (
	"strings"
	"time"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/pages"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/theme"
)

// tickMsg is sent on every poll interval.
type tickMsg time.Time

// authState describes the current authentication state of the TUI.
type authState int

const (
	authOK          authState = iota // Fully authenticated with project context
	authNeedLogin                    // No auth token or token expired
	authNeedProject                  // Authenticated but no workspace/project selected
)

// Model is the top-level Bubble Tea model for the TUI shell.
type Model struct {
	page   pages.Page
	width  int
	height int

	client *api.ConvexClient
	config *api.AuthConfig
	auth   authState

	// Page models
	pageModels map[pages.Page]pages.PageModel

	// Shared state
	connected bool
	ready     bool
}

// New creates a new App model.
func New(client *api.ConvexClient, config *api.AuthConfig) Model {
	// Determine auth state
	as := authOK
	if config == nil || !api.IsAuthenticated(config) {
		as = authNeedLogin
	} else if !api.HasProjectContext(config) {
		as = authNeedProject
	}

	m := Model{
		page:       pages.PageDashboard,
		client:     client,
		config:     config,
		auth:       as,
		connected:  as == authOK && client != nil,
		pageModels: make(map[pages.Page]pages.PageModel),
	}

	// Only initialize pages if fully authenticated
	if as == authOK {
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
	}

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
		if m.auth == authOK {
			contentW, contentH := m.contentSize()
			for _, pm := range m.pageModels {
				pm.SetSize(contentW, contentH)
			}
		}

		return m, nil

	case tickMsg:
		return m, tickEvery()

	case tea.KeyPressMsg:
		key := tea.Key(msg)

		// Quit — always available
		if key.Code == 'q' && key.Mod == 0 {
			return m, tea.Quit
		}
		if key.Code == tea.KeyEscape {
			return m, tea.Quit
		}

		// On login/setup screens, only quit works
		if m.auth != authOK {
			return m, nil
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
	if m.auth == authOK {
		updated, cmd := m.currentPage().Update(msg)
		m.pageModels[m.page] = updated
		return m, cmd
	}
	return m, nil
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
	// Header = 1 line, StatusBar = 1 line
	headerHeight := 1
	statusBarHeight := 1

	contentHeight := m.height - headerHeight - statusBarHeight
	if contentHeight < 1 {
		contentHeight = 1
	}

	// Sidebar uses background separation, no border char needed
	contentWidth := m.width - sidebarWidth
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

	// Show login or setup screen if not fully authenticated
	if m.auth != authOK {
		full := m.renderAuthScreen()
		view := tea.NewView(full)
		view.AltScreen = true
		view.MouseMode = tea.MouseModeCellMotion
		return view
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

// renderAuthScreen renders the full-screen login or setup screen.
func (m Model) renderAuthScreen() string {
	logo := lipgloss.NewStyle().
		Foreground(theme.AccentColor).
		Bold(true).
		Render("LTF1")

	var title, command, subtitle string
	if m.auth == authNeedLogin {
		title = "Not authenticated"
		command = "ltf auth login"
		subtitle = "Run the command above in another terminal,\nthen restart the TUI."
	} else {
		title = "No project selected"
		command = "ltf project select"
		subtitle = "Run the command above in another terminal,\nthen restart the TUI."
	}

	titleStyle := lipgloss.NewStyle().
		Foreground(theme.TextColor).
		Bold(true)

	cmdStyle := lipgloss.NewStyle().
		Foreground(theme.AccentColor).
		Bold(true).
		Background(theme.SurfaceColor).
		Padding(0, 2)

	subtitleStyle := lipgloss.NewStyle().
		Foreground(theme.TextMuted).
		Align(lipgloss.Center)

	quitStyle := lipgloss.NewStyle().
		Foreground(theme.TextDim)

	// Build the card content
	var lines []string
	lines = append(lines, "")
	lines = append(lines, logo)
	lines = append(lines, "")
	lines = append(lines, titleStyle.Render(title))
	lines = append(lines, "")
	lines = append(lines, cmdStyle.Render(command))
	lines = append(lines, "")
	lines = append(lines, subtitleStyle.Render(subtitle))
	lines = append(lines, "")
	lines = append(lines, quitStyle.Render("press q to quit"))
	lines = append(lines, "")

	content := lipgloss.JoinVertical(lipgloss.Center, lines...)

	// Center the card on screen
	card := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(theme.BorderColor).
		Padding(1, 4).
		Align(lipgloss.Center).
		Render(content)

	// Calculate vertical centering
	cardHeight := strings.Count(card, "\n") + 1
	topPad := (m.height - cardHeight) / 2
	if topPad < 0 {
		topPad = 0
	}

	padded := strings.Repeat("\n", topPad) + card

	return lipgloss.NewStyle().
		Background(theme.BgColor).
		Width(m.width).
		Height(m.height).
		Align(lipgloss.Center).
		Render(padded)
}

// SetPage allows external code to switch the active page.
func (m *Model) SetPage(p pages.Page) {
	m.page = p
}

// SetPageModel replaces a page model (used when agents implement real pages).
func (m *Model) SetPageModel(p pages.Page, pm pages.PageModel) {
	m.pageModels[p] = pm
}
