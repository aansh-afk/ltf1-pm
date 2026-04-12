// Package taskcmd implements the `ltf1 task` command group.
package taskcmd

import (
	"encoding/json"
	"fmt"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
)

// NewCommand returns the parent `task` command.
func NewCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:     "task",
		Aliases: []string{"t"},
		Short:   "Task management commands",
	}
	cmd.AddCommand(newListCmd())
	cmd.AddCommand(newCreateCmd())
	cmd.AddCommand(newViewCmd())
	cmd.AddCommand(newUpdateCmd())
	cmd.AddCommand(newDoneCmd())
	cmd.AddCommand(newAssignCmd())
	cmd.AddCommand(newDeleteCmd())
	cmd.AddCommand(newCommentCmd())
	cmd.AddCommand(newMineCmd())
	return cmd
}

func loadAuthClientWithProject() (*api.AuthConfig, *api.ConvexClient, error) {
	cfg, err := api.LoadAuthConfig()
	if err != nil {
		return nil, nil, fmt.Errorf("not authenticated. Run: ltf1 auth login")
	}
	if !api.IsAuthenticated(cfg) && !api.CanRefreshSession(cfg) {
		return nil, nil, fmt.Errorf("session expired. Run: ltf1 auth login")
	}
	if !api.HasProjectContext(cfg) {
		return nil, nil, fmt.Errorf("no project selected. Run: ltf1 project select")
	}
	url := api.GetConvexURL(cfg)
	if url == "" {
		return nil, nil, fmt.Errorf("CONVEX_URL not configured")
	}
	return cfg, api.NewClient(url, cfg), nil
}

func parseTasks(raw json.RawMessage) ([]api.Task, error) {
	var tasks []api.Task
	if err := json.Unmarshal(raw, &tasks); err != nil {
		return nil, err
	}
	return tasks, nil
}
