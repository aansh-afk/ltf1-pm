package auth

import (
	"fmt"
	"time"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newStatusCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "status",
		Short: "Show authentication status",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := api.LoadAuthConfig()
			if err != nil || cfg == nil || cfg.Auth.Token == "" {
				output.Warningf("not authenticated. Run: ltf1 auth login")
				return nil
			}

			output.Header("Authentication")
			fmt.Printf("Email:        %s\n", cfg.Auth.Email)
			fmt.Printf("User ID:      %s\n", cfg.Auth.UserID)
			fmt.Printf("Token type:   %s\n", cfg.Auth.TokenType)
			if cfg.Auth.ExpiresAt > 0 {
				expiry := time.UnixMilli(int64(cfg.Auth.ExpiresAt))
				if api.IsAuthenticated(cfg) {
					fmt.Printf("Expires:      %s\n", expiry.Format("2006-01-02 15:04"))
				} else {
					fmt.Printf("Expired at:   %s\n", expiry.Format("2006-01-02 15:04"))
				}
			}

			if api.HasProjectContext(cfg) {
				output.Header("Active Project")
				fmt.Printf("Workspace:    %s\n", cfg.Context.WorkspaceName)
				fmt.Printf("Project:      %s (%s)\n", cfg.Context.ProjectName, cfg.Context.ProjectKey)
			} else {
				output.Warningf("no project selected. Run: ltf1 project select")
			}
			return nil
		},
	}
}
