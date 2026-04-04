package theme

import (
	"image/color"

	"charm.land/lipgloss/v2"
)

// ONE background everywhere. No layering. Clean like OpenCode.
var (
	BgColor      = lipgloss.Color("#111111")
	SidebarBg    = lipgloss.Color("#111111") // same as bg — no separation
	SurfaceColor = lipgloss.Color("#111111")
	ContentBg    = lipgloss.Color("#111111")
	CardColor    = lipgloss.Color("#111111")
)

// Text hierarchy — this is how we create structure, not backgrounds
var (
	TextColor     = lipgloss.Color("#F9FAFB") // bold headers, primary content
	TextSecondary = lipgloss.Color("#9CA3AF") // body text, values
	TextMuted     = lipgloss.Color("#6B7280") // metadata, timestamps
	TextDim       = lipgloss.Color("#444444") // very subtle, dividers
)

// Borders — used very sparingly
var (
	BorderColor  = lipgloss.Color("#333333")
	BorderFocus  = lipgloss.Color("#6366F1")
	BorderSubtle = lipgloss.Color("#222222")
	PanelBorder  = lipgloss.Color("#333333")
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

// --- Reusable styles ---

// SectionHeader — bold white, clean
var SectionHeader = lipgloss.NewStyle().
	Bold(true).
	Foreground(TextColor).
	MarginBottom(1)

// SubtlePanel — left border only, NO background
var SubtlePanel = lipgloss.NewStyle().
	Border(lipgloss.ThickBorder(), false, false, false, true).
	BorderForeground(PanelBorder).
	PaddingLeft(1).
	PaddingRight(1)

// ActivePanel — left border in accent
var ActivePanel = lipgloss.NewStyle().
	Border(lipgloss.ThickBorder(), false, false, false, true).
	BorderForeground(AccentColor).
	PaddingLeft(1).
	PaddingRight(1)

// FocusedPanel
var FocusedPanel = lipgloss.NewStyle().
	Border(lipgloss.ThickBorder(), false, false, false, true).
	BorderForeground(BorderFocus).
	PaddingLeft(1).
	PaddingRight(1)

// StatusBarStyle — subtle bottom bar
var StatusBarStyle = lipgloss.NewStyle().
	Foreground(TextDim).
	Padding(0, 1)

// Legacy aliases
var PanelStyle = SubtlePanel
var FocusedPanelStyle = ActivePanel

var HeaderStyle = lipgloss.NewStyle().
	Bold(true).
	Foreground(TextColor)

var LabelStyle = lipgloss.NewStyle().
	Foreground(TextMuted)

var AccentStyle = lipgloss.NewStyle().
	Foreground(AccentColor).
	Bold(true)

var MutedStyle = lipgloss.NewStyle().
	Foreground(TextMuted)

var DimStyle = lipgloss.NewStyle().
	Foreground(TextDim)

var ErrorStyle = lipgloss.NewStyle().
	Foreground(RedColor)

var SuccessStyle = lipgloss.NewStyle().
	Foreground(GreenColor)

var WarningStyle = lipgloss.NewStyle().
	Foreground(AmberColor)

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

// LeftBorderPanel creates a panel with a colored left border. No background.
func LeftBorderPanel(borderColor color.Color) lipgloss.Style {
	return lipgloss.NewStyle().
		Border(lipgloss.ThickBorder(), false, false, false, true).
		BorderForeground(borderColor).
		PaddingLeft(1).
		PaddingRight(1)
}
