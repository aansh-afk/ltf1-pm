package pages

import (
	"encoding/json"
	"strings"

	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/components"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

type notificationsDataMsg struct {
	Notifications []api.Notification
	Err           error
}

type notificationsPage struct {
	width, height int
	client        *api.ConvexClient
	notifications []api.Notification
	cursor        int
	loading       bool
}

func NewNotificationsPage(client *api.ConvexClient) PageModel {
	return &notificationsPage{client: client, loading: true}
}

func (p *notificationsPage) Init() tea.Cmd {
	if p.client == nil {
		return nil
	}
	return p.fetchNotifications()
}

func (p *notificationsPage) fetchNotifications() tea.Cmd {
	return func() tea.Msg {
		raw, err := p.client.Query("notifications:list", nil)
		if err != nil {
			return notificationsDataMsg{Err: err}
		}
		var notifs []api.Notification
		json.Unmarshal(raw, &notifs)
		return notificationsDataMsg{Notifications: notifs}
	}
}

func (p *notificationsPage) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case notificationsDataMsg:
		p.notifications = msg.Notifications
		p.loading = false
	case tea.KeyMsg:
		switch msg.String() {
		case "j", "down":
			if p.cursor < len(p.notifications)-1 {
				p.cursor++
			}
		case "k", "up":
			if p.cursor > 0 {
				p.cursor--
			}
		}
	}
	return p, nil
}

func (p *notificationsPage) SetSize(w, h int) {
	p.width = w
	p.height = h
}

func (p *notificationsPage) ShortHelp() string {
	return "j/k navigate  enter mark read"
}

func (p *notificationsPage) View() string {
	if p.client == nil {
		return components.EmptyState("Not connected", p.width, p.height)
	}
	if p.loading {
		return components.EmptyState("Loading notifications...", p.width, p.height)
	}

	var b strings.Builder
	b.WriteString(theme.SectionHeader.Render("NOTIFICATIONS") + "\n\n")

	if len(p.notifications) == 0 {
		b.WriteString(components.EmptyState("No notifications", p.width, p.height-4))
		return b.String()
	}

	for i, n := range p.notifications {
		// Read/unread indicator
		dot := theme.SymDotEmpty
		if !n.IsRead {
			dot = lipgloss.NewStyle().Foreground(theme.Indigo).Render(theme.SymDot)
		}

		title := dot + " " + n.Title
		meta := theme.TextMutedStyle.Render(n.Type)
		b.WriteString(components.RenderListItem(title, meta, i == p.cursor) + "\n")
	}

	return b.String()
}
