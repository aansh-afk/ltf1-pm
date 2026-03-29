package tui

import (
	"strings"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/components"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/pages"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

// Model is the root Bubble Tea model.
type Model struct {
	width, height int
	page          pages.Page
	prevPage      pages.Page // for back navigation
	pageModels    map[pages.Page]pages.PageModel
	sidebar       components.SidebarModel
	topbar        components.TopBarModel
	statusbar     components.StatusBarModel
	toast         *components.ToastModel
	client        *api.ConvexClient
	config        *api.AuthConfig
	connected     bool
	inputMode     bool
	// Login flow
	authenticated bool
	loginState    LoginState
	loginError    string
}

// NewModel creates the root model.
func NewModel(client *api.ConvexClient, config *api.AuthConfig) Model {
	connected := client != nil
	authenticated := config != nil && api.IsAuthenticated(config) && client != nil

	topbar := components.NewTopBar()
	topbar.Connected = connected
	if config != nil {
		topbar.Workspace = config.Context.WorkspaceName
		topbar.Project = config.Context.ProjectName
	}

	statusbar := components.NewStatusBar()

	m := Model{
		page:          pages.PageDashboard,
		pageModels:    make(map[pages.Page]pages.PageModel),
		sidebar:       components.NewSidebar(),
		topbar:        topbar,
		statusbar:     statusbar,
		client:        client,
		config:        config,
		connected:     connected,
		authenticated: authenticated,
		loginState:    LoginIdle,
	}

	// Get workspace/project IDs from config
	var wsID, projID string
	if config != nil {
		wsID = config.Context.WorkspaceID
		projID = config.Context.ProjectID
	}

	// Register all pages with workspace/project context
	m.pageModels[pages.PageDashboard] = pages.NewDashboardPage(client, wsID, projID)
	m.pageModels[pages.PageTasks] = pages.NewTasksPage(client, wsID, projID)
	m.pageModels[pages.PageSprint] = pages.NewSprintPage(client, wsID, projID)
	m.pageModels[pages.PageAgent] = pages.NewAgentPage(client, wsID, projID)
	m.pageModels[pages.PageGit] = pages.NewGitPage()
	m.pageModels[pages.PageProjects] = pages.NewProjectsPage(client, wsID, projID)
	m.pageModels[pages.PageSkills] = pages.NewSkillsPage(client, wsID, projID)
	m.pageModels[pages.PageSearch] = pages.NewSearchPage(client)
	m.pageModels[pages.PageNotifications] = pages.NewNotificationsPage(client, wsID, projID)
	m.pageModels[pages.PageSettings] = pages.NewSettingsPage(config)
	m.pageModels[pages.PageHelp] = pages.NewHelpPage()

	return m
}

// Init initializes the current page.
func (m Model) Init() tea.Cmd {
	if pm, ok := m.pageModels[m.page]; ok {
		return pm.Init()
	}
	return nil
}

// Update handles messages.
func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case pages.LogoutMsg:
		// User logged out — show login screen again
		m.authenticated = false
		m.loginState = LoginIdle
		m.client = nil
		m.config = nil
		return m, nil

	case AuthResult:
		// OAuth callback received
		if msg.Err != nil {
			m.loginState = LoginError
			m.loginError = msg.Err.Error()
			return m, nil
		}
		// Success — set up the client and transition to dashboard
		m.config = msg.Config
		m.loginState = LoginSuccess
		m.authenticated = true

		// Create Convex client with new token
		convexURL := api.GetConvexURL(m.config)
		m.client = api.NewClient(convexURL, m.config.Auth.Token)
		m.connected = true
		m.topbar.Connected = true
		m.topbar.Workspace = m.config.Context.WorkspaceName
		m.topbar.Project = m.config.Context.ProjectName

		// Reinitialize pages with new client
		wsID := m.config.Context.WorkspaceID
		projID := m.config.Context.ProjectID
		m.pageModels[pages.PageDashboard] = pages.NewDashboardPage(m.client, wsID, projID)
		m.pageModels[pages.PageTasks] = pages.NewTasksPage(m.client, wsID, projID)
		m.pageModels[pages.PageSprint] = pages.NewSprintPage(m.client, wsID, projID)
		m.pageModels[pages.PageAgent] = pages.NewAgentPage(m.client, wsID, projID)
		m.pageModels[pages.PageProjects] = pages.NewProjectsPage(m.client, wsID, projID)
		m.pageModels[pages.PageSkills] = pages.NewSkillsPage(m.client, wsID, projID)
		m.pageModels[pages.PageNotifications] = pages.NewNotificationsPage(m.client, wsID, projID)
		m.pageModels[pages.PageSettings] = pages.NewSettingsPage(m.config)

		// Init the dashboard
		return m, m.pageModels[pages.PageDashboard].Init()

	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.topbar.Width = msg.Width
		m.statusbar.Width = msg.Width

		contentWidth, contentHeight := m.contentSize()
		m.sidebar.Height = contentHeight
		for _, pm := range m.pageModels {
			pm.SetSize(contentWidth, contentHeight)
		}
		return m, nil

	case tea.KeyMsg:
		// LOGIN SCREEN — handle keys when not authenticated
		if !m.authenticated {
			key := msg.String()
			if key == "q" || key == "ctrl+c" {
				return m, tea.Quit
			}
			if key == "enter" && m.loginState == LoginIdle {
				m.loginState = LoginWaiting
				return m, startOAuthFlow()
			}
			if key == "enter" && m.loginState == LoginError {
				// Retry
				m.loginState = LoginWaiting
				m.loginError = ""
				return m, startOAuthFlow()
			}
			return m, nil
		}

		// Let toast dismiss on any key if warning
		if m.toast != nil && m.toast.Visible {
			t, cmd := m.toast.Update(msg)
			m.toast = &t
			if cmd != nil {
				cmds = append(cmds, cmd)
			}
		}

		// If in input mode, Escape exits input mode.
		// All other keys go to the active page (for text input).
		if m.inputMode {
			key := msg.String()
			if key == "esc" {
				m.inputMode = false
				// Also delegate esc to the page so it can unfocus input
				if pm, ok := m.pageModels[m.page]; ok {
					newPM, cmd := pm.Update(msg)
					m.pageModels[m.page] = newPM
					if cmd != nil {
						cmds = append(cmds, cmd)
					}
				}
				return m, tea.Batch(cmds...)
			}
			// q still quits even in input mode (Ctrl+C is safer for forms)
			if key == "ctrl+c" {
				return m, tea.Quit
			}
			// Delegate to active page for text input
			if pm, ok := m.pageModels[m.page]; ok {
				newPM, cmd := pm.Update(msg)
				m.pageModels[m.page] = newPM
				if cmd != nil {
					cmds = append(cmds, cmd)
				}
			}
			return m, tea.Batch(cmds...)
		}

		key := msg.String()

		// q and ctrl+c always quit regardless of page
		if key == "q" || key == "ctrl+c" {
			return m, tea.Quit
		}

		// Esc = go back to previous page (or dashboard if no history)
		if key == "esc" {
			if m.page != pages.PageDashboard {
				if m.prevPage != m.page {
					m.switchPage(m.prevPage)
				} else {
					m.switchPage(pages.PageDashboard)
				}
				return m, nil
			}
		}

		// Check if the current page claims this key.
		// If so, delegate to the page instead of global nav.
		pageClaims := false
		if pm, ok := m.pageModels[m.page]; ok {
			for _, bind := range pm.KeyBinds() {
				if bind == key {
					pageClaims = true
					break
				}
			}
		}

		if pageClaims {
			// Page gets priority for this key
			if pm, ok := m.pageModels[m.page]; ok {
				newPM, cmd := pm.Update(msg)
				m.pageModels[m.page] = newPM
				if cmd != nil {
					cmds = append(cmds, cmd)
				}
			}
			return m, tea.Batch(cmds...)
		}

		// Global key handling — only reached if page doesn't claim the key
		switch key {
		case "d":
			m.switchPage(pages.PageDashboard)
		case "t":
			m.switchPage(pages.PageTasks)
		case "s":
			m.switchPage(pages.PageSprint)
		case "a":
			m.switchPage(pages.PageAgent)
		case "g":
			m.switchPage(pages.PageGit)
		case "p":
			m.switchPage(pages.PageProjects)
		case "k":
			m.switchPage(pages.PageSkills)
		case "/":
			m.switchPage(pages.PageSearch)
			// Search page focuses its input via Init() — no need to set inputMode here
			// User can press Esc to unfocus and navigate away
		case "n":
			m.switchPage(pages.PageNotifications)
		case ",":
			m.switchPage(pages.PageSettings)
		case "?":
			m.switchPage(pages.PageHelp)
		case "r":
			// Refresh current page
			if pm, ok := m.pageModels[m.page]; ok {
				cmd := pm.Init()
				if cmd != nil {
					cmds = append(cmds, cmd)
				}
			}
		default:
			// Delegate unclaimed keys to active page
			if pm, ok := m.pageModels[m.page]; ok {
				newPM, cmd := pm.Update(msg)
				m.pageModels[m.page] = newPM
				if cmd != nil {
					cmds = append(cmds, cmd)
				}
			}
		}
		return m, tea.Batch(cmds...)
	}

	// Handle toast timeout
	if m.toast != nil {
		t, cmd := m.toast.Update(msg)
		m.toast = &t
		if cmd != nil {
			cmds = append(cmds, cmd)
		}
	}

	// Delegate non-key messages to active page
	if pm, ok := m.pageModels[m.page]; ok {
		newPM, cmd := pm.Update(msg)
		m.pageModels[m.page] = newPM
		if cmd != nil {
			cmds = append(cmds, cmd)
		}
	}

	return m, tea.Batch(cmds...)
}

// View renders the full app layout.
func (m Model) View() tea.View {
	if m.width == 0 || m.height == 0 {
		return tea.NewView("")
	}

	// LOGIN SCREEN — full screen when not authenticated
	if !m.authenticated {
		return tea.NewView(renderLoginScreen(m.loginState, m.loginError, m.width, m.height))
	}

	topbar := m.topbar.View()
	statusbar := m.statusbar.View()
	sidebar := m.sidebar.View()

	// Content area
	contentWidth, contentHeight := m.contentSize()

	var content string
	if pm, ok := m.pageModels[m.page]; ok {
		content = pm.View()
	}

	// Constrain content width — NO Background (tea.View.BackgroundColor handles it)
	contentStyle := lipgloss.NewStyle().
		Width(contentWidth).
		Height(contentHeight).
		MaxWidth(theme.ContentMaxWidth)

	renderedContent := contentStyle.Render(content)

	// Join sidebar and content horizontally
	middle := lipgloss.JoinHorizontal(lipgloss.Top, sidebar, renderedContent)

	// Toast overlay
	var toastLine string
	if m.toast != nil && m.toast.Visible {
		toastLine = m.toast.View()
	}

	// Help hints at bottom of content
	helpHint := ""
	if pm, ok := m.pageModels[m.page]; ok {
		h := pm.ShortHelp()
		if h != "" {
			helpHint = theme.TextDimStyle.Render(h)
		}
	}

	// Build full layout
	var sections []string
	sections = append(sections, topbar, middle)
	if toastLine != "" {
		sections = append(sections, toastLine)
	}
	if helpHint != "" {
		sections = append(sections, helpHint)
	}
	sections = append(sections, statusbar)

	fullView := lipgloss.NewStyle().
		Width(m.width).
		Height(m.height).
		Render(strings.Join(sections, "\n"))

	v := tea.NewView(fullView)
	v.BackgroundColor = theme.BgBase
	v.AltScreen = true
	v.MouseMode = tea.MouseModeCellMotion
	return v
}

// switchPage changes the active page and updates the sidebar.
func (m *Model) switchPage(p pages.Page) {
	m.prevPage = m.page
	m.page = p
	m.inputMode = false

	// Map page to sidebar key
	keyMap := map[pages.Page]string{
		pages.PageDashboard:     "d",
		pages.PageTasks:         "t",
		pages.PageSprint:        "s",
		pages.PageAgent:         "a",
		pages.PageGit:           "g",
		pages.PageProjects:      "p",
		pages.PageSkills:        "k",
		pages.PageSearch:        "/",
		pages.PageNotifications: "n",
		pages.PageSettings:      ",",
		pages.PageHelp:          "?",
	}

	if key, ok := keyMap[p]; ok {
		m.sidebar.SetActive(key)
	}
}

// contentSize calculates the available content area dimensions.
func (m Model) contentSize() (int, int) {
	// topbar: 3 lines (1 padding top + 1 content + 1 padding bottom) + 1 border = ~4
	// statusbar: 1 line + 1 border = ~2
	topbarHeight := lipgloss.Height(m.topbar.View())
	statusbarHeight := lipgloss.Height(m.statusbar.View())

	contentWidth := m.width - theme.SidebarWidth - 1 // -1 for border
	if contentWidth < 0 {
		contentWidth = 0
	}

	contentHeight := m.height - topbarHeight - statusbarHeight
	if contentHeight < 0 {
		contentHeight = 0
	}

	return contentWidth, contentHeight
}
