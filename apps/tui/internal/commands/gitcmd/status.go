package gitcmd

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newStatusCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "status",
		Short: "Show git status with task context",
		RunE: func(cmd *cobra.Command, args []string) error {
			branch, err := currentBranch()
			if err != nil {
				return err
			}
			output.Header("Git Status")
			fmt.Printf("Branch:   %s\n", branch)

			cfg, _ := api.LoadAuthConfig()
			if cfg != nil && api.HasProjectContext(cfg) {
				if key := extractTaskKey(branch, cfg.Context.ProjectKey); key != "" {
					fmt.Printf("Linked task: %s\n", key)
				}
			}

			status, _ := gitCmd("status", "--short")
			if status != "" {
				output.Header("Changes")
				fmt.Println(status)
			}
			return nil
		},
	}
}
