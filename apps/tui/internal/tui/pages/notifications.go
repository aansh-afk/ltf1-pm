package pages

import (
	"encoding/json"
	"fmt"
	"strings"

	tea "charm.land/bubbletea/v2"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/components"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/tui/theme"
)

type notificationsDataMsg struct {
	Notifications []api.Notification
	Err           error
}

type notifMarkedMsg struct{ Err error }

type notificationsPage struct {
	width, height int
	client        *api.ConvexClient
	workspaceID   string
	projectID     string
	notifications []api.Notification
	cursor        int
	loading       bool
}

func NewNotificationsPage(client *api.ConvexClient, workspaceID, projectID string) PageModel {
	return &notificationsPage{client: client, workspaceID: workspaceID, projectID: projectID, loading: true}
}

func (p *notificationsPage) Init() tea.Cmd {
	if p.client == nil {
		return nil
	}
	return p.fetchNotifications()
}

func (p *notificationsPage) fetchNotifications() tea.Cmd {
	return func() tea.Msg {
		// Backend map: notificationQueries:getNotifications requires
		// workspaceId. The legacy `notifications:*` paths do not exist.
		if p.workspaceID == "" {
			return notificationsDataMsg{Err: fmt.Errorf("no workspace selected")}
		}
		raw, err := p.client.Query("notificationQueries:getNotifications", map[string]interface{}{
			"workspaceId": p.workspaceID,
		})
		if err != nil {
			return notificationsDataMsg{Err: err}
		}
		var notifs []api.Notification
		if jsonErr := json.Unmarshal(raw, &notifs); jsonErr != nil {
			return notificationsDataMsg{Err: jsonErr}
		}
		return notificationsDataMsg{Notifications: notifs}
	}
}

func (p *notificationsPage) markAsRead(notifID string) tea.Cmd {
	client := p.client
	return func() tea.Msg {
		_, err := client.Mutation("notificationQueries:markAsRead", map[string]interface{}{
			"notificationId": notifID,
		})
		return notifMarkedMsg{Err: err}
	}
}

func (p *notificationsPage) Update(msg tea.Msg) (PageModel, tea.Cmd) {
	switch msg := msg.(type) {
	case notificationsDataMsg:
		p.notifications = msg.Notifications
		p.loading = false
	case notifMarkedMsg:
		if msg.Err != nil {
			return p, func() tea.Msg {
				return ShowToastMsg{Message: "Failed to mark as read", IsError: true}
			}
		}
		return p, tea.Batch(
			p.fetchNotifications(),
			func() tea.Msg { return ShowToastMsg{Message: "Marked as read"} },
		)
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
		case "enter":
			if p.cursor >= 0 && p.cursor < len(p.notifications) {
				n := p.notifications[p.cursor]
				if !n.IsRead {
					return p, p.markAsRead(n.ID)
				}
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
	return components.KeyHints(components.KeyHint("enter", "mark read"))
}

func (p *notificationsPage) KeyBinds() []string {
	return []string{"j", "k", "up", "down", "enter"}
}

func (p *notificationsPage) HasModal() bool { return false }

func (p *notificationsPage) View() string {
	if p.client == nil {
		return components.EmptyState("Not connected", p.width, p.height)
	}
	if p.loading {
		return components.EmptyState("Loading notifications...", p.width, p.height)
	}

	var b strings.Builder

	b.WriteString("\n")

	// Count unread
	unread := 0
	for _, n := range p.notifications {
		if !n.IsRead {
			unread++
		}
	}

	header := theme.SectionHeader.Render("NOTIFICATIONS")
	if unread > 0 {
		header += "  " + theme.AccentTextStyle.Render(fmt.Sprintf("%d unread", unread))
	}
	b.WriteString(header + "\n")
	b.WriteString("\n")

	if len(p.notifications) == 0 {
		b.WriteString(components.EmptyState("No notifications", p.width, p.height-4))
		return b.String()
	}

	for i, n := range p.notifications {
		// Read/unread indicator
		dot := theme.TextDimStyle.Render(theme.SymDotEmpty)
		if !n.IsRead {
			dot = theme.ColorTextStyle(theme.Indigo).Render(theme.SymDot)
		}

		title := dot + " " + n.Title
		meta := theme.TextDimStyle.Render(n.Type)
		b.WriteString(components.RenderListItem(title, meta, i == p.cursor) + "\n")
	}

	return b.String()
}
