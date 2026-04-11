package components

import (
	"fmt"
	"image/color"
	"strings"

	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

// sparkBlocks is the ramp of Unicode block characters used for charts.
// Index 0 is "empty" (handled specially as a dim bullet).
var sparkBlocks = []string{"▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"}

// sparkBlockIndex maps a value to a block index (0..7).
func sparkBlockIndex(v, max float64) int {
	if max <= 0 || v <= 0 {
		return -1
	}
	idx := int((v/max)*float64(len(sparkBlocks)-1) + 0.5)
	if idx < 0 {
		idx = 0
	}
	if idx >= len(sparkBlocks) {
		idx = len(sparkBlocks) - 1
	}
	return idx
}

// Sparkline renders a single-line sparkline from values into the given width.
// Zero values render as a dim bullet; non-zero values use block characters in
// the supplied color. If all values are zero, a full-width line of dim dots is
// returned instead.
func Sparkline(values []float64, width int, c color.Color) string {
	if width < 1 {
		width = 1
	}

	// If there's no data at all, render a full dim line.
	if len(values) == 0 {
		return theme.TextDimStyle.Render(strings.Repeat(theme.SymBullet, width))
	}

	// Fit values to width: downsample by bucket average if too many,
	// left-pad with zeros if too few.
	fitted := make([]float64, width)
	if len(values) >= width {
		bucket := float64(len(values)) / float64(width)
		for i := 0; i < width; i++ {
			start := int(float64(i) * bucket)
			end := int(float64(i+1) * bucket)
			if end <= start {
				end = start + 1
			}
			if end > len(values) {
				end = len(values)
			}
			sum := 0.0
			n := 0
			for j := start; j < end; j++ {
				sum += values[j]
				n++
			}
			if n > 0 {
				fitted[i] = sum / float64(n)
			}
		}
	} else {
		offset := width - len(values)
		for i, v := range values {
			fitted[offset+i] = v
		}
	}

	// Determine max value.
	max := 0.0
	for _, v := range fitted {
		if v > max {
			max = v
		}
	}

	if max <= 0 {
		return theme.TextDimStyle.Render(strings.Repeat(theme.SymBullet, width))
	}

	filled := theme.ColorTextStyle(c)
	dim := theme.TextDimStyle

	var b strings.Builder
	for _, v := range fitted {
		idx := sparkBlockIndex(v, max)
		if idx < 0 {
			b.WriteString(dim.Render(theme.SymBullet))
		} else {
			b.WriteString(filled.Render(sparkBlocks[idx]))
		}
	}
	return b.String()
}

// statusColor returns the theme color for a task status.
func statusColor(status string) color.Color {
	switch strings.ToLower(status) {
	case "backlog":
		return theme.TextMuted
	case "todo", "pending":
		return theme.Cyan
	case "in_progress", "in progress", "active":
		return theme.Indigo
	case "in_review", "in review", "review":
		return theme.Amber
	case "done", "completed":
		return theme.Green
	case "cancelled", "canceled":
		return theme.Red
	default:
		return theme.TextMuted
	}
}

// statusLabel returns the uppercase display label for a status key.
func statusLabel(status string) string {
	switch strings.ToLower(status) {
	case "in_progress", "in progress":
		return "IN PROGRESS"
	case "in_review", "in review":
		return "IN REVIEW"
	default:
		return strings.ToUpper(status)
	}
}

// StackedTaskBars renders a stack of horizontal bars — one row per task
// status — with counts on the right. It always shows the core statuses
// (backlog, todo, in_progress, done) for visual continuity even when empty.
func StackedTaskBars(counts map[string]int, width int) string {
	if width < 20 {
		width = 20
	}

	// Canonical row order. We always show these; additional statuses with
	// non-zero counts are appended below.
	coreOrder := []string{"backlog", "todo", "in_progress", "in_review", "done", "cancelled"}
	seen := map[string]bool{}
	rows := make([]string, 0, len(coreOrder))
	for _, k := range coreOrder {
		seen[k] = true
		rows = append(rows, k)
	}
	for k := range counts {
		if !seen[k] {
			rows = append(rows, k)
			seen[k] = true
		}
	}

	total := 0
	for _, v := range counts {
		total += v
	}

	// Compute max count to scale bars visually (not all against total).
	maxCount := 0
	for _, k := range rows {
		if counts[k] > maxCount {
			maxCount = counts[k]
		}
	}

	labelW := 12
	// "  12/120" -> up to 8 chars. Reserve 9.
	countW := 9
	spacing := 2
	barW := width - labelW - countW - spacing
	if barW < 5 {
		barW = 5
	}

	labelStyle := lipgloss.NewStyle().Foreground(theme.TextSecondary).Width(labelW)
	numStyle := lipgloss.NewStyle().Foreground(theme.TextPrimary).Bold(true)
	denomStyle := theme.TextDimStyle
	dimStyle := theme.TextDimStyle

	var lines []string
	for _, k := range rows {
		count := counts[k]
		label := labelStyle.Render(statusLabel(k))

		// Bar width relative to max count (or zero if empty).
		filled := 0
		if maxCount > 0 && count > 0 {
			filled = int(float64(count) / float64(maxCount) * float64(barW))
			if filled < 1 && count > 0 {
				filled = 1
			}
		}
		empty := barW - filled
		if empty < 0 {
			empty = 0
		}

		barStyle := theme.ColorTextStyle(statusColor(k))
		bar := barStyle.Render(strings.Repeat(theme.SymBlockFull, filled)) +
			dimStyle.Render(strings.Repeat(theme.SymBlockLight, empty))

		countStr := numStyle.Render(fmt.Sprintf("%d", count)) +
			denomStyle.Render(fmt.Sprintf("/%d", total))

		lines = append(lines, label+"  "+bar+"  "+countStr)
	}

	return strings.Join(lines, "\n")
}

// StatBlock renders a 3-line compact statistic block:
//
//	LABEL
//	  42
//	▔▔▔▔
//
// The value is centered and rendered in the given color (bold). A thin
// underbar in the same color anchors the block visually.
func StatBlock(label string, value int, c color.Color, width int) string {
	if width < 6 {
		width = 6
	}

	labelStyle := lipgloss.NewStyle().
		Foreground(theme.TextMuted).
		Width(width).
		Align(lipgloss.Center)

	valueStyle := lipgloss.NewStyle().
		Foreground(c).
		Bold(true).
		Width(width).
		Align(lipgloss.Center)

	barStyle := theme.ColorTextStyle(c)

	labelLine := labelStyle.Render(strings.ToUpper(label))
	valueLine := valueStyle.Render(fmt.Sprintf("%d", value))
	barLine := barStyle.Render(strings.Repeat("▔", width))

	return labelLine + "\n" + valueLine + "\n" + barLine
}

// ActivityBars renders a 7-day activity mini bar chart with day labels.
// Bars use the purple analytics accent. If all values are zero, a row of
// dim bullets is shown with the same day-label footer.
func ActivityBars(values []int, width int) string {
	if len(values) != 7 {
		// Defensive: pad/truncate to 7.
		padded := make([]int, 7)
		for i := 0; i < 7 && i < len(values); i++ {
			padded[i] = values[i]
		}
		values = padded
	}
	if width < 14 {
		width = 14
	}

	// Each day gets an equal share of the width; remainder distributed
	// across the first few days.
	perDay := width / 7
	if perDay < 1 {
		perDay = 1
	}
	remainder := width - perDay*7

	dayLabels := []string{"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"}

	// Find max for scaling.
	maxVal := 0
	for _, v := range values {
		if v > maxVal {
			maxVal = v
		}
	}

	purple := theme.ColorTextStyle(theme.Purple)
	dim := theme.TextDimStyle
	mutedStyle := theme.TextMutedStyle

	var barBuilder strings.Builder
	var labelBuilder strings.Builder

	for i, v := range values {
		cellW := perDay
		if i < remainder {
			cellW++
		}

		// Compute fill for this day.
		var cell string
		if maxVal <= 0 {
			cell = dim.Render(strings.Repeat(theme.SymBullet, cellW))
		} else if v <= 0 {
			cell = dim.Render(strings.Repeat(theme.SymBullet, cellW))
		} else {
			idx := sparkBlockIndex(float64(v), float64(maxVal))
			if idx < 0 {
				idx = 0
			}
			cell = purple.Render(strings.Repeat(sparkBlocks[idx], cellW))
		}
		barBuilder.WriteString(cell)

		// Day label centered in cellW.
		label := dayLabels[i]
		if len(label) > cellW {
			label = label[:cellW]
		}
		pad := cellW - len(label)
		leftPad := pad / 2
		rightPad := pad - leftPad
		labelBuilder.WriteString(mutedStyle.Render(
			strings.Repeat(" ", leftPad) + label + strings.Repeat(" ", rightPad),
		))
	}

	return barBuilder.String() + "\n" + labelBuilder.String()
}
