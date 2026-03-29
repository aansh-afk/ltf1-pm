package theme

import "charm.land/lipgloss/v2"

// Brand
var (
	Indigo      = lipgloss.Color("#6366F1")
	IndigoMuted = lipgloss.Color("#4F46E5")
	IndigoDim   = lipgloss.Color("#3730A3")
)

// Semantic
var (
	Green  = lipgloss.Color("#22C55E")
	Red    = lipgloss.Color("#EF4444")
	Amber  = lipgloss.Color("#F59E0B")
	Purple = lipgloss.Color("#8B5CF6")
	Cyan   = lipgloss.Color("#06B6D4")
)

// Text hierarchy
var (
	TextPrimary   = lipgloss.Color("#F9FAFB")
	TextSecondary = lipgloss.Color("#9CA3AF")
	TextMuted     = lipgloss.Color("#6B7280")
	TextDim       = lipgloss.Color("#444444")
)

// Backgrounds
var (
	BgBase      = lipgloss.Color("#0A0A0A")
	BgSurface   = lipgloss.Color("#111111")
	BgElevated  = lipgloss.Color("#1A1A1A")
	BgHighlight = lipgloss.Color("#222222")
	BgSubtle    = lipgloss.Color("#1E1E1E")
)

// Borders
var (
	BorderDefault = lipgloss.Color("#2A2A2A")
	BorderFocused = Indigo
	BorderSubtle  = lipgloss.Color("#1F1F1F")
)
