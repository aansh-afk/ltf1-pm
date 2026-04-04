package components

import (
	"strings"

	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

// ModalModel holds modal state.
type ModalModel struct {
	Title    string
	Status   string // e.g. "In Progress"
	Priority string // e.g. "High"
	Meta     [][2]string // key-value metadata pairs
	Body     string
	Hints    string // pre-formatted key hints
	Visible  bool
}

// NewModal creates a hidden modal.
func NewModal() ModalModel {
	return ModalModel{}
}

// Show makes the modal visible with basic content.
func (m *ModalModel) Show(title, body, hints string) {
	m.Title = title
	m.Body = body
	m.Hints = hints
	m.Visible = true
}

// ShowDetail makes the modal visible with full task detail.
func (m *ModalModel) ShowDetail(title, status, priority, body string, meta [][2]string, hints string) {
	m.Title = title
	m.Status = status
	m.Priority = priority
	m.Meta = meta
	m.Body = body
	m.Hints = hints
	m.Visible = true
}

// Hide hides the modal.
func (m *ModalModel) Hide() {
	m.Visible = false
	m.Status = ""
	m.Priority = ""
	m.Meta = nil
}

// View renders the modal centered in the given dimensions.
func (m ModalModel) View(width, height int) string {
	if !m.Visible {
		return ""
	}

	// Build modal content
	var lines []string

	// Title (UPPERCASE, bold)
	titleText := strings.ToUpper(m.Title)
	lines = append(lines, theme.BrandTextStyle.Render(titleText))

	// Status + Priority line
	if m.Status != "" || m.Priority != "" {
		var statusLine string
		if m.Status != "" {
			statusLine = StatusBadge(m.Status)
		}
		if m.Priority != "" {
			if statusLine != "" {
				statusLine += theme.TextDimStyle.Render(" "+theme.SymBullet+" ")
			}
			statusLine += PriorityBadgePlain(m.Priority)
		}
		lines = append(lines, statusLine)
	}

	// Blank separator
	if len(m.Meta) > 0 || m.Body != "" {
		lines = append(lines, "")
	}

	// Key-value metadata
	for _, kv := range m.Meta {
		label := theme.TextMutedStyle.Render(kv[0]+": ")
		value := theme.TextPrimaryStyle.Render(kv[1])
		lines = append(lines, label+value)
	}

	// Body text
	if m.Body != "" {
		if len(m.Meta) > 0 {
			lines = append(lines, "")
		}
		lines = append(lines, theme.TextSecondaryStyle.Render(m.Body))
	}

	// Action hints
	if m.Hints != "" {
		lines = append(lines, "")
		lines = append(lines, m.Hints)
	}

	content := strings.Join(lines, "\n")

	// Modal box with rounded border
	modalW := width / 2
	if modalW < 40 {
		modalW = 40
	}
	if modalW > 70 {
		modalW = 70
	}

	box := lipgloss.NewStyle().
		Background(theme.BgElevated).
		BorderStyle(lipgloss.RoundedBorder()).
		BorderForeground(theme.BorderDefault).
		Padding(1, 2).
		Width(modalW).
		Render(content)

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
