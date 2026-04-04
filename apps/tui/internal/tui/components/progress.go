package components

import (
	"fmt"
	"image/color"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

// ProgressBar renders a block-character progress bar with percentage.
func ProgressBar(percent float64, width int, color color.Color) string {
	if percent < 0 {
		percent = 0
	}
	if percent > 100 {
		percent = 100
	}
	if width < 5 {
		width = 5
	}

	// Reserve space for " 100%"
	barWidth := width - 5
	if barWidth < 1 {
		barWidth = 1
	}

	filled := int(float64(barWidth) * percent / 100)
	empty := barWidth - filled

	filledStyle := theme.ColorTextStyle(color)
	emptyStyle := theme.TextDimStyle
	pctStyle := theme.TextSecondaryStyle

	bar := ""
	for i := 0; i < filled; i++ {
		bar += filledStyle.Render(theme.SymBlockFull)
	}
	for i := 0; i < empty; i++ {
		bar += emptyStyle.Render(theme.SymBlockLight)
	}

	return bar + pctStyle.Render(fmt.Sprintf(" %3.0f%%", percent))
}
