package theme

import (
	"image/color"

	"charm.land/lipgloss/v2"
)

// Background layering: #000000 (base) → #0A0A0A (sidebar) → #0D0D0D (content) → #1A1A1A (interactive)
var (
	BgColor      = lipgloss.Color("#000000")
	SidebarBg    = lipgloss.Color("#0A0A0A")
	SurfaceColor = lipgloss.Color("#111111")
	ContentBg    = lipgloss.Color("#0D0D0D")
	CardColor    = lipgloss.Color("#1A1A1A")
)

// Text hierarchy
var (
	TextColor     = lipgloss.Color("#F9FAFB")
	TextSecondary = lipgloss.Color("#9CA3AF")
	TextMuted     = lipgloss.Color("#6B7280")
	TextDim       = lipgloss.Color("#555555")
)

// Borders — used sparingly
var (
	BorderColor  = lipgloss.Color("#2E2E35")
	BorderFocus  = lipgloss.Color("#6366F1")
	BorderSubtle = lipgloss.Color("#1F1F23")
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

// SectionHeader — bold, accent colored, no border
var SectionHeader = lipgloss.NewStyle().
	Bold(true).
	Foreground(AccentColor).
	MarginBottom(1)

// SubtlePanel — left border accent instead of full box
var SubtlePanel = lipgloss.NewStyle().
	Border(lipgloss.ThickBorder(), false, false, false, true).
	BorderForeground(PanelBorder).
	PaddingLeft(1).
	PaddingRight(1).
	Background(ContentBg)

// ActivePanel — left border in accent color
var ActivePanel = lipgloss.NewStyle().
	Border(lipgloss.ThickBorder(), false, false, false, true).
	BorderForeground(AccentColor).
	PaddingLeft(1).
	PaddingRight(1).
	Background(ContentBg)

// FocusedPanel — left border in specific accent for focused interactive elements
var FocusedPanel = lipgloss.NewStyle().
	Border(lipgloss.ThickBorder(), false, false, false, true).
	BorderForeground(BorderFocus).
	PaddingLeft(1).
	PaddingRight(1).
	Background(ContentBg)

// StatusBarStyle for the bottom bar
var StatusBarStyle = lipgloss.NewStyle().
	Background(SurfaceColor).
	Foreground(TextMuted).
	Padding(0, 1)

// Legacy PanelStyle — kept for compatibility but now uses left-border accent
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

// LeftBorderPanel creates a panel with a colored left border.
func LeftBorderPanel(borderColor color.Color) lipgloss.Style {
	return lipgloss.NewStyle().
		Border(lipgloss.ThickBorder(), false, false, false, true).
		BorderForeground(borderColor).
		PaddingLeft(1).
		PaddingRight(1).
		Background(ContentBg)
}
