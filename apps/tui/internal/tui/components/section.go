package components

import (
	"strings"

	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

// BorderedSection renders content inside a rounded box with the header
// embedded in the top border line:
//
//	╭─ SECTION HEADER ──────────────────────╮
//	│                                       │
//	│  Content here                         │
//	│                                       │
//	╰───────────────────────────────────────╯
func BorderedSection(header, content string, width int) string {
	if width < 10 {
		width = 10
	}

	borderStyle := lipgloss.NewStyle().Foreground(theme.BorderDefault)
	headerStyle := lipgloss.NewStyle().Bold(true).Foreground(theme.TextPrimary)

	// Build top border: ╭─ HEADER ─────────╮
	headerText := " " + header + " "
	headerRendered := headerStyle.Render(headerText)
	headerVisualW := lipgloss.Width(headerRendered)

	topLeft := borderStyle.Render(theme.BoxTL + theme.BoxH)
	topRight := borderStyle.Render(theme.BoxTR)

	fillW := width - 2 - 1 - headerVisualW - 1 // 2 for ╭─, 1 for ╮, headerW already accounted
	if fillW < 1 {
		fillW = 1
	}
	topFill := borderStyle.Render(strings.Repeat(theme.BoxH, fillW))
	topLine := topLeft + headerRendered + topFill + topRight

	// Build bottom border: ╰───────────────╯
	bottomFillW := width - 2 // for ╰ and ╯
	if bottomFillW < 1 {
		bottomFillW = 1
	}
	bottomLine := borderStyle.Render(theme.BoxBL + strings.Repeat(theme.BoxH, bottomFillW) + theme.BoxBR)

	// Build content lines with side borders
	contentLines := strings.Split(content, "\n")
	innerW := width - 4 // 2 for "│ " left and " │" right
	if innerW < 1 {
		innerW = 1
	}

	var lines []string
	lines = append(lines, topLine)

	leftBorder := borderStyle.Render(theme.BoxV) + " "
	rightBorder := " " + borderStyle.Render(theme.BoxV)

	for _, cl := range contentLines {
		visW := lipgloss.Width(cl)
		pad := innerW - visW
		if pad < 0 {
			pad = 0
		}
		lines = append(lines, leftBorder+cl+strings.Repeat(" ", pad)+rightBorder)
	}

	lines = append(lines, bottomLine)

	return strings.Join(lines, "\n")
}

// KeyHint formats a single key hint in bracket notation: [key] action
func KeyHint(key, action string) string {
	return theme.KeyHintKey.Render("["+key+"]") + theme.KeyHintDesc.Render(" "+action)
}

// KeyHints joins multiple key hints with spacing.
func KeyHints(hints ...string) string {
	return strings.Join(hints, "  ")
}

// ActionBar renders a bottom action bar with key hints on a subtle background.
func ActionBar(width int, hints ...string) string {
	content := KeyHints(hints...)
	style := lipgloss.NewStyle().
		Width(width).
		Padding(0, 1).
		Background(theme.BgSurface)
	return style.Render(content)
}
