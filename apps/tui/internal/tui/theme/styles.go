package theme

import "charm.land/lipgloss/v2"

// Shell chrome styles

var TopBarStyle = lipgloss.NewStyle().
	Padding(1, 2).
	BorderStyle(lipgloss.NormalBorder()).
	BorderBottom(true).
	BorderForeground(BorderSubtle)

var SidebarStyle = lipgloss.NewStyle().
	Width(SidebarWidth).
	BorderStyle(lipgloss.NormalBorder()).
	BorderRight(true).
	BorderForeground(BorderSubtle)

var StatusBarStyle = lipgloss.NewStyle().
	BorderStyle(lipgloss.NormalBorder()).
	BorderTop(true).
	BorderForeground(BorderSubtle)

// Section headers

var SectionHeader = lipgloss.NewStyle().
	Bold(true).
	Foreground(TextPrimary).
	MarginBottom(SpaceXS)

// List items

var ListItemStyle = lipgloss.NewStyle().
	Padding(0, 1)

var ListItemSelected = lipgloss.NewStyle().
	Background(BgHighlight).
	Bold(true).
	Padding(0, 1)

// Modal

var ModalStyle = lipgloss.NewStyle().
	Background(BgElevated).
	BorderStyle(lipgloss.RoundedBorder()).
	BorderForeground(BorderDefault).
	Padding(1, 2).
	MaxWidth(60)

// Input

var InputStyle = lipgloss.NewStyle().
	BorderStyle(lipgloss.RoundedBorder()).
	BorderForeground(BorderDefault)

var InputFocusedStyle = lipgloss.NewStyle().
	BorderStyle(lipgloss.RoundedBorder()).
	BorderForeground(BorderFocused)

// Toast styles

var ToastSuccess = lipgloss.NewStyle().
	Foreground(Green).
	Bold(true).
	Padding(0, 1)

var ToastError = lipgloss.NewStyle().
	Foreground(Red).
	Bold(true).
	Padding(0, 1)

var ToastWarning = lipgloss.NewStyle().
	Foreground(Amber).
	Bold(true).
	Padding(0, 1)

// Text helpers

var TextPrimaryStyle = lipgloss.NewStyle().
	Foreground(TextPrimary)

var TextSecondaryStyle = lipgloss.NewStyle().
	Foreground(TextSecondary)

var TextMutedStyle = lipgloss.NewStyle().
	Foreground(TextMuted)

var TextDimStyle = lipgloss.NewStyle().
	Foreground(TextDim)

// Badge base

var BadgeStyle = lipgloss.NewStyle().
	Padding(0, 1)

// Key hint

var KeyHintKey = lipgloss.NewStyle().
	Foreground(Indigo).
	Bold(true)

var KeyHintDesc = lipgloss.NewStyle().
	Foreground(TextMuted)
