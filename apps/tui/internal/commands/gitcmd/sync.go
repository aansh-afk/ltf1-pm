package gitcmd

import (
	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newSyncCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "sync",
		Short: "Sync git activity with task status",
		RunE: func(cmd *cobra.Command, args []string) error {
			branch, err := currentBranch()
			if err != nil {
				return err
			}
			output.Infof("current branch: %s", branch)
			output.Infof("git sync triggers webhook-based task updates server-side")
			return nil
		},
	}
}
