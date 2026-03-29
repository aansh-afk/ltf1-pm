package pages

import tea "charm.land/bubbletea/v2"

// PageModel is the interface that all TUI pages must implement.
// Each page manages its own state and rendering within the given dimensions.
type PageModel interface {
	// Init returns an optional initial command for the page.
	Init() tea.Cmd

	// Update handles messages and returns the updated page model and command.
	Update(msg tea.Msg) (PageModel, tea.Cmd)

	// View renders the page content within the given width and height.
	View(width, height int) string

	// SetSize informs the page of its available dimensions.
	SetSize(width, height int)

	// ShortHelp returns a string of keyboard shortcuts for the status bar.
	ShortHelp() string
}

// Page enumerates the available pages in the TUI.
type Page int

const (
	PageDashboard Page = iota
	PageTasks
	PageSprint
	PageAgent
	PageSkills
	PageGit
	PageProjects
	PageSearch
	PageNotifications
	PageSettings
	PageHelp
)

// PageName returns the display name for a page.
func PageName(p Page) string {
	switch p {
	case PageDashboard:
		return "Dashboard"
	case PageTasks:
		return "Tasks"
	case PageSprint:
		return "Sprint"
	case PageAgent:
		return "Agent"
	case PageSkills:
		return "Skills"
	case PageGit:
		return "Git"
	case PageProjects:
		return "Projects"
	case PageSearch:
		return "Search"
	case PageNotifications:
		return "Notifications"
	case PageSettings:
		return "Settings"
	case PageHelp:
		return "Help"
	default:
		return "Unknown"
	}
}
