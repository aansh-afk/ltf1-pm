package theme

import (
	"image/color"
	"strings"

	"charm.land/lipgloss/v2"
)

// Shell chrome styles

var TopBarStyle = lipgloss.NewStyle().
	Background(BgSurface).
	Padding(1, 2).
	BorderStyle(lipgloss.NormalBorder()).
	BorderBottom(true).
	BorderForeground(BorderSubtle)

var SidebarStyle = lipgloss.NewStyle().
	Width(SidebarWidth).
	Background(BgBase).
	BorderStyle(lipgloss.NormalBorder()).
	BorderRight(true).
	BorderForeground(BorderSubtle)

var StatusBarStyle = lipgloss.NewStyle().
	Background(BgSurface).
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

var AccentTextStyle = lipgloss.NewStyle().
	Foreground(Indigo).
	Bold(true)

var SuccessTextStyle = lipgloss.NewStyle().
	Foreground(Green)

var ErrorTextStyle = lipgloss.NewStyle().
	Foreground(Red)

var WarningTextStyle = lipgloss.NewStyle().
	Foreground(Amber)

var SuccessBoldStyle = lipgloss.NewStyle().
	Foreground(Green).
	Bold(true)

var WarningBoldStyle = lipgloss.NewStyle().
	Foreground(Amber).
	Bold(true)

var BrandTextStyle = lipgloss.NewStyle().
	Foreground(TextPrimary).
	Bold(true)

var SubtitleTextStyle = lipgloss.NewStyle().
	Foreground(TextMuted)

var LoginMapStyle = lipgloss.NewStyle().
	Foreground(MapDim)

var FieldLabelStyle = lipgloss.NewStyle().
	Foreground(TextMuted).
	Width(20)

var FieldValueStyle = lipgloss.NewStyle().
	Foreground(TextPrimary)

var SidebarSelectedMarkerStyle = lipgloss.NewStyle().
	Foreground(Indigo).
	Bold(true)

var SidebarActiveMarkerStyle = lipgloss.NewStyle().
	Foreground(TextDim)

var SidebarSelectedStyle = lipgloss.NewStyle().
	Foreground(Indigo).
	Bold(true)

var SidebarActiveStyle = lipgloss.NewStyle().
	Foreground(TextSecondary).
	Bold(true)

var SidebarInactiveStyle = lipgloss.NewStyle().
	Foreground(TextMuted)

var SkillTextStyle = lipgloss.NewStyle().
	Foreground(Purple)

var TopBarContextStyle = lipgloss.NewStyle().
	Foreground(TextMuted)

var StatusBarBranchStyle = lipgloss.NewStyle().
	Foreground(Green)

var StatusBarPathStyle = lipgloss.NewStyle().
	Foreground(TextDim)

var StatusBarAccentStyle = lipgloss.NewStyle().
	Foreground(Indigo)

var ModalTitleStyle = lipgloss.NewStyle().
	Bold(true).
	Foreground(TextPrimary).
	MarginBottom(1)

var ModalBodyStyle = lipgloss.NewStyle().
	Foreground(TextSecondary)

var ModalHintStyle = lipgloss.NewStyle().
	Foreground(TextMuted).
	MarginTop(1)

var ListItemTitleSelectedStyle = lipgloss.NewStyle().
	Bold(true).
	Foreground(TextPrimary)

var ListItemMetaSelectedStyle = lipgloss.NewStyle().
	Foreground(TextSecondary)

var ListItemTitleStyle = lipgloss.NewStyle().
	Foreground(TextSecondary)

var ListItemMetaStyle = lipgloss.NewStyle().
	Foreground(TextMuted)

var InputPromptStyle = lipgloss.NewStyle().
	Foreground(Indigo)

var InputTextStyle = lipgloss.NewStyle().
	Foreground(TextPrimary)

var InputPlaceholderStyle = lipgloss.NewStyle().
	Foreground(TextDim)

var InputBlurredPromptStyle = lipgloss.NewStyle().
	Foreground(TextMuted)

var InputBlurredTextStyle = lipgloss.NewStyle().
	Foreground(TextSecondary)

var KeyColumnStyle = lipgloss.NewStyle().
	Width(8)

// Badge base

var BadgeStyle = lipgloss.NewStyle().
	Padding(0, 1)

// Key hint

var KeyHintKey = lipgloss.NewStyle().
	Foreground(TextMuted)

var KeyHintDesc = lipgloss.NewStyle().
	Foreground(TextMuted)

// ActionBarStyle is a subtle background strip for bottom action bars.
var ActionBarStyle = lipgloss.NewStyle().
	Background(BgSurface).
	Padding(0, 1)

// FilterBracketStyle for filter dropdowns [ Status: All ]
var FilterLabelStyle = lipgloss.NewStyle().
	Foreground(TextMuted)

var FilterValueStyle = lipgloss.NewStyle().
	Foreground(TextPrimary).
	Bold(true)

func ColorTextStyle(c color.Color) lipgloss.Style {
	return lipgloss.NewStyle().Foreground(c)
}

func ColorBoldStyle(c color.Color) lipgloss.Style {
	return lipgloss.NewStyle().Foreground(c).Bold(true)
}

func WidthStyle(width int) lipgloss.Style {
	return lipgloss.NewStyle().Width(width)
}

func EmptyStateStyle(width int) lipgloss.Style {
	return lipgloss.NewStyle().
		Foreground(TextMuted).
		Align(lipgloss.Center).
		Width(width)
}

func OffsetStyle(left, top int) lipgloss.Style {
	return lipgloss.NewStyle().
		PaddingLeft(left).
		PaddingTop(top)
}

// bgAnsi is the ANSI escape for BgBase (#0A0A0A = RGB 10,10,10).
// Used by FillBackground to patch reset gaps.
const bgAnsi = "\x1b[48;2;10;10;10m"

// FillBackground ensures every cell on screen has BgBase as its background.
// It works by injecting BgBase after every ANSI reset sequence so the terminal
// default background never shows through between styled text segments.
func FillBackground(content string, width, height int) string {
	if width <= 0 || height <= 0 {
		return content
	}

	// Inject BgBase after every ANSI reset to prevent terminal default bg gaps
	content = strings.ReplaceAll(content, "\x1b[0m", "\x1b[0m"+bgAnsi)
	content = strings.ReplaceAll(content, "\x1b[m", "\x1b[m"+bgAnsi)

	lines := strings.Split(content, "\n")
	if len(lines) > height {
		lines = lines[:height]
	}
	for len(lines) < height {
		lines = append(lines, "")
	}

	// Each line: start with BgBase, pad to full width, end with reset
	for i, line := range lines {
		visW := lipgloss.Width(line)
		pad := width - visW
		if pad < 0 {
			pad = 0
		}
		lines[i] = bgAnsi + line + strings.Repeat(" ", pad) + "\x1b[0m"
	}

	return strings.Join(lines, "\n")
}
