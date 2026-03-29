package components

import (
	"charm.land/bubbles/v2/textinput"
	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

// InputModel wraps a Bubbles textinput with themed styling.
type InputModel struct {
	Input   textinput.Model
	Focused bool
}

// NewInput creates a styled text input.
func NewInput(placeholder string) InputModel {
	ti := textinput.New()
	ti.Placeholder = placeholder
	ti.Prompt = "> "

	promptStyle := lipgloss.NewStyle().Foreground(theme.Indigo)
	textStyle := lipgloss.NewStyle().Foreground(theme.TextPrimary)
	placeholderStyle := lipgloss.NewStyle().Foreground(theme.TextDim)

	styles := textinput.DefaultDarkStyles()
	styles.Focused.Prompt = promptStyle
	styles.Focused.Text = textStyle
	styles.Focused.Placeholder = placeholderStyle
	styles.Blurred.Prompt = promptStyle.Foreground(theme.TextMuted)
	styles.Blurred.Text = lipgloss.NewStyle().Foreground(theme.TextSecondary)
	styles.Blurred.Placeholder = placeholderStyle
	ti.SetStyles(styles)

	return InputModel{Input: ti}
}

// Focus focuses the input.
func (i *InputModel) Focus() tea.Cmd {
	i.Focused = true
	return i.Input.Focus()
}

// Blur removes focus.
func (i *InputModel) Blur() {
	i.Focused = false
	i.Input.Blur()
}

// Value returns the current input text.
func (i InputModel) Value() string {
	return i.Input.Value()
}

// SetValue sets the input text.
func (i *InputModel) SetValue(s string) {
	i.Input.SetValue(s)
}

// Update delegates to the inner textinput.
func (i InputModel) Update(msg tea.Msg) (InputModel, tea.Cmd) {
	var cmd tea.Cmd
	i.Input, cmd = i.Input.Update(msg)
	return i, cmd
}

// View renders the styled input.
func (i InputModel) View() string {
	style := theme.InputStyle
	if i.Focused {
		style = theme.InputFocusedStyle
	}
	return style.Render(i.Input.View())
}
