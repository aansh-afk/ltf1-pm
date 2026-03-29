package components

import (
	"time"

	tea "charm.land/bubbletea/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

// ToastLevel indicates the severity of a toast message.
type ToastLevel int

const (
	ToastLevelSuccess ToastLevel = iota
	ToastLevelError
	ToastLevelWarning
)

// ToastModel manages an auto-dismissing toast notification.
type ToastModel struct {
	Message string
	Level   ToastLevel
	Visible bool
}

type toastTimeoutMsg struct{}

// NewToast creates a toast and returns the model with a timeout command.
func NewToast(message string, level ToastLevel) (ToastModel, tea.Cmd) {
	t := ToastModel{
		Message: message,
		Level:   level,
		Visible: true,
	}

	var dur time.Duration
	switch level {
	case ToastLevelSuccess:
		dur = 2 * time.Second
	case ToastLevelError:
		dur = 3 * time.Second
	case ToastLevelWarning:
		// Warning toasts persist until dismissed
		return t, nil
	}

	return t, tea.Tick(dur, func(time.Time) tea.Msg {
		return toastTimeoutMsg{}
	})
}

// Update handles toast timeout messages.
func (t ToastModel) Update(msg tea.Msg) (ToastModel, tea.Cmd) {
	if _, ok := msg.(toastTimeoutMsg); ok {
		t.Visible = false
	}
	return t, nil
}

// View renders the toast.
func (t ToastModel) View() string {
	if !t.Visible {
		return ""
	}

	switch t.Level {
	case ToastLevelSuccess:
		return theme.ToastSuccess.Render(theme.SymCheck + " " + t.Message)
	case ToastLevelError:
		return theme.ToastError.Render(theme.SymCross + " " + t.Message)
	case ToastLevelWarning:
		return theme.ToastWarning.Render("! " + t.Message)
	}
	return ""
}
