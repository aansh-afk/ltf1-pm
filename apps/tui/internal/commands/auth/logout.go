package auth

import (
	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newLogoutCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "logout",
		Short: "Clear stored credentials",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := api.LoadAuthConfig()
			if err != nil || cfg == nil {
				output.Infof("not currently logged in")
				return nil
			}
			cfg.Auth = api.AuthInfo{}
			cfg.Context = api.ProjectInfo{}
			if err := api.SaveAuthConfig(cfg); err != nil {
				return err
			}
			output.Successf("logged out")
			return nil
		},
	}
}
