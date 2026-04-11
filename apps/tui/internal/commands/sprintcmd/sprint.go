// Package sprintcmd implements the `ltf1 sprint` command group.
package sprintcmd

import (
	"encoding/json"
	"fmt"

	"github.com/spf13/cobra"

	"github.com/aansh-afk/ltf1-pm/apps/tui/internal/api"
)

func NewCommand() *cobra.Command {
	cmd := &cobra.Command{
		Use:     "sprint",
		Aliases: []string{"s"},
		Short:   "Sprint management commands",
	}
	cmd.AddCommand(newListCmd())
	cmd.AddCommand(newStatusCmd())
	cmd.AddCommand(newCreateCmd())
	cmd.AddCommand(newAddCmd())
	cmd.AddCommand(newCloseCmd())
	cmd.AddCommand(newRemoveCmd())
	cmd.AddCommand(newBacklogCmd())
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

func parseSprints(raw json.RawMessage) ([]api.Sprint, error) {
	var sprints []api.Sprint
	if err := json.Unmarshal(raw, &sprints); err != nil {
		return nil, err
	}
	return sprints, nil
}
