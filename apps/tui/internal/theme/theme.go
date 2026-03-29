package theme

import (
	"image/color"

	"charm.land/lipgloss/v2"
)

// Backgrounds
var (
	BgColor      = lipgloss.Color("#000000")
	SurfaceColor = lipgloss.Color("#111111")
	CardColor    = lipgloss.Color("#1A1A1A")
)

// Text
var (
	TextColor     = lipgloss.Color("#F9FAFB")
	TextSecondary = lipgloss.Color("#9CA3AF")
	TextMuted     = lipgloss.Color("#6B7280")
	TextDim       = lipgloss.Color("#555555")
)

// Borders
var (
	BorderColor  = lipgloss.Color("#2E2E35")
	BorderFocus  = lipgloss.Color("#6366F1")
	BorderSubtle = lipgloss.Color("#1F1F23")
)

// Accent
var AccentColor = lipgloss.Color("#6366F1")

// Semantic
var (
	GreenColor  = lipgloss.Color("#22C55E")
	RedColor    = lipgloss.Color("#EF4444")
	AmberColor  = lipgloss.Color("#F59E0B")
	PurpleColor = lipgloss.Color("#8B5CF6")
	CyanColor   = lipgloss.Color("#06B6D4")
)

// StatusColors maps task status to color.
var StatusColors = map[string]color.Color{
	"backlog":     lipgloss.Color("#6B7280"),
	"todo":        lipgloss.Color("#9CA3AF"),
	"in_progress": lipgloss.Color("#6366F1"),
	"in_review":   lipgloss.Color("#F59E0B"),
	"done":        lipgloss.Color("#22C55E"),
	"cancelled":   lipgloss.Color("#EF4444"),
}

// PriorityColors maps task priority to color.
var PriorityColors = map[string]color.Color{
	"urgent":      lipgloss.Color("#EF4444"),
	"high":        lipgloss.Color("#F59E0B"),
	"medium":      lipgloss.Color("#6366F1"),
	"low":         lipgloss.Color("#6B7280"),
	"no_priority": lipgloss.Color("#555555"),
}

// Reusable styles
var (
	PanelStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(BorderColor).
			Padding(0, 1)

	FocusedPanelStyle = lipgloss.NewStyle().
				Border(lipgloss.RoundedBorder()).
				BorderForeground(BorderFocus).
				Padding(0, 1)

	HeaderStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(TextColor)

	LabelStyle = lipgloss.NewStyle().
			Foreground(TextMuted)

	AccentStyle = lipgloss.NewStyle().
			Foreground(AccentColor).
			Bold(true)

	MutedStyle = lipgloss.NewStyle().
			Foreground(TextMuted)

	DimStyle = lipgloss.NewStyle().
			Foreground(TextDim)

	ErrorStyle = lipgloss.NewStyle().
			Foreground(RedColor)

	SuccessStyle = lipgloss.NewStyle().
			Foreground(GreenColor)

	WarningStyle = lipgloss.NewStyle().
			Foreground(AmberColor)
)

// StatusStyle returns a styled string for a given task status.
func StatusStyle(status string) lipgloss.Style {
	c, ok := StatusColors[status]
	if !ok {
		c = TextMuted
	}
	return lipgloss.NewStyle().Foreground(c)
}

// PriorityStyle returns a styled string for a given priority.
func PriorityStyle(priority string) lipgloss.Style {
	c, ok := PriorityColors[priority]
	if !ok {
		c = TextDim
	}
	return lipgloss.NewStyle().Foreground(c)
}
