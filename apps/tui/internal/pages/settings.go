package pages

import (
	"fmt"
	"strings"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/theme"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
)

// --- data types ---

type triageMode int

const (
	triageModeAuto   triageMode = iota
	triageModeReview            // default
	triageModeOff
)

func (m triageMode) String() string {
	switch m {
	case triageModeAuto:
		return "Auto"
	case triageModeReview:
		return "Review"
	case triageModeOff:
		return "Off"
	default:
		return "Unknown"
	}
}

func (m triageMode) Description() string {
	switch m {
	case triageModeAuto:
		return "Agent applies suggestions automatically"
	case triageModeReview:
		return "Agent suggests, you decide"
	case triageModeOff:
		return "No automatic triage"
	default:
		return ""
	}
}

// --- model ---

type settingsModel struct {
	triageMode   triageMode
	triageCursor int // 0=auto, 1=review, 2=off
	width        int
	height       int
	client       *api.ConvexClient
	config       *api.AuthConfig
}

func NewSettingsPage(client *api.ConvexClient, config *api.AuthConfig) PageModel {
	return &settingsModel{
		triageMode:   triageModeReview,
		triageCursor: 1,
		client:       client,
		config:       config,
	}
}

// PageModel interface

func (m *settingsModel) Init() tea.Cmd {
	return nil
}

func (m *settingsModel) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil

	case tea.KeyMsg:
		switch msg.String() {
		case "j", "down":
			if m.triageCursor < 2 {
				m.triageCursor++
			}
		case "k", "up":
			if m.triageCursor > 0 {
				m.triageCursor--
			}
		case "enter", " ":
			m.triageMode = triageMode(m.triageCursor)
		}
	}

	return m, nil
}

func (m *settingsModel) View(width, height int) string {
	header := theme.AccentStyle.Render("  SETTINGS")

	contentWidth := width - 4
	if contentWidth < 40 {
		contentWidth = 60
	}

	// --- Triage Mode Section ---
	sectionTitle := lipgloss.NewStyle().Bold(true).Foreground(theme.TextSecondary)

	modes := []triageMode{triageModeAuto, triageModeReview, triageModeOff}
	var triageRows []string
	for i, mode := range modes {
		cursor := "  "
		if i == m.triageCursor {
			cursor = lipgloss.NewStyle().Foreground(theme.AccentColor).Render("> ")
		}

		// radio button
		radio := theme.MutedStyle.Render("\u25cb") // ○ unselected
		if mode == m.triageMode {
			radio = lipgloss.NewStyle().Foreground(theme.AccentColor).Render("\u25cf") // ● selected
		}

		name := lipgloss.NewStyle().Foreground(theme.TextColor).Bold(true).Width(10).Render(mode.String())
		desc := lipgloss.NewStyle().Foreground(theme.TextSecondary).Render(mode.Description())

		triageRows = append(triageRows, fmt.Sprintf("%s%s %s  %s", cursor, radio, name, desc))
	}

	triageContent := sectionTitle.Render("TRIAGE MODE") + "\n" + strings.Join(triageRows, "\n")
	triageBox := theme.SubtlePanel.Width(contentWidth).Render(triageContent)

	// --- Connection Section ---
	label := lipgloss.NewStyle().Foreground(theme.TextMuted).Width(14)
	val := lipgloss.NewStyle().Foreground(theme.TextColor)

	connected := m.client != nil
	convexStatus := lipgloss.NewStyle().Foreground(theme.GreenColor).Render("\u25cf Connected")
	if !connected {
		convexStatus = lipgloss.NewStyle().Foreground(theme.RedColor).Render("\u25cf Disconnected")
	}

	email := "not logged in"
	workspace := "none"
	if m.config != nil {
		if m.config.Auth.Email != "" {
			email = m.config.Auth.Email
		}
		if m.config.Context.WorkspaceName != "" {
			workspace = m.config.Context.WorkspaceName
		}
	}

	connLines := []string{
		fmt.Sprintf("  %s %s", label.Render("Convex:"), convexStatus),
		fmt.Sprintf("  %s %s", label.Render("User:"), val.Render(email)),
		fmt.Sprintf("  %s %s", label.Render("Workspace:"), val.Render(workspace)),
		fmt.Sprintf("  %s %s", label.Render("Version:"), val.Render("v0.2.0")),
	}

	connContent := sectionTitle.Render("CONNECTION") + "\n" + strings.Join(connLines, "\n")
	connBox := theme.SubtlePanel.Width(contentWidth).Render(connContent)

	// footer hints
	hintKey := lipgloss.NewStyle().Foreground(theme.AccentColor)
	hint := theme.DimStyle
	footer := fmt.Sprintf("  %s %s  %s %s",
		hintKey.Render("j/k"), hint.Render("navigate"),
		hintKey.Render("enter"), hint.Render("select mode"))

	return lipgloss.JoinVertical(lipgloss.Left, "", header, "", triageBox, "", connBox, "", footer)
}

func (m *settingsModel) SetSize(width, height int) {
	m.width = width
	m.height = height
}

func (m *settingsModel) ShortHelp() string {
	return "j/k navigate | enter select triage mode"
}
