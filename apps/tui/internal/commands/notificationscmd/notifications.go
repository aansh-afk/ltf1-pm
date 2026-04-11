// Package notificationscmd implements the `ltf1 notifications` command group.
package notificationscmd

import (
	"encoding/json"
	"fmt"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func NewCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:     "notifications",
		Aliases: []string{"notif"},
		Short:   "Notification commands",
	}
	cmd.AddCommand(newListCmd())
	cmd.AddCommand(newReadCmd())
	cmd.AddCommand(newClearCmd())
	return cmd
}

func loadAuthClient() (*api.AuthConfig, *api.ConvexClient, error) {
	cfg, err := api.LoadAuthConfig()
	if err != nil {
		return nil, nil, fmt.Errorf("not authenticated")
	}
	url := api.GetConvexURL(cfg)
	if url == "" {
		return nil, nil, fmt.Errorf("CONVEX_URL not set")
	}
	return cfg, api.NewClient(url, cfg), nil
}

func newListCmd() *cobra.Command {
	var (
		unread  bool
		jsonOut bool
	)
	cmd := &cobra.Command{
		Use:     "list",
		Aliases: []string{"ls"},
		Short:   "List notifications",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClient()
			if err != nil {
				return err
			}
			callArgs := map[string]any{"workspaceId": cfg.Context.WorkspaceID}
			if unread {
				callArgs["unreadOnly"] = true
			}
			raw, err := client.Query("notifications/queries:getNotifications", callArgs)
			if err != nil {
				return err
			}
			var notifs []api.Notification
			if err := json.Unmarshal(raw, &notifs); err != nil {
				return err
			}
			if jsonOut {
				return output.JSON(notifs)
			}
			if len(notifs) == 0 {
				output.Infof("no notifications")
				return nil
			}
			for _, n := range notifs {
				marker := "○"
				if !n.IsRead {
					marker = "●"
				}
				fmt.Printf("  %s  %s  %s\n", marker, output.RelativeTime(n.CreatedAt), n.Title)
			}
			return nil
		},
	}
	cmd.Flags().BoolVarP(&unread, "unread", "u", false, "only show unread")
	cmd.Flags().BoolVar(&jsonOut, "json", false, "output as JSON")
	return cmd
}

func newReadCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "read <id>",
		Short: "Mark notification as read",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			_, client, err := loadAuthClient()
			if err != nil {
				return err
			}
			if _, err := client.Mutation("notifications/mutations:markAsRead", map[string]any{
				"notificationId": args[0],
			}); err != nil {
				return err
			}
			output.Successf("marked as read")
			return nil
		},
	}
}

func newClearCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "clear",
		Short: "Mark all notifications as read",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, client, err := loadAuthClient()
			if err != nil {
				return err
			}
			if _, err := client.Mutation("notifications/mutations:markAllAsRead", map[string]any{
				"workspaceId": cfg.Context.WorkspaceID,
			}); err != nil {
				return err
			}
			output.Successf("all notifications cleared")
			return nil
		},
	}
}
