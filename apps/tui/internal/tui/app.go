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
	pageModels    map[pages.Page]pages.PageModel
	sidebar       components.SidebarModel
	topbar        components.TopBarModel
	statusbar     components.StatusBarModel
	toast         *components.ToastModel
	client        *api.ConvexClient
	config        *api.AuthConfig
	connected     bool
	inputMode     bool
}

// NewModel creates the root model.
func NewModel(client *api.ConvexClient, config *api.AuthConfig) Model {
	connected := client != nil

	topbar := components.NewTopBar()
	topbar.Connected = connected
	if config != nil {
		topbar.Workspace = config.Context.WorkspaceName
		topbar.Project = config.Context.ProjectName
	}

	statusbar := components.NewStatusBar()

	m := Model{
		page:       pages.PageDashboard,
		pageModels: make(map[pages.Page]pages.PageModel),
		sidebar:    components.NewSidebar(),
		topbar:     topbar,
		statusbar:  statusbar,
		client:     client,
		config:     config,
		connected:  connected,
	}

	// Register all pages
	m.pageModels[pages.PageDashboard] = pages.NewDashboardPage(client)
	m.pageModels[pages.PageTasks] = pages.NewTasksPage(client)
	m.pageModels[pages.PageSprint] = pages.NewSprintPage(client)
	m.pageModels[pages.PageAgent] = pages.NewAgentPage(client)
	m.pageModels[pages.PageGit] = pages.NewGitPage()
	m.pageModels[pages.PageProjects] = pages.NewProjectsPage(client)
	m.pageModels[pages.PageSkills] = pages.NewSkillsPage(client)
	m.pageModels[pages.PageSearch] = pages.NewSearchPage(client)
	m.pageModels[pages.PageNotifications] = pages.NewNotificationsPage(client)
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

	topbar := m.topbar.View()
	statusbar := m.statusbar.View()
	sidebar := m.sidebar.View()

	// Content area
	contentWidth, contentHeight := m.contentSize()

	var content string
	if pm, ok := m.pageModels[m.page]; ok {
		content = pm.View()
	}

	// Constrain content width and center
	contentStyle := lipgloss.NewStyle().
		Width(contentWidth).
		Height(contentHeight).
		MaxWidth(theme.ContentMaxWidth).
		Background(theme.BgBase)

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
		Background(theme.BgBase).
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
