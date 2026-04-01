package tui

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/components"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/pages"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

// spinnerTickMsg triggers a spinner frame advance.
type spinnerTickMsg struct{}

func spinnerTick() tea.Cmd {
	return tea.Tick(120*time.Millisecond, func(time.Time) tea.Msg {
		return spinnerTickMsg{}
	})
}

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
	width, height  int
	page           pages.Page
	prevPage       pages.Page // for back navigation
	pageModels     map[pages.Page]pages.PageModel
	sidebar        components.SidebarModel
	sidebarFocused bool
	topbar         components.TopBarModel
	statusbar      components.StatusBarModel
	toast          *components.ToastModel
	client         *api.ConvexClient
	config         *api.AuthConfig
	connected      bool
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
	authenticated := config != nil && api.HasUsableAuth(config) && client != nil

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
		page:           pages.PageDashboard,
		pageModels:     make(map[pages.Page]pages.PageModel),
		sidebar:        components.NewSidebar(),
		sidebarFocused: true,
		topbar:         topbar,
		statusbar:      statusbar,
		client:         client,
		config:         config,
		connected:      connected,
		authenticated:  authenticated,
		loginState:     LoginIdle,
		appState:       appState,
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
		return m.initPage(m.page)
	}
	return nil
}

// Update handles messages.
func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case spinnerTickMsg:
		if m.appState == StateLogin && m.loginState == LoginWaiting {
			spinnerFrame++
			return m, spinnerTick()
		}
		return m, nil

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
		m.client = api.NewClient(convexURL, m.config)
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
				spinnerFrame = 0
				return m, tea.Batch(startOAuthFlow(), spinnerTick())
			}
			if key == "enter" && m.loginState == LoginError {
				m.loginState = LoginWaiting
				m.loginError = ""
				spinnerFrame = 0
				return m, tea.Batch(startOAuthFlow(), spinnerTick())
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

		key := msg.String()

		if key == "q" || key == "ctrl+c" {
			return m, tea.Quit
		}

		if key == "r" {
			if cmd := m.initPage(m.page); cmd != nil {
				cmds = append(cmds, cmd)
			}
			return m, tea.Batch(cmds...)
		}

		if m.sidebarFocused {
			switch key {
			case "j", "down":
				m.sidebar.Move(1)
			case "k", "up":
				m.sidebar.Move(-1)
			case "enter", "right", "l":
				if cmd := m.enterSelectedPage(); cmd != nil {
					cmds = append(cmds, cmd)
				}
			default:
				if p, ok := pageFromSidebarKey(key); ok {
					m.sidebar.SetSelected(sidebarKeyForPage(p))
				}
			}
			return m, tea.Batch(cmds...)
		}

		if key == "esc" {
			if cmd := m.focusSidebar(); cmd != nil {
				cmds = append(cmds, cmd)
			}
			return m, tea.Batch(cmds...)
		}

		if cmd := m.updatePage(m.page, msg); cmd != nil {
			cmds = append(cmds, cmd)
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

	// Broadcast non-key messages to all pages so page-scoped async messages are
	// never dropped by the shell.
	if m.appState == StateReady {
		if cmd := m.updateAllPages(msg); cmd != nil {
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
			if m.selectedWS.ID == "" {
				m.selectorError = "Selected workspace is missing an _id"
				return m, nil
			}
			m.appState = StateSelectProject
			m.selectorCursor = 0
			m.selectorError = ""
			m.projects = nil
			return m, fetchProjects(m.client, m.selectedWS.ID)
		}
		if m.appState == StateSelectProject && len(m.projects) > 0 {
			selectedProj := m.projects[m.selectorCursor]
			if selectedProj.ID == "" {
				m.selectorError = "Selected project is missing an _id"
				return m, nil
			}

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
	m.pageModels[pages.PageGit] = pages.NewGitPage()
	m.pageModels[pages.PageProjects] = pages.NewProjectsPage(m.client, wsID, projID)
	m.pageModels[pages.PageSkills] = pages.NewSkillsPage(m.client, wsID, projID)
	m.pageModels[pages.PageSearch] = pages.NewSearchPage(m.client)
	m.pageModels[pages.PageNotifications] = pages.NewNotificationsPage(m.client, wsID, projID)
	m.pageModels[pages.PageSettings] = pages.NewSettingsPage(m.config)
	m.pageModels[pages.PageHelp] = pages.NewHelpPage()

	m.sidebarFocused = true
	m.sidebar.SyncSelectionToActive()

	// Resize all pages
	contentWidth, contentHeight := m.contentSize()
	for _, pm := range m.pageModels {
		pm.SetSize(contentWidth, contentHeight)
	}

	return m.initPage(m.page)
}

// View renders the full app layout.
func (m Model) View() tea.View {
	if m.width == 0 || m.height == 0 {
		v := tea.NewView("")
		v.AltScreen = true
		v.MouseMode = tea.MouseModeCellMotion
		return v
	}

	switch m.appState {
	case StateLogin:
		v := tea.NewView(theme.FillBackground(renderLoginScreen(m.loginState, m.loginError, m.width, m.height), m.width, m.height))
		v.AltScreen = true
		v.MouseMode = tea.MouseModeCellMotion
		return v

	case StateSelectWorkspace:
		v := tea.NewView(theme.FillBackground(m.renderWorkspaceSelector(), m.width, m.height))
		v.AltScreen = true
		v.MouseMode = tea.MouseModeCellMotion
		return v

	case StateSelectProject:
		v := tea.NewView(theme.FillBackground(m.renderProjectSelector(), m.width, m.height))
		v.AltScreen = true
		v.MouseMode = tea.MouseModeCellMotion
		return v
	}

	// StateReady — full dashboard
	topbar := m.topbar.View()
	statusbar := m.statusbar.View()
	sidebarModel := m.sidebar
	sidebarModel.Focused = m.sidebarFocused
	sidebar := sidebarModel.View()

	// Content area
	contentWidth, contentHeight := m.contentSize()

	var content string
	if pm, ok := m.pageModels[m.page]; ok {
		content = pm.View()
	}

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
	if m.sidebarFocused {
		helpHint = strings.Join([]string{
			theme.KeyHintKey.Render("j/k") + theme.KeyHintDesc.Render(" navigate"),
			theme.KeyHintKey.Render("enter") + theme.KeyHintDesc.Render(" open"),
			theme.KeyHintKey.Render("r") + theme.KeyHintDesc.Render(" refresh"),
			theme.KeyHintKey.Render("q") + theme.KeyHintDesc.Render(" quit"),
		}, "    ")
	} else if pm, ok := m.pageModels[m.page]; ok {
		h := pm.ShortHelp()
		if h != "" {
			helpHint = theme.TextDimStyle.Render(h + "  esc sidebar")
		} else {
			helpHint = theme.KeyHintKey.Render("esc") + theme.KeyHintDesc.Render(" sidebar")
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

	v := tea.NewView(theme.FillBackground(strings.Join(sections, "\n"), m.width, m.height))
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
		fmt.Sprintf("SELECT PROJECT  %s", theme.SubtitleTextStyle.Render(m.selectedWS.Name)),
		m.projectNames(),
		m.selectorCursor,
		m.selectorError,
	)
}

// renderSelector renders a generic centered selection list.
func (m Model) renderSelector(title string, items []string, cursor int, errMsg string) string {
	var lines []string

	// Title
	lines = append(lines, theme.BrandTextStyle.Render(title))
	lines = append(lines, "")

	if errMsg != "" {
		lines = append(lines, theme.ErrorTextStyle.Render(theme.SymCross+" "+errMsg))
		lines = append(lines, "")
		retryHint := theme.TextDimStyle.Render("Press r to retry")
		lines = append(lines, retryHint)
	} else if len(items) == 0 {
		lines = append(lines, theme.WarningTextStyle.Render(theme.SymDot+" Loading..."))
	} else {
		for i, item := range items {
			if i == cursor {
				indicator := theme.AccentTextStyle.Render(theme.SymArrowRight)
				name := theme.BrandTextStyle.Render(" " + item)
				lines = append(lines, indicator+name)
			} else {
				name := theme.TextMutedStyle.Render("  " + item)
				lines = append(lines, name)
			}
		}
	}

	lines = append(lines, "")

	// Footer hints
	hintParts := []string{}
	hintParts = append(hintParts,
		theme.KeyHintKey.Render("j/k")+theme.KeyHintDesc.Render(" navigate"))
	hintParts = append(hintParts,
		theme.KeyHintKey.Render("enter")+theme.KeyHintDesc.Render(" select"))
	if m.appState == StateSelectProject {
		hintParts = append(hintParts,
			theme.KeyHintKey.Render("esc")+theme.KeyHintDesc.Render(" back"))
	}
	hintParts = append(hintParts,
		theme.KeyHintKey.Render("q")+theme.KeyHintDesc.Render(" quit"))

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
			if item.ID == "" {
				return workspacesLoadedMsg{Err: fmt.Errorf("workspace response missing _id for %q", item.Name)}
			}
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
			if item.ID == "" {
				return projectsLoadedMsg{Err: fmt.Errorf("project response missing _id for %q", item.Name)}
			}
			result[i] = projectItem{ID: item.ID, Key: item.Key, Name: item.Name}
		}
		return projectsLoadedMsg{Items: result}
	}
}

// switchPage changes the active page and updates the sidebar.
func (m *Model) switchPage(p pages.Page) {
	m.prevPage = m.page
	m.page = p

	if key := sidebarKeyForPage(p); key != "" {
		m.sidebar.SetActive(key)
		m.sidebar.SetSelected(key)
	}
}

func (m *Model) initPage(p pages.Page) tea.Cmd {
	if pm, ok := m.pageModels[p]; ok {
		return pm.Init()
	}
	return nil
}

func (m *Model) updatePage(p pages.Page, msg tea.Msg) tea.Cmd {
	pm, ok := m.pageModels[p]
	if !ok {
		return nil
	}

	newPM, cmd := pm.Update(msg)
	m.pageModels[p] = newPM
	return cmd
}

func (m *Model) updateAllPages(msg tea.Msg) tea.Cmd {
	var cmds []tea.Cmd
	for page := range m.pageModels {
		if cmd := m.updatePage(page, msg); cmd != nil {
			cmds = append(cmds, cmd)
		}
	}
	return tea.Batch(cmds...)
}

func (m *Model) focusSidebar() tea.Cmd {
	if m.sidebarFocused {
		return nil
	}

	m.sidebarFocused = true
	m.sidebar.SyncSelectionToActive()
	return m.updatePage(m.page, pages.PageBlurredMsg{})
}

func (m *Model) enterSelectedPage() tea.Cmd {
	page, ok := pageFromSidebarKey(m.sidebar.SelectedKey())
	if !ok {
		return nil
	}

	m.switchPage(page)
	m.sidebarFocused = false

	var cmds []tea.Cmd
	if cmd := m.initPage(m.page); cmd != nil {
		cmds = append(cmds, cmd)
	}
	if cmd := m.updatePage(m.page, pages.PageFocusedMsg{}); cmd != nil {
		cmds = append(cmds, cmd)
	}

	return tea.Batch(cmds...)
}

func pageFromSidebarKey(key string) (pages.Page, bool) {
	switch key {
	case "d":
		return pages.PageDashboard, true
	case "t":
		return pages.PageTasks, true
	case "s":
		return pages.PageSprint, true
	case "a":
		return pages.PageAgent, true
	case "g":
		return pages.PageGit, true
	case "p":
		return pages.PageProjects, true
	case "k":
		return pages.PageSkills, true
	case "/":
		return pages.PageSearch, true
	case "n":
		return pages.PageNotifications, true
	case ",":
		return pages.PageSettings, true
	case "?":
		return pages.PageHelp, true
	default:
		return pages.PageDashboard, false
	}
}

func sidebarKeyForPage(p pages.Page) string {
	switch p {
	case pages.PageDashboard:
		return "d"
	case pages.PageTasks:
		return "t"
	case pages.PageSprint:
		return "s"
	case pages.PageAgent:
		return "a"
	case pages.PageGit:
		return "g"
	case pages.PageProjects:
		return "p"
	case pages.PageSkills:
		return "k"
	case pages.PageSearch:
		return "/"
	case pages.PageNotifications:
		return "n"
	case pages.PageSettings:
		return ","
	case pages.PageHelp:
		return "?"
	default:
		return ""
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
