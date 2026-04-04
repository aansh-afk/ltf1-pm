package pages

import tea "charm.land/bubbletea/v2"

// Page identifies a TUI page.
type Page int

const (
	PageDashboard Page = iota
	PageTasks
	PageSprint
	PageAgent
	PageGit
	PageProjects
	PageSkills
	PageSearch
	PageNotifications
	PageSettings
	PageHelp
)

// PageModel is the interface every page must implement.
type PageModel interface {
	Init() tea.Cmd
	Update(msg tea.Msg) (PageModel, tea.Cmd)
	View() string
	SetSize(width, height int)
	ShortHelp() string

	// KeyBinds returns the set of key strings this page handles.
	// The app shell will delegate these keys to the page instead of
	// treating them as global navigation shortcuts.
	KeyBinds() []string

	// HasModal returns true if the page currently has a modal open.
	// When true, the shell sends esc to the page instead of focusing the sidebar.
	HasModal() bool
}

// PageFocusedMsg is sent by the shell when a page enters focused mode.
type PageFocusedMsg struct{}

// PageBlurredMsg is sent by the shell when focus returns to the sidebar.
type PageBlurredMsg struct{}

// ShowToastMsg is returned by pages to request a toast in the shell.
type ShowToastMsg struct {
	Message string
	IsError bool
}

// RefreshPageMsg tells the shell to re-init the current page.
type RefreshPageMsg struct{}
