package tui

import (
	"encoding/json"
	"fmt"
	"strings"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/components"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/pages"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

// AppState tracks the post-auth onboarding flow.
type AppState int

const (
	StateLogin           AppState = iota // Not authenticated
	StateSelectWorkspace                 // Authenticated, picking workspace
	StateSelectProject                   // Workspace picked, picking project
	StateReady                           // Everything selected, show dashboard
)

// Workspace/Project list items fetched from Convex
type workspaceItem struct {
	ID   string
	Name string
}

type projectItem struct {
	ID   string
	Key  string
	Name string
}

// Messages for async fetches
type workspacesLoadedMsg struct {
	Items []workspaceItem
	Err   error
}

type projectsLoadedMsg struct {
	Items []projectItem
	Err   error
}

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
	// Post-auth selection flow
	appState       AppState
	workspaces     []workspaceItem
	projects       []projectItem
	selectorCursor int
	selectorError  string
	selectedWS     workspaceItem // workspace chosen, used while picking project
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

	// Determine initial app state
	appState := StateLogin
	if authenticated {
		if api.HasProjectContext(config) {
			appState = StateReady
		} else {
			appState = StateSelectWorkspace
		}
	}

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
		appState:      appState,
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
	// If we need workspace selection, fetch workspaces immediately
	if m.appState == StateSelectWorkspace && m.client != nil {
		return fetchWorkspaces(m.client)
	}
	if m.appState == StateReady {
		var cmds []tea.Cmd
		for _, pm := range m.pageModels {
			if cmd := pm.Init(); cmd != nil {
				cmds = append(cmds, cmd)
			}
		}
		return tea.Batch(cmds...)
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
		m.appState = StateLogin
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
		// Success — set up the client
		m.config = msg.Config
		m.loginState = LoginSuccess
		m.authenticated = true

		// Create Convex client with new token
		convexURL := api.GetConvexURL(m.config)
		m.client = api.NewClient(convexURL, m.config.Auth.Token)
		m.connected = true
		m.topbar.Connected = true

		// Check if config already has workspace+project
		if api.HasProjectContext(m.config) {
			m.appState = StateReady
			m.topbar.Workspace = m.config.Context.WorkspaceName
			m.topbar.Project = m.config.Context.ProjectName
			cmd := m.reinitPages()
			return m, cmd
		}

		// No context — go to workspace selection
		m.appState = StateSelectWorkspace
		m.selectorCursor = 0
		m.selectorError = ""
		return m, fetchWorkspaces(m.client)

	case workspacesLoadedMsg:
		if msg.Err != nil {
			m.selectorError = msg.Err.Error()
			return m, nil
		}
		m.workspaces = msg.Items
		m.selectorCursor = 0
		m.selectorError = ""
		return m, nil

	case projectsLoadedMsg:
		if msg.Err != nil {
			m.selectorError = msg.Err.Error()
			return m, nil
		}
		m.projects = msg.Items
		m.selectorCursor = 0
		m.selectorError = ""
		return m, nil

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
		// LOGIN SCREEN
		if m.appState == StateLogin {
			key := msg.String()
			if key == "q" || key == "ctrl+c" {
				return m, tea.Quit
			}
			if key == "enter" && m.loginState == LoginIdle {
				m.loginState = LoginWaiting
				return m, startOAuthFlow()
			}
			if key == "enter" && m.loginState == LoginError {
				m.loginState = LoginWaiting
				m.loginError = ""
				return m, startOAuthFlow()
			}
			return m, nil
		}

		// WORKSPACE SELECTION
		if m.appState == StateSelectWorkspace {
			return m.handleSelectorKeys(msg)
		}

		// PROJECT SELECTION
		if m.appState == StateSelectProject {
			return m.handleSelectorKeys(msg)
		}

		// --- READY STATE (dashboard) ---

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

// handleSelectorKeys handles j/k/enter/q navigation for workspace and project pickers.
func (m Model) handleSelectorKeys(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	key := msg.String()

	switch key {
	case "q", "ctrl+c":
		return m, tea.Quit
	case "j", "down":
		maxIdx := m.selectorMaxIndex()
		if m.selectorCursor < maxIdx {
			m.selectorCursor++
		}
	case "k", "up":
		if m.selectorCursor > 0 {
			m.selectorCursor--
		}
	case "enter":
		if m.appState == StateSelectWorkspace && len(m.workspaces) > 0 {
			m.selectedWS = m.workspaces[m.selectorCursor]
			m.appState = StateSelectProject
			m.selectorCursor = 0
			m.selectorError = ""
			m.projects = nil
			return m, fetchProjects(m.client, m.selectedWS.ID)
		}
		if m.appState == StateSelectProject && len(m.projects) > 0 {
			selectedProj := m.projects[m.selectorCursor]

			// Save context to config
			ctx := api.ProjectInfo{
				WorkspaceID:   m.selectedWS.ID,
				WorkspaceName: m.selectedWS.Name,
				ProjectID:     selectedProj.ID,
				ProjectKey:    selectedProj.Key,
				ProjectName:   selectedProj.Name,
			}
			updatedCfg, err := api.SaveContext(ctx)
			if err != nil {
				m.selectorError = fmt.Sprintf("Failed to save config: %v", err)
				return m, nil
			}

			m.config = updatedCfg
			m.appState = StateReady
			m.topbar.Workspace = m.selectedWS.Name
			m.topbar.Project = selectedProj.Name
			cmd := m.reinitPages()
			return m, cmd
		}
	case "r":
		// Retry fetch on error
		if m.selectorError != "" {
			m.selectorError = ""
			if m.appState == StateSelectWorkspace {
				return m, fetchWorkspaces(m.client)
			}
			if m.appState == StateSelectProject {
				return m, fetchProjects(m.client, m.selectedWS.ID)
			}
		}
	case "esc":
		// In project selection, go back to workspace selection
		if m.appState == StateSelectProject {
			m.appState = StateSelectWorkspace
			m.selectorCursor = 0
			m.selectorError = ""
			return m, nil
		}
	}

	return m, nil
}

// selectorMaxIndex returns the max cursor index for the current selector state.
func (m Model) selectorMaxIndex() int {
	switch m.appState {
	case StateSelectWorkspace:
		if len(m.workspaces) == 0 {
			return 0
		}
		return len(m.workspaces) - 1
	case StateSelectProject:
		if len(m.projects) == 0 {
			return 0
		}
		return len(m.projects) - 1
	}
	return 0
}

// reinitPages recreates all pages with the current workspace/project IDs.
func (m *Model) reinitPages() tea.Cmd {
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

	// Resize all pages
	contentWidth, contentHeight := m.contentSize()
	for _, pm := range m.pageModels {
		pm.SetSize(contentWidth, contentHeight)
	}

	// Init ALL pages so they fetch their data
	var cmds []tea.Cmd
	for _, pm := range m.pageModels {
		if cmd := pm.Init(); cmd != nil {
			cmds = append(cmds, cmd)
		}
	}
	return tea.Batch(cmds...)
}

// View renders the full app layout.
func (m Model) View() tea.View {
	if m.width == 0 || m.height == 0 {
		return tea.NewView("")
	}

	switch m.appState {
	case StateLogin:
		v := tea.NewView(renderLoginScreen(m.loginState, m.loginError, m.width, m.height))
		v.BackgroundColor = theme.BgBase
		v.AltScreen = true
		return v

	case StateSelectWorkspace:
		v := tea.NewView(m.renderWorkspaceSelector())
		v.BackgroundColor = theme.BgBase
		v.AltScreen = true
		return v

	case StateSelectProject:
		v := tea.NewView(m.renderProjectSelector())
		v.BackgroundColor = theme.BgBase
		v.AltScreen = true
		return v
	}

	// StateReady — full dashboard
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

// renderWorkspaceSelector renders the centered workspace picker.
func (m Model) renderWorkspaceSelector() string {
	return m.renderSelector("SELECT WORKSPACE", m.workspaceNames(), m.selectorCursor, m.selectorError)
}

// renderProjectSelector renders the centered project picker.
func (m Model) renderProjectSelector() string {
	return m.renderSelector(
		fmt.Sprintf("SELECT PROJECT  %s", lipgloss.NewStyle().Foreground(theme.TextMuted).Render(m.selectedWS.Name)),
		m.projectNames(),
		m.selectorCursor,
		m.selectorError,
	)
}

// renderSelector renders a generic centered selection list.
func (m Model) renderSelector(title string, items []string, cursor int, errMsg string) string {
	var lines []string

	// Title
	titleStyle := lipgloss.NewStyle().Foreground(theme.TextPrimary).Bold(true)
	lines = append(lines, titleStyle.Render(title))
	lines = append(lines, "")

	if errMsg != "" {
		errStyle := lipgloss.NewStyle().Foreground(theme.Red)
		lines = append(lines, errStyle.Render(theme.SymCross+" "+errMsg))
		lines = append(lines, "")
		retryHint := lipgloss.NewStyle().Foreground(theme.TextDim).Render("Press r to retry")
		lines = append(lines, retryHint)
	} else if len(items) == 0 {
		loadingStyle := lipgloss.NewStyle().Foreground(theme.Amber)
		lines = append(lines, loadingStyle.Render(theme.SymDot+" Loading..."))
	} else {
		for i, item := range items {
			if i == cursor {
				indicator := lipgloss.NewStyle().Foreground(theme.Indigo).Bold(true).Render(theme.SymArrowRight)
				name := lipgloss.NewStyle().Foreground(theme.TextPrimary).Bold(true).Render(" " + item)
				lines = append(lines, indicator+name)
			} else {
				name := lipgloss.NewStyle().Foreground(theme.TextMuted).Render("  " + item)
				lines = append(lines, name)
			}
		}
	}

	lines = append(lines, "")

	// Footer hints
	hintParts := []string{}
	hintParts = append(hintParts,
		lipgloss.NewStyle().Foreground(theme.Indigo).Bold(true).Render("j/k")+
			lipgloss.NewStyle().Foreground(theme.TextDim).Render(" navigate"))
	hintParts = append(hintParts,
		lipgloss.NewStyle().Foreground(theme.Indigo).Bold(true).Render("enter")+
			lipgloss.NewStyle().Foreground(theme.TextDim).Render(" select"))
	if m.appState == StateSelectProject {
		hintParts = append(hintParts,
			lipgloss.NewStyle().Foreground(theme.Indigo).Bold(true).Render("esc")+
				lipgloss.NewStyle().Foreground(theme.TextDim).Render(" back"))
	}
	hintParts = append(hintParts,
		lipgloss.NewStyle().Foreground(theme.Indigo).Bold(true).Render("q")+
			lipgloss.NewStyle().Foreground(theme.TextDim).Render(" quit"))

	lines = append(lines, strings.Join(hintParts, "    "))

	// Center vertically
	content := strings.Join(lines, "\n")
	contentHeight := len(lines)
	topPad := (m.height - contentHeight) / 2
	if topPad < 0 {
		topPad = 0
	}

	// Center horizontally — find widest line
	maxWidth := 0
	for _, l := range lines {
		w := lipgloss.Width(l)
		if w > maxWidth {
			maxWidth = w
		}
	}
	leftPad := (m.width - maxWidth) / 2
	if leftPad < 0 {
		leftPad = 0
	}

	var out strings.Builder
	for i := 0; i < topPad; i++ {
		out.WriteString("\n")
	}
	for _, l := range strings.Split(content, "\n") {
		out.WriteString(strings.Repeat(" ", leftPad))
		out.WriteString(l)
		out.WriteString("\n")
	}

	return out.String()
}

func (m Model) workspaceNames() []string {
	names := make([]string, len(m.workspaces))
	for i, ws := range m.workspaces {
		names[i] = ws.Name
	}
	return names
}

func (m Model) projectNames() []string {
	names := make([]string, len(m.projects))
	for i, p := range m.projects {
		names[i] = p.Name
	}
	return names
}

// fetchWorkspaces returns a Cmd that queries Convex for user workspaces.
func fetchWorkspaces(client *api.ConvexClient) tea.Cmd {
	return func() tea.Msg {
		if client == nil {
			return workspacesLoadedMsg{Err: fmt.Errorf("no API client")}
		}

		raw, err := client.Query("workspaces/queries:getUserWorkspaces", nil)
		if err != nil {
			return workspacesLoadedMsg{Err: err}
		}

		var items []struct {
			ID   string `json:"_id"`
			Name string `json:"name"`
		}
		if err := json.Unmarshal(raw, &items); err != nil {
			return workspacesLoadedMsg{Err: fmt.Errorf("parse workspaces: %w", err)}
		}

		result := make([]workspaceItem, len(items))
		for i, item := range items {
			result[i] = workspaceItem{ID: item.ID, Name: item.Name}
		}
		return workspacesLoadedMsg{Items: result}
	}
}

// fetchProjects returns a Cmd that queries Convex for projects in a workspace.
func fetchProjects(client *api.ConvexClient, workspaceID string) tea.Cmd {
	return func() tea.Msg {
		if client == nil {
			return projectsLoadedMsg{Err: fmt.Errorf("no API client")}
		}

		raw, err := client.Query("projects/queries:getWorkspaceProjects", map[string]interface{}{
			"workspaceId": workspaceID,
		})
		if err != nil {
			return projectsLoadedMsg{Err: err}
		}

		var items []struct {
			ID   string `json:"_id"`
			Key  string `json:"key"`
			Name string `json:"name"`
		}
		if err := json.Unmarshal(raw, &items); err != nil {
			return projectsLoadedMsg{Err: fmt.Errorf("parse projects: %w", err)}
		}

		result := make([]projectItem, len(items))
		for i, item := range items {
			result[i] = projectItem{ID: item.ID, Key: item.Key, Name: item.Name}
		}
		return projectsLoadedMsg{Items: result}
	}
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
