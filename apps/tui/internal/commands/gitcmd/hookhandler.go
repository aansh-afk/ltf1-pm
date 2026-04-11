package gitcmd

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
)

func newHookHandlerCmd() *cobra.Command {
	return &cobra.Command{
		Use:    "hook-handler <event>",
		Short:  "Internal: handle git hook events",
		Hidden: true,
		Args:   cobra.MinimumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			event := args[0]
			branch, err := currentBranch()
			if err != nil {
				return nil // silent fail in hooks
			}

			cfg, err := api.LoadAuthConfig()
			if err != nil || !api.HasProjectContext(cfg) {
				return nil
			}

			key := extractTaskKey(branch, cfg.Context.ProjectKey)
			if key == "" {
				return nil
			}

			url := api.GetConvexURL(cfg)
			if url == "" {
				return nil
			}
			client := api.NewClient(url, cfg)
			_, _ = client.Mutation("tasks/mutations:updateTask", map[string]any{
				"taskId":    key,
				"gitBranch": branch,
			})
			fmt.Printf("[ltf1] %s linked %s\n", event, key)
			return nil
		},
	}
}
