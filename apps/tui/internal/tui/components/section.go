package components

import (
	"regexp"
	"strings"

	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

// ansiPattern matches ANSI escape sequences for width-safe truncation.
var ansiPattern = regexp.MustCompile(`\x1b\[[0-9;]*m`)

// BorderedSection renders content inside a rounded box with the header
// embedded in the top border line:
//
//	╭─ SECTION HEADER ──────────────────────╮
//	│                                       │
//	│  Content here                         │
//	│                                       │
//	╰───────────────────────────────────────╯
//
// Content lines that exceed the inner width are truncated with an ellipsis.
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

	fillW := width - 2 - 1 - headerVisualW - 1
	if fillW < 1 {
		fillW = 1
	}
	topFill := borderStyle.Render(strings.Repeat(theme.BoxH, fillW))
	topLine := topLeft + headerRendered + topFill + topRight

	// Build bottom border: ╰───────────────╯
	bottomFillW := width - 2
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
		if visW > innerW {
			// Truncate the line to fit within the box
			cl = truncateAnsi(cl, innerW-1) + theme.TextDimStyle.Render(theme.SymEllipsis)
		}
		visW = lipgloss.Width(cl)
		pad := innerW - visW
		if pad < 0 {
			pad = 0
		}
		lines = append(lines, leftBorder+cl+strings.Repeat(" ", pad)+rightBorder)
	}

	lines = append(lines, bottomLine)

	return strings.Join(lines, "\n")
}

// truncateAnsi truncates a string that may contain ANSI escape sequences
// to maxWidth visible characters, preserving ANSI codes.
func truncateAnsi(s string, maxWidth int) string {
	if maxWidth <= 0 {
		return ""
	}

	var result strings.Builder
	visWidth := 0
	i := 0
	runes := []rune(s)

	for i < len(runes) {
		// Check for ANSI escape sequence
		remaining := string(runes[i:])
		if loc := ansiPattern.FindStringIndex(remaining); loc != nil && loc[0] == 0 {
			// Write the entire ANSI sequence without counting width
			seq := remaining[loc[0]:loc[1]]
			result.WriteString(seq)
			i += len([]rune(seq))
			continue
		}

		if visWidth >= maxWidth {
			break
		}

		result.WriteRune(runes[i])
		visWidth++
		i++
	}

	// Close any open ANSI sequences with a reset
	result.WriteString("\x1b[0m")

	return result.String()
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
