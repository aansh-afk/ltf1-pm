package gitcmd

import (
	"fmt"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/output"
)

func newLinkCmd() *cobra.Command {
	var (
		taskID string
		prURL  string
		branch string
	)
	cmd := &cobra.Command{
		Use:   "link",
		Short: "Link current branch/PR to a task",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := api.LoadAuthConfig()
			if err != nil || !api.HasProjectContext(cfg) {
				return fmt.Errorf("not authenticated or no project selected")
			}

			if branch == "" {
				branch, _ = currentBranch()
			}

			if taskID == "" {
				key := extractTaskKey(branch, cfg.Context.ProjectKey)
				if key == "" {
					return fmt.Errorf("could not extract task key from branch %q", branch)
				}
				output.Infof("detected task key: %s", key)
				taskID = key
			}

			url := api.GetConvexURL(cfg)
			if url == "" {
				return fmt.Errorf("CONVEX_URL not set")
			}
			client := api.NewClient(url, cfg)
			callArgs := map[string]any{
				"taskId":    taskID,
				"gitBranch": branch,
			}
			if prURL != "" {
				callArgs["pullRequestUrl"] = prURL
			}
			if _, err := client.Mutation("tasks/mutations:updateTask", callArgs); err != nil {
				return err
			}
			output.Successf("linked %s to %s", branch, taskID)
			return nil
		},
	}
	cmd.Flags().StringVar(&taskID, "task", "", "task ID (auto-detected if omitted)")
	cmd.Flags().StringVar(&prURL, "pr", "", "pull request URL")
	cmd.Flags().StringVar(&branch, "branch", "", "branch name (defaults to current)")
	return cmd
}
