package components

import (
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

// ModalModel holds modal state.
type ModalModel struct {
	Title   string
	Body    string
	Hints   string
	Visible bool
}

// NewModal creates a hidden modal.
func NewModal() ModalModel {
	return ModalModel{}
}

// Show makes the modal visible with the given content.
func (m *ModalModel) Show(title, body, hints string) {
	m.Title = title
	m.Body = body
	m.Hints = hints
	m.Visible = true
}

// Hide hides the modal.
func (m *ModalModel) Hide() {
	m.Visible = false
}

// View renders the modal centered in the given dimensions.
func (m ModalModel) View(width, height int) string {
	if !m.Visible {
		return ""
	}

	content := theme.ModalTitleStyle.Render(m.Title) + "\n" +
		theme.ModalBodyStyle.Render(m.Body)
	if m.Hints != "" {
		content += "\n" + theme.ModalHintStyle.Render(m.Hints)
	}

	box := theme.ModalStyle.Render(content)

	// Center the box
	boxWidth := lipgloss.Width(box)
	boxHeight := lipgloss.Height(box)

	padLeft := (width - boxWidth) / 2
	padTop := (height - boxHeight) / 2
	if padLeft < 0 {
		padLeft = 0
	}
	if padTop < 0 {
		padTop = 0
	}

	return theme.OffsetStyle(padLeft, padTop).Render(box)
}
