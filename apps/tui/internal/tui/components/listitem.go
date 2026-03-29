package components

import "github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"

// RenderListItem renders a generic list item with title, metadata, and selection state.
func RenderListItem(title, metadata string, isSelected bool) string {
	if isSelected {
		line := theme.SymBar + " " + theme.ListItemTitleSelectedStyle.Render(title)
		if metadata != "" {
			line += "  " + theme.ListItemMetaSelectedStyle.Render(metadata)
		}
		return theme.ListItemSelected.Render(line)
	}

	line := "  " + theme.ListItemTitleStyle.Render(title)
	if metadata != "" {
		line += "  " + theme.ListItemMetaStyle.Render(metadata)
	}
	return theme.ListItemStyle.Render(line)
}
