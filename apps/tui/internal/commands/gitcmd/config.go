package gitcmd

import (
	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newConfigCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "config",
		Short: "Configure git integration",
		RunE: func(cmd *cobra.Command, args []string) error {
			output.Infof("git integration is configured per-project on the server")
			return nil
		},
	}
}
