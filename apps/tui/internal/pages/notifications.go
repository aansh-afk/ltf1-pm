package pages

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/theme"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
)

// --- data types ---

type notifItem struct {
	ID     string
	Text   string
	Source string // username or "system"
	Read   bool
	Time   time.Time
}

// --- messages ---

type notifsLoadedMsg struct {
	items []notifItem
}

type notifsErrMsg struct {
	err error
}

type notifMarkedReadMsg struct {
	index int
}

type notifsAllReadMsg struct{}

// --- model ---

type notificationsModel struct {
	items   []notifItem
	cursor  int
	width   int
	height  int
	loading bool
	err     error
	client  *api.ConvexClient
	config  *api.AuthConfig
}

func NewNotificationsPage(client *api.ConvexClient, config *api.AuthConfig) PageModel {
	return &notificationsModel{
		loading: true,
		client:  client,
		config:  config,
	}
}

// PageModel interface

func (m *notificationsModel) Init() tea.Cmd {
	return m.loadNotifications()
}

func (m *notificationsModel) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil

	case notifsLoadedMsg:
		m.items = msg.items
		m.loading = false
		return m, nil

	case notifsErrMsg:
		m.err = msg.err
		m.loading = false
		return m, nil

	case notifMarkedReadMsg:
		if msg.index >= 0 && msg.index < len(m.items) {
			m.items[msg.index].Read = true
		}
		return m, nil

	case notifsAllReadMsg:
		for i := range m.items {
			m.items[i].Read = true
		}
		return m, nil

	case tea.KeyMsg:
		if m.loading {
			return m, nil
		}
		switch msg.String() {
		case "j", "down":
			if m.cursor < len(m.items)-1 {
				m.cursor++
			}
		case "k", "up":
			if m.cursor > 0 {
				m.cursor--
			}
		case "enter":
			if len(m.items) > 0 && !m.items[m.cursor].Read {
				idx := m.cursor
				return m, func() tea.Msg {
					return notifMarkedReadMsg{index: idx}
				}
			}
		case "a":
			return m, func() tea.Msg {
				return notifsAllReadMsg{}
			}
		case "r":
			m.loading = true
			m.err = nil
			return m, m.loadNotifications()
		}
	}

	return m, nil
}

func (m *notificationsModel) View(width, height int) string {
	// count unread
	unread := 0
	for _, n := range m.items {
		if !n.Read {
			unread++
		}
	}

	title := "NOTIFICATIONS"
	if unread > 0 {
		title += fmt.Sprintf(" (%d unread)", unread)
	}
	header := theme.AccentStyle.Render("  " + title)

	if m.loading {
		return lipgloss.JoinVertical(lipgloss.Left, "", header, "",
			theme.MutedStyle.Render("  Loading notifications..."))
	}

	if m.err != nil {
		return lipgloss.JoinVertical(lipgloss.Left, "", header, "",
			theme.ErrorStyle.Render("  Error: "+m.err.Error()), "",
			theme.DimStyle.Render("  Press r to retry"))
	}

	if len(m.items) == 0 {
		return lipgloss.JoinVertical(lipgloss.Left, "", header, "",
			theme.MutedStyle.Render("  No notifications. You're all caught up!"))
	}

	contentWidth := width - 4
	if contentWidth < 40 {
		contentWidth = 60
	}

	var rows []string
	for i, n := range m.items {
		cursor := "  "
		if i == m.cursor {
			cursor = lipgloss.NewStyle().Foreground(theme.AccentColor).Render("> ")
		}

		// read/unread dot
		dot := theme.MutedStyle.Render("\u25cb") // ○ read
		if !n.Read {
			dot = lipgloss.NewStyle().Foreground(theme.AccentColor).Render("\u25cf") // ● unread
		}

		text := lipgloss.NewStyle().Foreground(theme.TextColor).Render(n.Text)

		source := lipgloss.NewStyle().Foreground(theme.CyanColor).Render("@" + n.Source)
		if n.Source == "system" {
			source = theme.MutedStyle.Render("system")
		}

		timeStr := relativeTime(n.Time)
		timeRendered := theme.DimStyle.Render(timeStr)

		rows = append(rows, fmt.Sprintf("%s%s %s  %s  %s", cursor, dot, text, source, timeRendered))
	}

	listBox := theme.SubtlePanel.Width(contentWidth).Render(strings.Join(rows, "\n"))

	// footer hints
	hintKey := lipgloss.NewStyle().Foreground(theme.AccentColor)
	hint := theme.DimStyle
	footer := fmt.Sprintf("  %s %s  %s %s  %s %s  %s %s",
		hintKey.Render("j/k"), hint.Render("navigate"),
		hintKey.Render("enter"), hint.Render("mark read"),
		hintKey.Render("a"), hint.Render("mark all read"),
		hintKey.Render("r"), hint.Render("refresh"))

	return lipgloss.JoinVertical(lipgloss.Left, "", header, "", listBox, "", footer)
}

func (m *notificationsModel) SetSize(width, height int) {
	m.width = width
	m.height = height
}

func (m *notificationsModel) ShortHelp() string {
	return "j/k navigate | enter mark read | a mark all read | r refresh"
}

// --- commands ---

func (m *notificationsModel) loadNotifications() tea.Cmd {
	return func() tea.Msg {
		if m.client == nil {
			return notifsLoadedMsg{items: sampleNotifications()}
		}

		raw, err := m.client.Query("notifications:getNotifications", nil)
		if err != nil {
			return notifsErrMsg{err: err}
		}

		var apiNotifs []api.Notification
		if err := json.Unmarshal(raw, &apiNotifs); err != nil {
			return notifsErrMsg{err: fmt.Errorf("parse notifications: %w", err)}
		}

		var items []notifItem
		for _, n := range apiNotifs {
			items = append(items, notifItem{
				ID:     n.ID,
				Text:   n.Title,
				Source: n.Type,
				Read:   n.IsRead,
				Time:   time.UnixMilli(int64(n.CreatedAt)),
			})
		}
		if len(items) == 0 {
			return notifsLoadedMsg{items: sampleNotifications()}
		}
		return notifsLoadedMsg{items: items}
	}
}

// --- helpers ---

func relativeTime(t time.Time) string {
	d := time.Since(t)
	switch {
	case d < time.Minute:
		return "just now"
	case d < time.Hour:
		return fmt.Sprintf("%dm ago", int(d.Minutes()))
	case d < 24*time.Hour:
		return fmt.Sprintf("%dh ago", int(d.Hours()))
	default:
		return fmt.Sprintf("%dd ago", int(d.Hours()/24))
	}
}

func sampleNotifications() []notifItem {
	now := time.Now()
	return []notifItem{
		{ID: "1", Text: "Task assigned: PROJ-123 \"Fix auth\"", Source: "sarah", Read: false, Time: now.Add(-2 * time.Minute)},
		{ID: "2", Text: "Sprint started: Sprint 3", Source: "system", Read: false, Time: now.Add(-1 * time.Hour)},
		{ID: "3", Text: "Comment on PROJ-101", Source: "john", Read: true, Time: now.Add(-3 * time.Hour)},
		{ID: "4", Text: "Task completed: PROJ-99 \"Setup CI\"", Source: "system", Read: true, Time: now.Add(-24 * time.Hour)},
	}
}
