package components

import (
	"strings"

	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

// RenderListItem renders a list item with title and right-aligned metadata.
//
// Selected: full-width BgHighlight background + bold title
// Default: regular title + muted metadata
func RenderListItem(title, metadata string, isSelected bool, widths ...int) string {
	width := 80
	if len(widths) > 0 && widths[0] > 0 {
		width = widths[0]
	}

	// Calculate visible widths
	titleW := lipgloss.Width(title)
	metaW := lipgloss.Width(metadata)

	// Prefix: "▌ " for selected, "  " for unselected
	prefix := "  "
	prefixW := 2
	if isSelected {
		prefix = theme.SidebarSelectedMarkerStyle.Render(theme.SymBar) + " "
		prefixW = 2
	}

	// Available width for content
	contentW := width - prefixW - 2

	// Truncate title if needed
	if titleW+metaW+2 > contentW {
		maxTitle := contentW - metaW - 2
		if maxTitle < 10 {
			maxTitle = 10
		}
		if titleW > maxTitle {
			runes := []rune(title)
			if len(runes) > maxTitle-1 {
				title = string(runes[:maxTitle-1]) + theme.SymEllipsis
				titleW = maxTitle
			}
		}
	}

	// Gap between title and metadata
	gap := contentW - titleW - metaW
	if gap < 2 {
		gap = 2
	}
	padding := strings.Repeat(" ", gap)

	// Build the line
	var line string
	if isSelected {
		styledTitle := theme.ListItemTitleSelectedStyle.Render(title)
		line = prefix + styledTitle + padding + metadata
	} else {
		styledTitle := theme.ListItemTitleStyle.Render(title)
		line = prefix + styledTitle + padding + metadata
	}

	// Apply background for selected items
	if isSelected {
		return theme.ListItemSelected.Width(width).Render(line)
	}
	return theme.ListItemStyle.Width(width).Render(line)
}

// RenderTaskRow renders a task in the new design format:
//
//	Title                      [PRIORITY]  ● Status     Due: Today
//
// Selected row gets full-width highlight background.
func RenderTaskRow(title, priority, status, due string, isSelected bool, width int) string {
	if width <= 0 {
		width = 80
	}

	// Build metadata parts
	var metaParts []string
	if priority != "" {
		metaParts = append(metaParts, PriorityBadge(priority))
	}
	metaParts = append(metaParts, StatusBadge(status))
	if due != "" {
		metaParts = append(metaParts, theme.TextMutedStyle.Render("Due: "+due))
	}

	meta := strings.Join(metaParts, "  ")

	return RenderListItem(title, meta, isSelected, width)
}

// RenderSimpleListItem renders a simpler list item with just title + badge
func RenderSimpleListItem(title, badge string, isSelected bool, width int) string {
	return RenderListItem(title, badge, isSelected, width)
}
