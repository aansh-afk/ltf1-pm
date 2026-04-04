package components

import (
	"charm.land/bubbles/v2/textinput"
	tea "charm.land/bubbletea/v2"
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
	ti.CharLimit = 200
	ti.SetWidth(50)

	styles := textinput.DefaultDarkStyles()
	styles.Focused.Prompt = theme.InputPromptStyle
	styles.Focused.Text = theme.InputTextStyle
	styles.Focused.Placeholder = theme.InputPlaceholderStyle
	styles.Blurred.Prompt = theme.InputBlurredPromptStyle
	styles.Blurred.Text = theme.InputBlurredTextStyle
	styles.Blurred.Placeholder = theme.InputPlaceholderStyle
	ti.SetStyles(styles)

	return InputModel{Input: ti}
}

// SetWidth sets the input's visible width.
// Accounts for border + padding (4 chars) so the bordered box fits within w.
func (i *InputModel) SetWidth(w int) {
	inner := w - 6 // 2 border + 2 padding + 2 prompt chars
	if inner < 10 {
		inner = 10
	}
	i.Input.SetWidth(inner)
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
