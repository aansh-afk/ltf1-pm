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
}
